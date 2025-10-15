import { useEffect, useRef } from "react";
import QRCode from "qrcode";

type Props = {
  data: string;
  size?: number;
  centerLabel?: string; // text overlay in the center
};

export default function QRCodeDisplay({ data, size = 192, centerLabel }: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;
    // Draw QR first
    QRCode.toCanvas(canvasRef.current, data, { width: size, margin: 1 }).then(() => {
      if (!centerLabel) return;
      const ctx = canvasRef.current?.getContext("2d");
      if (!ctx) return;
      // Draw a rounded white box at center
      const padding = Math.max(8, Math.floor(size * 0.04));
      const boxW = Math.floor(size * 0.5);
      const boxH = Math.floor(size * 0.18);
      const x = (size - boxW) / 2;
      const y = (size - boxH) / 2;
      const r = 8;
      ctx.fillStyle = "#fff";
      ctx.beginPath();
      ctx.moveTo(x + r, y);
      ctx.lineTo(x + boxW - r, y);
      ctx.quadraticCurveTo(x + boxW, y, x + boxW, y + r);
      ctx.lineTo(x + boxW, y + boxH - r);
      ctx.quadraticCurveTo(x + boxW, y + boxH, x + boxW - r, y + boxH);
      ctx.lineTo(x + r, y + boxH);
      ctx.quadraticCurveTo(x, y + boxH, x, y + boxH - r);
      ctx.lineTo(x, y + r);
      ctx.quadraticCurveTo(x, y, x + r, y);
      ctx.closePath();
      ctx.fill();

      // Draw text
      ctx.fillStyle = "#111827"; // gray-900
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.font = `bold ${Math.floor(size * 0.08)}px Poppins, Arial, sans-serif`;
      ctx.fillText(centerLabel, size / 2, size / 2, boxW - padding);
    });
  }, [data, size, centerLabel]);

  return <canvas ref={canvasRef} width={size} height={size} />;
}

export function downloadCanvasAsPng(canvas: HTMLCanvasElement, filename = "qr.png") {
  const url = canvas.toDataURL("image/png");
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
}


