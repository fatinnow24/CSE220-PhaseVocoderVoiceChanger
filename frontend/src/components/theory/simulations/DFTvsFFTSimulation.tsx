import { useState } from 'react';

const N_OPTIONS = [64, 128, 256, 512, 1024, 2048, 4096];
const PROJECT_DEFAULT = 2048;

export default function DFTvsFFTSimulation() {
  const [N, setN] = useState(PROJECT_DEFAULT);

  const dftOps = N * N;
  const fftOps = Math.round(N * Math.log2(N));
  const speedup = (dftOps / fftOps).toFixed(1);

  // log scale so FFT bar stays visible next to N²
  const maxOps = 4096 * 4096;
  const maxLog = Math.log10(maxOps);
  const dftHeight = (Math.log10(dftOps) / maxLog) * 100;
  const fftHeight = (Math.log10(fftOps) / maxLog) * 100;

  return (
    <div className="my-8 w-full border-y border-hairline py-6">
      <p className="text-[12.5px] text-ink-secondary mb-4 leading-relaxed">
        Same transform, two algorithms. Pick a frame size — watch how the naive DFT’s
        work explode while the FFT stays almost flat.
      </p>

      {/* power-of-two pills — no native select */}
      <div className="flex flex-wrap items-center gap-2 mb-6">
        <span className="font-mono text-[11px] uppercase tracking-wider text-ink-tertiary mr-1">
          N =
        </span>
        {N_OPTIONS.map((n) => {
          const active = n === N;
          const isDefault = n === PROJECT_DEFAULT;
          return (
            <button
              key={n}
              type="button"
              onClick={() => setN(n)}
              className={`font-mono text-[13px] px-3 py-1 rounded-full border transition-all duration-200 ${
                active
                  ? 'bg-[#49645d] border-[#49645d] text-white'
                  : 'bg-transparent border-hairline text-ink-secondary hover:border-ink-tertiary hover:text-ink-primary'
              }`}
            >
              {n}
              {isDefault && (
                <span
                  className={`ml-1.5 text-[9px] uppercase tracking-wider ${
                    active ? 'text-white/70' : 'text-ink-tertiary'
                  }`}
                >
                  proj
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* twin bars — shared baseline, log heights */}
      <div className="grid grid-cols-2 gap-8 items-end mb-5" style={{ height: 160 }}>
        <div className="flex flex-col justify-end h-full gap-2">
          <div className="text-center">
            <div className="font-mono text-[13px] text-ink-primary">
              {dftOps.toLocaleString()}
            </div>
            <div className="text-[11px] uppercase tracking-wider text-ink-tertiary">
              DFT ≈ N²
            </div>
          </div>
          <div
            className="w-full max-w-[120px] mx-auto rounded-t-md transition-all duration-500 ease-out"
            style={{
              height: `${Math.max(4, dftHeight)}%`,
              background: 'rgba(167, 196, 188, 0.85)',
            }}
          />
        </div>
        <div className="flex flex-col justify-end h-full gap-2">
          <div className="text-center">
            <div className="font-mono text-[13px] text-ink-primary">
              {fftOps.toLocaleString()}
            </div>
            <div className="text-[11px] uppercase tracking-wider text-ink-tertiary">
              FFT ≈ N log₂ N
            </div>
          </div>
          <div
            className="w-full max-w-[120px] mx-auto rounded-t-md transition-all duration-500 ease-out"
            style={{
              height: `${Math.max(4, fftHeight)}%`,
              background: '#49645d',
            }}
          />
        </div>
      </div>

      <div className="h-px bg-hairline mb-4" />

      <p className="text-center text-[15px] text-ink-primary">
        <span className="font-mono">{speedup}×</span>{' '}
        <span className="text-ink-secondary">fewer operations with the FFT</span>
      </p>
      <p className="mt-2 text-[12.5px] italic text-ink-tertiary text-center">
        Project default N = 2048 → numpy.fft.fft()
      </p>
    </div>
  );
}
