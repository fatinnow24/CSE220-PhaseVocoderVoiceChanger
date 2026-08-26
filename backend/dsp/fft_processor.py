import numpy as np

def compute_fft(frame: np.ndarray) -> np.ndarray:
    return np.fft.fft(frame)

def compute_ifft(spectrum: np.ndarray) -> np.ndarray:
    return np.real(np.fft.ifft(spectrum))

def magnitude_spectrum(spectrum: np.ndarray) -> np.ndarray:
    return np.abs(spectrum)

def phase_spectrum(spectrum: np.ndarray) -> np.ndarray:
    return np.angle(spectrum)

def frequency_axis(N: int, sample_rate: int) -> np.ndarray:
    return np.fft.rfftfreq(N, d=1.0/sample_rate)

def wrap_phase(phase: np.ndarray) -> np.ndarray:
    return (phase + np.pi) % (2.0 * np.pi) - np.pi

def magnitude_db(spectrum: np.ndarray, ref: float = 1.0) -> np.ndarray:
    mag = np.abs(spectrum)
    mag = np.maximum(mag, 1e-10)
    db = 20.0 * np.log10(mag / ref)
    return np.maximum(db, -120.0)

def spectral_centroid(magnitude: np.ndarray, freq_axis: np.ndarray) -> float:
    n_bins = len(freq_axis)
    mag = magnitude[:n_bins]
    sum_mag = np.sum(mag)
    if sum_mag < 1e-7:
        return 0.0
    return float(np.sum(freq_axis * mag) / sum_mag)

def spectral_bandwidth(magnitude: np.ndarray, freq_axis: np.ndarray, centroid: float) -> float:
    n_bins = len(freq_axis)
    mag = magnitude[:n_bins]
    sum_mag = np.sum(mag)
    if sum_mag < 1e-7:
        return 0.0
    var = np.sum(((freq_axis - centroid)**2) * mag) / sum_mag
    return float(np.sqrt(var))

def spectral_rolloff(magnitude: np.ndarray, freq_axis: np.ndarray, rolloff_percent: float = 0.85) -> float:
    n_bins = len(freq_axis)
    mag = magnitude[:n_bins]
    total_energy = np.sum(mag)
    cumsum = np.cumsum(mag)
    threshold = rolloff_percent * total_energy
    idx = np.where(cumsum >= threshold)[0]
    if len(idx) > 0:
        return float(freq_axis[idx[0]])
    return float(freq_axis[-1])

def spectral_flux(stft_matrix: np.ndarray) -> np.ndarray:
    mag = np.abs(stft_matrix)
    diff = np.diff(mag, axis=0)
    diff = np.maximum(diff, 0.0)
    flux = np.sum(diff, axis=1)
    return np.concatenate(([0.0], flux))
