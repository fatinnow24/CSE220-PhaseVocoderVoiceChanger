import numpy as np
from .stft import compute_stft, reconstruct_signal_wola
from .fft_processor import compute_ifft, wrap_phase
from .windowing import get_window
from .resampling import naive_resample


def estimate_instantaneous_frequency(
    phase_curr: np.ndarray,
    phase_prev: np.ndarray,
    ha: int,
    n_fft: int,
) -> np.ndarray:
    """
    Estimate instantaneous frequency for each bin.

    For bin k, the expected phase advance per analysis hop is:
        expected_k = 2π * k * Ha / N

    The residual (wrapped deviation from expected) gives the
    instantaneous frequency:
        ω_inst[k] = expected_k + wrap(Δφ[k] - expected_k) / Ha * Ha
                  = expected_k + wrap(Δφ[k] - expected_k)
    """
    expected = 2.0 * np.pi * ha * np.arange(n_fft) / n_fft
    delta_phi = phase_curr - phase_prev
    delta_phi_wrapped = wrap_phase(delta_phi - expected)
    return expected + delta_phi_wrapped


def time_stretch(
    signal: np.ndarray,
    sample_rate: int,
    stretch_factor: float,
    n_fft: int,
    ha: int,
    window_type: str = 'hann',
) -> np.ndarray:
    """
    Phase Vocoder time stretching.

    Analysis hop: Ha
    Synthesis hop: Hs = Ha * stretch_factor

    For each frame m:
        φ_synth[m,k] = φ_synth[m-1,k] + ω_inst[k] * (Hs / Ha)
    """
    hs = int(round(ha * stretch_factor))
    if hs < 1:
        hs = 1

    stft_matrix, mag, phase = compute_stft(signal, n_fft, ha, window_type)
    n_frames = len(mag)

    # Phase accumulator — initialise with the first frame's phase
    phi_synth = phase[0].copy()
    synth_frames = []

    ratio = float(hs) / float(ha)

    for i in range(n_frames):
        # Emit the current synthesis frame FIRST (using phi_synth as-is for i=0,
        # which is just phase[0], the correct starting phase), then update.
        synth_spec = mag[i] * np.exp(1j * phi_synth)
        synth_frames.append(compute_ifft(synth_spec))

        # Estimate instantaneous frequency for the NEXT frame's phase advance
        if i < n_frames - 1:
            omega_inst = estimate_instantaneous_frequency(
                phase[i + 1], phase[i], ha, n_fft
            )
        else:
            omega_inst = 2.0 * np.pi * ha * np.arange(n_fft) / n_fft

        # Advance synthesis phase by one synthesis hop
        phi_synth = phi_synth + omega_inst * ratio


    original_length = int(round(len(signal) * stretch_factor))
    out = reconstruct_signal_wola(
        np.array(synth_frames), hs, original_length, n_fft, window_type
    )

    # RMS-normalize output to match input level.
    # The WOLA overlap-add can produce occasional spike artifacts that make
    # the peak >> RMS. Without this, write_wav peak-normalizes by the spike,
    # silently reducing perceived loudness by 10–30× compared to naive resampling.
    in_rms = np.sqrt(np.mean(signal ** 2))
    out_rms = np.sqrt(np.mean(out ** 2))
    if out_rms > 1e-8 and in_rms > 1e-8:
        out = out * (in_rms / out_rms)

    return out


def time_stretch_with_phase_locking(
    signal: np.ndarray,
    sample_rate: int,
    stretch_factor: float,
    n_fft: int,
    ha: int,
    window_type: str = 'hann',
) -> np.ndarray:
    """
    Phase Vocoder time stretching with peak-based identity phase locking.

    Peak locking groups bins by their nearest spectral peak and keeps
    all bins in a group phase-coherent, reducing 'phasiness' artefacts.
    """
    hs = int(round(ha * stretch_factor))
    if hs < 1:
        hs = 1

    stft_matrix, mag, phase = compute_stft(signal, n_fft, ha, window_type)
    n_frames = len(mag)

    phi_synth = phase[0].copy()
    synth_frames = []
    ratio = float(hs) / float(ha)

    for i in range(n_frames):
        # --- Identity phase locking on current phi_synth ---
        m = mag[i]
        peaks = np.where(
            (m[1:-1] > m[:-2]) & (m[1:-1] > m[2:])
        )[0] + 1

        locked_phi = phi_synth.copy()
        if len(peaks) > 0:
            peak_set = set(peaks.tolist())
            for k in range(n_fft):
                if k in peak_set:
                    continue
                distances = np.abs(peaks - k)
                nearest_peak = peaks[np.argmin(distances)]
                locked_phi[k] = phi_synth[nearest_peak] + (
                    phase[i][k] - phase[i][nearest_peak]
                )

        # Emit frame using current (locked) phase, then advance
        synth_spec = m * np.exp(1j * locked_phi)
        synth_frames.append(compute_ifft(synth_spec))

        # Advance synthesis phase for next frame
        if i < n_frames - 1:
            omega_inst = estimate_instantaneous_frequency(
                phase[i + 1], phase[i], ha, n_fft
            )
        else:
            omega_inst = 2.0 * np.pi * ha * np.arange(n_fft) / n_fft

        phi_synth = phi_synth + omega_inst * ratio

    original_length = int(round(len(signal) * stretch_factor))
    out = reconstruct_signal_wola(
        np.array(synth_frames), hs, original_length, n_fft, window_type
    )

    # RMS-normalize to match input level
    in_rms = np.sqrt(np.mean(signal ** 2))
    out_rms = np.sqrt(np.mean(out ** 2))
    if out_rms > 1e-8 and in_rms > 1e-8:
        out = out * (in_rms / out_rms)

    return out


def pitch_shift(
    signal: np.ndarray,
    sample_rate: int,
    semitones: float,
    n_fft: int,
    ha: int,
    window_type: str = 'hann',
    phase_locking: bool = False,
) -> np.ndarray:
    """
    Pitch-shift *signal* by *semitones* while preserving its duration exactly.

    Pipeline:
        pitch_factor = 2 ** (semitones / 12)

        1. Phase-vocoder time-stretch by pitch_factor.
           This compresses or expands the signal in time while keeping pitch
           relationships intact (pitch_factor < 1 → shorter, > 1 → longer).

        2. Resample the stretched result back to EXACTLY len(signal) samples.
           The explicit target_length guarantees the output sample count is
           identical to the input regardless of floating-point rounding.

    Result: same duration, pitch shifted by *semitones*.
            len(output) == len(signal) is always true.

    Examples:
        -5  semitones: pitch_factor ≈ 0.749  →  PV compresses, resample expands back
        +12 semitones: pitch_factor = 2.0    →  PV doubles length, resample halves back
        -12 semitones: pitch_factor = 0.5    →  PV halves length, resample doubles back
    """
    if semitones == 0.0:
        return signal.copy()

    pitch_factor = 2.0 ** (semitones / 12.0)
    stretch_fn = time_stretch_with_phase_locking if phase_locking else time_stretch
    stretched = stretch_fn(signal, sample_rate, pitch_factor, n_fft, ha, window_type)

    # Resample back to the ORIGINAL sample count — explicit target_length
    # guarantees exactly len(signal) samples regardless of rounding in pitch_factor.
    return naive_resample(stretched, sample_rate, pitch_factor, target_length=len(signal))



def dominant_frequency(signal: np.ndarray, sample_rate: int) -> float:
    """Return the dominant frequency (Hz) of the signal."""
    from .fft_processor import compute_fft, magnitude_spectrum, frequency_axis
    if len(signal) == 0:
        return 0.0
    N = min(len(signal), 8192)  # use at most 8192 samples for speed
    spec = compute_fft(signal[:N])
    mag = magnitude_spectrum(spec)
    freqs = frequency_axis(N, sample_rate)
    mag = mag[: len(freqs)]
    return float(freqs[np.argmax(mag)])
