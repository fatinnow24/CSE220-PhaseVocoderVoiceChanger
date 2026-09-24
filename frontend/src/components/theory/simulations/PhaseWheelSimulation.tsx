import { useRef, useEffect, useState, useMemo } from 'react';
import Slider from '../../ui/Slider';

const HISTORY = 120;
const STEP_MS = 50;

function wrapPi(phi: number): number {
  let w = (phi + Math.PI) % (2 * Math.PI);
  if (w < 0) w += 2 * Math.PI;
  return w - Math.PI;
}

export default function PhaseWheelSimulation() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [advance, setAdvance] = useState(0.5);
  const [mode, setMode] = useState<'wrapped' | 'unwrapped'>('wrapped');

  // one clock: both views read the same refs every frame
  const phaseRef = useRef({ unwrapped: 0, wrapped: 0, prevUnwrapped: 0, justWrapped: false });
  const historyRef = useRef<{ w: number; u: number }[]>([]);
  const modeRef = useRef(mode);
  const advanceRef = useRef(advance);
  modeRef.current = mode;
  advanceRef.current = advance;

  const isReducedMotion = useMemo(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId = 0;
    let active = false;
    let lastTime = performance.now();

    const observer = new IntersectionObserver(([e]) => {
      active = e.isIntersecting;
    });
    observer.observe(canvas);

    const step = () => {
      const p = phaseRef.current;
      p.prevUnwrapped = p.unwrapped;
      p.unwrapped += advanceRef.current;
      const next = wrapPi(p.unwrapped);
      // detect a ±π boundary crossing (the moment the wheel hits the cut)
      p.justWrapped =
        (p.wrapped > 0 && next <= -Math.PI + 1e-9) ||
        (p.wrapped < 0 && next >= Math.PI - 1e-9) ||
        (p.wrapped > 0 && next < p.wrapped && next < 0) ||
        Math.abs(next - p.wrapped) > Math.PI;
      p.wrapped = next;

      historyRef.current.push({ w: p.wrapped, u: p.unwrapped });
      if (historyRef.current.length > HISTORY) historyRef.current.shift();
    };

    const draw = (time: number) => {
      if (!active || isReducedMotion) {
        if (isReducedMotion && active && historyRef.current.length === 0) {
          // single static frame for reduced motion
          for (let i = 0; i < HISTORY; i++) step();
        }
      } else if (time - lastTime >= STEP_MS) {
        step();
        lastTime = time;
      }

      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      const W = rect.width;
      const H = rect.height;
      if (W < 2 || H < 2) {
        animationId = requestAnimationFrame(draw);
        return;
      }
      if (canvas.width !== Math.round(W * dpr) || canvas.height !== Math.round(H * dpr)) {
        canvas.width = Math.round(W * dpr);
        canvas.height = Math.round(H * dpr);
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      }
      ctx.clearRect(0, 0, W, H);

      const p = phaseRef.current;
      const hist = historyRef.current;
      const showingWrapped = modeRef.current === 'wrapped';

      // ── left: wheel (always the true phasor angle = wrapped) ──
      const cx = W * 0.25;
      const cy = H * 0.48;
      const r = Math.min(cx, cy) - 28;

      ctx.strokeStyle = '#a7c4bc';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, 2 * Math.PI);
      ctx.stroke();

      // axes + the wrap cut (negative real axis, ±π)
      ctx.strokeStyle = 'rgba(167, 196, 188, 0.35)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(cx - r, cy);
      ctx.lineTo(cx + r, cy);
      ctx.moveTo(cx, cy - r);
      ctx.lineTo(cx, cy + r);
      ctx.stroke();

      // mark ±π cut
      ctx.strokeStyle = p.justWrapped ? '#b94a48' : 'rgba(185, 74, 72, 0.35)';
      ctx.lineWidth = p.justWrapped ? 2 : 1;
      ctx.beginPath();
      ctx.moveTo(cx - r, cy);
      ctx.lineTo(cx - r + 14, cy);
      ctx.stroke();

      // phasor — same angle in both modes (wheel position is physical)
      const ang = p.wrapped;
      const px = cx + r * Math.cos(ang);
      const py = cy - r * Math.sin(ang); // math orientation: CCW from +x

      ctx.strokeStyle = '#49645d';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(px, py);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(px, py, 5, 0, 2 * Math.PI);
      ctx.fillStyle = '#49645d';
      ctx.fill();

      // live readout under wheel
      ctx.fillStyle = '#59636e';
      ctx.font = '12px Outfit, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(
        showingWrapped
          ? `φ = ${p.wrapped.toFixed(2)} rad   (−π…π)`
          : `φ = ${p.wrapped.toFixed(2)}   |   Φ = ${p.unwrapped.toFixed(2)} rad`,
        cx,
        cy + r + 28
      );

      // ── right: strip chart of the SAME samples ──
      const gx = W * 0.5 + 8;
      const gw = W * 0.5 - 24;
      const gy = 16;
      const gh = H - 40;

      ctx.strokeStyle = 'rgba(167, 196, 188, 0.35)';
      ctx.lineWidth = 1;
      ctx.strokeRect(gx, gy, gw, gh);

      const mid = gy + gh / 2;
      ctx.beginPath();
      ctx.moveTo(gx, mid);
      ctx.lineTo(gx + gw, mid);
      ctx.stroke();

      if (hist.length > 1) {
        // unwrapped: scale to this window’s own span so the ramp never saturates
        let u0 = hist[0].u;
        let u1 = hist[hist.length - 1].u;
        let span = Math.max(u1 - u0, 2 * Math.PI);
        if (showingWrapped) span = 2 * Math.PI;

        ctx.strokeStyle = '#49645d';
        ctx.lineWidth = 2;
        ctx.beginPath();

        let prevY = 0;
        hist.forEach((pt, i) => {
          const x = gx + (i / (HISTORY - 1)) * gw;
          let norm: number;
          if (showingWrapped) {
            norm = pt.w / Math.PI; // −1…1
          } else {
            norm = ((pt.u - (u0 + span / 2)) / (span / 2)); // −1…1 around window centre
            norm = Math.max(-1, Math.min(1, norm));
          }
          const y = mid - norm * (gh / 2 - 4);

          if (i === 0) {
            ctx.moveTo(x, y);
          } else {
            const prev = hist[i - 1];
            const jumped =
              showingWrapped && Math.abs(pt.w - prev.w) > Math.PI;
            if (jumped) {
              // vertical sawtooth drop — same instant as the wheel hitting the cut
              ctx.lineTo(x, prevY);
              ctx.stroke();
              ctx.beginPath();
              ctx.strokeStyle = '#b94a48';
              ctx.lineWidth = 1.5;
              ctx.moveTo(x, prevY);
              ctx.lineTo(x, y);
              ctx.stroke();
              ctx.beginPath();
              ctx.strokeStyle = '#49645d';
              ctx.lineWidth = 2;
              ctx.moveTo(x, y);
            } else {
              ctx.lineTo(x, y);
            }
          }
          prevY = y;
        });
        ctx.stroke();
      }

      // strip labels
      ctx.fillStyle = '#8c959f';
      ctx.font = '11px Outfit, sans-serif';
      ctx.textAlign = 'left';
      if (showingWrapped) {
        ctx.fillText('+π', gx + 4, gy + 12);
        ctx.fillText('−π', gx + 4, gy + gh - 4);
        ctx.fillText('wrapped φ (sawtooth)', gx + 4, gy + gh + 16);
      } else {
        ctx.fillText('rising Φ (continuous)', gx + 4, gy + gh + 16);
      }

      // sync note
      ctx.textAlign = 'right';
      ctx.fillStyle = p.justWrapped ? '#b94a48' : '#8c959f';
      ctx.fillText(
        p.justWrapped ? 'wrapped ↔ wheel hit ±π' : 'wheel Φ ≡ strip phase',
        gx + gw,
        gy + gh + 16
      );

      animationId = requestAnimationFrame(draw);
    };

    animationId = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(animationId);
      observer.disconnect();
    };
  }, [isReducedMotion]);

  return (
    <div className="my-8 w-full border-y border-hairline py-6">
      <div className="flex flex-wrap items-center gap-4 mb-4">
        <div className="flex gap-2">
          {(['wrapped', 'unwrapped'] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMode(m)}
              className={`text-[13px] px-3 py-1.5 rounded-full border transition-all duration-200 ${
                mode === m
                  ? 'bg-[#49645d] border-[#49645d] text-white'
                  : 'bg-transparent border-hairline text-ink-secondary hover:border-ink-tertiary hover:text-ink-primary'
              }`}
            >
              {m === 'wrapped' ? 'Wrapped (−π…π)' : 'Unwrapped (continuous)'}
            </button>
          ))}
        </div>
        <div className="flex-1 min-w-[200px] max-w-xs">
          <Slider
            label="Phase advance per step"
            min={0.1}
            max={1.5}
            step={0.1}
            value={advance}
            onChange={(v) => setAdvance(Number(v))}
            formatValue={(v) => `${Number(v).toFixed(1)} rad`}
          />
        </div>
      </div>

      <canvas ref={canvasRef} className="w-full h-64 block rounded-xl bg-surface-container-lowest" />

      <p className="mt-3 font-mono text-[12px] text-ink-secondary">
        Δφ[k] = φ[k] − φ[k−1]
        <span className="mx-2 text-ink-tertiary">·</span>
        residual = wrap(Δφ − Ω)
      </p>
      <p className="mt-2 text-[12.5px] italic text-ink-secondary leading-relaxed">
        The wheel and the strip chart read the same clock. In wrapped mode the chart’s
        red jump is the exact frame the phasor crosses the ±π cut — nothing physical
        jumps; only the principal-value label does.
      </p>
    </div>
  );
}
