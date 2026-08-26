import numpy as np
from .windowing import get_window
from .fft_processor import compute_fft, magnitude_spectrum, phase_spectrum, magnitude_db, frequency_axis

def create_frames(signal: np.ndarray, frame_size: int, hop_size: int) -> np.ndarray:
    n_frames = 1 + (len(signal) - frame_size) // hop_size
    if n_frames < 1:
        return np.array([np.pad(signal, (0, max(0, frame_size - len(signal))))])
    indices = np.tile(np.arange(0, frame_size), (n_frames, 1)) + np.tile(np.arange(0, n_frames * hop_size, hop_size), (frame_size, 1)).T
    return signal[indices]

def compute_stft(signal: np.ndarray, n_fft: int, hop_size: int, window_type='hann'):
    frames = create_frames(signal, n_fft, hop_size)
    window = get_window(window_type, n_fft)
    windowed_frames = frames * window
    stft_matrix = np.array([compute_fft(f) for f in windowed_frames])
    mag = np.array([magnitude_spectrum(f) for f in stft_matrix])
    phase = np.array([phase_spectrum(f) for f in stft_matrix])
    return stft_matrix, mag, phase

def reconstruct_signal_wola(frames: np.ndarray, hop_size: int, original_length: int, n_fft: int, window_type='hann') -> np.ndarray:
    window = get_window(window_type, n_fft)
    n_frames = len(frames)
    signal = np.zeros(n_frames * hop_size + n_fft)
    window_sum = np.zeros(n_frames * hop_size + n_fft)
    
    for i in range(n_frames):
        start = i * hop_size
        signal[start:start+n_fft] += frames[i] * window
        window_sum[start:start+n_fft] += window**2
        
    window_sum[window_sum < 1e-10] = 1.0
    signal = signal / window_sum
    return signal[:original_length]

def compute_spectrogram(signal: np.ndarray, n_fft: int, hop_size: int, sample_rate: int, window_type='hann') -> dict:
    stft_matrix, mag, _ = compute_stft(signal, n_fft, hop_size, window_type)
    mag_db = np.array([magnitude_db(m) for m in mag])
    freqs = frequency_axis(n_fft, sample_rate)
    times = np.arange(len(mag)) * hop_size / sample_rate
    return {'times': times, 'frequencies': freqs, 'magnitude_db': mag_db[:, :len(freqs)]}

def compute_instantaneous_frequency(phases: np.ndarray, ha: int, n_fft: int) -> np.ndarray:
    n_frames = len(phases)
    inst_freqs = np.zeros_like(phases)
    for i in range(1, n_frames):
        delta_phi = phases[i] - phases[i-1]
        expected = 2 * np.pi * ha * np.arange(n_fft) / n_fft
        delta_phi_wrapped = (delta_phi - expected + np.pi) % (2 * np.pi) - np.pi
        inst_freqs[i] = expected + delta_phi_wrapped
    inst_freqs[0] = 2 * np.pi * ha * np.arange(n_fft) / n_fft
    return inst_freqs
