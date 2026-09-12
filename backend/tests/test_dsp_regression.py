"""
DSP Regression Tests — Phase Vocoder Correctness Suite

Tests per the specification:
    A. STFT frame coverage
    B. STFT/WOLA round-trip
    C. Time-stretch duration (7-second / 308700-sample input)
    D. Pitch-shift exact duration (308700 samples → exactly 308700)
    E. Pitch accuracy
    F. No NaN/Inf
    G. Determinism
    + Public effect-API tests
    + Edge cases
    + The specific -5 st + 1.5x compare-view test case
"""

import numpy as np
import pytest

from dsp.generator      import generate_sine
from dsp.stft           import create_frames, compute_stft, reconstruct_signal_wola
from dsp.phase_vocoder  import pitch_shift, time_stretch
from dsp.resampling     import naive_resample, semitones_to_pitch_factor
from dsp.effects        import PitchShiftEffect, TimeStretchEffect, apply_effect_chain

SR    = 44100
N_FFT = 2048
HA    = 512

# ---------------------------------------------------------------------------
# A. STFT Frame Coverage — no tail samples silently discarded
# ---------------------------------------------------------------------------

@pytest.mark.parametrize("n", [1, 100, 2047, 2048, 2049, 4095, 4096, 4097, 44100, 308700])
def test_stft_frame_coverage(n):
    """Every original input sample must be represented in at least one analysis frame."""
    rng = np.random.default_rng(42)
    sig = rng.random(n)
    frames = create_frames(sig, N_FFT, HA)

    assert frames.ndim == 2
    assert frames.shape[1] == N_FFT
    assert frames.shape[0] >= 1

    # The last frame must cover the last sample
    n_frames = frames.shape[0]
    last_frame_end = (n_frames - 1) * HA + N_FFT
    assert last_frame_end >= n, (
        f"n={n}: last frame ends at {last_frame_end}, tail from sample {n} lost"
    )


# ---------------------------------------------------------------------------
# B. STFT / WOLA round-trip at stretch factor 1.0
# ---------------------------------------------------------------------------

def test_wola_round_trip_length():
    """time_stretch(factor=1.0) must return a signal of the same length."""
    sig = 0.5 * np.sin(2 * np.pi * 440 * np.arange(SR) / SR)
    out = time_stretch(sig, SR, 1.0, N_FFT, HA)
    assert len(out) == len(sig)
    assert np.isfinite(out).all()


def test_wola_round_trip_similarity():
    """STFT → WOLA with 75% overlap (Hann) should give a reasonably faithful reconstruction."""
    sig = 0.5 * np.sin(2 * np.pi * 440 * np.arange(SR) / SR)
    stft_mat, mag, phase = compute_stft(sig, N_FFT, HA)
    from dsp.fft_processor import compute_ifft
    frames = np.array([compute_ifft(stft_mat[i]) for i in range(len(stft_mat))])
    recon = reconstruct_signal_wola(frames, HA, len(sig), N_FFT)
    min_len = min(len(sig), len(recon))
    norm_sig  = np.linalg.norm(sig[:min_len])
    norm_recon = np.linalg.norm(recon[:min_len])
    if norm_sig > 1e-8 and norm_recon > 1e-8:
        cos_sim = np.dot(sig[:min_len], recon[:min_len]) / (norm_sig * norm_recon)
        assert cos_sim > 0.85, f"Round-trip cosine similarity too low: {cos_sim:.4f}"


# ---------------------------------------------------------------------------
# C. Time-stretch duration — 7-second (308700-sample) input
# ---------------------------------------------------------------------------

@pytest.mark.parametrize("factor,expected", [
    (0.5,  154350),
    (1.0,  308700),
    (1.5,  463050),
    (2.0,  617400),
])
def test_time_stretch_duration_7s(factor, expected):
    """time_stretch must return exactly round(len(signal) * factor) samples."""
    sig = 0.5 * np.sin(2 * np.pi * 440 * np.arange(308700) / SR)
    out = time_stretch(sig, SR, factor, N_FFT, HA)
    assert len(out) == expected, (
        f"factor={factor}: expected {expected} samples, got {len(out)}"
    )
    assert np.isfinite(out).all()


# ---------------------------------------------------------------------------
# D. Pitch-shift exact duration — must remain exactly 308700 samples
# ---------------------------------------------------------------------------

@pytest.mark.parametrize("semitones", [-12, -5, -1, 0, 1, 5, 12])
def test_pitch_shift_exact_duration(semitones):
    """pitch_shift must return EXACTLY len(input) samples for every semitone value."""
    sig = 0.5 * np.sin(2 * np.pi * 440 * np.arange(308700) / SR)
    out = pitch_shift(sig, SR, semitones, N_FFT, HA)
    assert len(out) == 308700, (
        f"semitones={semitones:+d}: expected 308700, got {len(out)}"
    )
    assert np.isfinite(out).all()


# ---------------------------------------------------------------------------
# E. Pitch accuracy — dominant frequency must shift correctly
# ---------------------------------------------------------------------------

def _dominant_freq(sig: np.ndarray, sr: int = SR) -> float:
    """Estimate dominant frequency via rFFT on the full signal."""
    spec  = np.abs(np.fft.rfft(sig))
    freqs = np.fft.rfftfreq(len(sig), 1.0 / sr)
    return float(freqs[np.argmax(spec)])


@pytest.mark.parametrize("semitones,expected_hz", [
    ( 12,  880.0),
    (-12,  220.0),
    (  5,  440.0 * 2.0 ** ( 5.0 / 12.0)),
    ( -5,  440.0 * 2.0 ** (-5.0 / 12.0)),
])
def test_pitch_accuracy(semitones, expected_hz):
    """
    Pitch-shifted dominant frequency must be within 5% of the theoretical value.
    Uses 3 seconds of a 440 Hz sine for adequate frequency resolution.
    """
    duration = 3.0
    n = int(duration * SR)
    sig = 0.5 * np.sin(2 * np.pi * 440 * np.arange(n) / SR)
    out = pitch_shift(sig, SR, semitones, N_FFT, HA)
    dom = _dominant_freq(out)
    tol = expected_hz * 0.05  # 5% tolerance
    assert abs(dom - expected_hz) <= tol, (
        f"semitones={semitones:+d}: expected ~{expected_hz:.2f} Hz, "
        f"measured {dom:.2f} Hz (tol={tol:.2f} Hz)"
    )


# ---------------------------------------------------------------------------
# F. No NaN / Inf
# ---------------------------------------------------------------------------

@pytest.mark.parametrize("semitones", [-12, -5, -1, 0, 1, 5, 12])
def test_pitch_shift_finite(semitones):
    sig = 0.5 * np.sin(2 * np.pi * 440 * np.arange(SR) / SR)
    out = pitch_shift(sig, SR, semitones, N_FFT, HA)
    assert np.isfinite(out).all(), f"semitones={semitones}: NaN/Inf in output"


@pytest.mark.parametrize("factor", [0.5, 1.0, 1.5, 2.0])
def test_time_stretch_finite(factor):
    sig = 0.5 * np.sin(2 * np.pi * 440 * np.arange(SR) / SR)
    out = time_stretch(sig, SR, factor, N_FFT, HA)
    assert np.isfinite(out).all(), f"factor={factor}: NaN/Inf in output"


# ---------------------------------------------------------------------------
# G. Determinism
# ---------------------------------------------------------------------------

def test_pitch_shift_determinism():
    """Repeated pitch_shift calls on deterministic input must produce identical output."""
    sig = 0.5 * np.sin(2 * np.pi * 440 * np.arange(SR) / SR)
    out1 = pitch_shift(sig, SR, -5, N_FFT, HA)
    out2 = pitch_shift(sig, SR, -5, N_FFT, HA)
    np.testing.assert_array_equal(out1, out2)


def test_time_stretch_determinism():
    sig = 0.5 * np.sin(2 * np.pi * 440 * np.arange(SR) / SR)
    out1 = time_stretch(sig, SR, 1.5, N_FFT, HA)
    out2 = time_stretch(sig, SR, 1.5, N_FFT, HA)
    np.testing.assert_array_equal(out1, out2)


# ---------------------------------------------------------------------------
# Public Effect API
# ---------------------------------------------------------------------------

def test_pitch_shift_effect_preserves_length():
    """PitchShiftEffect must return exactly len(input) samples."""
    sig = 0.5 * np.sin(2 * np.pi * 440 * np.arange(SR) / SR)
    out = PitchShiftEffect(-5).process(sig, SR)
    assert len(out) == len(sig), f"PitchShiftEffect: expected {len(sig)}, got {len(out)}"
    assert np.isfinite(out).all()


def test_time_stretch_effect_duration():
    """TimeStretchEffect(1.5) must increase duration approximately 1.5x."""
    sig = 0.5 * np.sin(2 * np.pi * 440 * np.arange(SR) / SR)
    out = TimeStretchEffect(1.5).process(sig, SR)
    expected = int(round(SR * 1.5))
    assert len(out) == expected, f"TimeStretchEffect: expected {expected}, got {len(out)}"
    assert np.isfinite(out).all()


def test_chained_pitch_then_time_stretch():
    """
    PitchShiftEffect(-5) followed by TimeStretchEffect(1.5) on a 7-second signal:
        1. Pitch shift preserves length (308700)
        2. Time stretch then produces 463050 samples
    The two operations remain semantically independent.
    """
    sig = 0.5 * np.sin(2 * np.pi * 440 * np.arange(308700) / SR)

    # Pitch shift: duration must be preserved exactly
    ps_out = PitchShiftEffect(-5).process(sig, SR)
    assert len(ps_out) == 308700, (
        f"PitchShiftEffect must preserve 308700 samples, got {len(ps_out)}"
    )

    # Independent time stretch: duration changes to 1.5x
    ts_out = TimeStretchEffect(1.5).process(ps_out, SR)
    assert len(ts_out) == 463050, (
        f"TimeStretchEffect(1.5) on 308700 samples must give 463050, got {len(ts_out)}"
    )
    assert np.isfinite(ts_out).all()


# ---------------------------------------------------------------------------
# The specific compare-view test case from the user's use case
# ---------------------------------------------------------------------------

def test_specific_7s_minus5st_1_5x():
    """
    Reproduce the exact compare-view scenario:
        Input: 7 seconds at 44100 Hz = 308700 samples, 440 Hz sine
        PV:  pitch_shift(-5st) → 308700 samples, then time_stretch(1.5) → 463050 samples
        Naive: naive_resample(pitch_factor) → 412065 samples (≈ 9.34s, coupled change)
    """
    sig = 0.5 * np.sin(2 * np.pi * 440 * np.arange(308700) / SR)

    # PV pipeline
    pv_ps = pitch_shift(sig, SR, -5, N_FFT, HA)
    assert len(pv_ps) == 308700, f"Pitch shift: expected 308700, got {len(pv_ps)}"

    pv_ts = time_stretch(pv_ps, SR, 1.5, N_FFT, HA)
    assert len(pv_ts) == 463050, f"Time stretch: expected 463050, got {len(pv_ts)}"
    assert np.isfinite(pv_ts).all()

    # Naive pipeline (pitch only, duration coupled)
    pitch_factor = semitones_to_pitch_factor(-5)
    naive_out = naive_resample(sig, SR, pitch_factor)
    expected_naive = int(round(308700 / pitch_factor))  # ≈ 412065 = 9.34 s
    assert len(naive_out) == expected_naive, (
        f"Naive resample: expected {expected_naive}, got {len(naive_out)}"
    )
    assert np.isfinite(naive_out).all()


# ---------------------------------------------------------------------------
# Edge cases
# ---------------------------------------------------------------------------

def test_create_frames_empty():
    frames = create_frames(np.array([]), N_FFT, HA)
    assert frames.shape == (1, N_FFT)
    assert np.all(frames == 0)


def test_create_frames_shorter_than_window():
    sig = np.ones(100)
    frames = create_frames(sig, N_FFT, HA)
    assert frames.shape == (1, N_FFT)
    assert np.sum(frames[0, :100]) == 100.0
    assert np.all(frames[0, 100:] == 0)


def test_create_frames_exactly_window():
    sig = np.ones(N_FFT)
    frames = create_frames(sig, N_FFT, HA)
    assert frames.shape[0] >= 1
    assert frames.shape[1] == N_FFT


def test_zero_semitones_fast_path():
    """pitch_shift(0) must return a copy equal to input (fast path)."""
    sig = 0.5 * np.sin(2 * np.pi * 440 * np.arange(SR) / SR)
    out = pitch_shift(sig, SR, 0, N_FFT, HA)
    assert len(out) == len(sig)
    np.testing.assert_array_equal(out, sig)


def test_reconstruct_wola_empty_frames():
    out = reconstruct_signal_wola(np.zeros((0, N_FFT)), HA, SR, N_FFT)
    assert len(out) == SR
    assert np.all(out == 0)


def test_naive_resample_target_length():
    """naive_resample with explicit target_length must return exactly that many samples."""
    sig = np.sin(2 * np.pi * 440 * np.arange(SR) / SR)
    for tl in [1000, 22050, SR, 88200]:
        out = naive_resample(sig, SR, 0.7492, target_length=tl)
        assert len(out) == tl, f"target_length={tl}: got {len(out)}"


def test_pitch_shift_short_signal():
    """pitch_shift must not crash on a signal shorter than n_fft."""
    sig = np.zeros(500)
    sig[250] = 1.0
    out = pitch_shift(sig, SR, -5, N_FFT, HA)
    assert len(out) == len(sig)
    assert np.isfinite(out).all()
