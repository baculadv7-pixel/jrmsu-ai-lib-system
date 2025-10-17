import { useState, useEffect, useRef } from "react";
import { Camera, AlertTriangle, CheckCircle, Play, Square, Settings, ChevronDown, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Html5Qrcode, Html5QrcodeScanType } from "html5-qrcode";

interface CameraDevice {
  deviceId: string;
  label: string;
  isPreferred: boolean;
}

interface BasicQRScannerProps {
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

export function BasicQRScanner({ onScanSuccess, onError }: BasicQRScannerProps) {
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

  // Wait for container to be available and visible
  const waitForContainer = (maxAttempts = 20, delay = 250): Promise<HTMLElement> => {
    return new Promise((resolve, reject) => {
      let attempts = 0;
      
      const checkContainer = () => {
        attempts++;
        console.log(`🔍 Checking for scanner container, attempt ${attempts}/${maxAttempts}`);
        
        const container = document.getElementById('qr-scanner-container');
        
        if (container && isContainerVisible()) {
          console.log('✅ Scanner container found and visible');
          resolve(container);
          return;
        }
        
        if (attempts >= maxAttempts) {
          const error = 'Scanner container not found or not visible after maximum attempts';
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
          
          // Enhanced Chicony camera detection
          const labelLower = label.toLowerCase();
          const isChiconyCamera = (
            labelLower.includes('chicony') && labelLower.includes('usb')
          ) || (
            label.includes('04f2:b729') || label.includes('04f2') || label.includes('b729')
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
  };

  // Initialize HTML5-QRCode scanner with comprehensive error handling
  const startScanner = async (cameraId?: string, attemptNumber: number = 1): Promise<void> => {
    const maxAttempts = 3;
    console.log(`🎥 Starting QR scanner (attempt ${attemptNumber}/${maxAttempts})...`);
    
    if (attemptNumber === 1) {
      setIsInitializing(true);
      setError(null);
      setRetryCount(0);
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
      
      // Wait for container to be available and visible
      const containerElement = await waitForContainer();
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
      
      // Initialize HTML5-QRCode
      html5QrCodeRef.current = new Html5Qrcode('qr-scanner-container');
      
      // Enhanced scanner configuration
      const scannerConfig = {
        fps: 10,
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0,
        disableFlip: false,
        supportedScanTypes: [Html5QrcodeScanType.SCAN_TYPE_CAMERA],
        showTorchButtonIfSupported: true,
        showZoomSliderIfSupported: false, // Disable zoom slider for compatibility
        videoConstraints: {
          deviceId: targetCameraId, // Remove exact constraint for better compatibility
          width: { ideal: 640, min: 320 },
          height: { ideal: 480, min: 240 },
          facingMode: "environment" // Add facing mode for better camera selection
        }
      };
      
      console.log('⚙️ Scanner config:', scannerConfig);
      
      // Set up success and error callbacks
      const onScanSuccessCallback = (decodedText: string, decodedResult: any) => {
        console.log('✅ QR Code detected:', decodedText.slice(0, 50) + '...');
        onScanSuccess(decodedText);
      };
      
      const onScanErrorCallback = (errorMessage: string) => {
        // Only log significant errors, ignore routine scanning messages
        if (!errorMessage.includes('NotFoundException') && 
            !errorMessage.includes('No QR code found')) {
          console.debug('🔍 QR scan error:', errorMessage);
        }
      };
      
      // Start the scanner with timeout protection - use constraints instead of deviceId
      const cameraConstraints = {
        deviceId: targetCameraId,
        width: { ideal: 640 },
        height: { ideal: 480 },
        facingMode: "environment"
      };
      
      const scannerPromise = html5QrCodeRef.current.start(
        cameraConstraints,
        scannerConfig,
        onScanSuccessCallback,
        onScanErrorCallback
      );
      
      // Set timeout for initialization
      const timeoutPromise = new Promise((_, reject) => {
        initTimeoutRef.current = setTimeout(() => {
          reject(new Error('Scanner initialization timeout (10s)'));
        }, 10000);
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
      
      console.log('✅ QR Scanner started successfully');
      logDiagnostics({ lastError: null });
      
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

  const simulateScan = () => {
    // Simulate a successful scan for demo purposes
    const mockQRData = JSON.stringify({
      fullName: "Demo User",
      userId: "KC-24-A-12345",
      userType: "student",
      authCode: Math.random().toString().slice(2, 8),
      encryptedToken: btoa(`demo-token-${Date.now()}`),
      twoFactorKey: "DEMO2FA123456",
      timestamp: Date.now(),
      systemId: "JRMSU-LIBRARY"
    });
    
    console.log('🎯 Simulating QR scan with demo data');
    onScanSuccess(mockQRData);
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
        
        // Pre-detect cameras for permission and device enumeration
        try {
          console.log('🔒 Requesting camera permission for device enumeration...');
          const tempStream = await navigator.mediaDevices.getUserMedia({ video: true });
          tempStream.getTracks().forEach(track => track.stop());
          setPermissionGranted(true);
          console.log('✅ Camera permission granted');
        } catch (permError) {
          console.log('🔒 Camera permission not granted yet, will request during scan');
          setPermissionGranted(false);
        }
        
        // Detect available cameras
        await detectCameras();
        
      } catch (error) {
        console.error('❌ Scanner system initialization failed:', error);
        setError((error as Error).message);
        logDiagnostics({ lastError: (error as Error).message });
      }
    };
    
    initializeScanner();
    
    // Cleanup on unmount
    return () => {
      console.log('🧼 Component unmounting, cleaning up scanner...');
      stopScanner();
    };
  }, []);

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
          {!isActive && !error && !isInitializing && (
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                Click the button below to activate your camera for QR code scanning.
              </p>
              
              {/* Camera Selection */}
              {cameras.length > 1 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-center gap-2 text-xs text-gray-500">
                    <Settings className="h-3 w-3" />
                    <span>Camera Options Available</span>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setShowCameraSelector(!showCameraSelector)}
                    className="text-xs"
                  >
                    <ChevronDown className={`h-3 w-3 mr-1 transition-transform ${
                      showCameraSelector ? 'rotate-180' : ''
                    }`} />
                    {showCameraSelector ? 'Hide' : 'Show'} Camera Selection
                  </Button>
                  
                  {showCameraSelector && (
                    <div className="p-3 bg-gray-50 rounded border">
                      <label className="text-xs font-medium text-gray-700 block mb-2">
                        Select Camera Device:
                      </label>
                      <Select value={selectedCamera} onValueChange={setSelectedCamera}>
                        <SelectTrigger className="text-sm">
                          <SelectValue placeholder="Choose camera..." />
                        </SelectTrigger>
                        <SelectContent>
                          {cameras.map((camera) => (
                            <SelectItem key={camera.deviceId} value={camera.deviceId}>
                              <div className="flex items-center gap-2">
                                <span>{camera.label}</span>
                                {camera.isPreferred && (
                                  <Badge variant="secondary" className="text-xs px-1 py-0">
                                    Recommended
                                  </Badge>
                                )}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>
              )}
              
              <div className="space-y-2">
                <Button onClick={() => startScanner()} size="lg" className="min-w-[160px]">
                  <Play className="h-4 w-4 mr-2" />
                  Start QR Scanner
                  {cameras.find(cam => cam.deviceId === selectedCamera && cam.isPreferred) && (
                    <Badge variant="secondary" className="ml-2 text-xs">
                      Chicony
                    </Badge>
                  )}
                </Button>
                
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

          {/* HTML5-QRCode Scanner Container */}
          {(isActive || isInitializing) && (
            <div className="space-y-4">
              <div className="relative">
                {/* HTML5-QRCode Container */}
                <div 
                  id="qr-scanner-container"
                  ref={containerRef}
                  className="w-full mx-auto bg-black rounded-lg shadow-lg"
                  style={{ 
                    minHeight: '400px',
                    width: '100%',
                    display: 'block',
                    position: 'relative'
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
                
                {/* Scanning Overlay */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="border-2 border-white border-dashed rounded-lg w-48 h-48 flex items-center justify-center">
                    <div className="text-white text-sm font-medium bg-black bg-opacity-50 px-2 py-1 rounded">
                      Position QR Code Here
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="space-y-3">
                <p className="text-sm text-gray-700 font-medium">
                  🎥 Camera is active! Position your QR code in the frame above.
                </p>
                
                <div className="flex gap-2 justify-center">
                  <Button 
                    onClick={() => {
                      // Simulate a successful QR code scan for demo
                      const mockQRData = JSON.stringify({
                        fullName: "Demo User",
                        userId: "DEMO-12345",
                        userType: "student",
                        authCode: "123456",
                        encryptedToken: "demo-token",
                        timestamp: Date.now(),
                        systemId: "JRMSU-LIBRARY"
                      });
                      console.log('🎯 Simulating QR scan with demo data');
                      onScanSuccess(mockQRData);
                    }}
                    size="sm" 
                    className="bg-green-600 hover:bg-green-700"
                  >
                    📱 Simulate Scan (Demo)
                  </Button>
                  <Button onClick={stopScanner} variant="outline" size="sm">
                    <Square className="h-4 w-4 mr-1" />
                    Stop Scanner
                  </Button>
                </div>
                
                <div className="bg-blue-50 border border-blue-200 rounded p-3">
                  <p className="text-xs text-blue-700 font-medium">💡 Demo Instructions:</p>
                  <ul className="text-xs text-blue-600 mt-1 space-y-1">
                    <li>• Camera is working - you should see the live feed above</li>
                    <li>• Click "Simulate Scan" to test the login process</li>
                    <li>• In production, QR codes would be detected automatically</li>
                    <li>• Check browser console (F12) for detailed debugging info</li>
                  </ul>
                </div>
                
                {/* Debug Panel */}
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
          )}
        </div>
      </div>
    </div>
  );
}