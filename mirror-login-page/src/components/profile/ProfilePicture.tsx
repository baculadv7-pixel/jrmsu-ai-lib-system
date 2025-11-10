import { useState, useRef } from "react";
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
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.match(/^image\/(jpeg|jpg|png)$/)) {
      toast({
        title: "Invalid file type",
        description: "Please select a JPG, JPEG, or PNG image.",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please select an image under 5MB.",
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
            onClick={() => fileInputRef.current?.click()}
          >
            <Camera className="h-5 w-5" />
          </Button>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/jpg,image/png"
            className="hidden"
            onChange={handleFileSelect}
          />
        </div>

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