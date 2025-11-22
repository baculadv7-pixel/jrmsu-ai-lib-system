import { useEffect, useRef } from "react";
import QRCode from "qrcode";

type Props = {
  data: string;
  /**
   * Render size in pixels. Default is 256 to match admin/student QR visual size.
   * For small inline previews you can override (e.g. 128), but downloaded PNG
   * will always use a higher internal resolution for sharp printing.
   */
  size?: number;
  centerLabel?: string; // text overlay in the center (NOT USED ANYMORE)
};

export default function QRCodeDisplay({ data, size = 256 }: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;
    
    // Draw QR with OPTIMAL settings for maximum readability - NO LOGO
    QRCode.toCanvas(canvasRef.current, data, { 
      width: size, 
      margin: 4, // Increased margin for better scanning
      errorCorrectionLevel: 'M', // Medium error correction for better density
      type: 'image/png',
      quality: 1.0, // Maximum quality
      color: {
        dark: '#000000', // Pure black for high contrast
        light: '#FFFFFF' // Pure white background
      }
    });
    
    console.log('✅ QR Code generated without logo for maximum readability');
  }, [data, size]);

  // Use a higher internal resolution to keep downloaded PNGs sharp.
  // The canvas CSS size can be scaled down by the caller via container CSS.
  return <canvas ref={canvasRef} width={size} height={size} style={{ width: size, height: size }} />;
}

export function downloadCanvasAsPng(canvas: HTMLCanvasElement, filename = "qr.png") {
  // Export at 2x resolution for print/scan clarity while preserving content.
  const exportScale = 2;
  const w = canvas.width;
  const h = canvas.height;
  const tmp = document.createElement("canvas");
  tmp.width = w * exportScale;
  tmp.height = h * exportScale;
  const ctx = tmp.getContext("2d");
  if (ctx) {
    ctx.imageSmoothingEnabled = false; // avoid blur when scaling up
    ctx.drawImage(canvas, 0, 0, tmp.width, tmp.height);
  }
  const url = tmp.toDataURL("image/png");
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
}


