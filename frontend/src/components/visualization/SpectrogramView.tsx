import { useRef, useEffect, useState } from 'react';
import { useAudioStore } from '../../store/useAudioStore';

/**
 * SpectrogramView — renders the server-computed STFT spectrogram as a heatmap
 * using ImageData for efficient rendering. Color maps log-magnitude → green tones.
 */
export default function SpectrogramView() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { spectrogramData } = useAudioStore();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !spectrogramData) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const times = spectrogramData.times;
    const freqs = spectrogramData.frequencies;
    const mag = spectrogramData.magnitude_db;

    if (!times.length || !freqs.length || !mag.length) return;

    const nTime = times.length;
    const nFreq = freqs.length;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    const W = Math.round(rect.width * dpr);
    const H = Math.round(rect.height * dpr);
    canvas.width = W;
    canvas.height = H;

    // Build ImageData: x = time, y = frequency (inverted so low freq is bottom)
    const imgData = ctx.createImageData(W, H);
    const data = imgData.data;

    const minDb = -80;
    const maxDb = 0;
    const dbRange = maxDb - minDb;

    for (let py = 0; py < H; py++) {
      // Map pixel y → frequency bin (bottom = low freq)
      const fIdx = Math.floor((1 - py / H) * (nFreq - 1));
      const fRow = mag[fIdx] ?? [];

      for (let px = 0; px < W; px++) {
        const tIdx = Math.floor((px / W) * (nTime - 1));
        const dbVal = fRow[tIdx] ?? minDb;
        const norm = Math.max(0, Math.min(1, (dbVal - minDb) / dbRange));

        // Color: dark background → sage green → light yellow
        // r: 0→200, g: 20→220, b: 20→80
        const r = Math.round(norm * 200);
        const g = Math.round(20 + norm * 200);
        const b = Math.round(20 + norm * 60);

        const i = (py * W + px) * 4;
        data[i] = r;
        data[i + 1] = g;
        data[i + 2] = b;
        data[i + 3] = 255;
      }
    }
    ctx.putImageData(imgData, 0, 0);

    // Frequency axis labels
    ctx.scale(dpr, dpr);
    const h = rect.height;
    ctx.font = `bold ${Math.round(10 * dpr)}px Manrope, sans-serif`;
    ctx.fillStyle = 'rgba(255,255,255,0.8)';
    const labelFreqs = [1000, 4000, 8000, 16000].filter(f => f <= freqs[freqs.length - 1]);
    labelFreqs.forEach(f => {
      const normF = f / freqs[freqs.length - 1];
      const y = h * (1 - normF);
      ctx.fillText(`${f >= 1000 ? (f / 1000).toFixed(0) + 'k' : f}Hz`, 4, y - 2);
    });
  }, [spectrogramData]);

  const [hover, setHover] = useState({ visible: false, x: 0, y: 0, label: '' });
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const container = containerRef.current;
    if (!container || !spectrogramData) return;
    const rect = container.getBoundingClientRect();
    const relX = e.clientX - rect.left;
    const relY = e.clientY - rect.top;
    const w = rect.width;
    const h = rect.height;

    const nTime = spectrogramData.times.length;
    const nFreq = spectrogramData.frequencies.length;
    if (nTime === 0 || nFreq === 0) return;

    // x = time, y = frequency (inverted so low freq is bottom)
    const fIdx = Math.floor((1 - relY / h) * (nFreq - 1));
    const tIdx = Math.floor((relX / w) * (nTime - 1));

    const clampedFIdx = Math.max(0, Math.min(nFreq - 1, fIdx));
    const clampedTIdx = Math.max(0, Math.min(nTime - 1, tIdx));

    const time = spectrogramData.times[clampedTIdx];
    const freq = spectrogramData.frequencies[clampedFIdx];
    const mag = spectrogramData.magnitude_db[clampedFIdx]?.[clampedTIdx] ?? -80;

    const timeLabel = `Time: ${time.toFixed(2)}s`;
    const freqLabel = freq >= 1000 ? `Freq: ${(freq / 1000).toFixed(1)}k` : `Freq: ${Math.round(freq)}Hz`;
    const powLabel = `Power: ${mag.toFixed(0)}dB`;
    const label = `${timeLabel} | ${freqLabel} | ${powLabel}`;

    const tipW = 220;
    const tipX = relX + 12 + tipW > w ? relX - tipW - 8 : relX + 12;
    const tipY = relY - 14;

    setHover({ visible: true, x: tipX, y: tipY, label });
  };

  return (
    <div className="w-full h-64 bg-transparent rounded-ios-2xl overflow-hidden p-4 flex flex-col select-none">
      <div className="flex justify-between items-center mb-2">
        <h4 className="text-[12px] font-semibold text-ink-secondary">SPECTROGRAM (STFT)</h4>
        {spectrogramData && (
          <span className="text-[10px] text-ink-tertiary">
            {spectrogramData.times.length} frames × {spectrogramData.frequencies.length} bins
          </span>
        )}
      </div>
      <div 
        ref={containerRef}
        className="flex-1 relative rounded-ios-lg overflow-hidden bg-black/5 cursor-crosshair"
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setHover(h => ({ ...h, visible: false }))}
      >
        <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
        {!spectrogramData && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-ink-tertiary gap-1.5">
            <span className="material-symbols-outlined text-[24px]">graphic_eq</span>
            <p className="text-[12px]">Load audio to compute STFT spectrogram</p>
          </div>
        )}
        {hover.visible && (
          <div
            className="absolute bg-ink-primary text-surface px-2.5 py-1 rounded-[10px] text-[11px] font-mono shadow-md pointer-events-none z-30 whitespace-nowrap transition-opacity duration-75"
            style={{ left: hover.x, top: hover.y }}
          >
            {hover.label}
          </div>
        )}
      </div>
    </div>
  );
}
