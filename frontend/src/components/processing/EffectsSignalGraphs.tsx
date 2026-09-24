import { useRef, useEffect, useState, useCallback } from 'react';
import { useAudioStore } from '../../store/useAudioStore';
import { useAnalyserNode } from '../../hooks/useAudioEngine';

/* ────────────────────────────────────────────────────────────
   Shared hover tooltip state shape
──────────────────────────────────────────────────────────── */
interface HoverState {
  visible: boolean;
  x: number;
  y: number;
  label: string;
}

/* ────────────────────────────────────────────────────────────
   TIME-DOMAIN GRAPH
──────────────────────────────────────────────────────────── */
function TimeDomainGraph() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const { waveformData, duration, currentTime, isPlaying , theme } = useAudioStore();
  const analyserNode = useAnalyserNode();
  const [hover, setHover] = useState<HoverState>({ visible: false, x: 0, y: 0, label: '' });
  const animIdRef = useRef<number>(0);

  // Canvas draw
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId = 0;
    let buffer: Uint8Array | null = null;

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;
      canvas.width = Math.round(rect.width * dpr);
      canvas.height = Math.round(rect.height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    const drawGrid = (w: number, h: number) => {
      ctx.strokeStyle = 'rgba(38,33,28,0.06)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let i = 1; i <= 4; i++) {
        const x = (w / 5) * i;
        ctx.moveTo(x, 0); ctx.lineTo(x, h);
      }
      for (let i = 1; i <= 3; i++) {
        const y = (h / 4) * i;
        ctx.moveTo(0, y); ctx.lineTo(w, y);
      }
      ctx.stroke();
      // Center baseline
      ctx.strokeStyle = theme === 'dark' ? 'rgba(229,231,235,0.15)' : 'rgba(38,33,28,0.15)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, h / 2); ctx.lineTo(w, h / 2);
      ctx.stroke();
    };

    const render = () => {
      animId = requestAnimationFrame(render);
      const rect = canvas.getBoundingClientRect();
      const w = rect.width;
      const h = rect.height;
      if (w === 0 || h === 0) return;

      ctx.clearRect(0, 0, w, h);
      drawGrid(w, h);

      // Live audio from analyser
      if (isPlaying && analyserNode) {
        if (!buffer || buffer.length !== analyserNode.fftSize) {
          buffer = new Uint8Array(analyserNode.fftSize);
        }
        analyserNode.getByteTimeDomainData(buffer as any);

        ctx.beginPath();
        ctx.lineWidth = 1.75;
        ctx.strokeStyle = theme === 'dark' ? '#E5E7EB' : '#1f2328';
        ctx.lineJoin = 'round';
        const sliceW = w / buffer.length;
        for (let i = 0; i < buffer.length; i++) {
          const v = buffer[i] / 128.0;
          const y = (v * h) / 2;
          if (i === 0) ctx.moveTo(0, y);
          else ctx.lineTo(i * sliceW, y);
        }
        ctx.stroke();
        return;
      }

      // Static waveform from store
      const peaks: Array<{ min: number; max: number }> = Array.isArray(waveformData)
        ? (waveformData as any)
        : (waveformData?.peaks || []);

      if (peaks.length > 0) {
        ctx.beginPath();
        const step = w / peaks.length;
        ctx.moveTo(0, h / 2);
        for (let i = 0; i < peaks.length; i++) {
          ctx.lineTo(i * step, (1 - peaks[i].max) * (h / 2));
        }
        for (let i = peaks.length - 1; i >= 0; i--) {
          ctx.lineTo(i * step, (1 - peaks[i].min) * (h / 2));
        }
        ctx.closePath();
        ctx.fillStyle = theme === 'dark' ? 'rgba(229,231,235,0.18)' : 'rgba(38,33,28,0.18)';
        ctx.fill();
        ctx.strokeStyle = theme === 'dark' ? '#E5E7EB' : '#1f2328';
        ctx.lineWidth = 1;
        ctx.stroke();

        // Playhead
        if (duration > 0) {
          const cx = (currentTime / duration) * w;
          ctx.beginPath();
          ctx.moveTo(cx, 0); ctx.lineTo(cx, h);
          ctx.strokeStyle = theme === 'dark' ? '#E5E7EB' : '#1f2328';
          ctx.lineWidth = 2;
          ctx.stroke();
        }
        return;
      }

      // Idle flat line
      ctx.beginPath();
      ctx.strokeStyle = theme === 'dark' ? 'rgba(229,231,235,0.15)' : 'rgba(38,33,28,0.15)';
      ctx.lineWidth = 1.5;
      ctx.moveTo(0, h / 2); ctx.lineTo(w, h / 2);
      ctx.stroke();
    };

    animIdRef.current = animId;
    render();

    return () => {
      cancelAnimationFrame(animId);
      ro.disconnect();
    };
  }, [waveformData, isPlaying, analyserNode, duration, currentTime, theme]);

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

    // Compute time from X
    if (duration > 0) {
      timeSec = (relX / w) * duration;
    } else if (isPlaying && analyserNode) {
      // No absolute time context in live mode; just show relative position
      timeSec = null;
    }

    // Compute amplitude from Y position (0 = top = +1, h/2 = 0, h = -1)
    const normY = (relY / h - 0.5) * -2;
    amplitude = parseFloat(normY.toFixed(3));

    // Also sample peak at this X position from waveformData
    const peaks: Array<{ min: number; max: number }> = Array.isArray(waveformData)
      ? (waveformData as any)
      : (waveformData?.peaks || []);
    if (peaks.length > 0) {
      const idx = Math.floor((relX / w) * peaks.length);
      const clamped = Math.max(0, Math.min(peaks.length - 1, idx));
      amplitude = parseFloat(((peaks[clamped].max + peaks[clamped].min) / 2).toFixed(3));
    }

    const timeLabel = timeSec !== null
      ? `Time: ${timeSec.toFixed(3)}s`
      : 'Time: Live';
    const ampLabel = amplitude !== null
      ? `Amp: ${amplitude >= 0 ? '+' : ''}${amplitude}`
      : '';

    const label = [timeLabel, ampLabel].filter(Boolean).join('  |  ');

    // Clamp tooltip to avoid clipping
    const tipW = 200;
    const tipX = relX + 12 + tipW > w ? relX - tipW - 8 : relX + 12;
    const tipY = relY - 14;

    setHover({ visible: true, x: tipX, y: tipY, label });
  }, [waveformData, duration, isPlaying, analyserNode]);

  return (
    <div
      ref={containerRef}
      className="relative w-full h-32 select-none cursor-crosshair"
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
  );
}

/* ────────────────────────────────────────────────────────────
   FREQUENCY-DOMAIN GRAPH
──────────────────────────────────────────────────────────── */
function FreqDomainGraph() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const { fftData, isPlaying , theme } = useAudioStore();
  const analyserNode = useAnalyserNode();
  const [hover, setHover] = useState<HoverState>({ visible: false, x: 0, y: 0, label: '' });
  const SAMPLE_RATE = 44100; // standard, used for freq mapping in live mode
  const MAX_FREQ_LIVE = SAMPLE_RATE / 2; // Nyquist

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId = 0;
    const bufferLength = analyserNode ? analyserNode.frequencyBinCount : 1024;
    const dataArray = new Uint8Array(bufferLength);

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;
      canvas.width = Math.round(rect.width * dpr);
      canvas.height = Math.round(rect.height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    const drawGrid = (w: number, h: number) => {
      ctx.strokeStyle = 'rgba(38,33,28,0.06)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let i = 1; i <= 4; i++) {
        const x = (w / 5) * i;
        ctx.moveTo(x, 0); ctx.lineTo(x, h);
      }
      for (let i = 1; i <= 3; i++) {
        const y = (h / 4) * i;
        ctx.moveTo(0, y); ctx.lineTo(w, y);
      }
      ctx.stroke();
    };

    const render = () => {
      animId = requestAnimationFrame(render);
      const rect = canvas.getBoundingClientRect();
      const w = rect.width;
      const h = rect.height;
      if (w === 0 || h === 0) return;

      ctx.clearRect(0, 0, w, h);
      drawGrid(w, h);

      const bars = 64;
      const barW = Math.max(2, (w / bars) - 1.5);

      // Live analyser
      if (isPlaying && analyserNode) {
        analyserNode.getByteFrequencyData(dataArray as any);
        for (let i = 0; i < bars; i++) {
          const binIdx = Math.min(bufferLength - 1, Math.floor(Math.pow(i / bars, 2) * (bufferLength * 0.75)));
          const norm = dataArray[binIdx] / 255;
          const bh = Math.max(2, norm * (h - 8));
          const x = i * (barW + 1.5);
          ctx.fillStyle = theme === 'dark' ? '#E5E7EB' : '#1f2328';
          ctx.beginPath();
          ctx.roundRect(x, h - bh, barW, bh, [1.5, 1.5, 0, 0]);
          ctx.fill();
        }
        return;
      }

      // Static FFT from store
      if (fftData && fftData.magnitudes_db?.length) {
        const mags = fftData.magnitudes_db;
        for (let i = 0; i < bars; i++) {
          const step = Math.floor(mags.length / bars);
          const mag = mags[i * step];
          const minDb = -80;
          const norm = Math.max(0, (mag - minDb) / Math.abs(minDb));
          const bh = Math.max(2, norm * (h - 8));
          const x = i * (barW + 1.5);
          ctx.fillStyle = theme === 'dark' ? '#E5E7EB' : '#1f2328';
          ctx.beginPath();
          ctx.roundRect(x, h - bh, barW, bh, [1.5, 1.5, 0, 0]);
          ctx.fill();
        }
        return;
      }

      // Empty baseline
      ctx.fillStyle = 'rgba(38,33,28,0.12)';
      ctx.fillRect(0, h - 2, w, 2);
    };

    render();

    return () => {
      cancelAnimationFrame(animId);
      ro.disconnect();
    };
  }, [fftData, isPlaying, analyserNode, theme]);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const container = containerRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    const relX = e.clientX - rect.left;
    const relY = e.clientY - rect.top;
    const w = rect.width;
    const h = rect.height;

    // Frequency mapping — linear bin allocation (matches bar layout above)
    const bars = 64;
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
      // Map bar index → frequency based on Nyquist
      const barFrac = Math.pow(barIdx / bars, 2) * 0.75;
      freqHz = barFrac * MAX_FREQ_LIVE;
    } else {
      freqHz = (barIdx / bars) * 20000;
    }

    // If no fft mag, estimate from Y
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
  }, [fftData, isPlaying, analyserNode, theme]);

  return (
    <div
      ref={containerRef}
      className="relative w-full h-32 select-none cursor-crosshair"
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
  );
}

/* ────────────────────────────────────────────────────────────
   COMPOSED PANEL
──────────────────────────────────────────────────────────── */
export default function EffectsSignalGraphs() {
  const { selectedFile } = useAudioStore();

  if (!selectedFile) return null;

  return (
    <div className="grid grid-cols-1 gap-5">
      {/* Time Domain */}
      <div className="bg-pastel-cream rounded-[24px] p-5 flex flex-col gap-3 select-none">
        <div className="flex items-center justify-between">
          <h3 className="text-[15px] font-semibold text-ink-primary tracking-tight">Time Domain</h3>
          <span className="text-[11px] font-medium text-ink-secondary">Amplitude vs Time</span>
        </div>
        <TimeDomainGraph />
        <p className="text-[10px] text-ink-tertiary">Hover over graph to inspect time and amplitude</p>
      </div>

      {/* Frequency Domain */}
      <div className="bg-pastel-blue rounded-[24px] p-5 flex flex-col gap-3 select-none">
        <div className="flex items-center justify-between">
          <h3 className="text-[15px] font-semibold text-ink-primary tracking-tight">Frequency Domain</h3>
          <span className="text-[11px] font-medium text-ink-secondary">Magnitude (dB) vs Freq</span>
        </div>
        <FreqDomainGraph />
        <p className="text-[10px] text-ink-tertiary">Hover over graph to inspect frequency and magnitude</p>
      </div>
    </div>
  );
}
