import { useState, useEffect, useRef } from "react";
import { Camera, AlertTriangle, CheckCircle, Play, Square, Settings, ChevronDown, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Html5Qrcode, Html5QrcodeScanType, Html5QrcodeSupportedFormats } from "html5-qrcode";
import jsQR from "jsqr"; // Add jsQR as backup decoder

interface CameraDevice {
  deviceId: string;
  label: string;
  isPreferred: boolean;
}

interface QRScannerProps {
  onScanSuccess: (data: string) => void;
  onError: (error: string) => void;
}

interface DiagnosticsInfo {
  availableDevices: number;
  selectedDeviceId: string | null;
  isSecureContext: boolean;
  containerExists: boolean;
  containerVisible: boolean;
  lastError: string | null;
  timestamp: string;
}

export function QRScanner({ onScanSuccess, onError }: QRScannerProps) {
  const [isActive, setIsActive] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [permissionGranted, setPermissionGranted] = useState<boolean | null>(null);
  const [debugInfo, setDebugInfo] = useState<string>('');
  const [showDebug, setShowDebug] = useState(false);
  const [cameras, setCameras] = useState<CameraDevice[]>([]);
  const [selectedCamera, setSelectedCamera] = useState<string>('');
  const [showCameraSelector, setShowCameraSelector] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [diagnostics, setDiagnostics] = useState<DiagnosticsInfo | null>(null);
  const [showRestartButton, setShowRestartButton] = useState(false);
  
  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const initTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Log diagnostics to localStorage for postmortem analysis
  const logDiagnostics = (info: Partial<DiagnosticsInfo>) => {
    const diagnosticsInfo: DiagnosticsInfo = {
      availableDevices: cameras.length,
      selectedDeviceId: selectedCamera || null,
      isSecureContext: window.isSecureContext,
      containerExists: !!document.getElementById('qr-scanner-container'),
      containerVisible: isContainerVisible(),
      lastError: error,
      timestamp: new Date().toISOString(),
      ...info
    };
    
    setDiagnostics(diagnosticsInfo);
    
    // Save to localStorage for debugging
    try {
      const logs = JSON.parse(localStorage.getItem('qr-scanner-logs') || '[]');
      logs.push(diagnosticsInfo);
      // Keep only last 10 entries
      localStorage.setItem('qr-scanner-logs', JSON.stringify(logs.slice(-10)));
    } catch (e) {
      console.warn('Failed to save diagnostics to localStorage:', e);
    }
  };

  // Check if scanner container is visible
  const isContainerVisible = (): boolean => {
    const container = document.getElementById('qr-scanner-container');
    if (!container) return false;
    
    const rect = container.getBoundingClientRect();
    const style = window.getComputedStyle(container);
    
    return (
      rect.width > 0 && 
      rect.height > 0 && 
      style.display !== 'none' && 
      style.visibility !== 'hidden' && 
      parseFloat(style.opacity || '1') > 0
    );
  };

  // Wait for DOM to be ready and container to be mounted
  const waitForDOMReady = (): Promise<void> => {
    return new Promise((resolve) => {
      if (document.readyState === 'complete') {
        resolve();
        return;
      }
      
      window.addEventListener('load', () => resolve(), { once: true });
    });
  };

  // Wait for container to be available and visible with improved logic
  const waitForContainer = (maxAttempts = 30, delay = 200): Promise<HTMLElement> => {
    return new Promise((resolve, reject) => {
      let attempts = 0;
      
      const checkContainer = () => {
        attempts++;
        console.log(`🔍 Checking for scanner container, attempt ${attempts}/${maxAttempts}`);
        
        const container = document.getElementById('qr-scanner-container');
        
        if (container) {
          // Force container to be visible
          container.style.display = 'block';
          container.style.visibility = 'visible';
          container.style.opacity = '1';
          
          // Wait a bit more for container to be properly mounted
          setTimeout(() => {
            if (isContainerVisible()) {
              console.log('✅ Scanner container found and made visible');
              resolve(container);
            } else {
              console.log('⚠️ Container exists but not visible, continuing...');
              if (attempts < maxAttempts) {
                setTimeout(checkContainer, delay);
              } else {
                console.log('🔧 Using container anyway - forcing initialization');
                resolve(container);
              }
            }
          }, 100);
          return;
        }
        
        if (attempts >= maxAttempts) {
          const error = 'Scanner container not found after maximum attempts - DOM may not be ready';
          console.error('❌', error);
          logDiagnostics({ lastError: error });
          reject(new Error(error));
          return;
        }
        
        setTimeout(checkContainer, delay);
      };
      
      checkContainer();
    });
  };

  // Comprehensive camera device detection
  const detectCameras = async (): Promise<CameraDevice[]> => {
    try {
      console.log('🔍 Starting camera detection...');
      
      // Check if mediaDevices is supported
      if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
        throw new Error('MediaDevices API not supported');
      }
      
      const devices = await navigator.mediaDevices.enumerateDevices();
      console.log('📹 Raw devices found:', devices.length);
      
      const videoDevices = devices
        .filter(device => device.kind === 'videoinput')
        .map(device => {
          const label = device.label || `Camera ${device.deviceId.slice(0, 8)}`;
          console.log(`📷 Device found: ${label} (ID: ${device.deviceId.slice(0, 8)}...)`);
          
          // Enhanced Chicony camera detection with more patterns
          const labelLower = label.toLowerCase();
          const isChiconyCamera = (
            labelLower.includes('chicony') || 
            labelLower.includes('04f2:b729') ||
            labelLower.includes('04f2') ||
            labelLower.includes('b729') ||
            labelLower.includes('usb 2.0 camera') ||
            device.deviceId.includes('04f2') ||
            device.deviceId.includes('b729')
          );
          
          return {
            deviceId: device.deviceId,
            label: label,
            isPreferred: isChiconyCamera
          };
        })
        .sort((a, b) => {
          if (a.isPreferred && !b.isPreferred) return -1;
          if (!a.isPreferred && b.isPreferred) return 1;
          return 0;
        });
      
      console.log(`📋 Processed video devices: ${videoDevices.length}`);
      videoDevices.forEach((cam, idx) => {
        console.log(`  ${idx + 1}. ${cam.label}${cam.isPreferred ? ' (PREFERRED - Chicony)' : ''}`);
      });
      
      setCameras(videoDevices);
      
      // Auto-select Chicony camera or first available
      if (videoDevices.length > 0) {
        const preferredCamera = videoDevices.find(cam => cam.isPreferred);
        const defaultCamera = preferredCamera || videoDevices[0];
        setSelectedCamera(defaultCamera.deviceId);
        
        if (preferredCamera) {
          console.log('✅ Chicony USB 2.0 Camera auto-selected:', preferredCamera.label);
        } else {
          console.log('📷 First available camera selected:', defaultCamera.label);
        }
      }
      
      logDiagnostics({ availableDevices: videoDevices.length });
      return videoDevices;
      
    } catch (error) {
      const errorMsg = `Camera detection failed: ${(error as Error).message}`;
      console.error('❌', errorMsg);
      logDiagnostics({ lastError: errorMsg });
      throw error;
    }
  };

  // Properly stop and clean up existing scanner instance
  const stopScanner = async (): Promise<void> => {
    console.log('🛝 Stopping QR scanner...');
    
    if (initTimeoutRef.current) {
      clearTimeout(initTimeoutRef.current);
      initTimeoutRef.current = null;
    }
    
    if (html5QrCodeRef.current) {
      try {
        const isScanning = html5QrCodeRef.current.getState();
        if (isScanning === 2) { // Html5QrcodeScannerState.SCANNING
          await html5QrCodeRef.current.stop();
        }
        await html5QrCodeRef.current.clear();
        console.log('✅ HTML5-QRCode instance cleaned up');
      } catch (error) {
        console.warn('⚠️ Error during scanner cleanup:', error);
      } finally {
        html5QrCodeRef.current = null;
      }
    }
    
    setIsActive(false);
    setIsInitializing(false);
    setShowRestartButton(true);
  };

  // Initialize HTML5-QRCode scanner with comprehensive error handling
  const startScanner = async (cameraId?: string, attemptNumber: number = 1): Promise<void> => {
    const maxAttempts = 3;
    console.log(`🎥 Starting QR scanner (attempt ${attemptNumber}/${maxAttempts})...`);
    
    if (attemptNumber === 1) {
      setIsInitializing(true);
      setError(null);
      setRetryCount(0);
      setShowRestartButton(false);
    }
    
    try {
      // Security and compatibility checks
      if (!window.isSecureContext) {
        throw new Error('HTTPS or localhost required for camera access');
      }
      
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera access not supported in this browser');
      }
      
      // Wait for DOM to be ready
      await waitForDOMReady();
      
      // First check if container exists immediately
      let containerElement = document.getElementById('qr-scanner-container');
      
      if (!containerElement) {
        console.log('⚠️ Container not found, waiting for it...');
        containerElement = await waitForContainer();
      } else {
        console.log('✅ Container found immediately');
        // Ensure it's visible
        containerElement.style.display = 'block';
        containerElement.style.visibility = 'visible';
        containerElement.style.opacity = '1';
      }
      
      console.log('✅ Container ready:', containerElement.id);
      
      // Stop any existing scanner before starting new one
      await stopScanner();
      
      // Get available cameras
      let availableCameras = cameras;
      if (cameras.length === 0) {
        availableCameras = await detectCameras();
      }
      
      if (availableCameras.length === 0) {
        throw new Error('No camera devices found');
      }
      
      // Determine target camera ID
      const targetCameraId = cameraId || selectedCamera || availableCameras[0].deviceId;
      
      console.log(`📹 Using camera: ${availableCameras.find(cam => cam.deviceId === targetCameraId)?.label || 'Unknown'}`);
      console.log(`🎯 Target device ID: ${targetCameraId.slice(0, 8)}...`);
      
      // Enhanced camera constraints for better compatibility and quality
      const cameraConstraints = {
        deviceId: targetCameraId ? { exact: targetCameraId } : undefined,
        width: { ideal: 1280, min: 480 }, // Ensure minimum width for display
        height: { ideal: 720, min: 360 },
        frameRate: { ideal: 30, min: 10 }, // Lower minimum for compatibility
        facingMode: targetCameraId ? undefined : "environment", // Only use facingMode if no specific device
        aspectRatio: { ideal: 16/9 }
      };
      
      console.log('📹 Camera constraints:', cameraConstraints);
      
      // Initialize HTML5-QRCode
      html5QrCodeRef.current = new Html5Qrcode('qr-scanner-container');
      
      // SIMPLE RELIABLE scanner configuration - focus on WORKING not features
      const scannerConfig = {
        fps: 10, // Lower FPS for reliability
        qrbox: 250, // Fixed size box for consistent detection
        aspectRatio: 1.0,
        disableFlip: false,
        
        // SIMPLE settings that actually work
        supportedScanTypes: [Html5QrcodeScanType.SCAN_TYPE_CAMERA],
        useBarCodeDetectorIfSupported: true,
        
        // Basic video constraints
        videoConstraints: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          frameRate: { ideal: 15 }
        },
        
        // Keep it simple
        formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE],
        verbose: true // Keep logging
      };
      
      console.log('⚙️ Scanner config:', scannerConfig);
      
      // Set up success and error callbacks with MAXIMUM logging
      const onScanSuccessCallback = (decodedText: string, decodedResult: any) => {
        console.log('🚨 === QR CODE DETECTION SUCCESS === 🚨');
        console.log('🎉 QRCode detect! Successfully scanned QR code');
        console.log('✅ RAW QR Code data:', decodedText);
        console.log('📊 QR Details:', {
          format: decodedResult.format?.formatName,
          timestamp: new Date().toISOString(),
          dataLength: decodedText.length,
          fullData: decodedText
        });
        console.log('🚀 Calling onScanSuccess callback...');
        
        // FORCE immediate callback execution
        try {
          onScanSuccess(decodedText);
          console.log('✅ onScanSuccess callback completed successfully');
        } catch (error) {
          console.error('❌ onScanSuccess callback FAILED:', error);
        }
        
        // Show immediate success feedback with enhanced login loading card
        const container = document.getElementById('qr-scanner-container');
        if (container) {
          // Create QR detection success overlay similar to manual login loading
          const successOverlay = document.createElement('div');
          successOverlay.className = 'absolute inset-0 bg-gradient-to-br from-green-500 to-blue-600 bg-opacity-95 flex items-center justify-center rounded-lg z-50 animate-in fade-in duration-300';
          successOverlay.innerHTML = `
            <div class="text-white text-center p-6 space-y-4 animate-in slide-in-from-bottom-4 duration-500">
              <div class="animate-bounce">
                <div class="text-4xl mb-2">✅</div>
                <div class="text-2xl font-bold mb-2 text-green-100">QRCode detect!</div>
                <div class="text-lg text-green-200">Processing authentication...</div>
              </div>
              <div class="flex items-center justify-center space-x-3 mt-6">
                <div class="animate-spin rounded-full h-10 w-10 border-4 border-white border-t-transparent"></div>
                <div class="flex flex-col items-start text-left">
                  <span class="text-sm font-medium">Verifying QR credentials...</span>
                  <span class="text-xs text-green-200">Auto-login in progress</span>
                </div>
              </div>
            </div>
          `;
          container.style.position = 'relative';
          container.appendChild(successOverlay);
          
          // Keep overlay visible during login process - will be removed when login completes
          setTimeout(() => {
            if (successOverlay && successOverlay.parentNode) {
              successOverlay.parentNode.removeChild(successOverlay);
            }
          }, 6000); // Extended timeout for login process
        }
        
        onScanSuccess(decodedText);
      };
      
      const onScanErrorCallback = (errorMessage: string) => {
        // Only log actual errors, not normal "not found" messages
        if (errorMessage.includes('NotFoundException') || 
            errorMessage.includes('No QR code found') ||
            errorMessage.includes('QR code parse error')) {
          // These are normal - don't spam console
          return;
        }
        
        // Log real errors
        if (!errorMessage.includes('NotFoundException')) {
          console.warn('⚠️ QR Scanner error:', errorMessage);
        }
      };
      
      // Use SIMPLE camera approach - just the device ID
      console.log('📹 Starting scanner with device ID:', targetCameraId.slice(0, 8) + '...');
      console.log('🔧 Using SIMPLE reliable configuration');
      
      const scannerPromise = html5QrCodeRef.current.start(
        targetCameraId, // Just pass device ID string directly
        scannerConfig,
        onScanSuccessCallback,
        onScanErrorCallback
      );
      
      // Set timeout for initialization with better error handling
      const timeoutPromise = new Promise((_, reject) => {
        initTimeoutRef.current = setTimeout(() => {
          reject(new Error('Scanner initialization timeout (15s). Please check camera permissions and try again.'));
        }, 15000); // Increased timeout for better compatibility
      });
      
      // Wait for scanner to start or timeout
      await Promise.race([scannerPromise, timeoutPromise]);
      
      if (initTimeoutRef.current) {
        clearTimeout(initTimeoutRef.current);
        initTimeoutRef.current = null;
      }
      
      setIsActive(true);
      setIsInitializing(false);
      setPermissionGranted(true);
      setError(null);
      
      // Force video element to be visible and properly sized
      setTimeout(() => {
        const container = document.getElementById('qr-scanner-container');
        if (container) {
          const videoElement = container.querySelector('video');
          if (videoElement) {
            videoElement.style.width = '100%';
            videoElement.style.height = '100%';
            videoElement.style.objectFit = 'cover';
            videoElement.style.display = 'block';
            videoElement.style.visibility = 'visible';
            console.log('📹 Video element forced to display:', videoElement);
          } else {
            console.warn('⚠️ Video element not found in container');
          }
        }
      }, 500);
      
      console.log('✅ QR Scanner started successfully');
      logDiagnostics({ lastError: null });
      
      // REPLACE broken HTML5-QRCode detection with WORKING jsQR manual scanning
      let scanningActive = true;
      const jsQRDetection = setInterval(() => {
        if (!scanningActive || !html5QrCodeRef.current) {
          clearInterval(jsQRDetection);
          return;
        }
        
        try {
          const container = document.getElementById('qr-scanner-container');
          const video = container?.querySelector('video') as HTMLVideoElement;
          
          if (video && video.videoWidth > 0 && video.videoHeight > 0) {
            // Create canvas to capture video frame
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            
            if (ctx) {
              canvas.width = video.videoWidth;
              canvas.height = video.videoHeight;
              ctx.drawImage(video, 0, 0);
              
              // Get image data for jsQR
              const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
              
              // Use jsQR to actually decode QR codes that HTML5-QRCode can't handle
              const qrResult = jsQR(imageData.data, imageData.width, imageData.height, {
                inversionAttempts: "dontInvert",
              });
              
              if (qrResult && qrResult.data) {
                console.log('🎉 jsQR SUCCESS! Decoded QR code data:', qrResult.data);
                scanningActive = false; // Stop scanning
                clearInterval(jsQRDetection);
                
                // Call the success callback with the decoded data
                onScanSuccessCallback(qrResult.data, { 
                  format: { formatName: 'QR_CODE' },
                  location: qrResult.location 
                });
              }
            }
          }
        } catch (error) {
          console.debug('jsQR detection failed:', error);
        }
      }, 100); // Check every 100ms for faster detection
      
      // Clean up jsQR interval when scanner stops
      const originalStop = html5QrCodeRef.current.stop;
      html5QrCodeRef.current.stop = () => {
        scanningActive = false;
        clearInterval(jsQRDetection);
        return originalStop.call(html5QrCodeRef.current);
      };
      
    } catch (error) {
      const errorMsg = (error as Error).message;
      console.error(`❌ Scanner start failed (attempt ${attemptNumber}):`, errorMsg);
      
      // Clean up on error
      if (html5QrCodeRef.current) {
        try {
          await html5QrCodeRef.current.clear();
        } catch (cleanupError) {
          console.warn('Cleanup error:', cleanupError);
        }
        html5QrCodeRef.current = null;
      }
      
      // Retry logic with exponential backoff
      if (attemptNumber < maxAttempts) {
        const delay = attemptNumber * 500; // 500ms, 1000ms, 1500ms
        console.log(`🔄 Retrying in ${delay}ms...`);
        
        setTimeout(() => {
          startScanner(cameraId, attemptNumber + 1);
        }, delay);
        
        return;
      }
      
      // All attempts failed
      setError(errorMsg);
      setIsInitializing(false);
      setIsActive(false);
      setRetryCount(attemptNumber);
      
      logDiagnostics({ lastError: errorMsg });
      onError(errorMsg);
    }
  };

  const restartCamera = async () => {
    console.log('🔄 Restarting camera...');
    setShowRestartButton(false);
    setError(null);
    await startScanner(selectedCamera);
  };


  // Initialize camera detection on component mount with DOM-ready safeguard
  useEffect(() => {
    const initializeScanner = async () => {
      try {
        console.log('🚀 Initializing QR Scanner system...');
        
        // Wait for DOM to be fully ready
        await waitForDOMReady();
        
        // Security context check
        if (!window.isSecureContext) {
          setError('HTTPS or localhost required for camera access');
          logDiagnostics({ lastError: 'Insecure context' });
          return;
        }
        
        // Browser compatibility check
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          setError('Camera not supported in this browser');
          logDiagnostics({ lastError: 'MediaDevices not supported' });
          return;
        }
        
        // Enhanced camera permission and device enumeration
        try {
          console.log('🔒 Requesting camera permission for device enumeration...');
          
          // First try to get permission with basic video constraints
          const tempStream = await navigator.mediaDevices.getUserMedia({ 
            video: { 
              width: { ideal: 640 }, 
              height: { ideal: 480 } 
            } 
          });
          
          // Check if we actually got a video track
          const videoTracks = tempStream.getVideoTracks();
          if (videoTracks.length === 0) {
            throw new Error('No video tracks available');
          }
          
          console.log(`✅ Camera permission granted - ${videoTracks.length} video track(s) available`);
          
          // Stop the temporary stream
          tempStream.getTracks().forEach(track => {
            console.log(`📋 Stopping temp track: ${track.label}`);
            track.stop();
          });
          
          setPermissionGranted(true);
          
        } catch (permError) {
          console.warn('⚠️ Camera permission request failed:', (permError as Error).message);
          setPermissionGranted(false);
          
          // Don't set this as a hard error - user can still try to grant permission later
          console.log('🔄 Permission will be requested when user starts scanner');
        }
        
        // Detect available cameras
        await detectCameras();
        
        // Auto-start scanner after camera detection
        setTimeout(() => {
          if (!isActive && !isInitializing) {
            console.log('🚀 Auto-starting camera scanner...');
            startScanner();
          }
        }, 1000);
        
      } catch (error) {
        console.error('❌ Scanner system initialization failed:', error);
        setError((error as Error).message);
        logDiagnostics({ lastError: (error as Error).message });
      }
    };
    
    initializeScanner();
    
    // Cleanup on unmount
    return () => {
      console.log('🧹 Component unmounting, cleaning up scanner...');
      stopScanner();
    };
  }, []);

  // Force container visibility and video display when scanner is active/initializing
  useEffect(() => {
    const container = document.getElementById('qr-scanner-container');
    if (container && (isActive || isInitializing)) {
      container.style.display = 'block';
      container.style.visibility = 'visible';
      container.style.opacity = '1';
      container.style.minHeight = '400px';
      console.log('🔧 Container forced to be visible');
      
      // Periodically check for video element and force it to display
      const videoCheckInterval = setInterval(() => {
        const videoElement = container.querySelector('video');
        if (videoElement) {
          videoElement.style.width = '100%';
          videoElement.style.height = '100%';
          videoElement.style.objectFit = 'cover';
          videoElement.style.display = 'block';
          videoElement.style.visibility = 'visible';
          videoElement.style.opacity = '1';
          videoElement.style.backgroundColor = 'transparent';
          console.log('📹 Video element styling enforced');
        }
      }, 1000);
      
      // Cleanup interval when component unmounts or scanner stops
      return () => {
        clearInterval(videoCheckInterval);
      };
    }
  }, [isActive, isInitializing]);

  return (
    <div className="space-y-4">
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-dashed border-blue-200 rounded-lg p-6">
        <div className="text-center space-y-4">
          {/* Status Header */}
          <div className="flex items-center justify-center gap-3">
            <div className={`p-2 rounded-full ${
              isActive ? 'bg-green-100' : 
              isInitializing ? 'bg-yellow-100' : 
              error ? 'bg-red-100' : 'bg-gray-100'
            }`}>
              <Camera className={`h-8 w-8 ${
                isActive ? 'text-green-600' : 
                isInitializing ? 'text-yellow-600' : 
                error ? 'text-red-600' : 'text-gray-400'
              }`} />
            </div>
            <div className="text-left">
              <h3 className="text-lg font-semibold text-gray-800">Camera Scanner</h3>
              <div className="flex items-center gap-2">
                <Badge variant={isActive ? 'default' : 'secondary'} className="text-xs">
                  {isInitializing ? 'Initializing...' : 
                   isActive ? 'Live Camera' : 
                   error ? 'Error' : 'Ready'}
                </Badge>
                {permissionGranted === true && <CheckCircle className="h-4 w-4 text-green-500" />}
                {permissionGranted === false && <AlertTriangle className="h-4 w-4 text-red-500" />}
              </div>
            </div>
          </div>
          
          {/* Camera Off State */}
          {!isActive && !error && !isInitializing && cameras.length === 0 && (
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                Detecting cameras...
              </p>
            </div>
          )}
          
          {/* Camera Selection - Show when cameras detected but not started */}
          {!isActive && !error && !isInitializing && cameras.length > 0 && (
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                Camera detected. Starting scanner automatically...
              </p>
              
              <div className="space-y-3">
                <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
                  <Settings className="h-4 w-4" />
                  <span>Camera Selection ({cameras.length} available)</span>
                </div>
                  
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <label className="text-sm font-semibold text-blue-800 block mb-3">
                      Select Camera Device:
                    </label>
                    <Select value={selectedCamera} onValueChange={setSelectedCamera}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Choose camera device..." />
                      </SelectTrigger>
                      <SelectContent>
                        {cameras.map((camera) => (
                          <SelectItem key={camera.deviceId} value={camera.deviceId}>
                            <div className="flex items-center justify-between w-full">
                              <span className="truncate flex-1">{camera.label}</span>
                              {camera.isPreferred && (
                                <Badge variant="default" className="text-xs ml-2 bg-green-600">
                                  ✅ Chicony Recommended
                                </Badge>
                              )}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    
                    {selectedCamera && cameras.length > 0 && (
                      <div className="mt-2 text-xs text-blue-700 bg-blue-100 p-2 rounded">
                        📹 <strong>Active:</strong> {cameras.find(cam => cam.deviceId === selectedCamera)?.label || 'Unknown camera'}
                        {cameras.find(cam => cam.deviceId === selectedCamera)?.isPreferred && (
                          <span className="text-green-700 font-semibold"> (Optimal for QR scanning)</span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              
              <div className="space-y-2">
                {!showRestartButton ? (
                  <Button onClick={() => startScanner()} size="lg" className="min-w-[160px]">
                    <Play className="h-4 w-4 mr-2" />
                    Start QR Scanner
                    {cameras.find(cam => cam.deviceId === selectedCamera && cam.isPreferred) && (
                      <Badge variant="secondary" className="ml-2 text-xs">
                        Chicony
                      </Badge>
                    )}
                  </Button>
                ) : (
                  <Button onClick={restartCamera} size="lg" className="min-w-[160px] bg-green-600 hover:bg-green-700">
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Restart Camera
                    {cameras.find(cam => cam.deviceId === selectedCamera && cam.isPreferred) && (
                      <Badge variant="secondary" className="ml-2 text-xs">
                        Chicony
                      </Badge>
                    )}
                  </Button>
                )}
                
                {selectedCamera && cameras.length > 0 && (
                  <p className="text-xs text-gray-500 text-center">
                    Using: {cameras.find(cam => cam.deviceId === selectedCamera)?.label || 'Selected camera'}
                    {cameras.find(cam => cam.deviceId === selectedCamera)?.isPreferred && 
                      <span className="text-green-600 font-medium"> (Recommended)</span>
                    }
                  </p>
                )}
                
                <p className="text-xs text-gray-500 text-center">
                  Your browser will ask for camera permission.
                </p>
              </div>
            </div>
          )}

          {/* Initializing State */}
          {isInitializing && (
            <div className="space-y-3">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-sm text-gray-600">
                Activating camera... Please allow camera access if prompted.
              </p>
            </div>
          )}

          {/* Error State */}
          {error && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription className="text-left">
                <div className="space-y-2">
                  <p className="font-medium">Camera Access Issue</p>
                  <p className="text-sm">{error}</p>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => {
                      setError(null);
                      setPermissionGranted(null);
                      startScanner();
                    }}>
                      <Play className="h-4 w-4 mr-1" />
                      Try Again
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => setError(null)}>
                      Dismiss
                    </Button>
                  </div>
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* HTML5-QRCode Scanner Container - Always visible for immediate camera display */}
          <div className="space-y-4">
            <div className="relative">
              {/* HTML5-QRCode Container - Always visible and mounted */}
              <div 
                id="qr-scanner-container"
                ref={containerRef}
                className="w-full mx-auto bg-black rounded-lg shadow-lg overflow-hidden block"
                style={{ 
                  minHeight: '400px',
                  height: '400px',
                  width: '100%',
                  maxWidth: '600px',
                  display: 'block',
                  position: 'relative',
                  visibility: 'visible',
                  opacity: 1,
                  backgroundColor: '#000000'
                }}
              />
              
              {/* Initialization overlay */}
              {isInitializing && (
                <div className="absolute inset-0 bg-blue-900 bg-opacity-90 flex items-center justify-center rounded-lg">
                  <div className="text-white text-center p-4 space-y-3">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
                    <div>
                      <p className="text-sm font-medium">Starting QR Scanner...</p>
                      <p className="text-xs mt-1">Initializing camera and detection</p>
                      {retryCount > 0 && (
                        <p className="text-xs mt-1 text-yellow-300">Retry attempt: {retryCount}/3</p>
                      )}
                    </div>
                  </div>
                </div>
              )}
              
              {/* Scanning Overlay - Display only, detection works everywhere in frame */}
              {isActive && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  {/* Visual guide frame - detection works anywhere in camera view */}
                  <div className="border-2 border-white border-dashed rounded-lg w-56 h-56 flex items-center justify-center animate-pulse opacity-70">
                    <div className="text-white text-sm font-medium bg-black bg-opacity-60 px-3 py-2 rounded-lg animate-pulse">
                      Point camera at QR code
                    </div>
                  </div>
                  
                  {/* Corner indicators - purely visual, detection works anywhere */}
                  <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                    <div className="relative w-56 h-56">
                      <div className="absolute top-0 left-0 w-10 h-10 border-l-4 border-t-4 border-green-400 animate-pulse opacity-80"></div>
                      <div className="absolute top-0 right-0 w-10 h-10 border-r-4 border-t-4 border-green-400 animate-pulse opacity-80"></div>
                      <div className="absolute bottom-0 left-0 w-10 h-10 border-l-4 border-b-4 border-green-400 animate-pulse opacity-80"></div>
                      <div className="absolute bottom-0 right-0 w-10 h-10 border-r-4 border-b-4 border-green-400 animate-pulse opacity-80"></div>
                    </div>
                  </div>
                  
                  {/* Status indicator */}
                  <div className="absolute top-4 left-1/2 transform -translate-x-1/2">
                    <div className="bg-blue-600 text-white px-4 py-2 rounded-full text-sm font-medium animate-pulse">
                      📷 Scanning for QR codes...
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            {/* Camera Controls - Only show when active or initializing */}
            {(isActive || isInitializing) && (
              <div className="space-y-3">
                <p className="text-sm text-gray-700 font-medium">
                  {isActive ? "🎥 Camera is active! Position your QR code in the frame above." : "⏳ Initializing camera..."}
                </p>
                
                {isActive && (
                <div className="flex gap-2 justify-center flex-wrap">
                  <Button onClick={stopScanner} variant="outline" size="sm">
                    <Square className="h-4 w-4 mr-1" />
                    Stop Scanner
                  </Button>
                </div>
                )}
              </div>
            )}
            
            {/* Debug Panel - Always available */}
            <div className="border-t pt-2">
              <Button 
                size="sm" 
                variant="ghost" 
                onClick={() => setShowDebug(!showDebug)}
                className="text-xs"
              >
                {showDebug ? 'Hide' : 'Show'} Debug Info
              </Button>
              
              {showDebug && diagnostics && (
                <div className="mt-2 p-3 bg-gray-100 rounded text-xs font-mono space-y-1">
                  <p><strong>QR Scanner Diagnostics</strong></p>
                  <div className="border-t pt-2 space-y-1">
                    <p><strong>Security Context:</strong> {diagnostics.isSecureContext ? '✅ Secure' : '❌ Insecure'}</p>
                    <p><strong>Container Status:</strong> {diagnostics.containerExists ? '✅ Exists' : '❌ Missing'} | {diagnostics.containerVisible ? 'Visible' : 'Hidden'}</p>
                    <p><strong>Available Devices:</strong> {diagnostics.availableDevices}</p>
                    <p><strong>Selected Device ID:</strong> {diagnostics.selectedDeviceId?.slice(0, 12) || 'None'}...</p>
                    <p><strong>Scanner State:</strong> {isActive ? '✅ Active' : isInitializing ? '⏳ Initializing' : '❌ Inactive'}</p>
                    <p><strong>Permission Status:</strong> {permissionGranted === true ? '✅ Granted' : permissionGranted === false ? '❌ Denied' : '⏳ Unknown'}</p>
                    <p><strong>Retry Count:</strong> {retryCount}</p>
                    <p><strong>Last Error:</strong> {diagnostics.lastError || 'None'}</p>
                    <p><strong>Timestamp:</strong> {new Date(diagnostics.timestamp).toLocaleTimeString()}</p>
                  </div>
                  
                  {cameras.length > 0 && (
                    <div className="border-t pt-2">
                      <p><strong>Detected Cameras:</strong></p>
                      <div className="ml-2 space-y-1">
                        {cameras.map((cam, idx) => (
                          <p key={cam.deviceId} className="text-xs">
                            {idx + 1}. {cam.label} {cam.isPreferred && '🏆 (Chicony - Recommended)'}
                            <br />
                            <span className="text-gray-500 ml-3">ID: {cam.deviceId.slice(0, 12)}...</span>
                          </p>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  <div className="border-t pt-2">
                    <p><strong>Console Commands (Run in DevTools):</strong></p>
                    <div className="text-xs text-blue-600 space-y-1 mt-1">
                      <p>• <code>navigator.mediaDevices.enumerateDevices()</code></p>
                      <p>• <code>window.isSecureContext</code></p>
                      <p>• <code>document.getElementById('qr-scanner-container')</code></p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
