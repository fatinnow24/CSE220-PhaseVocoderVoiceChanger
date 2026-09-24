import { useState, useCallback } from 'react';
import Latex from '../components/ui/Latex';

// Layout & navigation
import TheoryHero from '../components/theory/TheoryHero';
import TheoryNav from '../components/theory/TheoryNav';
import TheorySection from '../components/theory/TheorySection';

// Plain narrative primitives (no card chrome)
import {
  Prose,
  DisplayMath,
  Footnote,
  ModuleHeader,
  ModuleClose,
} from '../components/theory/Narrative';

// Simulations — Batch A (Foundations & Spectral)
import FourierSimulation from '../components/theory/simulations/FourierSimulation';
import DFTvsFFTSimulation from '../components/theory/simulations/DFTvsFFTSimulation';
import MagnitudePhaseSimulation from '../components/theory/simulations/MagnitudePhaseSimulation';
import WindowingSimulation from '../components/theory/simulations/WindowingSimulation';

// Simulations — Batch B (Phase Vocoder, Resampling & Reconstruction)
import STFTSimulation from '../components/theory/simulations/STFTSimulation';
import PhaseVocoderSimulation from '../components/theory/simulations/PhaseVocoderSimulation';
import PhaseWheelSimulation from '../components/theory/simulations/PhaseWheelSimulation';
import TimeStretchSimulation from '../components/theory/simulations/TimeStretchSimulation';
import PitchShiftSimulation from '../components/theory/simulations/PitchShiftSimulation';
import ResamplingSimulation from '../components/theory/simulations/ResamplingSimulation';
import ConvolutionSimulation from '../components/theory/simulations/ConvolutionSimulation';
import WOLASimulation from '../components/theory/simulations/WOLASimulation';

// Complex visualizations
import PipelineVisualization from '../components/theory/PipelineVisualization';
import FinalSummary from '../components/theory/FinalSummary';

// Foundations — plain theoretical narrative (replaces block cards)
import { FoundationsPart, SamplingPart } from '../components/theory/foundations/FoundationsTheory';

function scrollToModule(id: string) {
  const el = document.getElementById(id);
  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

export default function Theory() {
  const [activeSection, setActiveSection] = useState('sub-foundations');

  const handleSectionVisible = useCallback((id: string) => {
    setActiveSection(id);
  }, []);

  const handleNavigate = useCallback((id?: string) => {
    const target = id || 'sub-foundations';
    scrollToModule(target);
    setActiveSection(target);
  }, []);

  return (
    <div className="max-w-5xl mx-auto animate-in fade-in duration-500 pb-20">
      {/* Animated Hero Header */}
      <TheoryHero />

      {/* Sticky Concept Navbar */}
      <TheoryNav activeSection={activeSection} onNavigate={handleNavigate} />

      {/* Structured Curriculum Chapters */}
      <div className="space-y-8 pt-6">

        {/* ═══════════ MODULE 01 ═══════════ */}
        <div id="module-foundations" className="scroll-mt-24 space-y-12">
          <ModuleHeader
            id="mh-foundations"
            number="Module 01"
            title="Signals & Sampling Foundations"
            description="Continuous sound waves, discrete sampling representations, the Nyquist limit, and LTI principles — told as narrative, with motion where the idea needs it."
          />

          {/* 01.1 */}
          <TheorySection
            id="sub-foundations"
            index="1.1"
            title="From air to arrays"
            subtitle="Sound is continuous. Computers keep only measurements of it."
            initiallyVisible={true}
            onVisible={() => handleSectionVisible('sub-foundations')}
          >
            <FoundationsPart />
          </TheorySection>

          {/* 01.2 */}
          <TheorySection
            id="sampling"
            index="1.2"
            title="How often is often enough?"
            subtitle="Two points per cycle — and what happens when you cheat."
            onVisible={() => handleSectionVisible('sub-foundations')}
          >
            <SamplingPart />
          </TheorySection>

          <ModuleClose label="Module 01" />
        </div>

        {/* ═══════════ MODULE 02 ═══════════ */}
        <div id="module-spectral" className="scroll-mt-24 space-y-12 pt-8">
          <ModuleHeader
            id="mh-spectral"
            number="Module 02"
            title="Fourier & Spectral Domain Analysis"
            description="Leave the time axis. DFT and FFT, magnitude versus phase, and what a window does to leakage — each idea in prose, each mechanism in motion."
          />

          {/* 02.1 DFT & FFT */}
          <TheorySection
            id="dft-fft"
            index="2.1"
            title="Discrete Fourier Transform & FFT"
            subtitle="Turning a finite frame of samples into orthogonal complex sinusoidal bins."
            whyCard="The phase vocoder lives in the frequency domain. FFT evaluates the DFT in O(N log N) instead of O(N²) — the difference between real time and a coffee break."
            onVisible={() => handleSectionVisible('dft-fft')}
          >
            <Prose>
              <p>
                Take one windowed frame <LatexInline math="x[n]" />, n = 0…N−1, and ask:
                how much of each pure sinusoid sits inside it? The discrete Fourier
                transform answers with one complex number per frequency bin:
              </p>
              <DisplayMath math="X[k] = \sum_{n=0}^{N-1} x[n] \cdot e^{-j \frac{2\pi k n}{N}}, \quad k = 0, \dots, N-1" />
              <p>
                Bin <LatexInline math="k" /> sits at frequency{' '}
                <LatexInline math="f_k = k \cdot F_s / N" />. Its magnitude is how loud
                that tone is in the frame; its angle is where the cycle was when we
                looked. The FFT is not a different transform — it is the same sum
                factored so butterfly stages share work.
              </p>
            </Prose>

            <FourierSimulation />
            <DFTvsFFTSimulation />

            <Footnote
              file="dsp/fft_processor.py"
              fn="compute_fft"
              note="numpy.fft.fft(frame) — ~22.5k ops at N=2048 vs 4.19M for the naive double loop"
            />
          </TheorySection>

          {/* 02.2 Magnitude & Phase */}
          <TheorySection
            id="magnitude-phase"
            index="2.2"
            title="Polar Decomposition: Magnitude & Phase"
            subtitle="Energy on one hand, temporal alignment on the other."
            whyCard="Magnitude says which frequencies exist in a frame. Phase says when they line up. The vocoder keeps magnitude and rewrites only phase — that is the whole trick."
            onVisible={() => handleSectionVisible('dft-fft')}
          >
            <Prose>
              <p>
                Every complex bin splits cleanly into a length and an angle — Euler’s
                polar form:
              </p>
              <DisplayMath math="X[k] = |X[k]| \cdot e^{j \phi[k]}" />
              <p>
                For real-valued audio the spectrum mirrors itself: magnitudes are even,
                phases odd. Modify one half and the other follows, so we only ever
                reason about bins 0…N/2.
              </p>
              <DisplayMath math="X[N - k] = X^*[k] \implies |X[N-k]| = |X[k]|, \; \phi[N-k] = -\phi[k]" />
            </Prose>

            <MagnitudePhaseSimulation />

            <Prose>
              <Footnote
                file="dsp/fft_processor.py"
                fn="magnitude_spectrum"
                note="np.abs(spectrum) — the energy profile of the frame"
              />
              <Footnote
                file="dsp/fft_processor.py"
                fn="phase_spectrum"
                note="np.angle(spectrum) — angles wrapped to (−π, π]"
              />
            </Prose>
          </TheorySection>

          {/* 02.3 Windowing */}
          <TheorySection
            id="windowing"
            index="2.3"
            title="Windowing & Spectral Leakage"
            subtitle="Taper the frame edges, or the cut itself becomes music."
            whyCard="A hard truncation is a rectangular window: sinc sidelobes at −13 dB smear every harmonic. Tapering to zero at both ends confines the energy where it belongs."
            onVisible={() => handleSectionVisible('dft-fft')}
          >
            <Prose>
              <p>
                The FFT assumes the frame repeats forever. If the ends do not meet, that
                discontinuity radiates energy across the whole spectrum — leakage. A
                window multiplies the frame by a smooth envelope that vanishes at the
                boundaries. Our default is Hann:
              </p>
              <DisplayMath math="w[n] = 0.5 \left(1 - \cos\left(\frac{2\pi n}{N-1}\right)\right)" />
              <p>
                The windowed frame is just an elementwise product — cheap in time,
                a convolution (smearing) in frequency. That trade is the price of a
                quiet floor:
              </p>
              <DisplayMath math="x_w[n] = x[n] \cdot w[n]" />
            </Prose>

            <WindowingSimulation />

            <Footnote
              file="dsp/windowing.py"
              fn="get_window"
              note="Hann, Hamming, Blackman, or rectangular — length N"
            />
          </TheorySection>

          <ModuleClose label="Module 02" />
        </div>

        {/* ═══════════ MODULE 03 ═══════════ */}
        <div id="module-vocoder" className="scroll-mt-24 space-y-12 pt-8">
          <ModuleHeader
            id="mh-vocoder"
            number="Module 03"
            title="Phase Vocoder Engine & Transformation"
            description="STFT framing, phase unwrapping, instantaneous frequency, time-stretch, pitch-shift, and WOLA resynthesis — the machine this project is built around."
          />

          {/* 03.1 STFT */}
          <TheorySection
            id="stft"
            index="3.1"
            title="Short-Time Fourier Transform (STFT)"
            subtitle="A slide of window across the signal — time and frequency, together."
            whyCard="Music and speech never sit still. STFT chops audio into overlapping frames stepped by the analysis hop Ha, so each FFT sees a local snapshot."
            onVisible={() => handleSectionVisible('stft')}
          >
            <Prose>
              <p>
                One FFT says nothing about <em>when</em>. The STFT slides a window of
                length N along the signal, hop by hop, and transforms each visit:
              </p>
              <DisplayMath math="\text{STFT}\{x\}[m, k] = \sum_{n=0}^{N-1} x[n + m H_a] \cdot w[n] \cdot e^{-j \frac{2\pi k n}{N}}" />
              <p>
                Frame index m advances by <LatexInline math="H_a" />. Our defaults:
                N = 2048, Ha = 512 — 75% overlap, enough redundancy that no sample is
                lost under a taper.
              </p>
            </Prose>

            <STFTSimulation />

            <Prose>
              <Footnote
                file="dsp/stft.py"
                fn="create_frames"
                note="stride-trick view of shape (n_frames, n_fft)"
              />
              <Footnote
                file="dsp/stft.py"
                fn="compute_stft"
                note="window + FFT per frame → complex matrix, magnitude, phase"
              />
            </Prose>
          </TheorySection>

          {/* 03.2 Phase & instantaneous frequency */}
          <TheorySection
            id="phase-vocoder"
            index="3.2"
            title="Phase Difference & Instantaneous Frequency"
            subtitle="Why you cannot recycle phase when the hop changes."
            whyCard="When Hs ≠ Ha the old phases no longer describe the new time positions. True instantaneous frequency tells each bin how far to advance next."
            onVisible={() => handleSectionVisible('phase-vocoder')}
          >
            <Prose>
              <p>
                A sinusoid locked to bin k would advance by a known angle each analysis
                hop — the nominal rate:
              </p>
              <DisplayMath math="\Omega_k = \frac{2\pi k}{N} \cdot H_a" />
              <p>
                Real energy rarely sits dead-centre in a bin, so the measured step
                overshoots or lags. Wrap that residual into (−π, π]:
              </p>
              <DisplayMath math="\Delta\Phi_k = \text{wrap}\Big(\phi_m[k] - \phi_{m-1}[k] - \Omega_k\Big)" />
              <p>
                and correct the bin centre into the true tone frequency:
              </p>
              <DisplayMath math="\omega_{\text{inst}}[k] = \frac{2\pi k}{N} + \frac{\Delta\Phi_k}{H_a}" />
              <p>
                Synthesis then walks phase forward with the <em>synthesis</em> hop —
                this is what keeps overlap-add coherent when frames are spaced
                differently than they were analysis:
              </p>
              <DisplayMath math="\phi_{\text{synth}}[m, k] = \phi_{\text{synth}}[m-1, k] + \omega_{\text{inst}}[k] \cdot H_s" />
            </Prose>

            <PhaseWheelSimulation />
            <PhaseVocoderSimulation />

            <Prose>
              <Footnote
                file="dsp/fft_processor.py"
                fn="wrap_phase"
                note="(φ + π) mod 2π − π — keeps residuals in the principal branch"
              />
              <Footnote
                file="dsp/phase_vocoder.py"
                fn="estimate_instantaneous_frequency"
                note="true bin frequency from consecutive frame phase advances"
              />
            </Prose>
          </TheorySection>

          {/* 03.3 Time & pitch */}
          <TheorySection
            id="time-stretching"
            index="3.3"
            title="Time-Stretching & Independent Pitch Shifting"
            subtitle="Two levers that usually move together — pulled apart."
            whyCard="Naive resampling ties pitch to duration. Stretch first (pitch preserved), then resample back to original length — the duration change cancels, only pitch remains."
            onVisible={() => handleSectionVisible('time-stretching')}
          >
            <Prose>
              <p>
                Musical intervals map to frequency ratios on the equal-tempered ladder —
                twelve semitones to an octave, an octave a doubling:
              </p>
              <DisplayMath math="p = 2^{\frac{\Delta \text{semitones}}{12}}" />
              <p>
                Pitch shifting is stretch-then-resample: synthesis hop scales so the
                signal is first laid out at duration 1/p, then naively resampled by p —
                duration restored, pitch left at p·f₀:
              </p>
              <DisplayMath math="H_s = \text{round}(H_a \cdot \alpha) = \text{round}\left(\frac{H_a}{p}\right)" />
            </Prose>

            <TimeStretchSimulation />
            <PitchShiftSimulation />
            <ResamplingSimulation />

            <Prose>
              <Footnote
                file="dsp/phase_vocoder.py"
                fn="pitch_shift"
                note="time_stretch(signal, 1/p) → naive_resample(stretched, p)"
              />
              <Footnote
                file="dsp/resampling.py"
                fn="naive_resample"
                note="linear-interp playback-rate change — moves pitch and duration together"
              />
            </Prose>
          </TheorySection>

          {/* 03.4 WOLA & locking */}
          <TheorySection
            id="wola"
            index="3.4"
            title="WOLA Resynthesis & Phase Locking"
            subtitle="No clicks at the seams, no watery ghost between bins."
            whyCard="Plain overlap-add ripples in amplitude. Unlocked phases drift into a hollow phasiness. Weighted overlap-add plus identity phase locking is the fix."
            onVisible={() => handleSectionVisible('wola')}
          >
            <Prose>
              <p>
                After IFFT, each synthesis frame is tapered again and summed. Divide by
                the running sum of squared windows and reconstruction is unity-gain
                wherever the overlap is sufficient:
              </p>
              <DisplayMath math="y[n] = \frac{\sum_m y_m[n - m H_s] \cdot w[n - m H_s]}{\sum_m w^2[n - m H_s]}" />
              <p>
                Phase locking goes further: once a spectral peak’s phase is
                accumulated, neighbours that only carry its leakage keep their original
                phase <em>offset relative to that peak</em> — transients stay crisp:
              </p>
              <DisplayMath math="\phi_{\text{synth}}[k] = \phi_{\text{synth}}[\text{peak}] + \Big(\phi_{\text{orig}}[k] - \phi_{\text{orig}}[\text{peak}]\Big)" />
            </Prose>

            <WOLASimulation />

            <Prose>
              <Footnote
                file="dsp/stft.py"
                fn="reconstruct_signal_wola"
                note="overlap windowed IFFT frames ÷ Σ w²"
              />
              <Footnote
                file="dsp/phase_vocoder.py"
                fn="time_stretch_with_phase_locking"
                note="peak-pick, lock neighbouring bins to the peak’s phase walk"
              />
            </Prose>
          </TheorySection>

          {/* 03.5 LTI contrast */}
          <TheorySection
            id="sub-lti"
            index="3.5"
            title="LTI Effects & Convolution"
            subtitle="What the vocoder is not — and why that matters."
            whyCard="Reverb, echo, and EQ are textbook LTI: one impulse response, convolution, done. The vocoder cannot be written that way — that is the point of Module 03."
            onVisible={() => handleSectionVisible('wola')}
          >
            <Prose>
              <p>
                An LTI system is fully described by its response to a single impulse{' '}
                <LatexInline math="h[n]" />. Any input is just scaled, shifted copies
                of that impulse sliding past each other:
              </p>
              <DisplayMath math="y[n] = x[n] * h[n] = \sum_{k=-\infty}^{\infty} x[k] \cdot h[n - k]" />
            </Prose>

            <ConvolutionSimulation />

            <Footnote
              file="dsp/effects.py"
              fn="ReverbEffect.process"
              note="synthesizes a decaying impulse response, convolves via scipy.signal"
            />
          </TheorySection>

          <ModuleClose label="Module 03" />
        </div>

        {/* ═══════════ MODULE 04 ═══════════ */}
        <div id="module-defense" className="scroll-mt-24 space-y-12 pt-8">
          <ModuleHeader
            id="mh-defense"
            number="Module 04"
            title="End-to-End Pipeline"
            description="One linear path from raw samples to reconstructed output."
          />

          {/* 04.1 Pipeline */}
          <TheorySection
            id="pipeline"
            index="4.1"
            title="End-to-End Pipeline"
            subtitle="Input samples to reconstructed output, one stage at a time."
            onVisible={() => handleSectionVisible('pipeline')}
          >
            <PipelineVisualization />
          </TheorySection>

          <FinalSummary />
          <ModuleClose label="Theory" />
        </div>

      </div>
    </div>
  );
}

function LatexInline({ math }: { math: string }) {
  return <Latex math={math} />;
}
