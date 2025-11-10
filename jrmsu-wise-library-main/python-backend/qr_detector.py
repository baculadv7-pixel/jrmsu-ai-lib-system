#!/usr/bin/env python3
"""
QR Code Detection Backend Service
Uses OpenCV for camera processing and QR code detection
"""

import cv2
import json
import time
import logging
from pyzbar import pyzbar
import numpy as np
from typing import Optional, Dict, Any
import threading
import queue

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class QRDetector:
    def __init__(self, camera_id: int = 0):
        """
        Initialize QR Detector with camera
        
        Args:
            camera_id: Camera device ID (0 for default, check for Chicony camera)
        """
        self.camera_id = camera_id
        self.cap = None
        self.is_running = False
        self.detection_queue = queue.Queue()
        
        # Try to find Chicony camera
        self.chicony_camera_id = self._find_chicony_camera()
        if self.chicony_camera_id is not None:
            self.camera_id = self.chicony_camera_id
            logger.info(f"Found Chicony camera at index {self.chicony_camera_id}")
        
    def _find_chicony_camera(self) -> Optional[int]:
        """
        Try to find Chicony USB camera by testing different camera indices
        """
        for i in range(10):  # Check first 10 camera indices
            try:
                cap = cv2.VideoCapture(i)
                if cap.isOpened():
                    # Get camera name if available (platform dependent)
                    ret, frame = cap.read()
                    if ret:
                        logger.info(f"Found camera at index {i}")
                        # For Chicony detection, we rely on the camera_id
                        # In production, you might use platform-specific APIs
                        cap.release()
                        if i == 0:  # Assume first camera is Chicony for demo
                            return i
                cap.release()
            except Exception as e:
                logger.debug(f"Error checking camera {i}: {e}")
                continue
        return None
    
    def initialize_camera(self) -> bool:
        """
        Initialize camera with optimal settings for QR detection
        """
        try:
            self.cap = cv2.VideoCapture(self.camera_id)
            
            if not self.cap.isOpened():
                logger.error(f"Cannot open camera {self.camera_id}")
                return False
            
            # Set camera properties for optimal QR detection
            self.cap.set(cv2.CAP_PROP_FRAME_WIDTH, 640)
            self.cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 480)
            self.cap.set(cv2.CAP_PROP_FPS, 30)
            
            # Test frame capture
            ret, frame = self.cap.read()
            if not ret:
                logger.error("Cannot read frame from camera")
                return False
            
            logger.info(f"Camera initialized successfully: {frame.shape}")
            return True
            
        except Exception as e:
            logger.error(f"Camera initialization failed: {e}")
            return False
    
    def detect_qr_codes(self, frame: np.ndarray) -> list:
        """
        Detect QR codes in the given frame with retry strategy
        """
        try:
            detected_codes = []
            # Pipeline 1: grayscale + light blur
            gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
            gray_blur = cv2.GaussianBlur(gray, (3, 3), 0)
            qr_codes = pyzbar.decode(gray_blur)
            
            # Retry Pipeline 2: adaptive threshold if none found
            if not qr_codes:
                th = cv2.adaptiveThreshold(gray, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
                                           cv2.THRESH_BINARY, 31, 2)
                qr_codes = pyzbar.decode(th)
            
            # Retry Pipeline 3: resize scales if still none
            if not qr_codes:
                for scale in [1.25, 1.5, 2.0]:
                    resized = cv2.resize(gray_blur, None, fx=scale, fy=scale, interpolation=cv2.INTER_CUBIC)
                    qr_codes = pyzbar.decode(resized)
                    if qr_codes:
                        break
            
            for qr in qr_codes:
                # Extract QR code data
                try:
                    qr_data = qr.data.decode('utf-8')
                except Exception:
                    continue
                qr_type = getattr(qr, 'type', 'QRCODE')
                # Get bounding box
                (x, y, w, h) = qr.rect
                # Get corner points
                points = getattr(qr, 'polygon', [])
                if len(points) == 4:
                    corners = [(point.x, point.y) for point in points]
                else:
                    corners = [(x, y), (x + w, y), (x + w, y + h), (x, y + h)]
                detected_codes.append({
                    'data': qr_data,
                    'type': qr_type,
                    'bbox': (x, y, w, h),
                    'corners': corners,
                    'timestamp': time.time()
                })
            return detected_codes
        except Exception as e:
            logger.error(f"QR detection error: {e}")
            return []
            for qr in qr_codes:
                # Extract QR code data
                qr_data = qr.data.decode('utf-8')
                qr_type = qr.type
                
                # Get bounding box
                (x, y, w, h) = qr.rect
                
                # Get corner points
                points = qr.polygon
                if len(points) == 4:
                    corners = [(point.x, point.y) for point in points]
                else:
                    corners = [(x, y), (x + w, y), (x + w, y + h), (x, y + h)]
                
                detected_codes.append({
                    'data': qr_data,
                    'type': qr_type,
                    'bbox': (x, y, w, h),
                    'corners': corners,
                    'timestamp': time.time()
                })
                
                logger.info(f"QR Code detected: {qr_data[:50]}...")
            
            return detected_codes
            
        except Exception as e:
            logger.error(f"QR detection error: {e}")
            return []
    
    def validate_jrmsu_qr(self, qr_data: str) -> Dict[str, Any]:
        """
        Validate if QR code is a valid JRMSU Library System code (no expiration check)
        """
        try:
            data = json.loads(qr_data)
            # Required fields based on login requirements
            required_fields = ['systemId', 'userId', 'fullName', 'userType', 'systemTag']
            if not all(field in data for field in required_fields):
                return {'isValid': False, 'error': 'Missing required fields'}
            if data.get('systemId') != 'JRMSU-LIBRARY':
                return {'isValid': False, 'error': 'Invalid system ID'}
            # Accept either encryptedPasswordToken or sessionToken/encryptedToken
            if not any(k in data for k in ['encryptedPasswordToken', 'sessionToken', 'encryptedToken']):
                return {'isValid': False, 'error': 'Missing authentication token'}
            # Basic userType/systemTag consistency
            expected_tag = 'JRMSU-KCL' if data.get('userType') == 'admin' else 'JRMSU-KCS'
            if data.get('systemTag') != expected_tag:
                return {'isValid': False, 'error': 'System tag/user type mismatch'}
            return {'isValid': True, 'data': data, 'validatedAt': time.time()}
        except json.JSONDecodeError:
            return {'isValid': False, 'error': 'Invalid JSON format'}
        except Exception as e:
            return {'isValid': False, 'error': f'Validation error: {str(e)}'}
    
    def draw_detections(self, frame: np.ndarray, detections: list) -> np.ndarray:
        """
        Draw QR code detections on the frame
        
        Args:
            frame: OpenCV image frame
            detections: List of detected QR codes
            
        Returns:
            Frame with drawn detections
        """
        for detection in detections:
            corners = detection['corners']
            bbox = detection['bbox']
            x, y, w, h = bbox
            
            # Draw bounding rectangle
            cv2.rectangle(frame, (x, y), (x + w, y + h), (0, 255, 0), 2)
            
            # Draw corner points
            for corner in corners:
                cv2.circle(frame, corner, 5, (255, 0, 0), -1)
            
            # Draw QR code type and data preview
            label = f"{detection['type']}: {detection['data'][:20]}..."
            cv2.putText(frame, label, (x, y - 10), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 0), 1)
        
        return frame
    
    def process_frame(self) -> Optional[Dict[str, Any]]:
        """
        Process a single frame and return QR detection results
        
        Returns:
            Dictionary with frame data and detections, or None if error
        """
        if not self.cap or not self.cap.isOpened():
            return None
        
        try:
            ret, frame = self.cap.read()
            if not ret:
                logger.warning("Failed to read frame")
                return None
            
            # Detect QR codes
            detections = self.detect_qr_codes(frame)
            
            # Validate JRMSU QR codes
            validated_codes = []
            for detection in detections:
                validation = self.validate_jrmsu_qr(detection['data'])
                detection['validation'] = validation
                if validation['isValid']:
                    validated_codes.append(detection)
            
            # Draw detections on frame
            annotated_frame = self.draw_detections(frame.copy(), detections)
            
            return {
                'timestamp': time.time(),
                'frame_shape': frame.shape,
                'detections_count': len(detections),
                'valid_jrmsu_codes': len(validated_codes),
                'detections': detections,
                'valid_codes': validated_codes
            }
            
        except Exception as e:
            logger.error(f"Frame processing error: {e}")
            return None
    
    def start_detection_loop(self):
        """
        Start continuous QR detection loop
        """
        if not self.initialize_camera():
            logger.error("Failed to initialize camera")
            return
        
        self.is_running = True
        logger.info("Starting QR detection loop...")
        
        try:
            while self.is_running:
                result = self.process_frame()
                if result and result['valid_jrmsu_codes'] > 0:
                    # Put valid detections in queue
                    self.detection_queue.put(result)
                    logger.info(f"Valid JRMSU QR code detected: {result['valid_jrmsu_codes']} codes")
                
                # Small delay to prevent excessive CPU usage
                time.sleep(0.1)
                
        except KeyboardInterrupt:
            logger.info("Detection loop interrupted by user")
        except Exception as e:
            logger.error(f"Detection loop error: {e}")
        finally:
            self.stop()
    
    def stop(self):
        """
        Stop the QR detection system
        """
        self.is_running = False
        if self.cap:
            self.cap.release()
            logger.info("Camera released")
    
    def get_latest_detection(self) -> Optional[Dict[str, Any]]:
        """
        Get the latest QR detection from the queue
        
        Returns:
            Latest detection result or None if queue is empty
        """
        try:
            return self.detection_queue.get_nowait()
        except queue.Empty:
            return None

def main():
    """
    Main function for testing the QR detector
    """
    detector = QRDetector()
    
    # Test initialization
    if detector.initialize_camera():
        logger.info("Camera initialized successfully")
        
        # Process a few frames for testing
        for i in range(10):
            result = detector.process_frame()
            if result:
                logger.info(f"Frame {i}: {result['detections_count']} detections, {result['valid_jrmsu_codes']} valid")
            time.sleep(1)
    
    detector.stop()

if __name__ == "__main__":
    main()