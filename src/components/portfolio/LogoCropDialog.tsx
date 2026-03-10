import { useState, useCallback } from "react";
import Cropper, { Area } from "react-easy-crop";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Loader2, ZoomIn } from "lucide-react";

interface LogoCropDialogProps {
  open: boolean;
  imageSrc: string | null;
  onClose: () => void;
  onCropComplete: (croppedBlob: Blob) => void;
  isSaving?: boolean;
}

function createImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener("load", () => resolve(image));
    image.addEventListener("error", (error) => reject(error));
    image.crossOrigin = "anonymous";
    image.src = url;
  });
}

async function getCroppedImg(imageSrc: string, pixelCrop: Area): Promise<Blob> {
  const image = await createImage(imageSrc);
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("No 2d context");

  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;

  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    pixelCrop.width,
    pixelCrop.height
  );

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("Canvas is empty"))),
      "image/png",
      1
    );
  });
}

export function LogoCropDialog({
  open,
  imageSrc,
  onClose,
  onCropComplete,
  isSaving = false,
}: LogoCropDialogProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);

  const onCropAreaChange = useCallback((_: Area, croppedPixels: Area) => {
    setCroppedAreaPixels(croppedPixels);
  }, []);

  const handleConfirm = async () => {
    if (!imageSrc || !croppedAreaPixels) return;
    const croppedBlob = await getCroppedImg(imageSrc, croppedAreaPixels);
    onCropComplete(croppedBlob);
  };

  const handleClose = () => {
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Crop Your Logo</DialogTitle>
          <DialogDescription>
            Drag to reposition and use the slider to zoom. The cropped area will be used as your logo.
          </DialogDescription>
        </DialogHeader>

        {imageSrc && (
          <div className="space-y-4">
            <div className="relative h-64 w-full overflow-hidden rounded-lg border bg-muted">
              <Cropper
                image={imageSrc}
                crop={crop}
                zoom={zoom}
                aspect={1}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={onCropAreaChange}
                cropShape="rect"
                showGrid={false}
              />
            </div>

            <div className="flex items-center gap-3">
              <ZoomIn className="h-4 w-4 text-muted-foreground shrink-0" />
              <Label className="text-sm text-muted-foreground shrink-0">Zoom</Label>
              <Slider
                value={[zoom]}
                onValueChange={(v) => setZoom(v[0])}
                min={1}
                max={3}
                step={0.05}
                className="flex-1"
              />
            </div>
          </div>
        )}

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={handleClose} disabled={isSaving}>
            Cancel
          </Button>
          <Button onClick={handleConfirm} disabled={isSaving || !croppedAreaPixels}>
            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Logo
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
