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
