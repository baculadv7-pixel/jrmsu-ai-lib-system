import { useEffect, useRef } from "react";
import QRCode from "qrcode";

type Props = {
  data: string;
  /**
   * Display size in CSS pixels (how big it looks on screen).
   */
  size?: number;
  /**
   * Internal render size in real pixels. Defaults to `size` but can be higher
   * so that a small on-screen QR still downloads as a sharp, full-resolution
   * image (e.g., internalSize=256 while size=120).
   */
  internalSize?: number;
  centerLabel?: string; // text overlay in the center (NOT USED ANYMORE)
};

export default function QRCodeDisplay({ data, size = 256, internalSize }: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const renderSize = internalSize ?? size;

  useEffect(() => {
    if (!canvasRef.current) return;
    
    // Draw QR with OPTIMAL settings for maximum readability - NO LOGO
    QRCode.toCanvas(canvasRef.current, data, { 
      width: renderSize, 
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
  }, [data, renderSize]);

  // Use higher internal resolution for sharp downloads; scale down visually via CSS.
  return (
    <canvas
      ref={canvasRef}
      width={renderSize}
      height={renderSize}
      style={{ width: size, height: size }}
    />
  );
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


