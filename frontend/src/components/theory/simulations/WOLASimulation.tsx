import { useRef, useEffect, useState, useMemo } from 'react'; // eslint-disable-line
import Card from '../../ui/Card';
import Button from '../../ui/Button';
import Slider from '../../ui/Slider';
import Latex from '../../ui/Latex';

export default function WOLASimulation() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [hopSize, setHopSize] = useState(32);

  const frameLength = 64;
  const numFrames = 4;
  const totalSamples = frameLength + (numFrames - 1) * hopSize;

  const isReducedMotion = useMemo(() => {
    if (typeof window !== 'undefined') return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    return false;
  }, []);

  const frames = useMemo(() => {
    const f = [];
    for (let m = 0; m < numFrames; m++) {
      const sig = new Float32Array(frameLength);
      for (let i = 0; i < frameLength; i++) {
        const hann = 0.5 * (1 - Math.cos((2 * Math.PI * i) / (frameLength - 1)));
        const phase = (i + m * hopSize) * 0.1;
        sig[i] = Math.sin(phase) * hann;
      }
      f.push(sig);
    }
    return f;
  }, [hopSize]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;
    let isActive = false;
    let cycleStart = performance.now();

    const FRAME_MS = 450;
    const HOLD_MS = 1000;
    const cycleMs = numFrames * FRAME_MS + HOLD_MS;

    const observer = new IntersectionObserver(([entry]) => { isActive = entry.isIntersecting; });
    observer.observe(canvas);

    const render = (now: number) => {
      if (isActive && ctx) {
        const dpr = window.devicePixelRatio || 1;
        const rect = canvas.getBoundingClientRect();
        const W = rect.width;
        const H = rect.height;
        if (W < 2 || H < 2) {
          animationId = requestAnimationFrame(render);
          return;
        }
        if (canvas.width !== Math.round(W * dpr) || canvas.height !== Math.round(H * dpr)) {
          canvas.width = Math.round(W * dpr);
          canvas.height = Math.round(H * dpr);
          ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        }
        ctx.clearRect(0, 0, W, H);

        // how many frames are "in" this tick (all when paused)
        let shown = numFrames;
        if (isPlaying && !isReducedMotion) {
          const t = (now - cycleStart) % cycleMs;
          shown = Math.min(numFrames, Math.floor(t / FRAME_MS) + 1);
        } else {
          cycleStart = now; // restart sweep when resumed
        }

        // reserved label bands — text never sits on the waves
        const LABEL = 20;
        const DIV = Math.round(H * 0.56);
        const topTop = LABEL + 2;
        const topBot = DIV - 8;
        const topMid = (topTop + topBot) / 2;
        const botTop = DIV + LABEL + 2;
        const botBot = H - 6;
        const botMid = (botTop + botBot) / 2;

        // section divider
        ctx.strokeStyle = 'rgba(31, 35, 40, 0.1)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(0, DIV + 0.5);
        ctx.lineTo(W, DIV + 0.5);
        ctx.stroke();

        // labels — muted ink, out of the plot area
        ctx.fillStyle = '#8c959f';
        ctx.font = '11px Outfit, sans-serif';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'alphabetic';
        ctx.fillText('Overlapping frames', 4, 14);
        ctx.fillText('Reconstructed  (Σ y·w  /  Σ w²)', 4, DIV + 14);

        // frame amplitudes scaled so the sum lands nicely
        const frameScale = (topBot - topTop) / 2 / 1.4;

        for (let m = 0; m < numFrames; m++) {
          if (m >= shown) continue;
          const isCurrent = isPlaying && !isReducedMotion && m === shown - 1 && shown <= numFrames;
          const xOffset = ((m * hopSize) / totalSamples) * W;
          const frameW = (frameLength / totalSamples) * W;

          ctx.beginPath();
          ctx.strokeStyle = isCurrent ? '#49645d' : 'rgba(167, 196, 188, 0.65)';
          ctx.lineWidth = isCurrent ? 2.2 : 1.2;
          for (let i = 0; i < frameLength; i++) {
            const x = xOffset + (i / frameLength) * frameW;
            const y = topMid - frames[m][i] * frameScale;
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
          }
          ctx.stroke();
        }

        // reconstruction from the frames shown so far
        const sum = new Float32Array(totalSamples);
        const winSqSum = new Float32Array(totalSamples);
        for (let m = 0; m < shown; m++) {
          for (let i = 0; i < frameLength; i++) {
            const hann = 0.5 * (1 - Math.cos((2 * Math.PI * i) / (frameLength - 1)));
            const idx = m * hopSize + i;
            sum[idx] += frames[m][i] * hann;
            winSqSum[idx] += hann * hann;
          }
        }

        const botAmp = (botBot - botTop) / 2;
        ctx.beginPath();
        ctx.strokeStyle = '#49645d';
        ctx.lineWidth = 2;
        let started = false;
        for (let i = 0; i < totalSamples; i++) {
          const val = winSqSum[i] > 1e-6 ? sum[i] / winSqSum[i] : 0;
          const x = (i / (totalSamples - 1)) * W;
          const y = botMid - val * botAmp;
          if (!started) {
            ctx.moveTo(x, y);
            started = true;
          } else {
            ctx.lineTo(x, y);
          }
        }
        ctx.stroke();

        // midline of reconstruction so an empty start still reads as a graph
        ctx.strokeStyle = 'rgba(31, 35, 40, 0.08)';
        ctx.beginPath();
        ctx.moveTo(0, botMid);
        ctx.lineTo(W, botMid);
        ctx.stroke();
      }
      animationId = requestAnimationFrame(render);
    };

    animationId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animationId);
      observer.disconnect();
    };
  }, [frames, hopSize, isPlaying, totalSamples, isReducedMotion]);

  return (
    <Card className="p-6">
      <h3 className="text-title-md mb-4">Weighted Overlap-Add (WOLA)</h3>

      <div className="flex items-center gap-4 mb-6">
        <Button size="sm" onClick={() => setIsPlaying(!isPlaying)}>
          {isPlaying ? 'Pause' : 'Play Animation'}
        </Button>
        <span className="text-body-sm font-semibold ml-4">Hop Size:</span>
        <Slider min={8} max={48} step={8} value={hopSize} onChange={(val: number) => setHopSize(Number(val))} />
        <span className="font-mono bg-surface-container px-2 py-1 rounded text-body-sm">{hopSize}</span>
      </div>

      <canvas ref={canvasRef} className="w-full h-72 bg-surface-container-lowest rounded-xl mb-4" />

      <div className="py-2 mb-4 overflow-x-auto">
        <Latex
          math="y_m[n] = \text{IFFT}\{Y[m, :]\}"
          block
          className="text-[15px]"
        />
        <Latex
          math="y[n] = \frac{\sum_m y_m[n - m H_s]\, w[n - m H_s]}{\sum_m w^2[n - m H_s]}"
          block
          className="text-[15px]"
        />
      </div>

      <p className="text-body-sm text-on-surface-variant italic">
        Why this matters: Individual IFFT frames are local reconstructions with edges tapered by windows. Overlap-add with window² normalization recombines them into a smooth, continuous output signal.
      </p>
    </Card>
  );
}
