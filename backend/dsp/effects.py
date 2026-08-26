import numpy as np
from scipy import signal as scipy_signal
from .phase_vocoder import pitch_shift, time_stretch

class AudioEffect:
    name: str = "AudioEffect"
    description: str = "Base effect"
    parameters: dict = {}
    
    def process(self, signal: np.ndarray, sample_rate: int) -> np.ndarray:
        raise NotImplementedError
    
    def to_dict(self) -> dict:
        return {'name': self.name, 'description': self.description, 'parameters': self.parameters}

class PitchShiftEffect(AudioEffect):
    def __init__(self, semitones=0):
        self.name = "PitchShift"
        self.description = "Pitch shifting"
        self.semitones = semitones
        self.parameters = {'semitones': {'value': semitones}}
    def process(self, signal, sample_rate):
        return pitch_shift(signal, sample_rate, self.semitones, 2048, 512, 'hann')

class TimeStretchEffect(AudioEffect):
    def __init__(self, factor=1.0):
        self.name = "TimeStretch"
        self.description = "Time stretching"
        self.factor = factor
        self.parameters = {'factor': {'value': factor}}
    def process(self, signal, sample_rate):
        return time_stretch(signal, sample_rate, self.factor, 2048, 512, 'hann')

class RingModulationEffect(AudioEffect):
    def __init__(self, frequency=35.0, depth=0.8):
        self.name = "RingModulation"
        self.description = "Ring modulation"
        self.frequency = frequency
        self.depth = depth
        self.parameters = {'frequency': {'value': frequency}, 'depth': {'value': depth}}
    def process(self, signal, sample_rate):
        t = np.arange(len(signal)) / sample_rate
        mod = np.sin(2 * np.pi * self.frequency * t) * self.depth + (1 - self.depth)
        return signal * mod

class TremoloEffect(AudioEffect):
    def __init__(self, rate=5.0, depth=0.5):
        self.name = "Tremolo"
        self.description = "Amplitude modulation"
        self.rate = rate
        self.depth = depth
        self.parameters = {'rate': {'value': rate}, 'depth': {'value': depth}}
    def process(self, signal, sample_rate):
        t = np.arange(len(signal)) / sample_rate
        mod = 1.0 - self.depth * 0.5 * (1.0 - np.sin(2 * np.pi * self.rate * t))
        return signal * mod

class ReverbEffect(AudioEffect):
    def __init__(self, room_size=0.3, wet=0.2):
        self.name = "Reverb"
        self.description = "Simple FIR reverb"
        self.room_size = room_size
        self.wet = wet
        self.parameters = {'room_size': {'value': room_size}, 'wet': {'value': wet}}
    def process(self, signal, sample_rate):
        ir_length = int(sample_rate * 2.0 * self.room_size)
        if ir_length == 0: return signal
        t = np.arange(ir_length) / sample_rate
        ir = np.exp(-t * (10.0 / max(self.room_size, 0.01)))
        ir *= np.random.randn(ir_length)
        res = scipy_signal.convolve(signal, ir, mode='full')[:len(signal)]
        return signal * (1-self.wet) + res * self.wet * 0.1

class EchoEffect(AudioEffect):
    def __init__(self, delay_sec=0.3, decay=0.5):
        self.name = "Echo"
        self.description = "Discrete echo"
        self.delay_sec = delay_sec
        self.decay = decay
        self.parameters = {'delay_sec': {'value': delay_sec}, 'decay': {'value': decay}}
    def process(self, signal, sample_rate):
        delay_samples = int(self.delay_sec * sample_rate)
        out = np.copy(signal)
        if delay_samples > 0 and delay_samples < len(signal):
            out[delay_samples:] += signal[:-delay_samples] * self.decay
        return out

class DistortionEffect(AudioEffect):
    def __init__(self, drive=0.5, gain=1.0):
        self.name = "Distortion"
        self.description = "Soft clipping"
        self.drive = drive
        self.gain = gain
        self.parameters = {'drive': {'value': drive}, 'gain': {'value': gain}}
    def process(self, signal, sample_rate):
        k = 2 * self.drive / (1.0 - self.drive + 0.01)
        return self.gain * np.tanh(k * signal) / np.tanh(k)

class LowPassFilterEffect(AudioEffect):
    def __init__(self, cutoff_hz=4000):
        self.name = "LowPass"
        self.description = "Lowpass filter"
        self.cutoff_hz = cutoff_hz
        self.parameters = {'cutoff_hz': {'value': cutoff_hz}}
    def process(self, signal, sample_rate):
        nyq = 0.5 * sample_rate
        norm_cutoff = min(self.cutoff_hz / nyq, 0.99)
        b, a = scipy_signal.butter(4, norm_cutoff, btype='low')
        return scipy_signal.lfilter(b, a, signal)

class HighPassFilterEffect(AudioEffect):
    def __init__(self, cutoff_hz=300):
        self.name = "HighPass"
        self.description = "Highpass filter"
        self.cutoff_hz = cutoff_hz
        self.parameters = {'cutoff_hz': {'value': cutoff_hz}}
    def process(self, signal, sample_rate):
        nyq = 0.5 * sample_rate
        norm_cutoff = min(self.cutoff_hz / nyq, 0.99)
        if norm_cutoff <= 0: return signal
        b, a = scipy_signal.butter(4, norm_cutoff, btype='high')
        return scipy_signal.lfilter(b, a, signal)

class BandPassFilterEffect(AudioEffect):
    def __init__(self, low_hz=300, high_hz=4000):
        self.name = "BandPass"
        self.description = "Bandpass filter"
        self.low_hz = low_hz
        self.high_hz = high_hz
        self.parameters = {'low_hz': {'value': low_hz}, 'high_hz': {'value': high_hz}}
    def process(self, signal, sample_rate):
        nyq = 0.5 * sample_rate
        low = min(self.low_hz / nyq, 0.98)
        high = min(self.high_hz / nyq, 0.99)
        if low >= high or low <= 0: return signal
        b, a = scipy_signal.butter(4, [low, high], btype='band')
        return scipy_signal.lfilter(b, a, signal)

class TelephoneEffect(AudioEffect):
    def __init__(self):
        self.name = "Telephone"
        self.description = "Telephone effect"
        self.parameters = {}
    def process(self, signal, sample_rate):
        res = BandPassFilterEffect(300, 3400).process(signal, sample_rate)
        return DistortionEffect(0.2).process(res, sample_rate)

class RobotEffect(AudioEffect):
    def __init__(self):
        self.name = "Robot"
        self.description = "Spectral freeze robot"
        self.parameters = {}
    def process(self, signal, sample_rate):
        from .stft import compute_stft, reconstruct_signal_wola
        stft_matrix, mag, phase = compute_stft(signal, 2048, 512, 'hann')
        synth_spec = mag * np.exp(1j * np.zeros_like(phase))
        from .fft_processor import compute_ifft
        frames = np.array([compute_ifft(f) for f in synth_spec])
        return reconstruct_signal_wola(frames, 512, len(signal), 2048, 'hann')

class WhisperEffect(AudioEffect):
    def __init__(self):
        self.name = "Whisper"
        self.description = "Whisper effect"
        self.parameters = {}
    def process(self, signal, sample_rate):
        from .stft import compute_stft, reconstruct_signal_wola
        stft_matrix, mag, phase = compute_stft(signal, 2048, 512, 'hann')
        rand_phase = np.random.uniform(-np.pi, np.pi, phase.shape)
        synth_spec = mag * np.exp(1j * rand_phase)
        from .fft_processor import compute_ifft
        frames = np.array([compute_ifft(f) for f in synth_spec])
        res = reconstruct_signal_wola(frames, 512, len(signal), 2048, 'hann')
        noise = np.random.randn(len(signal)) * 0.05
        return res + noise * np.max(np.abs(res))

class MegaphoneEffect(AudioEffect):
    def __init__(self):
        self.name = "Megaphone"
        self.description = "Megaphone effect"
        self.parameters = {}
    def process(self, signal, sample_rate):
        res = BandPassFilterEffect(500, 2000).process(signal, sample_rate)
        return DistortionEffect(0.7, 1.5).process(res, sample_rate)

class UnderwaterEffect(AudioEffect):
    def __init__(self):
        self.name = "Underwater"
        self.description = "Underwater effect"
        self.parameters = {}
    def process(self, signal, sample_rate):
        res = LowPassFilterEffect(800).process(signal, sample_rate)
        res = TremoloEffect(rate=3.0, depth=0.3).process(res, sample_rate)
        return ReverbEffect(room_size=0.5, wet=0.4).process(res, sample_rate)

class CaveEffect(AudioEffect):
    def __init__(self):
        self.name = "Cave"
        self.description = "Cave effect"
        self.parameters = {}
    def process(self, signal, sample_rate):
        res = ReverbEffect(room_size=0.8, wet=0.5).process(signal, sample_rate)
        return EchoEffect(delay_sec=0.4, decay=0.6).process(res, sample_rate)

def alien_preset(): return [PitchShiftEffect(8), RingModulationEffect(40.0, 0.8), DistortionEffect(0.3), ReverbEffect(0.2, 0.2)]
def grandpa_preset(): return [PitchShiftEffect(-4), LowPassFilterEffect(3500), ReverbEffect(0.15, 0.2)]
def woman_preset(): return [PitchShiftEffect(3), HighPassFilterEffect(200), LowPassFilterEffect(8000)]
def child_preset(): return [PitchShiftEffect(6), HighPassFilterEffect(300)]
def robot_preset(): return [RobotEffect()]
def deep_voice_preset(): return [PitchShiftEffect(-6), LowPassFilterEffect(5000), ReverbEffect(0.1, 0.2)]
def chipmunk_preset(): return [PitchShiftEffect(10)]
def telephone_preset(): return [TelephoneEffect()]
def radio_preset(): return [BandPassFilterEffect(300, 3000), DistortionEffect(0.2), HighPassFilterEffect(200)]
def echo_preset(): return [EchoEffect(0.3, 0.5)]
def reverb_preset(): return [ReverbEffect(0.6, 0.4)]
def ghost_preset(): return [PitchShiftEffect(2), ReverbEffect(0.7, 0.5), WhisperEffect()]
def helium_preset(): return [PitchShiftEffect(12)]
def underwater_preset(): return [UnderwaterEffect()]
def cave_preset(): return [CaveEffect()]
def megaphone_preset(): return [MegaphoneEffect()]
def metallic_preset(): return [RingModulationEffect(60, 0.8), DistortionEffect(0.4)]

EFFECT_PRESETS = {
    'alien': alien_preset,
    'grandpa': grandpa_preset,
    'woman': woman_preset,
    'child': child_preset,
    'robot': robot_preset,
    'deep_voice': deep_voice_preset,
    'chipmunk': chipmunk_preset,
    'telephone': telephone_preset,
    'radio': radio_preset,
    'echo': echo_preset,
    'reverb': reverb_preset,
    'ghost': ghost_preset,
    'helium': helium_preset,
    'underwater': underwater_preset,
    'cave': cave_preset,
    'megaphone': megaphone_preset,
    'metallic': metallic_preset,
}

def apply_effect_chain(signal: np.ndarray, sample_rate: int, effects: list[AudioEffect]) -> np.ndarray:
    out = signal.copy()
    for eff in effects:
        out = eff.process(out, sample_rate)
    return out
