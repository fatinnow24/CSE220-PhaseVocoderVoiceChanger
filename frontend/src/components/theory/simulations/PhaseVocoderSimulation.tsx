import Latex from '../../ui/Latex';

interface Step {
  title: string;
  latex: string;
  desc: string;
}

const STEPS: Step[] = [
  {
    title: 'Frame',
    latex: 'x_m[n] = x[n + m H_a]',
    desc: 'Slice the signal into overlapping windows of length N, stepped by the analysis hop Ha (512 samples by default).',
  },
  {
    title: 'Window',
    latex: 'x_w[n] = x_m[n] \\cdot w[n]',
    desc: 'Taper each frame with a Hann window so the FFT never sees a hard cut at the edges.',
  },
  {
    title: 'FFT',
    latex: 'X[m, k] = \\sum_{n=0}^{N-1} x_w[n]\\, e^{-j \\frac{2\\pi k n}{N}}',
    desc: 'One complex spectrum per frame — bin k holds the amplitude and phase of that frequency in this slice of time.',
  },
  {
    title: 'Split magnitude & phase',
    latex: 'X[m, k] = \\big|X[m, k]\\big| \\cdot e^{j \\phi_m[k]}',
    desc: 'Magnitude stays untouched. Only phase will be rewritten — that is what keeps the timbre while time moves.',
  },
  {
    title: 'Instantaneous frequency',
    latex: '\\omega_{\\text{inst}}[k] = \\frac{2\\pi k}{N} + \\frac{\\Delta\\Phi_k}{H_a}, \\quad \\Delta\\Phi_k = \\text{wrap}\\!\\big(\\phi_m[k] - \\phi_{m-1}[k] - \\Omega_k\\big)',
    desc: 'Compare consecutive frames to find where the tone really sits — between bins, not on them.',
  },
  {
    title: 'Accumulate synthesis phase',
    latex: '\\phi_{\\text{synth}}[m, k] = \\phi_{\\text{synth}}[m-1, k] + \\omega_{\\text{inst}}[k]\\, H_s',
    desc: 'Walk phase forward with the synthesis hop Hs. Hs = Ha keeps duration; Hs = Ha · α stretches or compresses it — pitch never changes.',
  },
  {
    title: 'IFFT',
    latex: 'x_m^{\\text{synth}}[n] = \\frac{1}{N} \\sum_{k=0}^{N-1} X_{\\text{synth}}[m, k]\\, e^{j \\frac{2\\pi k n}{N}}',
    desc: 'Rebuild each frame in the time domain from the modified spectrum.',
  },
  {
    title: 'WOLA overlap-add',
    latex: 'y[n] = \\frac{\\sum_m y_m[n - m H_s]\\, w[n - m H_s]}{\\sum_m w^2[n - m H_s]}',
    desc: 'Overlap the frames at Hs, taper again, normalize — one continuous signal, no boundary clicks.',
  },
];

function Arrow() {
  return (
    <div className="flex justify-center py-1" aria-hidden>
      <div className="flex flex-col items-center gap-0.5">
        <span className="w-px h-4 bg-ink-tertiary/50" />
        <span className="text-ink-tertiary text-[11px] leading-none">▼</span>
        <span className="w-px h-4 bg-ink-tertiary/50" />
      </div>
    </div>
  );
}

/**
 * PhaseVocoderPipeline — plain static walkthrough of the time-stretch
 * path: nodes + LaTeX + arrows. No fake playback; the flow is the lesson.
 */
export default function PhaseVocoderSimulation() {
  return (
    <div className="my-8 w-full border-y border-hairline py-6">
      <div className="flex items-center gap-3 mb-3">
        <span className="font-bold text-[13px] tracking-[0.2em] uppercase text-ink-primary">
          Pipeline
        </span>
        <span className="h-px flex-1 bg-hairline" />
      </div>
      <p className="text-[14px] text-ink-secondary leading-relaxed mb-6">
        Eight steps, every frame. Magnitude rides through untouched; phase is
        re-accumulated at a different hop — that is the entire time stretch.
        Nothing here plays audio; it is the algorithm, written out.
      </p>

      <ol className="w-full">
        {STEPS.map((step, i) => (
          <li key={step.title} className="w-full">
            <div className="w-full">
              <div className="flex items-baseline gap-3 flex-wrap">
                <span className="font-mono text-[11px] tracking-wider text-ink-tertiary">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <h4 className="text-[15px] font-semibold text-ink-primary">
                  {step.title}
                </h4>
              </div>
              <div className="mt-1.5 py-1.5 overflow-x-auto">
                <Latex math={step.latex} block className="text-[15.5px]" />
              </div>
              <p className="text-[13.5px] text-ink-secondary leading-relaxed">
                {step.desc}
              </p>
            </div>
            {i < STEPS.length - 1 && <Arrow />}
          </li>
        ))}
      </ol>

      <div className="mt-6 pt-4 border-t border-hairline">
        <p className="font-mono text-[12px] text-ink-secondary">
          H_a = 512
          <span className="mx-2 text-ink-tertiary">·</span>
          H_s = \alpha \cdot H_a
          <span className="mx-2 text-ink-tertiary">·</span>
          {'α = 1 → same length,  α ≠ 1 → stretched / compressed, pitch held'}
        </p>
        <p className="mt-1 font-mono text-[12px] text-ink-tertiary">
          dsp/phase_vocoder.py → time_stretch()
          <span className="mx-2">·</span>
          dsp/stft.py → reconstruct_signal_wola()
        </p>
      </div>
    </div>
  );
}
