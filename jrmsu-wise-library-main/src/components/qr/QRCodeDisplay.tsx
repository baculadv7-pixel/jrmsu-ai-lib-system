import { useEffect, useRef } from "react";
import QRCode from "qrcode";

type Props = {
  data: string;
  size?: number;
  centerLabel?: string; // text overlay in the center (NOT USED ANYMORE)
};

export default function QRCodeDisplay({ data, size = 192 }: Props) {
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

  return <canvas ref={canvasRef} width={size} height={size} />;
}

export function downloadCanvasAsPng(canvas: HTMLCanvasElement, filename = "qr.png") {
  const url = canvas.toDataURL("image/png");
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
}


