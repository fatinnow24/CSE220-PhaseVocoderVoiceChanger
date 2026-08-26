import { useRef, useEffect } from 'react';
import { useAudioStore } from '../../store/useAudioStore';

export default function SpectrumAnalyzer() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { fftData } = useAudioStore();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !fftData) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const width = rect.width;
    const height = rect.height;

    ctx.clearRect(0, 0, width, height);

    const freqs = fftData.frequencies;
    const mags = fftData.magnitudes_db;
    const binCount = freqs.length;

    const barWidth = (width / binCount) * 2.5;
    let x = 0;

    for (let i = 0; i < binCount; i++) {
      // Map dB range [-80, 0] to height [0, height]
      const minDb = -80;
      const mag = mags[i];
      const normalizedMag = Math.max(0, (mag - minDb) / Math.abs(minDb));
      const barHeight = normalizedMag * height;

      ctx.fillStyle = '#a7c4bc'; // primary-container
      ctx.fillRect(x, height - barHeight, barWidth, barHeight);
      
      // Top cap
      ctx.fillStyle = '#49645d'; // primary
      ctx.fillRect(x, height - barHeight - 2, barWidth, 2);

      x += barWidth + 1;
    }
  }, [fftData]);

  return (
    <div className="w-full h-full min-h-[200px] bg-surface-container-lowest rounded-3xl shadow-card overflow-hidden p-4 flex flex-col">
      <h4 className="text-label-caps text-on-surface-variant mb-2">SPECTRUM (FFT)</h4>
      <div className="flex-1 relative">
        <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
        {!fftData && (
          <div className="absolute inset-0 flex items-center justify-center text-on-surface-variant">
            No spectrum data available
          </div>
        )}
      </div>
    </div>
  );
}
