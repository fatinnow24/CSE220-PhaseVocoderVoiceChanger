import Latex from '../../ui/Latex';
import { Prose, DisplayMath, Footnote } from '../Narrative';
import ContinuousSignalAnimation from './ContinuousSignalAnimation';
import AliasingAnimation from './AliasingAnimation';

export function FoundationsPart() {
  return (
    <Prose>
      <p>
        Sound in the air is continuous. Pressure varies at <em>every</em> instant — there
        are no gaps, no indices, no arrays. Mathematically we write that as
      </p>
      <DisplayMath math="x(t), \quad t \in \mathbb{R}" />
      <p>
        a function of a real-valued time variable. A microphone produces (approximately)
        this: a voltage that tracks pressure without interruption.
      </p>
      <p>
        A computer cannot store “every instant”. So we <em>measure</em> the wave at a
        steady tick — every <Latex math="T_s" /> seconds — and keep only those numbers:
      </p>
      <DisplayMath math="x[n] = x(n T_s), \quad n \in \mathbb{Z}, \quad T_s = 1 / F_s" />
      <ContinuousSignalAnimation />
      <p>
        That is the whole transition. <Latex math="F_s" /> is the sampling rate (44100
        ticks per second for CD audio), <Latex math="T_s" /> the period between them, and{' '}
        <Latex math="x[n]" /> an ordinary array on disk. Everything downstream — FFTs,
        phase estimates, resampling — reads this array, never the air itself.
      </p>
      <p>
        Two ideas from continuous theory carry over and are worth stating once. First, any
        such wave can be decomposed into sinusoids and rebuilt from them:
      </p>
      <DisplayMath math="X(j\omega) = \int_{-\infty}^{\infty} x(t)\, e^{-j\omega t}\, dt \qquad\Longleftrightarrow\qquad x(t) = \tfrac{1}{2\pi}\int_{-\infty}^{\infty} X(j\omega)\, e^{j\omega t}\, d\omega" />
      <p>
        This Fourier pair is the ancestor of everything in Module 02 — the DFT is just
        its sampled, finite-length descendant.
      </p>
      <p>
        Second, most audio <em>effects</em> (filters, echo, reverb) are linear and
        time-invariant: scaling or shifting the input scales or shifts the output by the
        same amount. Such systems are fully described by one impulse response{' '}
        <Latex math="h[n]" /> acting through convolution:
      </p>
      <DisplayMath math="y[n] = x[n] * h[n] = \sum_k x[k]\, h[n-k]" />
      <p>
        Keep this as contrast: the phase vocoder you will meet in Module 03 is{' '}
        <em>not</em> LTI — estimating and rewriting phase is non-linear, and stretching
        the time axis breaks time-invariance. That is exactly why it can do what no
        convolution can: change duration without changing pitch.
      </p>
      <Footnote
        file="dsp/stft.py"
        fn="create_frames"
        note="starts here — slices x[n] into overlapping frames of length N"
      />
    </Prose>
  );
}

export function SamplingPart() {
  return (
    <Prose>
      <p>
        Sampling looks innocent — just “take values often enough”. The subtlety is what
        “often enough” means. To pin down one full oscillation you need at least{' '}
        <em>two</em> points per cycle: one for the rise, one for the fall. Hence the
        Nyquist–Shannon bound:
      </p>
      <DisplayMath math="f_{\text{Nyquist}} = F_s / 2" />
      <p>
        Any tone below this limit is uniquely determined by its samples. Any tone above
        it is not — a slower impostor threads the very same dots:
      </p>
      <DisplayMath math="f_{\text{alias}} = |\, f - m F_s \,|, \quad m \in \mathbb{Z}" />
      <AliasingAnimation />
      <p>
        That folding is aliasing. Once two tones share the same samples, no later
        processing can separate them — the harsh inharmonic edge is baked in. For 44.1
        kHz audio the ceiling sits at 22 050 Hz, safely above hearing; drop{' '}
        <Latex math="F_s" /> (as resampling does) and the ceiling drops with it, folding
        highs back down as noise.
      </p>
      <p>
        This is why sampling matters for a voice changer: every pitch shift ends in a
        resample, and every resample moves the Nyquist ceiling. Cross it carelessly and
        you manufacture frequencies that were never sung.
      </p>
      <Footnote
        file="dsp/fft_processor.py"
        fn="frequency_axis"
        note="rfftfreq(N, 1/Fs) — bin centres live or die by this Fs"
      />
    </Prose>
  );
}
