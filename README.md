# DSP Engine & Phase Vocoder Voice Changer

A full-featured, extensible Digital Signal Processing (DSP) laboratory and Phase Vocoder application built for deep experimentation, audio transformation, and educational exploration of Signals & Systems concepts.

## 🚀 Features

- **Advanced Phase Vocoder Implementation:** Real-time pitch shifting and time stretching with phase locking and coherence preservation, preventing the "phasiness" artifact common in naive implementations.
- **Interactive DSP Laboratory:** Visualize signals in the time-domain (Waveform) and frequency-domain (Spectrum, Spectrogram).
- **Extensible Effect Chains:** Apply complex effects via an extensible pipeline system (Chorus, Reverb, Delay, Distortion).
- **Algorithm Comparison Tool:** Directly compare the Phase Vocoder algorithm's performance against Naive Resampling (Sample Rate Conversion).
- **Signal Generator:** Generate primitives (Sine, Square, Sawtooth, White Noise) to test edge cases, analyze impulse responses, and understand windowing transients.
- **Modern UI:** Built on the "Serene Logic" design system — utilizing React, Tailwind, and Zustand for state management.
- **Robust Backend API:** Written in Django + Django REST Framework + NumPy/SciPy for serious number-crunching and offline processing capability.

## 🧠 DSP Theory & Phase Vocoder Architecture

### Short-Time Fourier Transform (STFT)
The core of our processing pipeline uses the STFT to decompose signals into overlapping windows. This localized frequency analysis allows us to separate magnitude and phase across time frames. We support multiple windowing functions (Hann, Hamming, Blackman).

### Phase Vocoder: Time-Stretching
To stretch a signal in time without altering pitch:
1. We compute the STFT (analysis frames).
2. We resynthesize with a different hop size (synthesis frames).
3. **Phase Propagation:** Because the hop size changes, we cannot simply use the original phase. We estimate the instantaneous frequency from phase differences between successive frames, unwrap the phase, and construct a new coherent phase sequence for the output.

### Phase Vocoder: Pitch-Shifting
Pitch shifting is achieved via a two-step process:
1. Time-stretch the audio by a factor alpha = 2^(semitones/12).
2. Resample (sample rate convert) the stretched audio back to the original length, which effectively shifts the pitch without altering the duration.

### Phase Locking (Identity Phase Locking)
A common artifact of the standard phase vocoder is "phasiness" or loss of transient sharpness. To mitigate this, we implement **Identity Phase Locking**. We lock the phases of adjacent bins to the phase of local magnitude peaks, preserving the vertical phase coherence of transients and resulting in a much crisper, more natural sound.

## 📚 Signals & Systems Course Mapping

This project maps directly to core concepts in an undergraduate Signals and Systems curriculum:

| Component | Concept | Application in this Project |
|-----------|---------|-----------------------------|
| **Fourier Analysis** | Discrete Fourier Transform (DFT), FFT | Frequency analysis of audio; `backend/dsp/fft_processor.py` |
| **LTI Systems** | Impulse Response, Convolution | Effect processing (Reverb, Filters) |
| **Sampling Theorem** | Nyquist Rate, Aliasing, Resampling | Naive pitch shifting via interpolation |
| **Windowing** | Spectral Leakage, Spectral Smearing | STFT window choice (Hann vs Rectangular) |
| **Phase & Group Delay** | Instantaneous Frequency, Phase Unwrapping | Phase accumulation in the Vocoder |

## 🛠️ Setup Instructions

### Prerequisites
- Python 3.10+
- Node.js 18+
- FFmpeg (for format conversions, must be on system PATH)

### Backend (Django)
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Create and activate a virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Run migrations and start server:
   ```bash
   python manage.py migrate
   python manage.py runserver
   ```
   The API will run at `http://localhost:8000/api/`

### Frontend (React + Vite)
1. Open a new terminal and navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```
   The application will run at `http://localhost:5173/`

## 📂 Project Structure

```text
.
├── backend/
│   ├── api/                  # Django views, models, serializers
│   ├── dsp/                  # Core DSP algorithms (NumPy/SciPy)
│   │   ├── phase_vocoder.py  # Advanced Phase Vocoder implementation
│   │   ├── effects.py        # Extensible effect chain system
│   │   ├── generator.py      # Primitive signal generator
│   │   └── ...
│   ├── core/                 # Django settings
│   └── media/                # Uploaded and processed audio files
└── frontend/
    ├── src/
    │   ├── api/              # Axios client mapping to backend API
    │   ├── components/       # UI components (Audio, Visualization, UI)
    │   ├── hooks/            # Custom React hooks (useAudioEngine)
    │   ├── pages/            # Application views (Studio, Compare, etc.)
    │   └── store/            # Zustand state management
    └── index.html
```

---

## 📐 Detailed Theoretical Background

### 1. Fourier Series vs Fourier Transform

**Fourier Series** represents periodic signals as sums of discrete harmonics:
```
x(t) = Σ_k a_k e^(jkω₀t)
```
As the period T → ∞, the discrete harmonics approach a continuous spectrum — the **Fourier Transform**.

**Fourier Transform** (course convention):
```
Analysis:  X(jω) = ∫ x(t) e^(−jωt) dt
Synthesis: x(t) = (1/2π) ∫ X(jω) e^(jωt) dω
```

---

### 2. From FT to DFT to FFT

Because audio is sampled (discrete), we use the **Discrete Fourier Transform (DFT)**:
```
X[k] = Σ_{n=0}^{N-1} x[n] e^(−j2πkn/N)    k = 0, 1, …, N−1
```
The **FFT** computes the DFT in O(N log N) rather than O(N²). Frequency axis:
```
f_k = k · Fs / N (Hz)      ω_k = 2π · k / N (radians/sample)
f_Nyquist = Fs / 2
```

---

### 3. Magnitude and Phase

Each DFT output is complex:
```
X[k] = |X[k]| · e^(jφ[k])
```
- **|X[k]|** — magnitude spectrum (amplitude of frequency component k)
- **φ[k] = ∠X[k]** — phase spectrum (timing offset of that component)

For a real signal the spectrum has **conjugate symmetry**: `X[N−k] = X*[k]` → even magnitude, odd phase.

---

### 4. Fourier Transform Properties Used

#### Time-Shifting Property
```
x(t − t₀) ↔ X(jω) · e^(−jω·t₀)
```
A time shift leaves magnitude unchanged but rotates phase by −ω·t₀. The Phase Vocoder uses this: when a frame is moved to a new synthesis position, its phase must be updated to reflect the positional change.

#### Time-Scaling Property
```
x(αt) ↔ (1/|α|) X(j·ω/α)
```
Time compression (α > 1) shifts all frequency components to higher frequencies (pitch up) and reduces duration simultaneously. This is exactly what naive resampling does — both pitch and duration change together.

---

### 5. Phase Vocoder Algorithm — Step by Step

#### Step 1 — STFT Analysis
For each analysis frame m, compute the windowed FFT:
```
X[m,k] = FFT(x_windowed[m])
magnitude[m,k] = |X[m,k]|
phi_curr[m,k]  = ∠X[m,k]
```

#### Step 2 — Phase Difference
```
Δφ[k] = phi_curr[k] − phi_prev[k]
```

#### Step 3 — Remove Expected Advance
Expected phase advance over Ha samples at bin k:
```
expected[k] = ω_k · Ha = (2π·k/N) · Ha
residual[k] = wrap(Δφ[k] − expected[k])   → range (−π, π]
```

#### Step 4 — Instantaneous Frequency
```
ω_inst[k] = (2π·k/N) + residual[k] / Ha
```
This is the true frequency of the component near bin k.

#### Step 5 — Accumulate Synthesis Phase
```
φ_synth[m,k] = φ_synth[m−1,k] + ω_inst[k] · Hs
```
Where `Hs` = synthesis hop. This ensures continuous phase evolution.

#### Step 6 — Reconstruct Modified Spectrum
```
Y[m,k] = magnitude[m,k] · exp(j · φ_synth[m,k])
```

#### Step 7 — IFFT + Weighted Overlap-Add (WOLA)
```
y_frame[m] = IFFT(Y[m,:])   (apply synthesis window)
output[n]  = Σ_m y_frame[m][n − m·Hs] / Σ_m w²[n − m·Hs]
```

---

### 6. Time Stretching

Control the output duration by changing the relationship between Ha and Hs:
```
Hs = Ha × stretch_factor
```
- `stretch_factor > 1` → **longer** output (frames placed further apart)
- `stretch_factor < 1` → **shorter** output
- Pitch is approximately preserved (spectral content of each frame is unchanged)

---

### 7. Pitch Shifting

Pitch shift without changing duration:
```
pitch_factor = 2^(semitones / 12)

Step 1: Time-stretch with stretch_factor = 1 / pitch_factor
Step 2: Resample back to original length
```
Examples:
```
+12 semitones → pitch_factor = 2.0 (octave up)
-12 semitones → pitch_factor = 0.5 (octave down)
 +7 semitones → pitch_factor ≈ 1.498 (perfect fifth)
```

---

### 8. Naive Resampling (Baseline Comparison)

Simple resampling is equivalent to x(α·t):
```
pitch_factor > 1 → pitch ↑, duration ↓
pitch_factor < 1 → pitch ↓, duration ↑
```
Both pitch and duration change simultaneously — this is the fundamental limitation that the Phase Vocoder overcomes.

---

### 9. How Theory Maps to Implementation

| Course Concept | Implementation Location |
|---|---|
| Fourier Transform X(jω) | `backend/dsp/fft_processor.py` — `compute_fft()` |
| Magnitude spectrum \|X[k]\| | `fft_processor.magnitude_spectrum()` |
| Phase spectrum ∠X[k] | `fft_processor.phase_spectrum()` |
| Time-shifting property | Phase accumulation in `phase_vocoder.time_stretch()` |
| Time-scaling property | `dsp/resampling.naive_resample()` (demonstration baseline) |
| Windowing / Hann window | `dsp/windowing.py` — `get_window()` |
| STFT | `dsp/stft.py` — `compute_stft()`, `reconstruct_signal_wola()` |
| Instantaneous frequency | `phase_vocoder.estimate_instantaneous_frequency()` |
| Phase accumulation | Phase loop in `phase_vocoder.time_stretch()` |
| IFFT (synthesis) | `fft_processor.compute_ifft()` |
| Overlap-Add (WOLA) | `stft.reconstruct_signal_wola()` |
| Phase locking | `phase_vocoder.time_stretch_with_phase_locking()` |
| Frequency axis f_k = k·Fs/N | `fft_processor.frequency_axis()` |

---

## 🧪 Running DSP Tests

```bash
cd backend
python -m pytest tests/ -v
```

**Tests cover:**
1. FFT correctly identifies dominant frequency of a 440 Hz sine wave
2. Pitch shift +12 semitones doubles dominant frequency (440 → 880 Hz)
3. Pitch shift −12 semitones halves dominant frequency (440 → 220 Hz)
4. Time stretching by 1.5× produces output ≈ 1.5× input duration, pitch preserved
5. Naive resampling changes both pitch and duration; Phase Vocoder changes only pitch
