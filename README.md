# CSE 220: PhasePlay, an Interactive Phase Vocoder & Voice Changer Studio

## 📌 Project Overview

An advanced digital signal processing (DSP) application built to explore, visualize, and apply audio transformations. The core of this project is a custom implementation of a **Phase Vocoder**, an algorithm that allows for independent modification of audio pitch (pitch shifting) and time (time stretching) without the classic "chipmunk" or "slow-motion" artifacts inherent to naive resampling.

The project features a high-performance **Django/NumPy backend** that serves as the math and DSP engine, paired with a rich, interactive **React/TypeScript frontend** that acts as both a processing laboratory and an educational platform.

---

## ✨ Core Features

1. **Custom Phase Vocoder Implementation:** 
   - Built from scratch using NumPy and SciPy.
   - Implements Short-Time Fourier Transform (STFT), phase accumulation/unwrapping, and Weighted Overlap-Add (WOLA) synthesis.
2. **DSP Effects Rack:** 
   - Chainable audio effects including LowPass/HighPass Filters, Echo, Reverb, Ring Modulation, and Distortion.
3. **High-Performance Visualizations:** 
   - Custom HTML5 Canvas rendering for massive audio arrays.
   - Features real-time Waveform viewers, Spectrum Analyzers (1D FFT), and Spectrograms (2D time-frequency heatmaps).
4. **Comparative Analysis:** 
   - Side-by-side visual and auditory comparisons demonstrating why the Phase Vocoder algorithm outperforms Naive Resampling.
5. **Interactive Theory Module:** 
   - A built-in educational hub with interactive DSP simulations, KaTeX-rendered math equations, and concept mapping explaining Fourier Transforms and complex signal processing.

---

## 🛠️ Tech Stack

### Frontend (User Interface & Visualizations)
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **State Management**: Zustand
- **Math Rendering**: KaTeX
- **Graphics**: HTML5 Canvas API (custom implementations)

### Backend (DSP Engine & API)
- **Framework**: Django 4.2 & Django REST Framework (DRF)
- **Math & Audio Processing**: NumPy, SciPy
- **Audio File I/O**: SoundFile, PyDub
- **Testing**: Pytest

---

## 📁 Architecture & Codebase Guide

This section outlines where the core logic lives for evaluation purposes.

### Backend (`/backend/`)
The Django server performs all heavy lifting for DSP algorithms.

- **`backend/dsp/` (Core DSP Library)**
  - `stft.py`: Implements the Short-Time Fourier Transform (`compute_stft`) and Weighted Overlap-Add synthesis (`reconstruct_signal_wola`).
  - `phase_vocoder.py`: The core algorithm for time-stretching and pitch-shifting. Implements instantaneous frequency estimation and phase accumulation.
  - `resampling.py`: Implements `naive_resample` using linear interpolation for comparative analysis.
  - `fft_processor.py`: Wraps `scipy.fft` to compute magnitude/phase spectrums.
  - `effects.py`: Base classes and implementations for filters, delays, modulations, and distortions.
  - `analysis.py`: Calculates signal features like RMS energy and spectral centroid.
  - `windowing.py`: Generates window functions (Hann, Hamming, Rectangular).

- **`backend/api/` (Django Application)**
  - `views.py` & `urls.py`: Orchestrates HTTP requests, file uploads, and routes audio data through the DSP modules.
  - `audio_utils.py`: Safely loads and normalizes `.wav` files.

- **`backend/tests/`**
  - Contains Pytest suites (`test_dsp.py`, `test_effects.py`) verifying mathematical correctness of the signal processing.

### Frontend (`/frontend/`)
A Single Page Application (SPA) built with Vite and React.

- **`frontend/src/pages/` (Main Views)**
  - `Studio.tsx`: The primary workspace for uploading, visualizing, and processing audio.
  - `Compare.tsx`: Visual/audio lab comparing naive resampling vs. phase vocoder shifting.
  - `Theory.tsx`: The interactive educational hub for DSP math.
  - `Effects.tsx`: The visual rack for building custom DSP chains.

- **`frontend/src/components/` (UI Modules)**
  - `/visualization/`: Contains `SpectrogramView.tsx` and `SpectrumAnalyzer.tsx` for canvas-based frequency rendering.
  - `/audio/`: Custom audio players and waveform rendering hooks.
  - `/theory/`: Educational simulations (e.g., `FourierSimulation.tsx`, `PhaseWheelSimulation.tsx`).

- **`frontend/src/store/useAudioStore.ts`**
  - Global Zustand state managing the currently loaded audio file, active effects, and analysis data without prop-drilling.

---

## 🚀 Setup & Execution Instructions

### Prerequisites
- Python 3.10+
- Node.js 18+
- FFmpeg (must be installed and added to system PATH for PyDub audio conversions)

### 1. Start the Backend (Django)
Open a terminal and navigate to the backend directory:
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```
*The API will run locally at `http://localhost:8000/api/`*

### 2. Start the Frontend (React)
Open a new terminal and navigate to the frontend directory:
```bash
cd frontend
npm install
npm run dev
```
*The application will run locally at `http://localhost:5173/`*

---
*Created for CSE 220.*
