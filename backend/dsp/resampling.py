import numpy as np


def naive_resample(
    signal: np.ndarray,
    sample_rate: int,
    pitch_factor: float,
    target_length: int | None = None,
) -> np.ndarray:
    """
    Resample *signal* by *pitch_factor* using linear interpolation.

    If *target_length* is provided the output has EXACTLY that many samples.
    pitch_shift() always passes target_length=len(input) so that the output
    length is guaranteed independent of floating-point rounding in pitch_factor.

    If *target_length* is None the output length is derived from pitch_factor:
        n = round(len(signal) / pitch_factor)
    This is the conventional behaviour for standalone use (e.g. in views.py
    to demonstrate that naive resampling couples pitch and duration).

    Reading positions are distributed uniformly from 0 to len(signal)-1
    using np.linspace, which guarantees the endpoint is always reached and
    the spacing is exactly uniform.

    pitch_factor > 1  →  fewer output samples  (faster playback, higher pitch)
    pitch_factor < 1  →  more output samples   (slower playback, lower pitch)

    The *sample_rate* parameter is retained for API compatibility but is not
    used in the computation.
    """
    if len(signal) == 0:
        return signal.copy()

    if target_length is None:
        target_length = int(round(len(signal) / pitch_factor))

    if target_length <= 0:
        return np.zeros(0, dtype=signal.dtype)
    if target_length == 1:
        return signal[:1].copy()

    # Map each output sample to a fractional input position
    positions = np.linspace(0.0, len(signal) - 1, target_length)

    idx0 = np.floor(positions).astype(int)
    idx1 = np.minimum(idx0 + 1, len(signal) - 1)
    frac = positions - idx0

    return signal[idx0] * (1.0 - frac) + signal[idx1] * frac


def semitones_to_pitch_factor(semitones: float) -> float:
    return 2.0 ** (semitones / 12.0)
