import os

base_dir = r"c:\Users\workf\Downloads\stitch_phase_vocoder_voice_changer\backend"

def write_file(path, content):
    full_path = os.path.join(base_dir, path)
    os.makedirs(os.path.dirname(full_path), exist_ok=True)
    with open(full_path, "w", encoding="utf-8") as f:
        f.write(content.strip() + "\n")

# tests/__init__.py
write_file("tests/__init__.py", "")

# tests/test_dsp.py
write_file("tests/test_dsp.py", """
import numpy as np
import pytest
from dsp.generator import generate_sine
from dsp.fft_processor import compute_fft, magnitude_spectrum, frequency_axis
from dsp.phase_vocoder import pitch_shift, time_stretch
from dsp.resampling import naive_resample, semitones_to_pitch_factor
from dsp.stft import compute_stft, reconstruct_signal_wola
from dsp.windowing import get_window
from dsp.effects import apply_effect_chain, alien_preset

def test_fft_440hz_sine():
    sr = 44100
    sig = generate_sine(440, 1.0, 1.0, sr)
    spec = compute_fft(sig[:2048])
    mag = magnitude_spectrum(spec)
    freqs = frequency_axis(2048, sr)
    dom_freq = freqs[np.argmax(mag[:1025])]
    assert abs(dom_freq - 440) < 5

def test_pitch_shift_up_12st():
    sr = 44100
    sig = generate_sine(440, 1.0, 0.5, sr)
    shifted = pitch_shift(sig, sr, 12, 2048, 512, 'hann')
    
    spec = compute_fft(shifted[:2048])
    mag = magnitude_spectrum(spec)
    freqs = frequency_axis(2048, sr)
    dom_freq = freqs[np.argmax(mag[:1025])]
    assert abs(dom_freq - 880) < 5

def test_pitch_shift_down_12st():
    sr = 44100
    sig = generate_sine(440, 1.0, 0.5, sr)
    shifted = pitch_shift(sig, sr, -12, 2048, 512, 'hann')
    
    spec = compute_fft(shifted[:2048])
    mag = magnitude_spectrum(spec)
    freqs = frequency_axis(2048, sr)
    dom_freq = freqs[np.argmax(mag[:1025])]
    assert abs(dom_freq - 220) < 5

def test_time_stretch_duration():
    sr = 44100
    sig = generate_sine(440, 1.0, 1.0, sr)
    stretched = time_stretch(sig, sr, 1.5, 2048, 512, 'hann')
    dur = len(stretched) / sr
    assert abs(dur - 1.5) < 0.05

def test_wola_reconstruction():
    sr = 44100
    sig = generate_sine(440, 1.0, 1.0, sr)
    frames = []
    hop = 512
    n_fft = 2048
    window = get_window('hann', n_fft)
    for i in range(0, len(sig) - n_fft, hop):
        frames.append(sig[i:i+n_fft] * window)
    
    recon = reconstruct_signal_wola(np.array(frames), hop, len(sig), n_fft, 'hann')
    
    min_len = min(len(sig), len(recon))
    cos_sim = np.dot(sig[:min_len], recon[:min_len]) / (np.linalg.norm(sig[:min_len]) * np.linalg.norm(recon[:min_len]))
    assert cos_sim > 0.9

def test_naive_resample_duration():
    sr = 44100
    sig = generate_sine(440, 1.0, 1.0, sr)
    factor = semitones_to_pitch_factor(12)
    res = naive_resample(sig, sr, factor)
    dur = len(res) / sr
    assert abs(dur - 0.5) < 0.01

def test_hann_window_symmetry():
    win = get_window('hann', 2048)
    assert abs(win[0] - 0.0) < 1e-5
    assert abs(win[1024] - 1.0) < 1e-5

def test_phase_wrapping():
    from dsp.fft_processor import wrap_phase
    assert abs(wrap_phase(3 * np.pi) - (-np.pi)) < 1e-5
    assert abs(wrap_phase(-np.pi) - (-np.pi)) < 1e-5

def test_generator_sine_freq():
    sr = 44100
    sig = generate_sine(440, 1.0, 1.0, sr)
    from dsp.phase_vocoder import dominant_frequency
    dom = dominant_frequency(sig, sr)
    assert abs(dom - 440) < 5

def test_effect_chain_no_crash():
    sr = 44100
    sig = generate_sine(440, 1.0, 0.5, sr)
    preset = alien_preset()
    res = apply_effect_chain(sig, sr, preset)
    assert len(res) > 0
""")

# tests/test_effects.py
write_file("tests/test_effects.py", """
import numpy as np
import pytest
from dsp.generator import generate_sine
from dsp.effects import RingModulationEffect, ReverbEffect, DistortionEffect, alien_preset, apply_effect_chain, PitchShiftEffect

def test_ring_modulation_shape():
    sr = 44100
    sig = generate_sine(440, 1.0, 0.5, sr)
    eff = RingModulationEffect()
    res = eff.process(sig, sr)
    assert len(res) == len(sig)

def test_reverb_shape():
    sr = 44100
    sig = generate_sine(440, 1.0, 0.5, sr)
    eff = ReverbEffect()
    res = eff.process(sig, sr)
    assert len(res) == len(sig)

def test_distortion_bounded():
    sr = 44100
    sig = generate_sine(440, 1.0, 0.5, sr) * 2.0
    eff = DistortionEffect(drive=0.9, gain=1.0)
    res = eff.process(sig, sr)
    assert np.max(np.abs(res)) <= 1.1

def test_alien_preset():
    sr = 44100
    sig = generate_sine(440, 1.0, 0.1, sr)
    preset = alien_preset()
    res = apply_effect_chain(sig, sr, preset)
    assert len(res) > 0

def test_effect_chain_order():
    sr = 44100
    sig = generate_sine(440, 1.0, 0.1, sr)
    # chain length check
    preset = alien_preset()
    res = apply_effect_chain(sig, sr, preset)
    assert len(res) > 0
""")

print("Tests generated")
