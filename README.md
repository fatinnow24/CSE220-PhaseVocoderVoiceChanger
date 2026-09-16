# Phase Vocoder Voice Changer & DSP Studio

A full-stack application that serves as a digital signal processing (DSP) laboratory. It allows users to upload audio files, visualize them (Waveform, Spectrum, Spectrogram), apply various DSP effects including Phase Vocoder-based time stretching and pitch shifting, and learn the theoretical background behind these transformations.

## Tech Stack

### Frontend
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **State Management**: Zustand
- **API Client**: Axios
- **Routing**: React Router DOM
- **Visualization**: HTML5 Canvas API (custom implementations for high-performance waveform/spectrogram rendering)

### Backend
- **Framework**: Django 4.2 with Django REST Framework (DRF)
- **Audio Processing**: NumPy, SciPy
- **Audio File Handling**: SoundFile, PyDub
- **Testing**: Pytest

---

## Directory & File Structure Guide

This section explains every key file in the project. If you need to understand where a piece of logic lives or what a file does, refer to this guide.

### `/backend/` (Django Server & DSP Engine)

The backend is built with Django and performs all the heavy lifting for DSP algorithms.

#### `backend/api/` (Django App)
Handles HTTP requests, file uploads, and orchestrates the DSP processing.
- `models.py`: Defines the database schema using Django ORM. Contains `AudioProject`, `AudioFile`, and `EffectPreset`.
- `serializers.py`: DRF serializers to convert complex models (like `AudioFile`) into JSON for the frontend.
- `urls.py`: Defines the API endpoints (e.g., `/api/files/upload/`, `/api/process/pitch-shift/`).
- `views.py`: Contains the view functions handling the API routes. Uses DSP modules to process audio data and handles saving/reading files.
- `audio_utils.py`: Helper functions for loading and saving `.wav` files using `soundfile` and `pydub`.

#### `backend/config/` (Django Configuration)
- `settings.py`: Core Django settings (database configuration, CORS headers, installed apps, static/media file directories).
- `urls.py`: The root URL configuration, routing `/api/` to `api.urls`.
- `wsgi.py` / `asgi.py`: Entry points for WSGI/ASGI web servers.

#### `backend/dsp/` (Core DSP Library)
This is the heart of the signal processing engine. It relies heavily on `numpy`.
- `stft.py`: Implements the Short-Time Fourier Transform (`compute_stft`) and Weighted Overlap-Add (WOLA) synthesis (`reconstruct_signal_wola`).
- `fft_processor.py`: Wraps `scipy.fft` to compute the FFT, IFFT, magnitude spectrum, phase spectrum, and frequency axis.
- `phase_vocoder.py`: The core algorithm for time-stretching and pitch-shifting. Implements instantaneous frequency estimation, phase accumulation, and phase locking.
- `resampling.py`: Implements `naive_resample` using linear interpolation (changes both pitch and time).
- `effects.py`: Implements various audio effects (`AudioEffect` base class). Includes filters (LowPass, HighPass), delays (Echo, Reverb), modulations (RingModulation), and distortion.
- `analysis.py`: Functions to calculate signal features like RMS energy, zero-crossing rate, spectral centroid, and frequency bandwidth.
- `generator.py`: Generates primitive audio signals (sine, square, sawtooth, noise) for testing or synthesis.
- `windowing.py`: Generates different window functions (Hann, Hamming, Blackman, Rectangular).

#### `backend/tests/`
- `test_dsp.py`, `test_effects.py`: Pytest suites verifying that the math and DSP logic (like the phase vocoder shifting pitch correctly) actually work.

---

### `/frontend/` (React SPA)

The frontend is a single-page application built with Vite and React.

#### `frontend/src/` (Source Root)
- `App.tsx`: The root component, sets up the `AppShell` and routing layout.
- `main.tsx`: React entry point, mounts the app to the DOM.
- `index.css`: Global CSS, contains Tailwind directives and custom CSS (like custom styled range sliders).

#### `frontend/src/api/`
- `client.ts`: Configures the Axios instance (`apiClient`) with the correct base URL pointing to the Django backend.

#### `frontend/src/store/`
- `useAudioStore.ts`: Global state management using Zustand. Holds the currently loaded audio file, playback state, effect chain, analysis data, and handles dispatching state updates across the app without prop drilling.

#### `frontend/src/pages/`
The main routed views of the application:
- `Studio.tsx`: The main workspace. Combines upload, visualization, and effect processing.
- `Effects.tsx`: A visual rack to build and manage custom DSP effect chains (e.g., adding Reverb -> Pitch Shift).
- `Compare.tsx`: Allows users to compare the naive resampling approach against the advanced Phase Vocoder approach visually and audibly.
- `Theory.tsx`: An educational hub explaining the math (Fourier Transforms, STFT, WOLA) and containing interactive simulations.
- `Signals.tsx`: A page dedicated to generating and analyzing pure primitive signals (sine, square).
- `Dashboard.tsx` & `Settings.tsx`: Basic routing pages for project management and app configuration.

#### `frontend/src/hooks/`
Custom React hooks encapsulating complex logic:
- `useAudioPlayer.ts` / `useNativeAudioPlayer.ts`: Handles the HTML5 `<audio>` element lifecycle, play/pause, seeking, and updating the global time state.
- `useAudioEngine.ts`: Higher-level orchestration hook for the audio context.
- `useWaveformCanvas.ts`: Hook that handles efficiently drawing massive arrays of audio samples onto an HTML `<canvas>`.
- `useAnimationLoop.ts`: `requestAnimationFrame` wrapper for smooth UI updates.

#### `frontend/src/types/`
- `index.ts`: TypeScript interfaces defining the shape of `AudioFile`, `WaveformData`, `SpectrogramData`, `Effect`, etc., ensuring type safety across the frontend.

#### `frontend/src/components/`
Modular UI building blocks, grouped by feature:

- **`/audio/`**: Components for handling audio playback and uploading.
  - `AudioPlayer.tsx` / `NativeAudioPlayer.tsx`: The custom transport controls (play, pause, timeline slider).
  - `UploadZone.tsx`: Drag-and-drop file uploader.
  - `WaveformViewer.tsx`: Uses the canvas hooks to draw the signal waveform.

- **`/visualization/`**: Complex data visualizations.
  - `SpectrogramView.tsx`: Renders 2D frequency over time using a heatmap canvas.
  - `SpectrumAnalyzer.tsx`: Renders the 1D frequency magnitude (FFT).

- **`/processing/`**:
  - `EffectChain.tsx` & `ProcessingControls.tsx`: UI for adding, reordering, and tweaking parameters of DSP effects.

- **`/compare/`**:
  - `ComparisonSignalGraphs.tsx` & `ComparisonView.tsx`: Specialized visualizers that stack naive vs phase vocoder waveforms side-by-side.

- **`/theory/`**:
  - Educational components (`ConceptCard.tsx`, `EquationCard.tsx`) and an interactive questionnaire (`Questionnaire.tsx`, `questionsData.ts`).
  - **`/simulations/`**: Interactive visual simulations explaining DSP concepts (e.g., `FourierSimulation.tsx`, `PhaseWheelSimulation.tsx`, `PitchShiftSimulation.tsx`).

- **`/ui/`**: Reusable generic components.
  - `Button.tsx`, `Card.tsx`, `Slider.tsx`, `ProgressBar.tsx`, `Select.tsx`, etc.

---

## 🚀 Setup Instructions

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
