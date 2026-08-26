import numpy as np

def create_hann_window(N: int) -> np.ndarray:
    return 0.5 * (1 - np.cos(2 * np.pi * np.arange(N) / (N - 1)))

def create_hamming_window(N: int) -> np.ndarray:
    return 0.54 - 0.46 * np.cos(2 * np.pi * np.arange(N) / (N - 1))

def create_blackman_window(N: int) -> np.ndarray:
    return 0.42 - 0.5 * np.cos(2 * np.pi * np.arange(N) / (N - 1)) + 0.08 * np.cos(4 * np.pi * np.arange(N) / (N - 1))

def create_rectangular_window(N: int) -> np.ndarray:
    return np.ones(N)

def get_window(window_type: str, N: int) -> np.ndarray:
    if window_type == 'hann':
        return create_hann_window(N)
    elif window_type == 'hamming':
        return create_hamming_window(N)
    elif window_type == 'blackman':
        return create_blackman_window(N)
    elif window_type == 'rectangular':
        return create_rectangular_window(N)
    else:
        return create_hann_window(N)
