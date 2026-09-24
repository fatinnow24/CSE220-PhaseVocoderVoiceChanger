import { useRef, useEffect, useState } from 'react'; // eslint-disable-line

export interface SpectrumPlotProps {
  frequencies: number[];
  magnitudes: number[];
  height?: number;
  highlightBin?: number;
  label?: string;
}

export default function SpectrumPlot({
  frequencies,
  magnitudes,
  height = 150,
  highlightBin = -1,
  label
}: SpectrumPlotProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => setIsVisible(entries[0].isIntersecting),
      { threshold: 0.1 }
    );
    if (containerRef.current) observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resizeObserver = new ResizeObserver((entries) => {
      for (let entry of entries) {
        const { width } = entry.contentRect;
        const dpr = window.devicePixelRatio || 1;
        canvas.width = width * dpr;
        canvas.height = height * dpr;
        ctx.scale(dpr, dpr);
        canvas.style.width = `${width}px`;
        canvas.style.height = `${height}px`;
        if (isVisible) draw();
      }
    });

    if (canvas.parentElement) {
      resizeObserver.observe(canvas.parentElement);
    }

    const draw = () => {
      const width = canvas.width / (window.devicePixelRatio || 1);
      const h = height;
      ctx.clearRect(0, 0, width, h);

      if (frequencies.length === 0) return;

      const padBottom = 18;
      const plotH = h - padBottom;
      const slot = width / frequencies.length;
      const barWidth = Math.max(2, slot - Math.max(1, slot * 0.2));
      const maxMag = Math.max(1e-9, ...magnitudes);

      // baseline
      ctx.strokeStyle = 'rgba(31, 35, 40, 0.12)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, plotH + 0.5);
      ctx.lineTo(width, plotH + 0.5);
      ctx.stroke();

      for (let i = 0; i < frequencies.length; i++) {
        const norm = magnitudes[i] / maxMag;
        if (norm <= 0.001) continue;

        const x = i * slot + (slot - barWidth) / 2;
        const barHeight = Math.max(2, norm * (plotH - 4));
        const y = plotH - barHeight;

        // energy-scaled fill: pale floor → deep sage at peaks
        const isHi = i === highlightBin;
        if (isHi) {
          ctx.fillStyle = '#49645d';
        } else if (norm > 0.55) {
          ctx.fillStyle = '#6f8f87';
        } else if (norm > 0.2) {
          ctx.fillStyle = '#a7c4bc';
        } else {
          ctx.fillStyle = 'rgba(167, 196, 188, 0.55)';
        }

        // rounded top
        const r = Math.min(3, barWidth / 2, barHeight);
        ctx.beginPath();
        ctx.moveTo(x, y + r);
        ctx.arcTo(x, y, x + r, y, r);
        ctx.lineTo(x + barWidth - r, y);
        ctx.arcTo(x + barWidth, y, x + barWidth, y + r, r);
        ctx.lineTo(x + barWidth, plotH);
        ctx.lineTo(x, plotH);
        ctx.closePath();
        ctx.fill();
      }

      // axis labels — muted ink, app font
      ctx.fillStyle = '#8c959f';
      ctx.font = '10px Outfit, sans-serif';
      ctx.textBaseline = 'top';
      ctx.textAlign = 'left';
      ctx.fillText('0', 2, plotH + 5);
      ctx.textAlign = 'center';
      ctx.fillText('Fs/4', width / 2, plotH + 5);
      ctx.textAlign = 'right';
      ctx.fillText('Fs/2', width - 2, plotH + 5);
    };

    if (isVisible) draw();

    return () => resizeObserver.disconnect();
  }, [frequencies, magnitudes, height, highlightBin, isVisible]);

  return (
    <div ref={containerRef} className="w-full">
      {label && (
        <div className="mb-1.5 text-label-caps text-on-surface-variant">{label}</div>
      )}
      <div className="relative w-full" style={{ height }}>
        <canvas ref={canvasRef} className="w-full h-full block bg-transparent" />
      </div>
    </div>
  );
}
