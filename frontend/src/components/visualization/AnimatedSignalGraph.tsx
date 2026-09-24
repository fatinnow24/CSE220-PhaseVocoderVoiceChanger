import { useRef, useEffect, useState } from 'react';
import { useAnalyserNode } from '../../hooks/useAudioEngine';
import { useAudioStore } from '../../store/useAudioStore';

interface AnimatedSignalGraphProps {
  previewSignal?: {
    type: string;
    frequency: number;
    amplitude: number;
    duration: number;
  } | null;
}




const GRID_STEP = 36;

function clamp(v: number, lo: number, hi: number) {
  return Math.min(hi, Math.max(lo, v));
}

function frequencyToCycles(frequency: number) {
  const f = clamp(frequency, 20, 2000);
  const norm = Math.log(f / 20) / Math.log(2000 / 20);
  return 2 + norm * 7;
}

function waveformY(type: string, u: number, cycles: number, phase: number): number {
  const t = u * cycles * 2 * Math.PI + phase;

  switch (type) {
    case 'square':
      return Math.sin(t) >= 0 ? 0.9 : -0.9;
    case 'triangle': {
      const phaseNorm = ((t / (2 * Math.PI)) % 1 + 1) % 1;
      return 4 * Math.abs(phaseNorm - 0.5) - 1;
    }
    case 'sawtooth': {
      const phaseNorm = ((t / (2 * Math.PI)) % 1 + 1) % 1;
      return 2 * (phaseNorm - Math.floor(phaseNorm + 0.5));
    }
    case 'chirp':
      // Instantaneous frequency sweeps upwards starting from base cycles to 4x cycles
      return Math.sin(2 * Math.PI * cycles * (1 + 3 * u) * u + phase);
    case 'white_noise': {
      const seed = Math.floor(u * cycles * 64 + phase * 14);
      const n = Math.sin(seed * 12.9898) * 43758.5453;
      return ((n - Math.floor(n)) * 2 - 1) * 0.85;
    }
    case 'impulse':
      return Math.abs(u - 0.5) < 0.008 ? 1 : 0;
    case 'sine':
    default:
      return Math.sin(t);
  }
}

export default function AnimatedSignalGraph({ previewSignal }: AnimatedSignalGraphProps = {}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { isPlaying , theme } = useAudioStore();
  const analyserNode = useAnalyserNode();

  const previewRef = useRef(previewSignal);
  previewRef.current = previewSignal;

  const playingRef = useRef(isPlaying);
  playingRef.current = isPlaying;

  const analyserRef = useRef(analyserNode);
  analyserRef.current = analyserNode;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId = 0;
    let lastW = 0;
    let lastH = 0;
    let lastDpr = 0;
    let buffer: Uint8Array | null = null;

    const ensureSize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      const w = Math.round(rect.width);
      const h = Math.round(rect.height);
      if (w !== lastW || h !== lastH || dpr !== lastDpr) {
        canvas.width = Math.round(w * dpr);
        canvas.height = Math.round(h * dpr);
        lastW = w;
        lastH = h;
        lastDpr = dpr;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      }
      return { w, h };
    };

    const resizeObs = new ResizeObserver(() => ensureSize());
    resizeObs.observe(canvas);

    const drawGrid = (w: number, h: number) => {
      ctx.save();
      ctx.strokeStyle = (theme === 'dark' ? 'rgba(229, 231, 235, 0.05)' : 'rgba(38, 33, 28, 0.05)');
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let x = GRID_STEP; x < w; x += GRID_STEP) {
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
      }
      for (let y = GRID_STEP; y < h; y += GRID_STEP) {
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
      }
      ctx.stroke();

      // Center baseline
      ctx.strokeStyle = (theme === 'dark' ? 'rgba(229, 231, 235, 0.12)' : 'rgba(38, 33, 28, 0.12)');
      ctx.beginPath();
      ctx.moveTo(0, h / 2);
      ctx.lineTo(w, h / 2);
      ctx.stroke();
      ctx.restore();
    };

    const render = () => {
      animationId = requestAnimationFrame(render);
      const rect = canvas.getBoundingClientRect();
      const w = rect.width;
      const h = rect.height;
      if (w === 0 || h === 0) return;

      ensureSize();
      ctx.clearRect(0, 0, w, h);
      drawGrid(w, h);

      const playing = playingRef.current;
      const analyser = analyserRef.current;
      const preview = previewRef.current;

      // Case 1: Active audio playback from Web Audio
      if (playing && analyser) {
        if (!buffer || buffer.length !== analyser.frequencyBinCount) {
          buffer = new Uint8Array(analyser.frequencyBinCount);
        }
        analyser.getByteTimeDomainData(buffer as any);

        ctx.beginPath();
        ctx.lineWidth = 1.75;
        ctx.strokeStyle = (theme === 'dark' ? '#E5E7EB' : '#26211c');
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

      // Case 2: Live preview during parameter tweaking (static waveform, no scrolling phase)
      if (preview) {
        const cycles = frequencyToCycles(preview.frequency);
        const amp = preview.amplitude;
        const pts = Math.min(600, Math.floor(w));

        ctx.beginPath();
        ctx.lineWidth = 1.75;
        ctx.strokeStyle = (theme === 'dark' ? '#E5E7EB' : '#26211c');
        ctx.lineJoin = 'round';

        for (let i = 0; i <= pts; i++) {
          const u = i / pts;
          const normY = waveformY(preview.type, u, cycles, 0);
          const y = (h / 2) - (normY * amp * (h * 0.42));
          const x = u * w;
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
        return;
      }

      // Idle flat line
      ctx.beginPath();
      ctx.strokeStyle = (theme === 'dark' ? 'rgba(229, 231, 235, 0.12)' : 'rgba(38, 33, 28, 0.12)');
      ctx.lineWidth = 1.5;
      ctx.moveTo(0, h / 2);
      ctx.lineTo(w, h / 2);
      ctx.stroke();
    };

    render();

    return () => {
      cancelAnimationFrame(animationId);
      resizeObs.disconnect();
    };
  }, []);

  const [hover, setHover] = useState({ visible: false, x: 0, y: 0, label: '' });
  const containerRef = useRef<HTMLDivElement>(null);
  const { duration } = useAudioStore();

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const container = containerRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    const relX = e.clientX - rect.left;
    const relY = e.clientY - rect.top;
    const w = rect.width;
    const h = rect.height;

    // Amplitude from Y
    const normY = (relY / h - 0.5) * -2;
    let amplitude = parseFloat(normY.toFixed(3));
    
    let timeLabel = 'Time: Live';
    if (previewSignal && previewSignal.duration) {
       timeLabel = `Time: ${((relX / w) * previewSignal.duration).toFixed(3)}s`;
    } else if (duration > 0) {
       timeLabel = `Time: ${((relX / w) * duration).toFixed(3)}s`;
    }

    const ampLabel = `Amp: ${amplitude >= 0 ? '+' : ''}${amplitude}`;
    const label = `${timeLabel}  |  ${ampLabel}`;

    const tipW = 200;
    const tipX = relX + 12 + tipW > w ? relX - tipW - 8 : relX + 12;
    const tipY = relY - 14;

    setHover({ visible: true, x: tipX, y: tipY, label });
  };

  return (
    <div className="w-full h-44 bg-surface rounded-ios-2xl p-4 flex flex-col">
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-[12px] font-semibold text-ink-secondary">LIVE SIGNAL GRAPH</h4>
        <span className="text-[10px] text-ink-tertiary">Time Domain</span>
      </div>
      <div 
        ref={containerRef}
        className="flex-1 bg-surface overflow-hidden relative cursor-crosshair"
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setHover(h => ({ ...h, visible: false }))}
      >
        <canvas ref={canvasRef} className="w-full h-full bg-surface" />
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



