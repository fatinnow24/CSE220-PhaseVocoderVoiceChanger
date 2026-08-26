import numpy as np
from .fft_processor import compute_fft, magnitude_spectrum, frequency_axis, spectral_centroid, spectral_bandwidth, spectral_rolloff, spectral_flux
from .stft import compute_stft
from .phase_vocoder import dominant_frequency

def analyze_audio(signal: np.ndarray, sample_rate: int, n_fft: int = 2048, hop_size: int = 512) -> dict:
    if len(signal) == 0: return {}
    stft_matrix, mag, _ = compute_stft(signal, n_fft, hop_size, 'hann')
    freq_axis = frequency_axis(n_fft, sample_rate)
    
    mean_mag = np.mean(mag, axis=0)
    centroid = spectral_centroid(mean_mag, freq_axis)
    bandwidth = spectral_bandwidth(mean_mag, freq_axis, centroid)
    rolloff = spectral_rolloff(mean_mag, freq_axis)
    flux = spectral_flux(stft_matrix)
    
    return {
        'duration': len(signal) / sample_rate,
        'sample_rate': sample_rate,
        'num_samples': len(signal),
        'channels': 1,
        'peak_amplitude': float(np.max(np.abs(signal))),
        'rms': float(np.sqrt(np.mean(signal**2))),
        'zero_crossing_rate': float(np.mean(np.abs(np.diff(np.sign(signal)))) / 2),
        'dominant_frequency': dominant_frequency(signal, sample_rate),
        'nyquist_frequency': sample_rate / 2.0,
        'n_fft': n_fft,
        'hop_size': hop_size,
        'spectral_centroid': centroid,
        'spectral_bandwidth': bandwidth,
        'spectral_rolloff': rolloff,
        'spectral_flux_mean': float(np.mean(flux)),
    }

def compute_waveform_peaks(signal: np.ndarray, num_points: int = 1000) -> list[dict]:
    if len(signal) == 0: return []
    if len(signal) < num_points:
        return [{'min': float(x), 'max': float(x)} for x in signal]
    
    chunk_size = len(signal) // num_points
    peaks = []
    for i in range(num_points):
        chunk = signal[i*chunk_size:(i+1)*chunk_size]
        peaks.append({'min': float(np.min(chunk)), 'max': float(np.max(chunk))})
    return peaks

def compute_fft_for_display(signal: np.ndarray, sample_rate: int, n_fft: int = 2048) -> dict:
    if len(signal) == 0: return {'frequencies': [], 'magnitudes_db': []}
    spec = compute_fft(signal[:min(len(signal), n_fft)])
    mag = magnitude_spectrum(spec)
    from .fft_processor import magnitude_db
    db = magnitude_db(mag)
    freqs = frequency_axis(len(spec), sample_rate)
    n_bins = len(freqs)
    return {'frequencies': freqs.tolist(), 'magnitudes_db': db[:n_bins].tolist()}

def compute_spectrogram_for_display(signal, sample_rate, n_fft=2048, hop_size=512, max_time_bins=200, max_freq_bins=256) -> dict:
    from .stft import compute_spectrogram
    sg = compute_spectrogram(signal, n_fft, hop_size, sample_rate, 'hann')
    times = sg['times']
    freqs = sg['frequencies']
    mag_db = sg['magnitude_db']
    
    # Downsample time
    if len(times) > max_time_bins:
        idx = np.linspace(0, len(times)-1, max_time_bins, dtype=int)
        times = times[idx]
        mag_db = mag_db[idx, :]
        
    # Downsample freq
    if len(freqs) > max_freq_bins:
        idx = np.linspace(0, len(freqs)-1, max_freq_bins, dtype=int)
        freqs = freqs[idx]
        mag_db = mag_db[:, idx]
        
    return {
        'times': times.tolist(),
        'frequencies': freqs.tolist(),
        'magnitude_db': mag_db.tolist()
    }
