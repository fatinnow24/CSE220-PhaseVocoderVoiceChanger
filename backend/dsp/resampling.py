import numpy as np

def naive_resample(signal: np.ndarray, sample_rate: int, pitch_factor: float) -> np.ndarray:
    n_samples = int(len(signal) / pitch_factor)
    indices = np.arange(n_samples) * pitch_factor
    indices = np.clip(indices, 0, len(signal) - 1)
    
    # Linear interpolation
    idx0 = np.floor(indices).astype(int)
    idx1 = np.clip(idx0 + 1, 0, len(signal) - 1)
    weight1 = indices - idx0
    weight0 = 1.0 - weight1
    
    return signal[idx0] * weight0 + signal[idx1] * weight1

def semitones_to_pitch_factor(semitones: float) -> float:
    return 2.0 ** (semitones / 12.0)
