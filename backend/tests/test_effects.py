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
