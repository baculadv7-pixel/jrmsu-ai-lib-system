import { useState, useRef, useEffect } from "react";
import { Camera, Upload, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";

interface ProfilePictureProps {
  currentImage?: string;
  userInitials: string;
  canRemove?: boolean;
  onImageChange: (file: File) => void;
  onImageRemove?: () => void;
}

export function ProfilePicture({ 
  currentImage, 
  userInitials, 
  canRemove = false, 
  onImageChange, 
  onImageRemove 
}: ProfilePictureProps) {
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  // Separate refs so the camera button can hint "capture" while the upload button uses a normal picker
  const fileInputRef = useRef<HTMLInputElement>(null);   // regular file picker (desktop or gallery)
  const cameraInputRef = useRef<HTMLInputElement>(null); // camera-first input on supported mobile devices
  const [showCamera, setShowCamera] = useState(false);
  const [isCameraReady, setIsCameraReady] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const { toast } = useToast();

  function validateFile(file: File): string | null {
    if (!file.type.match(/^image\/(jpeg|jpg|png)$/)) {
      return "Please select a JPG, JPEG, or PNG image.";
    }
    if (file.size > 5 * 1024 * 1024) {
      return "Please select an image under 5MB.";
    }
    return null;
  }

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const error = validateFile(file);
    if (error) {
      toast({
        title: "Invalid image",
        description: error,
        variant: "destructive",
      });
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreviewImage(e.target?.result as string);
      setSelectedFile(file);
      setShowPreview(true);
    };
    reader.readAsDataURL(file);
  };

  const handleConfirmUpload = () => {
    if (selectedFile) {
      onImageChange(selectedFile);
      setShowPreview(false);
      setPreviewImage(null);
      setSelectedFile(null);
      toast({
        title: "Profile picture updated",
        description: "Your profile picture has been successfully updated.",
      });
    }
  };

  const handleCancelUpload = () => {
    setShowPreview(false);
    setPreviewImage(null);
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    if (cameraInputRef.current) {
      cameraInputRef.current.value = '';
    }
  };

  const handleRemoveImage = () => {
    if (onImageRemove) {
      onImageRemove();
      toast({
        title: "Profile picture removed",
        description: "Your profile picture has been removed.",
      });
    }
  };

  useEffect(() => {
    if (!showCamera) {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
      setIsCameraReady(false);
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        if (!navigator.mediaDevices?.getUserMedia) {
          throw new Error("Camera not supported in this browser.");
        }
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "user" },
          audio: false,
        });
        if (cancelled) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        setIsCameraReady(true);
      } catch (err) {
        console.error("Camera error:", err);
        setShowCamera(false);
        toast({
          title: "Camera not available",
          description: "Please check browser permissions or use Upload New Photo.",
          variant: "destructive",
        });
      }
    })();

    return () => {
      cancelled = true;
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
      setIsCameraReady(false);
    };
  }, [showCamera, toast]);

  const handleCameraCapture = async () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;

    const width = video.videoWidth || 640;
    const height = video.videoHeight || 480;
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, width, height);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.9);

    const res = await fetch(dataUrl);
    const blob = await res.blob();
    const file = new File([blob], "profile-camera.jpg", { type: "image/jpeg" });

    const error = validateFile(file);
    if (error) {
      toast({
        title: "Invalid image",
        description: error,
        variant: "destructive",
      });
      return;
    }

    setPreviewImage(dataUrl);
    setSelectedFile(file);
    setShowPreview(true);
    setShowCamera(false);
  };

  return (
    <>
      <div className="flex flex-col items-center space-y-4">
        <div className="relative">
          <Avatar className="w-36 h-36 border-4 border-background shadow-lg">
            <AvatarImage src={currentImage} alt="Profile picture" />
            <AvatarFallback className="text-2xl font-semibold bg-primary text-primary-foreground">
              {userInitials}
            </AvatarFallback>
          </Avatar>
          
          <Button
            variant="outline"
            size="icon"
            className="absolute -bottom-2 -right-2 h-10 w-10 rounded-full shadow-lg"
            onClick={() => setShowCamera(true)}
          >
            <Camera className="h-5 w-5" />
          </Button>

          {/* Camera-first input (used by the round camera button). */}
          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*" /* allow camera/gallery; handleFileSelect still validates JPEG/PNG */
            capture="user" /* hint to open the front camera on supported mobile browsers */
            className="hidden"
            onChange={handleFileSelect}
          />

          {/* Standard file picker (used by the "Upload New Photo" button). */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileSelect}
          />
        </div>

        {/* Camera Capture Dialog */}
        <Dialog open={showCamera} onOpenChange={setShowCamera}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Take a Photo</DialogTitle>
              <DialogDescription>
                Use your camera to capture a new profile picture.
              </DialogDescription>
            </DialogHeader>

            <div className="flex justify-center py-4">
              <div className="w-64 h-64 bg-black rounded-lg overflow-hidden flex items-center justify-center">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />
              </div>
            </div>

            {/* Off-screen canvas used to capture a frame */}
            <canvas ref={canvasRef} className="hidden" />

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowCamera(false)}>
                Cancel
              </Button>
              <Button onClick={handleCameraCapture} disabled={!isCameraReady}>
                Capture
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2"
          >
            <Upload className="h-4 w-4" />
            Upload New Photo
          </Button>
          
          {canRemove && currentImage && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleRemoveImage}
              className="flex items-center gap-2 text-destructive hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
              Remove Photo
            </Button>
          )}
        </div>

        <p className="text-xs text-muted-foreground text-center max-w-xs">
          Supported formats: JPG, JPEG, PNG<br />
          Maximum file size: 5MB
        </p>
      </div>

      {/* Preview Dialog */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Preview Profile Picture</DialogTitle>
            <DialogDescription>
              Review your new profile picture before saving
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex justify-center py-6">
            <Avatar className="w-32 h-32 border-4 border-background shadow-lg">
              <AvatarImage src={previewImage || undefined} alt="Preview" />
              <AvatarFallback className="text-xl font-semibold bg-primary text-primary-foreground">
                {userInitials}
              </AvatarFallback>
            </Avatar>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={handleCancelUpload}>
              Cancel
            </Button>
            <Button onClick={handleConfirmUpload}>
              Save Picture
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}