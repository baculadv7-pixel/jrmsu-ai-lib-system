import { useState, useEffect, useRef } from "react";
import { Camera, X, AlertTriangle, CheckCircle, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { validateJRMSUQRCode } from "./StableQRCode";

interface CameraDevice {
  deviceId: string;
  label: string;
}

interface QRScannerProps {
  isOpen: boolean;
  onClose: () => void;
  onScanSuccess: (data: any) => void;
  onScanError?: (error: string) => void;
}

export function QRScanner({ isOpen, onClose, onScanSuccess, onScanError }: QRScannerProps) {
  const [cameras, setCameras] = useState<CameraDevice[]>([]);
  const [selectedCamera, setSelectedCamera] = useState<string>("");
  const [isScanning, setIsScanning] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);
  const [scanResult, setScanResult] = useState<any>(null);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scanIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  const { toast } = useToast();

  // Detect available camera devices
  const detectCameras = async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices
        .filter(device => device.kind === 'videoinput')
        .map(device => ({
          deviceId: device.deviceId,
          label: device.label || `Camera ${device.deviceId.slice(0, 8)}`
        }));
      
      setCameras(videoDevices);
      if (videoDevices.length > 0 && !selectedCamera) {
        setSelectedCamera(videoDevices[0].deviceId);
      }
    } catch (error) {
      console.error('Error detecting cameras:', error);
      setScanError('Failed to detect camera devices');
    }
  };

  // Start camera stream
  const startCamera = async (deviceId: string) => {
    try {
      // Stop existing stream
      stopCamera();
      
      const constraints = {
        video: {
          deviceId: deviceId ? { exact: deviceId } : undefined,
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'environment' // Prefer back camera
        }
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setHasPermission(true);
        setScanError(null);
        startScanning();
      }
    } catch (error) {
      console.error('Error starting camera:', error);
      setHasPermission(false);
      setScanError('Failed to access camera. Please check permissions.');
    }
  };

  // Stop camera stream
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
    }
    
    setIsScanning(false);
  };

  // Start QR code scanning
  const startScanning = () => {
    if (!videoRef.current || !canvasRef.current) return;
    
    setIsScanning(true);
    
    scanIntervalRef.current = setInterval(() => {
      scanQRCode();
    }, 500); // Scan every 500ms
  };

  // Scan QR code from video frame
  const scanQRCode = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    if (!video || !canvas || video.readyState !== video.HAVE_ENOUGH_DATA) {
      return;
    }
    
    const context = canvas.getContext('2d');
    if (!context) return;
    
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    try {
      // Get image data for QR scanning
      const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
      
      // In a real implementation, you would use a QR code scanning library here
      // For now, we'll simulate QR code detection
      simulateQRDetection(imageData);
    } catch (error) {
      console.error('Error scanning QR code:', error);
    }
  };

  // Simulate QR code detection (replace with actual QR library)
  const simulateQRDetection = (imageData: ImageData) => {
    // This is a mock implementation
    // In reality, you'd use a library like jsQR or qr-scanner
    
    // Simulate random QR detection for demo
    if (Math.random() < 0.1) { // 10% chance per scan
      const mockQRData = JSON.stringify({
        fullName: "John Doe",
        userId: "2024-12345",
        userType: "student",
        authCode: "123456",
        encryptedToken: "abc123",
        timestamp: Date.now(),
        systemId: "JRMSU-LIBRARY"
      });
      
      handleQRDetected(mockQRData);
    }
  };

  // Handle detected QR code
  const handleQRDetected = (qrData: string) => {
    const validation = validateJRMSUQRCode(qrData);
    
    if (!validation.isValid) {
      setScanError(validation.error || "Invalid QR Code");
      if (onScanError) {
        onScanError(validation.error || "Invalid QR Code");
      }
      return;
    }
    
    // Valid JRMSU QR code detected
    setScanResult(validation.data);
    stopCamera();
    
    toast({
      title: "QR Code scanned successfully",
      description: "Valid JRMSU Library QR Code detected"
    });
    
    onScanSuccess(validation.data);
  };

  // Request camera permission
  const requestCameraPermission = async () => {
    try {
      await navigator.mediaDevices.getUserMedia({ video: true });
      setHasPermission(true);
      await detectCameras();
    } catch (error) {
      setHasPermission(false);
      setScanError('Camera permission denied');
    }
  };

  // Initialize scanner when opened
  useEffect(() => {
    if (isOpen) {
      detectCameras();
    } else {
      stopCamera();
      setScanError(null);
      setScanResult(null);
    }
    
    return () => {
      stopCamera();
    };
  }, [isOpen]);

  // Start camera when device is selected
  useEffect(() => {
    if (selectedCamera && isOpen && hasPermission) {
      startCamera(selectedCamera);
    }
  }, [selectedCamera, isOpen, hasPermission]);

  const handleClose = () => {
    stopCamera();
    onClose();
  };

  const handleRetry = () => {
    setScanError(null);
    setScanResult(null);
    if (selectedCamera) {
      startCamera(selectedCamera);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Camera className="h-5 w-5" />
            QR Code Scanner
          </DialogTitle>
          <DialogDescription>
            Scan JRMSU Library System QR codes for users and books
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Camera Selection */}
          {cameras.length > 1 && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Select Camera</label>
              <Select value={selectedCamera} onValueChange={setSelectedCamera}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose camera device" />
                </SelectTrigger>
                <SelectContent>
                  {cameras.map((camera) => (
                    <SelectItem key={camera.deviceId} value={camera.deviceId}>
                      {camera.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Camera Permission */}
          {hasPermission === false && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Camera access is required to scan QR codes.
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="ml-2"
                  onClick={requestCameraPermission}
                >
                  Grant Permission
                </Button>
              </AlertDescription>
            </Alert>
          )}

          {/* Scanner Interface */}
          {hasPermission && (
            <Card>
              <CardContent className="p-4">
                <div className="relative">
                  <video
                    ref={videoRef}
                    className="w-full h-64 bg-black rounded-lg object-cover"
                    autoPlay
                    muted
                    playsInline
                  />
                  
                  {/* Scanning overlay */}
                  {isScanning && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="border-2 border-primary border-dashed rounded-lg w-48 h-48 animate-pulse">
                        <div className="absolute top-2 left-2 w-6 h-6 border-l-2 border-t-2 border-primary"></div>
                        <div className="absolute top-2 right-2 w-6 h-6 border-r-2 border-t-2 border-primary"></div>
                        <div className="absolute bottom-2 left-2 w-6 h-6 border-l-2 border-b-2 border-primary"></div>
                        <div className="absolute bottom-2 right-2 w-6 h-6 border-r-2 border-b-2 border-primary"></div>
                      </div>
                    </div>
                  )}
                  
                  {/* Scanner status */}
                  <div className="absolute top-2 left-2">
                    <Badge variant={isScanning ? "default" : "secondary"}>
                      {isScanning ? "Scanning..." : "Ready"}
                    </Badge>
                  </div>
                </div>

                <canvas ref={canvasRef} className="hidden" />
                
                {/* Instructions */}
                <p className="text-sm text-muted-foreground mt-2 text-center">
                  Position the QR code within the frame to scan
                </p>
              </CardContent>
            </Card>
          )}

          {/* Error Display */}
          {scanError && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription className="flex items-center justify-between">
                <span>{scanError}</span>
                <Button variant="outline" size="sm" onClick={handleRetry}>
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Retry
                </Button>
              </AlertDescription>
            </Alert>
          )}

          {/* Scan Result */}
          {scanResult && (
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-2">
                  <p className="font-medium">QR Code scanned successfully!</p>
                  <div className="text-sm">
                    {scanResult.fullName && (
                      <p><strong>User:</strong> {scanResult.fullName}</p>
                    )}
                    {scanResult.title && (
                      <p><strong>Book:</strong> {scanResult.title}</p>
                    )}
                    {scanResult.userId && (
                      <p><strong>ID:</strong> {scanResult.userId}</p>
                    )}
                  </div>
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={handleClose}>
              Close
            </Button>
            {scanResult && (
              <Button onClick={() => onScanSuccess(scanResult)}>
                Process Scan
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}