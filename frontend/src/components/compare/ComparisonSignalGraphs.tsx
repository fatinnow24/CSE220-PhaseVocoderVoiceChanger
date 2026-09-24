import { useEffect, useRef, useState } from 'react';
import { ComparisonResult, WaveformData, FFTData } from '../../types';
import { getWaveform, getFFT } from '../../api/client';
import Card from '../ui/Card';

interface ComparisonSignalGraphsProps {
  result: ComparisonResult;
  pvProgressPct: number;
  naiveProgressPct: number;
}

function WaveformCanvas({ data, color, progressPct, duration = 0 }: { data: WaveformData | null, color: string, progressPct: number, duration?: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const w = rect.width;
    const h = rect.height;

    ctx.clearRect(0, 0, w, h);

    // Draw center line (Axes)
    ctx.strokeStyle = 'rgba(38, 33, 28, 0.12)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, h / 2);
    ctx.lineTo(w, h / 2);
    ctx.stroke();

    if (!data) return;
    const peaks = Array.isArray(data) ? data : (data.peaks || []);
    if (peaks.length === 0) return;

    ctx.fillStyle = color;
    const step = w / peaks.length;

    for (let i = 0; i < peaks.length; i++) {
      const { min, max } = peaks[i];
      const x = i * step;
      const yMax = (h / 2) - (max * (h / 2.5));
      const yMin = (h / 2) - (min * (h / 2.5));
      const height = Math.max(1, yMin - yMax);

      ctx.fillRect(x, yMax, step > 1 ? step - 0.5 : step, height);
    }
  }, [data, color]);

  const [hover, setHover] = useState({ visible: false, x: 0, y: 0, label: '' });
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const container = containerRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    const relX = e.clientX - rect.left;
    const relY = e.clientY - rect.top;
    const w = rect.width;
    const h = rect.height;

    const normY = (relY / h - 0.5) * -2;
    let amplitude = parseFloat(normY.toFixed(3));

    const peaks = Array.isArray(data) ? data : (data?.peaks || []);
    if (peaks.length > 0) {
      const idx = Math.floor((relX / w) * peaks.length);
      const clamped = Math.max(0, Math.min(peaks.length - 1, idx));
      amplitude = parseFloat(((peaks[clamped].max + peaks[clamped].min) / 2).toFixed(3));
    }

    const timeSec = duration > 0 ? (relX / w) * duration : 0;
    const timeLabel = duration > 0 ? `Time: ${timeSec.toFixed(3)}s` : `Pos: ${((relX / w) * 100).toFixed(1)}%`;
    const label = `${timeLabel}  |  Amp: ${amplitude >= 0 ? '+' : ''}${amplitude}`;

    const tipW = 180;
    const tipX = relX + 12 + tipW > w ? relX - tipW - 8 : relX + 12;
    const tipY = relY - 14;

    setHover({ visible: true, x: tipX, y: tipY, label });
  };

  return (
    <div 
      ref={containerRef}
      className="w-full h-24 bg-surface rounded-ios-lg relative overflow-hidden cursor-crosshair"
      onMouseMove={handleMouseMove}
      onMouseLeave={() => setHover(h => ({ ...h, visible: false }))}
    >
      {!data && (
        <div className="absolute inset-0 flex items-center justify-center text-[11px] text-ink-tertiary">
          Loading waveform...
        </div>
      )}
      <canvas ref={canvasRef} className="w-full h-full block relative z-0" />
      {progressPct > 0 && progressPct < 100 && (
        <div 
          className="absolute top-0 bottom-0 w-[1.5px] bg-[#e15241] z-10 pointer-events-none transition-all duration-75"
          style={{ left: `${progressPct}%` }}
        />
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
  );
}

function FFTCanvas({ data, color, progressPct }: { data: FFTData | null, color: string, progressPct: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const w = rect.width;
    const h = rect.height;

    ctx.clearRect(0, 0, w, h);

    // Grid lines
    ctx.strokeStyle = 'rgba(38, 33, 28, 0.05)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let i = 1; i < 4; i++) {
      const y = (h / 4) * i;
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
    }
    // Baseline
    ctx.moveTo(0, h - 1);
    ctx.lineTo(w, h - 1);
    ctx.stroke();

    if (!data) return;
    const mags = Array.isArray(data) ? data : (data.magnitudes_db || []);
    if (mags.length === 0) return;

    ctx.fillStyle = color;
    const bars = Math.min(128, mags.length);
    const barWidth = Math.max(1, (w / bars) - 1);

    for (let i = 0; i < bars; i++) {
      const step = Math.floor(mags.length / bars);
      const mag = mags[i * step];
      const minDb = -80;
      const norm = Math.max(0, (mag - minDb) / Math.abs(minDb));
      const barHeight = Math.max(1, norm * (h - 8));
      
      const x = i * (w / bars);
      const y = h - barHeight;

      ctx.beginPath();
      ctx.roundRect(x, y, barWidth, barHeight, [1, 1, 0, 0]);
      ctx.fill();
    }
  }, [data, color]);

  const [hover, setHover] = useState({ visible: false, x: 0, y: 0, label: '' });
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const container = containerRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    const relX = e.clientX - rect.left;
    const relY = e.clientY - rect.top;
    const w = rect.width;
    const h = rect.height;

    const bars = 128;
    const barIdx = Math.floor((relX / w) * bars);
    let freqHz: number;
    let magDb: number | null = null;

    if (data && data.frequencies?.length > 0) {
      const mags = data.magnitudes_db;
      const freqs = data.frequencies;
      const step = Math.floor(mags.length / bars);
      const binIdx = Math.min(mags.length - 1, barIdx * step);
      freqHz = freqs[binIdx] ?? 0;
      magDb = mags[binIdx] ?? null;
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
  };

  return (
    <div 
      ref={containerRef}
      className="w-full h-24 bg-surface rounded-ios-lg relative overflow-hidden cursor-crosshair"
      onMouseMove={handleMouseMove}
      onMouseLeave={() => setHover(h => ({ ...h, visible: false }))}
    >
      {!data && (
        <div className="absolute inset-0 flex items-center justify-center text-[11px] text-ink-tertiary">
          Loading FFT...
        </div>
      )}
      <canvas ref={canvasRef} className="w-full h-full block relative z-0" />
      {progressPct > 0 && progressPct < 100 && (
        <div 
          className="absolute top-0 bottom-0 w-[1.5px] bg-[#e15241] z-10 pointer-events-none transition-all duration-75"
          style={{ left: `${progressPct}%` }}
        />
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
  );
}

export default function ComparisonSignalGraphs({ result, pvProgressPct, naiveProgressPct }: ComparisonSignalGraphsProps) {
  const [pvWaveform, setPvWaveform] = useState<WaveformData | null>(null);
  const [naiveWaveform, setNaiveWaveform] = useState<WaveformData | null>(null);
  const [pvFFT, setPvFFT] = useState<FFTData | null>(null);
  const [naiveFFT, setNaiveFFT] = useState<FFTData | null>(null);

  useEffect(() => {
    let mounted = true;
    
    // Points count for waveform
    const pts = 800;

    Promise.all([
      getWaveform(result.pv_file.id, pts),
      getWaveform(result.naive_file.id, pts),
      getFFT(result.pv_file.id),
      getFFT(result.naive_file.id)
    ]).then(([pvW, naiveW, pvF, naiveF]) => {
      if (!mounted) return;
      setPvWaveform(pvW.data.data || pvW.data);
      setNaiveWaveform(naiveW.data.data || naiveW.data);
      setPvFFT(pvF.data.data || pvF.data);
      setNaiveFFT(naiveF.data.data || naiveF.data);
    }).catch(err => {
      console.error('Failed to fetch comparison graph data:', err);
    });

    return () => {
      mounted = false;
    };
  }, [result]);

  return (
    <div className="flex flex-col gap-6 mt-6">
      <Card variant="surface" className="flex flex-col gap-4">
        <h3 className="text-[15px] font-semibold text-ink-primary tracking-tight px-1">
          Time Domain (Waveform)
        </h3>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <span className="text-[12px] font-medium text-ink-secondary px-1">Phase Vocoder Output</span>
            <WaveformCanvas 
              data={pvWaveform} 
              color="#4a7eb3" 
              progressPct={pvProgressPct} 
              duration={result.metrics.pv.duration} 
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <span className="text-[12px] font-medium text-ink-secondary px-1">Naive Resampling Output</span>
            <WaveformCanvas 
              data={naiveWaveform} 
              color="#786c8f" 
              progressPct={naiveProgressPct} 
              duration={result.metrics.naive.duration} 
            />
          </div>
        </div>
      </Card>

      <Card variant="surface" className="flex flex-col gap-4">
        <h3 className="text-[15px] font-semibold text-ink-primary tracking-tight px-1">
          Frequency Domain (FFT Spectrum)
        </h3>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <span className="text-[12px] font-medium text-ink-secondary px-1">Phase Vocoder Output</span>
            <FFTCanvas data={pvFFT} color="#4a7eb3" progressPct={pvProgressPct} />
          </div>
          <div className="flex flex-col gap-1.5">
            <span className="text-[12px] font-medium text-ink-secondary px-1">Naive Resampling Output</span>
            <FFTCanvas data={naiveFFT} color="#786c8f" progressPct={naiveProgressPct} />
          </div>
        </div>
      </Card>
    </div>
  );
}
