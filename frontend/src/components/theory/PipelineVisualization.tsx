const STEPS = [
  {
    name: 'Input',
    desc: 'Continuous sound arrives as pressure — still analog in spirit, the thing microphones catch.',
  },
  {
    name: 'Sampling',
    desc: 'Measure it 44,100 times a second into x[n]. Continuous time becomes integer indices.',
  },
  {
    name: 'Framing',
    desc: 'Cut x[n] into short overlapping blocks (N = 2048, hop Ha = 512) so each can be treated as its own signal.',
  },
  {
    name: 'Windowing',
    desc: 'Taper each frame with a Hann w[n]. Soft edges stop the spectrum from smearing between frames.',
  },
  {
    name: 'STFT',
    desc: 'FFT every windowed frame. You get a grid X[m, k]: frame m against frequency bin k.',
  },
  {
    name: 'Magnitude + phase',
    desc: 'Split each bin into energy and angle. Magnitude is left alone from here on.',
  },
  {
    name: 'Phase evolution',
    desc: 'Compare phase across frames to recover true instantaneous frequency ω_inst in every bin.',
  },
  {
    name: 'Accumulate phase',
    desc: 'Rebuild phase at synthesis hop Hs = α·Ha. This step is where time actually stretches.',
  },
  {
    name: 'IFFT',
    desc: 'Inverse transform the modified spectra back into time-domain frames.',
  },
  {
    name: 'WOLA',
    desc: 'Retaper, overlap-add at Hs, divide by the stacked window energy. Frames become one smooth wave.',
  },
  {
    name: 'Resample',
    desc: 'Play the stretched result faster or slower by factor p. Duration returns to the original; pitch lands where you wanted it.',
  },
  {
    name: 'Output',
    desc: 'Same length as the input, frequencies shifted — the path is complete.',
  },
];

/**
 * PipelineVisualization — plain step list: one short description each.
 * No diagram, no connectors.
 */
export default function PipelineVisualization() {
  return (
    <ol className="w-full space-y-3">
      {STEPS.map((s, i) => (
        <li key={s.name} className="flex gap-3">
          <span className="font-mono text-[11px] text-ink-tertiary pt-1 shrink-0 w-5">
            {String(i + 1).padStart(2, '0')}
          </span>
          <div>
            <span className="text-[14.5px] font-semibold text-ink-primary">
              {s.name}
            </span>
            <span className="text-[14.5px] text-ink-secondary"> — {s.desc}</span>
          </div>
        </li>
      ))}
    </ol>
  );
}
