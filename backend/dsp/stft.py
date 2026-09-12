import numpy as np
from .windowing import get_window
from .fft_processor import compute_fft, magnitude_spectrum, phase_spectrum, magnitude_db, frequency_axis


def create_frames(signal: np.ndarray, frame_size: int, hop_size: int) -> np.ndarray:
    """
    Slice *signal* into overlapping frames of exactly *frame_size* samples,
    advancing by *hop_size* samples between frames.

    Uses CEILING frame count so that NO tail samples are silently discarded.
    The signal is zero-padded at the right so that every frame is full-length.

    Edge cases:
        empty input  → one zero frame of shape (1, frame_size)
        len <= frame_size → one zero-padded frame of shape (1, frame_size)
        otherwise    → ceil((len-frame_size)/hop_size) + 1 frames
    """
    if len(signal) == 0:
        return np.zeros((1, frame_size))

    if len(signal) <= frame_size:
        padded = np.zeros(frame_size)
        padded[:len(signal)] = signal
        return padded[None, :]

    # Ceiling ensures the final partial hop is included
    n_frames = int(np.ceil((len(signal) - frame_size) / hop_size)) + 1
    padded_length = (n_frames - 1) * hop_size + frame_size
    padded_signal = np.pad(signal, (0, padded_length - len(signal)))

    # Build index matrix: shape (n_frames, frame_size)
    row_idx = np.arange(frame_size)[None, :]           # (1, frame_size)
    col_idx = np.arange(n_frames)[:, None] * hop_size  # (n_frames, 1)
    return padded_signal[row_idx + col_idx]


def compute_stft(signal: np.ndarray, n_fft: int, hop_size: int, window_type='hann'):
    frames = create_frames(signal, n_fft, hop_size)
    window = get_window(window_type, n_fft)
    windowed_frames = frames * window
    stft_matrix = np.array([compute_fft(f) for f in windowed_frames])
    mag   = np.array([magnitude_spectrum(f) for f in stft_matrix])
    phase = np.array([phase_spectrum(f)     for f in stft_matrix])
    return stft_matrix, mag, phase


def reconstruct_signal_wola(
    frames: np.ndarray,
    hop_size: int,
    original_length: int,
    n_fft: int,
    window_type: str = 'hann',
) -> np.ndarray:
    """
    Weighted Overlap-Add (WOLA) synthesis.

    Each synthesis frame is windowed and added at its output position.
    The result is normalised by the accumulated squared-window, which
    cancels the WOLA gain exactly for a Hann window with sufficient overlap.

    The output is then truncated or zero-padded to *original_length* so the
    caller always receives exactly the requested number of samples — even when
    the integer synthesis hop causes the WOLA buffer to fall slightly short
    of the requested duration.
    """
    if len(frames) == 0:
        return np.zeros(original_length)

    window = get_window(window_type, n_fft)
    n_frames = len(frames)

    # The last frame starts at (n_frames-1)*hop_size and extends n_fft samples.
    output_length = (n_frames - 1) * hop_size + n_fft

    signal     = np.zeros(output_length)
    window_sum = np.zeros(output_length)

    for i, frame in enumerate(frames):
        start = i * hop_size
        signal[start:start + n_fft]     += frame * window
        window_sum[start:start + n_fft] += window ** 2

    # Divide only where window energy is non-negligible
    valid = window_sum > 1e-10
    signal[valid] /= window_sum[valid]

    if output_length >= original_length:
        return signal[:original_length]

    # Zero-pad the tail when integer hop rounding leaves the WOLA buffer
    # slightly short of the requested duration (typically < 1 ms gap).
    return np.pad(signal, (0, original_length - output_length))


def compute_spectrogram(
    signal: np.ndarray,
    n_fft: int,
    hop_size: int,
    sample_rate: int,
    window_type: str = 'hann',
) -> dict:
    stft_matrix, mag, _ = compute_stft(signal, n_fft, hop_size, window_type)
    mag_db = np.array([magnitude_db(m) for m in mag])
    freqs  = frequency_axis(n_fft, sample_rate)
    times  = np.arange(len(mag)) * hop_size / sample_rate
    return {'times': times, 'frequencies': freqs, 'magnitude_db': mag_db[:, :len(freqs)]}


def compute_instantaneous_frequency(phases: np.ndarray, ha: int, n_fft: int) -> np.ndarray:
    n_frames = len(phases)
    inst_freqs = np.zeros_like(phases)
    for i in range(1, n_frames):
        delta_phi = phases[i] - phases[i - 1]
        expected  = 2 * np.pi * ha * np.arange(n_fft) / n_fft
        delta_phi_wrapped = (delta_phi - expected + np.pi) % (2 * np.pi) - np.pi
        inst_freqs[i] = expected + delta_phi_wrapped
    inst_freqs[0] = 2 * np.pi * ha * np.arange(n_fft) / n_fft
    return inst_freqs
