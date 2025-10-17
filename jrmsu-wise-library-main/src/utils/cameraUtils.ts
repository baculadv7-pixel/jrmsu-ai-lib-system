/**
 * Camera Utilities for QR Code Scanner
 * Provides compatibility checking, device enumeration, and optimization functions
 */

export interface CameraCapabilities {
  hasCamera: boolean;
  hasMediaDevices: boolean;
  hasGetUserMedia: boolean;
  isHttps: boolean;
  supportedConstraints: MediaTrackSupportedConstraints | null;
  videoDevices: MediaDeviceInfo[];
  audioDevices: MediaDeviceInfo[];
}

export interface CameraCompatibility {
  isCompatible: boolean;
  warnings: string[];
  errors: string[];
  recommendations: string[];
}

export interface OptimalCameraConfig {
  deviceId?: string;
  constraints: MediaStreamConstraints;
  fallbackConstraints: MediaStreamConstraints;
}

/**
 * Check comprehensive camera capabilities of the browser/device
 */
export async function checkCameraCapabilities(): Promise<CameraCapabilities> {
  const capabilities: CameraCapabilities = {
    hasCamera: false,
    hasMediaDevices: false,
    hasGetUserMedia: false,
    isHttps: window.location.protocol === 'https:' || window.location.hostname === 'localhost',
    supportedConstraints: null,
    videoDevices: [],
    audioDevices: []
  };

  // Check if MediaDevices API is available
  if ('mediaDevices' in navigator) {
    capabilities.hasMediaDevices = true;

    // Check if getUserMedia is available
    if ('getUserMedia' in navigator.mediaDevices) {
      capabilities.hasGetUserMedia = true;

      try {
        // Get supported constraints
        if ('getSupportedConstraints' in navigator.mediaDevices) {
          capabilities.supportedConstraints = navigator.mediaDevices.getSupportedConstraints();
        }

        // Enumerate devices (requires HTTPS or localhost)
        if (capabilities.isHttps) {
          const devices = await navigator.mediaDevices.enumerateDevices();
          capabilities.videoDevices = devices.filter(device => device.kind === 'videoinput');
          capabilities.audioDevices = devices.filter(device => device.kind === 'audioinput');
          capabilities.hasCamera = capabilities.videoDevices.length > 0;
        }
      } catch (error) {
        console.warn('Error checking camera capabilities:', error);
      }
    }
  }

  return capabilities;
}

/**
 * Analyze camera compatibility and provide recommendations
 */
export function analyzeCameraCompatibility(capabilities: CameraCapabilities): CameraCompatibility {
  const compatibility: CameraCompatibility = {
    isCompatible: false,
    warnings: [],
    errors: [],
    recommendations: []
  };

  // Check for basic compatibility
  if (!capabilities.hasMediaDevices) {
    compatibility.errors.push('MediaDevices API is not supported in this browser');
    compatibility.recommendations.push('Please update to a modern browser (Chrome 53+, Firefox 36+, Safari 11+)');
  }

  if (!capabilities.hasGetUserMedia) {
    compatibility.errors.push('getUserMedia API is not supported');
    compatibility.recommendations.push('Camera access requires a modern browser with getUserMedia support');
  }

  if (!capabilities.isHttps) {
    compatibility.errors.push('Camera access requires HTTPS or localhost connection');
    compatibility.recommendations.push('Deploy the application over HTTPS for camera functionality');
  }

  if (!capabilities.hasCamera) {
    if (capabilities.isHttps && capabilities.hasGetUserMedia) {
      compatibility.warnings.push('No camera devices detected');
      compatibility.recommendations.push('Please connect a camera device or check camera permissions');
    }
  }

  // Browser-specific warnings
  const userAgent = navigator.userAgent.toLowerCase();
  
  if (userAgent.includes('ios') && !userAgent.includes('crios')) {
    compatibility.warnings.push('iOS Safari may have limited camera functionality');
    compatibility.recommendations.push('Consider using Chrome on iOS for better QR scanning');
  }

  if (userAgent.includes('android') && userAgent.includes('webview')) {
    compatibility.warnings.push('Android WebView may have camera restrictions');
    compatibility.recommendations.push('Open in a full browser for better camera support');
  }

  // Set overall compatibility
  compatibility.isCompatible = 
    capabilities.hasMediaDevices && 
    capabilities.hasGetUserMedia && 
    capabilities.isHttps;

  if (compatibility.isCompatible && compatibility.errors.length === 0) {
    if (capabilities.videoDevices.length === 0) {
      compatibility.warnings.push('Camera compatibility confirmed but no devices detected yet');
    }
  }

  return compatibility;
}

/**
 * Get optimal camera configuration for QR scanning
 */
export function getOptimalCameraConfig(capabilities: CameraCapabilities): OptimalCameraConfig {
  const config: OptimalCameraConfig = {
    constraints: {
      video: {
        width: { ideal: 1280, min: 640 },
        height: { ideal: 720, min: 480 },
        aspectRatio: { ideal: 16/9 },
        facingMode: { ideal: 'environment' }, // Prefer back camera
        focusMode: { ideal: 'continuous' }
      }
    },
    fallbackConstraints: {
      video: {
        width: { ideal: 640, min: 320 },
        height: { ideal: 480, min: 240 },
        facingMode: 'user' // Front camera fallback
      }
    }
  };

  // Select best camera device if multiple are available
  if (capabilities.videoDevices.length > 0) {
    // Prefer back/environment camera for QR scanning
    const backCamera = capabilities.videoDevices.find(device => 
      device.label.toLowerCase().includes('back') ||
      device.label.toLowerCase().includes('rear') ||
      device.label.toLowerCase().includes('environment')
    );

    if (backCamera) {
      config.deviceId = backCamera.deviceId;
      config.constraints.video = {
        ...config.constraints.video,
        deviceId: { exact: backCamera.deviceId }
      };
    } else {
      // Use first available camera
      config.deviceId = capabilities.videoDevices[0].deviceId;
      config.constraints.video = {
        ...config.constraints.video,
        deviceId: { exact: capabilities.videoDevices[0].deviceId }
      };
    }
  }

  // Adjust constraints based on supported features
  if (capabilities.supportedConstraints) {
    if (!capabilities.supportedConstraints.focusMode) {
      delete (config.constraints.video as any).focusMode;
    }
    if (!capabilities.supportedConstraints.facingMode) {
      delete (config.constraints.video as any).facingMode;
    }
  }

  return config;
}

/**
 * Test camera stream with fallback options
 */
export async function testCameraStream(config: OptimalCameraConfig): Promise<{
  success: boolean;
  stream?: MediaStream;
  usedFallback: boolean;
  error?: string;
}> {
  let stream: MediaStream | undefined;
  let usedFallback = false;

  try {
    // Try optimal configuration first
    stream = await navigator.mediaDevices.getUserMedia(config.constraints);
    return { success: true, stream, usedFallback: false };
  } catch (error) {
    console.warn('Optimal camera config failed, trying fallback:', error);
    
    try {
      // Try fallback configuration
      stream = await navigator.mediaDevices.getUserMedia(config.fallbackConstraints);
      usedFallback = true;
      return { success: true, stream, usedFallback: true };
    } catch (fallbackError) {
      console.error('All camera configurations failed:', fallbackError);
      return { 
        success: false, 
        usedFallback: false, 
        error: (fallbackError as Error).message 
      };
    }
  }
}

/**
 * Get camera device preferences from localStorage
 */
export function getCameraPreferences(): {
  lastUsedDevice?: string;
  preferredFacingMode?: 'user' | 'environment';
  resolution?: { width: number; height: number };
} {
  try {
    const prefs = localStorage.getItem('jrmsu-camera-preferences');
    return prefs ? JSON.parse(prefs) : {};
  } catch {
    return {};
  }
}

/**
 * Save camera device preferences to localStorage
 */
export function saveCameraPreferences(preferences: {
  lastUsedDevice?: string;
  preferredFacingMode?: 'user' | 'environment';
  resolution?: { width: number; height: number };
}): void {
  try {
    const existing = getCameraPreferences();
    const updated = { ...existing, ...preferences };
    localStorage.setItem('jrmsu-camera-preferences', JSON.stringify(updated));
  } catch (error) {
    console.warn('Failed to save camera preferences:', error);
  }
}

/**
 * Get camera device information with user-friendly labels
 */
export function formatCameraDevice(device: MediaDeviceInfo): {
  id: string;
  label: string;
  isBack: boolean;
  isFront: boolean;
} {
  const label = device.label || `Camera ${device.deviceId.slice(0, 8)}`;
  const lowerLabel = label.toLowerCase();
  
  const isBack = lowerLabel.includes('back') || 
                 lowerLabel.includes('rear') || 
                 lowerLabel.includes('environment');
  const isFront = lowerLabel.includes('front') || 
                  lowerLabel.includes('user') || 
                  lowerLabel.includes('facing');

  let friendlyLabel = label;
  if (isBack) {
    friendlyLabel += ' (Recommended for QR codes)';
  } else if (isFront) {
    friendlyLabel += ' (Front camera)';
  }

  return {
    id: device.deviceId,
    label: friendlyLabel,
    isBack,
    isFront
  };
}

/**
 * Performance optimization for camera stream
 */
export function optimizeCameraStream(stream: MediaStream, canvas?: HTMLCanvasElement): void {
  const videoTracks = stream.getVideoTracks();
  
  videoTracks.forEach(track => {
    const capabilities = track.getCapabilities?.();
    const settings = track.getSettings?.();
    
    if (capabilities && settings) {
      // Optimize for QR code scanning
      const constraints: MediaTrackConstraints = {};
      
      // Set optimal resolution if supported
      if (capabilities.width && capabilities.height) {
        constraints.width = { ideal: 1280 };
        constraints.height = { ideal: 720 };
      }
      
      // Set focus mode for better QR detection
      if (capabilities.focusMode && capabilities.focusMode.includes('continuous')) {
        constraints.focusMode = 'continuous';
      }
      
      // Apply constraints
      track.applyConstraints(constraints).catch(error => {
        console.warn('Failed to apply camera optimizations:', error);
      });
    }
  });
}

/**
 * Browser compatibility information
 */
export const BROWSER_COMPATIBILITY = {
  chrome: { minVersion: 53, features: ['getUserMedia', 'enumerateDevices', 'getCapabilities'] },
  firefox: { minVersion: 36, features: ['getUserMedia', 'enumerateDevices'] },
  safari: { minVersion: 11, features: ['getUserMedia', 'enumerateDevices'], limitations: ['iOS restrictions'] },
  edge: { minVersion: 12, features: ['getUserMedia', 'enumerateDevices'] },
  opera: { minVersion: 40, features: ['getUserMedia', 'enumerateDevices'] }
};

/**
 * Check if current browser meets minimum requirements
 */
export function checkBrowserSupport(): {
  isSupported: boolean;
  browserName: string;
  version?: string;
  limitations: string[];
} {
  const ua = navigator.userAgent;
  const limitations: string[] = [];
  let browserName = 'Unknown';
  let isSupported = false;

  if (ua.includes('Chrome')) {
    browserName = 'Chrome';
    isSupported = true;
  } else if (ua.includes('Firefox')) {
    browserName = 'Firefox';
    isSupported = true;
  } else if (ua.includes('Safari') && !ua.includes('Chrome')) {
    browserName = 'Safari';
    isSupported = true;
    if (ua.includes('Mobile')) {
      limitations.push('iOS Safari may require user interaction to start camera');
    }
  } else if (ua.includes('Edge')) {
    browserName = 'Edge';
    isSupported = true;
  } else if (ua.includes('Opera')) {
    browserName = 'Opera';
    isSupported = true;
  } else {
    limitations.push('Browser may have limited camera support');
  }

  return {
    isSupported,
    browserName,
    limitations
  };
}