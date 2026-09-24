import { useEffect, useRef, useState } from 'react';
import Slider from '../../ui/Slider';

/**
 * AliasingAnimation — plain Nyquist / folding demonstration.
 * Same dots, two waves: the true tone (solid) and the impostor
 * the sampler actually sees (dashed) when f > Fs/2.
 */
export default function AliasingAnimation() {
  const [signalFreq, setSignalFreq] = useState(5);
  const [samplingFreq, setSamplingFreq] = useState(14);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  const nyquist = samplingFreq / 2;
  const aliased = signalFreq > nyquist + 1e-9;
  const m = Math.round(signalFreq / samplingFreq);
  const aliasFreq = Math.abs(signalFreq - m * samplingFreq);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => setVisible(e.isIntersecting), {
      threshold: 0.1,
    });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    if (!visible) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const W = canvas.width;
    const H = canvas.height;
    ctx.clearRect(0, 0, W, H);

    ctx.strokeStyle = 'rgba(31,35,40,0.12)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, H / 2);
    ctx.lineTo(W, H / 2);
    ctx.stroke();

    const draw = (freq: number, color: string, dashed: boolean) => {
      ctx.strokeStyle = color;
      ctx.lineWidth = dashed ? 1.5 : 2;
      ctx.setLineDash(dashed ? [7, 5] : []);
      ctx.beginPath();
      for (let x = 0; x <= W; x += 2) {
        const t = x / W;
        const y = H / 2 - Math.cos(2 * Math.PI * freq * t) * (H * 0.34);
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
      ctx.setLineDash([]);
    };

    // true tone, faint
    draw(signalFreq, 'rgba(31,35,40,0.45)', false);
    // impostor the samples imply
    if (aliased) draw(aliasFreq, '#b94a48', true);

    // sample dots — both waves pass through these
    ctx.fillStyle = '#1f2328';
    const n = Math.floor(samplingFreq);
    for (let i = 0; i <= n; i++) {
      const t = i / samplingFreq;
      if (t > 1) break;
      const x = t * W;
      const y = H / 2 - Math.cos(2 * Math.PI * signalFreq * t) * (H * 0.34);
      ctx.beginPath();
      ctx.arc(x, y, 4, 0, 2 * Math.PI);
      ctx.fill();
    }
  }, [signalFreq, samplingFreq, visible, aliased, aliasFreq]);

  return (
    <div ref={wrapRef} className="my-8 w-full">
      <canvas
        ref={canvasRef}
        width={1200}
        height={260}
        className="w-full block border-y border-hairline"
      />
      <p className="mt-2 text-[12.5px] leading-relaxed text-ink-secondary">
        {aliased ? (
          <>
            Folded. The {signalFreq} Hz tone only meets the sampler every{' '}
            {(1 / samplingFreq).toFixed(3)}s, and those dots also lie exactly on a{' '}
            {aliasFreq.toFixed(1)} Hz wave (dashed). After sampling they are
            indistinguishable — that is aliasing.
          </>
        ) : (
          <>
            Clean. {signalFreq} Hz stays below Nyquist ({nyquist.toFixed(1)} Hz), so no
            slower wave can thread the same dots. Push the tone above Nyquist and watch
            the impostor appear.
          </>
        )}
      </p>
      <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-6 w-full">
        <Slider
          label="Tone frequency f"
          value={signalFreq}
          min={1}
          max={20}
          step={1}
          onChange={setSignalFreq}
          formatValue={(v) => `${v} Hz`}
        />
        <Slider
          label="Sampling rate Fs"
          value={samplingFreq}
          min={6}
          max={40}
          step={1}
          onChange={setSamplingFreq}
          formatValue={(v) => `${v} Hz`}
        />
      </div>
      <p className="mt-3 font-mono text-[12px] text-ink-secondary">
        f<sub>N</sub> = Fs/2 = {nyquist.toFixed(1)} Hz
        <span className="mx-2 text-ink-tertiary">·</span>
        {aliased ? (
          <span className="text-[#b94a48]">
            f<sub>alias</sub> = |{signalFreq} − {m}·{samplingFreq}| = {aliasFreq.toFixed(1)} Hz
          </span>
        ) : (
          <span>f &lt; fN — no fold</span>
        )}
      </p>
    </div>
  );
}
