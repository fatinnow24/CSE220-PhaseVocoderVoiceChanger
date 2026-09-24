import { useEffect, useRef, useState } from 'react';
import Slider from '../../ui/Slider';

/**
 * ContinuousSignalAnimation — plain theoretical animation for
 * x(t) -> x[n] = x(n·Ts).
 *
 * A single travelling sine wave. Toggling "samples" drops vertical
 * stems + dots at Ts intervals so the reader *sees* discretization
 * instead of reading a card about it. No block chrome on purpose.
 */
export default function ContinuousSignalAnimation() {
  const [freq, setFreq] = useState(2);
  const [sampleRate, setSampleRate] = useState(12);
  const [playing, setPlaying] = useState(true);
  const [showSamples, setShowSamples] = useState(true);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const phaseRef = useRef(0);
  const stateRef = useRef({ freq, sampleRate, playing, showSamples });
  stateRef.current = { freq, sampleRate, playing, showSamples };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let raf = 0;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) tick();
        else cancelAnimationFrame(raf);
      },
      { threshold: 0.05 }
    );
    observer.observe(canvas);

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    function tick() {
      const { freq: f, sampleRate: fs, playing: play, showSamples: show } = stateRef.current;
      const W = canvas!.width;
      const H = canvas!.height;
      ctx!.clearRect(0, 0, W, H);

      // faint midline
      ctx!.strokeStyle = 'rgba(31,35,40,0.12)';
      ctx!.lineWidth = 1;
      ctx!.beginPath();
      ctx!.moveTo(0, H / 2);
      ctx!.lineTo(W, H / 2);
      ctx!.stroke();

      const cycles = f; // waves visible across width
      const phase = phaseRef.current;

      // continuous wave
      ctx!.strokeStyle = '#1f2328';
      ctx!.lineWidth = 2;
      ctx!.lineJoin = 'round';
      ctx!.beginPath();
      for (let x = 0; x <= W; x += 2) {
        const t = x / W;
        const y = H / 2 - Math.sin(2 * Math.PI * cycles * t - phase) * (H * 0.32);
        if (x === 0) ctx!.moveTo(x, y);
        else ctx!.lineTo(x, y);
      }
      ctx!.stroke();

      // samples: stems + dots at Ts grid
      if (show) {
        const n = Math.floor(fs);
        ctx!.strokeStyle = 'rgba(31,35,40,0.28)';
        ctx!.lineWidth = 1;
        ctx!.fillStyle = '#1f2328';
        for (let i = 0; i <= n; i++) {
          const t = i / fs;
          if (t > 1) break;
          const x = t * W;
          const y = H / 2 - Math.sin(2 * Math.PI * cycles * t - phase) * (H * 0.32);
          ctx!.beginPath();
          ctx!.moveTo(x, H / 2);
          ctx!.lineTo(x, y);
          ctx!.stroke();
          ctx!.beginPath();
          ctx!.arc(x, y, 4, 0, 2 * Math.PI);
          ctx!.fill();
        }
      }

      if (play && !reduced) phaseRef.current += 0.02;
      raf = requestAnimationFrame(tick);
    }

    tick();
    return () => {
      cancelAnimationFrame(raf);
      observer.disconnect();
    };
  }, []);

  const Ts = (1 / sampleRate).toFixed(3);

  return (
    <div ref={wrapRef} className="my-8 w-full">
      <canvas
        ref={canvasRef}
        width={1200}
        height={260}
        className="w-full block border-y border-hairline"
      />
      <p className="mt-2 text-[12.5px] text-ink-secondary leading-relaxed">
        {showSamples
          ? `Sampling the travelling wave every Ts = ${Ts}s gives the sequence x[n] = x(n·Ts). Drag Fs down — the dots get sparse and the wave between them becomes guesswork.`
          : `Pure continuous pressure wave x(t). No indices, no arrays — defined at every instant. Turn samples on to discretize it.`}
      </p>
      <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-6 w-full">
        <Slider
          label="Wave frequency"
          value={freq}
          min={1}
          max={5}
          step={0.5}
          onChange={setFreq}
          formatValue={(v) => `${v} Hz`}
        />
        <Slider
          label="Sampling rate Fs"
          value={sampleRate}
          min={4}
          max={32}
          step={1}
          onChange={setSampleRate}
          formatValue={(v) => `${v} Hz`}
        />
      </div>
      <div className="mt-3 flex items-center gap-4 text-[13px]">
        <button
          onClick={() => setPlaying((p) => !p)}
          className="underline underline-offset-4 decoration-ink-tertiary hover:decoration-ink-primary text-ink-primary"
        >
          {playing ? 'pause time' : 'resume time'}
        </button>
        <button
          onClick={() => setShowSamples((s) => !s)}
          className="underline underline-offset-4 decoration-ink-tertiary hover:decoration-ink-primary text-ink-primary"
        >
          {showSamples ? 'hide samples' : 'show samples'}
        </button>
        <span className="text-ink-tertiary font-mono text-[12px]">
          Ts = 1/{sampleRate} ≈ {Ts}s
        </span>
      </div>
    </div>
  );
}
