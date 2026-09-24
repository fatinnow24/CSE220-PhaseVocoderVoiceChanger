import { useRef, useEffect, useState, useCallback } from 'react';
import { useAnalyserNode } from '../../hooks/useAudioEngine';
import { useWaveformCanvas } from '../../hooks/useWaveformCanvas';
import { useAudioStore } from '../../store/useAudioStore';

export function StudioWaveform() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const { waveformData, currentTime, duration, theme } = useAudioStore();
  const [hover, setHover] = useState({ visible: false, x: 0, y: 0, label: '' });

  useWaveformCanvas({
    canvasRef,
    waveformData,
    currentTime,
    duration,
    selection: null,
    color: theme === 'dark' ? '#E5E7EB' : '#1f2328',
  });

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const container = containerRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    const relX = e.clientX - rect.left;
    const relY = e.clientY - rect.top;
    const w = rect.width;
    const h = rect.height;

    let timeSec: number | null = null;
    let amplitude: number | null = null;

    if (duration > 0) {
      timeSec = (relX / w) * duration;
    }

    const normY = (relY / h - 0.5) * -2;
    amplitude = parseFloat(normY.toFixed(3));

    const peaks: Array<{ min: number; max: number }> = Array.isArray(waveformData)
      ? (waveformData as any)
      : (waveformData?.peaks || []);
    if (peaks.length > 0) {
      const idx = Math.floor((relX / w) * peaks.length);
      const clamped = Math.max(0, Math.min(peaks.length - 1, idx));
      amplitude = parseFloat(((peaks[clamped].max + peaks[clamped].min) / 2).toFixed(3));
    }

    const timeLabel = timeSec !== null ? `Time: ${timeSec.toFixed(3)}s` : 'Time: --';
    const ampLabel = amplitude !== null ? `Amp: ${amplitude >= 0 ? '+' : ''}${amplitude}` : '';
    const label = [timeLabel, ampLabel].filter(Boolean).join('  |  ');

    const tipW = 200;
    const tipX = relX + 12 + tipW > w ? relX - tipW - 8 : relX + 12;
    const tipY = relY - 14;

    setHover({ visible: true, x: tipX, y: tipY, label });
  }, [waveformData, duration]);

  return (
    <div className="bg-pastel-cream rounded-[24px] p-5 flex flex-col justify-between h-[180px] shadow-none select-none">
      <div className="flex items-center justify-between">
        <h3 className="text-[17px] font-semibold text-ink-primary tracking-tight">Waveform</h3>
        <span className="text-[12px] font-medium text-ink-secondary">
          Overview
        </span>
      </div>
      <div 
        ref={containerRef}
        className="w-full h-[105px] relative mt-1 cursor-crosshair"
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setHover(h => ({ ...h, visible: false }))}
      >
        <canvas ref={canvasRef} className="w-full h-full" />
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

export function StudioLiveSignal() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { isPlaying, theme } = useAudioStore();
  const analyserNode = useAnalyserNode();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let buffer: Uint8Array | null = null;
    const dpr = window.devicePixelRatio || 1;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;
      canvas.width = Math.round(rect.width * dpr);
      canvas.height = Math.round(rect.height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    const draw = () => {
      animId = requestAnimationFrame(draw);
      const rect = canvas.getBoundingClientRect();
      const w = rect.width;
      const h = rect.height;
      if (w === 0 || h === 0) return;

      ctx.clearRect(0, 0, w, h);

      if (isPlaying && analyserNode) {
        if (!buffer || buffer.length !== analyserNode.fftSize) {
          buffer = new Uint8Array(analyserNode.fftSize);
        }
        analyserNode.getByteTimeDomainData(buffer as any);

        ctx.lineWidth = 1.5;
        ctx.strokeStyle = theme === 'dark' ? '#E5E7EB' : '#1f2328';
        ctx.beginPath();

        const sliceWidth = w / buffer.length;
        let x = 0;

        for (let i = 0; i < buffer.length; i++) {
          const v = buffer[i] / 128.0;
          const y = (v * h) / 2;

          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);

          x += sliceWidth;
        }

        ctx.stroke();
      } else {
        ctx.lineWidth = 1.5;
        ctx.strokeStyle = 'rgba(38,33,28,0.2)';
        ctx.beginPath();
        ctx.moveTo(0, h / 2);
        ctx.lineTo(w, h / 2);
        ctx.stroke();
      }
    };

    draw();

    return () => {
      cancelAnimationFrame(animId);
      ro.disconnect();
    };
  }, [isPlaying, analyserNode, theme]);

  const [hover, setHover] = useState({ visible: false, x: 0, y: 0, label: '' });
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const container = containerRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    const relX = e.clientX - rect.left;
    const relY = e.clientY - rect.top;
    const w = rect.width;
    const h = rect.height;

    const normY = (relY / h - 0.5) * -2;
    const amplitude = parseFloat(normY.toFixed(3));

    const timeLabel = 'Time: Live';
    const ampLabel = `Amp: ${amplitude >= 0 ? '+' : ''}${amplitude}`;
    const label = `${timeLabel}  |  ${ampLabel}`;

    const tipW = 200;
    const tipX = relX + 12 + tipW > w ? relX - tipW - 8 : relX + 12;
    const tipY = relY - 14;

    setHover({ visible: true, x: tipX, y: tipY, label });
  }, []);

  return (
    <div className="bg-pastel-blue rounded-[24px] p-5 flex flex-col justify-between h-[180px] shadow-none select-none">
      <div className="flex items-center justify-between">
        <h3 className="text-[17px] font-semibold text-ink-primary tracking-tight">Live Oscilloscope</h3>
        <span className="text-[12px] font-medium text-ink-secondary">
          Real-time
        </span>
      </div>
      <div 
        ref={containerRef}
        className="w-full h-[105px] relative mt-1 cursor-crosshair"
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setHover(h => ({ ...h, visible: false }))}
      >
        <canvas ref={canvasRef} className="w-full h-full" />
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

export function StudioLiveSpectrum() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { isPlaying, fftData, theme } = useAudioStore();
  const analyserNode = useAnalyserNode();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    const bufferLength = analyserNode ? analyserNode.frequencyBinCount : 1024;
    const dataArray = new Uint8Array(bufferLength);
    const dpr = window.devicePixelRatio || 1;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;
      canvas.width = Math.round(rect.width * dpr);
      canvas.height = Math.round(rect.height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    const draw = () => {
      animId = requestAnimationFrame(draw);
      const rect = canvas.getBoundingClientRect();
      const w = rect.width;
      const h = rect.height;
      if (w === 0 || h === 0) return;

      ctx.clearRect(0, 0, w, h);

      const bars = 48;
      const barW = Math.max(2, (w / bars) - 2);

      if (isPlaying && analyserNode) {
        analyserNode.getByteFrequencyData(dataArray as any);
        for (let i = 0; i < bars; i++) {
          const idx = Math.min(bufferLength - 1, Math.floor(Math.pow(i / bars, 1.8) * (bufferLength * 0.7)));
          const norm = dataArray[idx] / 255;
          const barH = Math.max(2, norm * (h - 6));
          const x = i * (barW + 2);
          const y = h - barH;

          ctx.fillStyle = theme === 'dark' ? '#E5E7EB' : '#1f2328';
          ctx.beginPath();
          ctx.roundRect(x, y, barW, barH, [1.5, 1.5, 0, 0]);
          ctx.fill();
        }
      } else if (fftData && fftData.magnitudes_db?.length) {
        const mags = fftData.magnitudes_db;
        for (let i = 0; i < bars; i++) {
          const idx = Math.floor(i * (mags.length / bars));
          const norm = Math.max(0, (mags[idx] + 80) / 80);
          const barH = Math.max(2, norm * (h - 6));
          const x = i * (barW + 2);
          const y = h - barH;

          ctx.fillStyle = theme === 'dark' ? '#E5E7EB' : '#1f2328';
          ctx.beginPath();
          ctx.roundRect(x, y, barW, barH, [1.5, 1.5, 0, 0]);
          ctx.fill();
        }
      } else {
        ctx.fillStyle = 'rgba(38,33,28,0.15)';
        ctx.fillRect(0, h - 2, w, 2);
      }
    };

    draw();

    return () => {
      cancelAnimationFrame(animId);
      ro.disconnect();
    };
  }, [isPlaying, analyserNode, fftData, theme]);

  const [hover, setHover] = useState({ visible: false, x: 0, y: 0, label: '' });
  const containerRef = useRef<HTMLDivElement>(null);
  const SAMPLE_RATE = 44100;
  const MAX_FREQ_LIVE = SAMPLE_RATE / 2;

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const container = containerRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    const relX = e.clientX - rect.left;
    const relY = e.clientY - rect.top;
    const w = rect.width;
    const h = rect.height;

    const bars = 48;
    const barIdx = Math.floor((relX / w) * bars);
    let freqHz: number;
    let magDb: number | null = null;

    if (fftData && fftData.frequencies?.length > 0) {
      const mags = fftData.magnitudes_db;
      const freqs = fftData.frequencies;
      const step = Math.floor(mags.length / bars);
      const binIdx = Math.min(mags.length - 1, barIdx * step);
      freqHz = freqs[binIdx] ?? 0;
      magDb = mags[binIdx] ?? null;
    } else if (isPlaying && analyserNode) {
      const barFrac = Math.pow(barIdx / bars, 1.8) * 0.7;
      freqHz = barFrac * MAX_FREQ_LIVE;
    } else {
      freqHz = (barIdx / bars) * 20000;
    }

    if (magDb === null) {
      const normFromY = 1 - (relY / h);
      magDb = -80 + normFromY * 80;
    }

    const freqLabel = freqHz >= 1000
      ? `Freq: ${(freqHz / 1000).toFixed(2)} kHz`
      : `Freq: ${Math.round(freqHz)} Hz`;
    const magLabel = `Mag: ${magDb.toFixed(1)} dB`;
    const label = `${freqLabel}  |  ${magLabel}`;

    const tipW = 220;
    const tipX = relX + 12 + tipW > w ? relX - tipW - 8 : relX + 12;
    const tipY = relY - 14;

    setHover({ visible: true, x: tipX, y: tipY, label });
  }, [fftData, isPlaying, analyserNode]);

  return (
    <div className="bg-pastel-lavender rounded-[24px] p-5 flex flex-col justify-between h-[180px] shadow-none select-none">
      <div className="flex items-center justify-between">
        <h3 className="text-[17px] font-semibold text-ink-primary tracking-tight">Spectrum (FFT)</h3>
        <span className="text-[12px] font-medium text-ink-secondary">
          Frequency
        </span>
      </div>
      <div 
        ref={containerRef}
        className="w-full h-[105px] relative mt-1 cursor-crosshair"
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setHover(h => ({ ...h, visible: false }))}
      >
        <canvas ref={canvasRef} className="w-full h-full" />
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
