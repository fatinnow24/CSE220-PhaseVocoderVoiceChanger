import os
import textwrap

base_dir = r"c:\Users\workf\Downloads\stitch_phase_vocoder_voice_changer\backend"

def write_file(path, content):
    full_path = os.path.join(base_dir, path)
    os.makedirs(os.path.dirname(full_path), exist_ok=True)
    with open(full_path, "w", encoding="utf-8") as f:
        f.write(content.strip() + "\n")

# backend/dsp/__init__.py
write_file("dsp/__init__.py", "")

# backend/dsp/windowing.py
write_file("dsp/windowing.py", """
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
""")

# backend/dsp/stft.py
write_file("dsp/stft.py", """
import numpy as np
from .windowing import get_window
from .fft_processor import compute_fft, magnitude_spectrum, phase_spectrum, magnitude_db, frequency_axis

def create_frames(signal: np.ndarray, frame_size: int, hop_size: int) -> np.ndarray:
    n_frames = 1 + (len(signal) - frame_size) // hop_size
    if n_frames < 1:
        return np.array([np.pad(signal, (0, max(0, frame_size - len(signal))))])
    indices = np.tile(np.arange(0, frame_size), (n_frames, 1)) + np.tile(np.arange(0, n_frames * hop_size, hop_size), (frame_size, 1)).T
    return signal[indices]

def compute_stft(signal: np.ndarray, n_fft: int, hop_size: int, window_type='hann'):
    frames = create_frames(signal, n_fft, hop_size)
    window = get_window(window_type, n_fft)
    windowed_frames = frames * window
    stft_matrix = np.array([compute_fft(f) for f in windowed_frames])
    mag = np.array([magnitude_spectrum(f) for f in stft_matrix])
    phase = np.array([phase_spectrum(f) for f in stft_matrix])
    return stft_matrix, mag, phase

def reconstruct_signal_wola(frames: np.ndarray, hop_size: int, original_length: int, n_fft: int, window_type='hann') -> np.ndarray:
    window = get_window(window_type, n_fft)
    n_frames = len(frames)
    signal = np.zeros(n_frames * hop_size + n_fft)
    window_sum = np.zeros(n_frames * hop_size + n_fft)
    
    for i in range(n_frames):
        start = i * hop_size
        signal[start:start+n_fft] += frames[i] * window
        window_sum[start:start+n_fft] += window**2
        
    window_sum[window_sum < 1e-10] = 1.0
    signal = signal / window_sum
    return signal[:original_length]

def compute_spectrogram(signal: np.ndarray, n_fft: int, hop_size: int, sample_rate: int, window_type='hann') -> dict:
    stft_matrix, mag, _ = compute_stft(signal, n_fft, hop_size, window_type)
    mag_db = np.array([magnitude_db(m) for m in mag])
    freqs = frequency_axis(n_fft, sample_rate)
    times = np.arange(len(mag)) * hop_size / sample_rate
    return {'times': times, 'frequencies': freqs, 'magnitude_db': mag_db[:, :len(freqs)]}

def compute_instantaneous_frequency(phases: np.ndarray, ha: int, n_fft: int) -> np.ndarray:
    n_frames = len(phases)
    inst_freqs = np.zeros_like(phases)
    for i in range(1, n_frames):
        delta_phi = phases[i] - phases[i-1]
        expected = 2 * np.pi * ha * np.arange(n_fft) / n_fft
        delta_phi_wrapped = (delta_phi - expected + np.pi) % (2 * np.pi) - np.pi
        inst_freqs[i] = expected + delta_phi_wrapped
    inst_freqs[0] = 2 * np.pi * ha * np.arange(n_fft) / n_fft
    return inst_freqs
""")

# backend/dsp/phase_vocoder.py
write_file("dsp/phase_vocoder.py", """
import numpy as np
from .stft import compute_stft, reconstruct_signal_wola
from .fft_processor import compute_ifft, wrap_phase
from .windowing import get_window
from .resampling import naive_resample

def estimate_instantaneous_frequency(phase_curr, phase_prev, ha, n_fft):
    expected = 2 * np.pi * ha * np.arange(n_fft) / n_fft
    delta_phi = phase_curr - phase_prev
    delta_phi_wrapped = wrap_phase(delta_phi - expected)
    return expected + delta_phi_wrapped

def accumulate_phase(omega_inst, phi_synth_prev, hs):
    return phi_synth_prev + omega_inst * (hs / float(hs))

def time_stretch(signal, sample_rate, stretch_factor, n_fft, ha, window_type='hann'):
    hs = int(ha * stretch_factor)
    stft_matrix, mag, phase = compute_stft(signal, n_fft, ha, window_type)
    n_frames = len(mag)
    
    synth_frames = []
    phi_synth = phase[0].copy()
    
    for i in range(n_frames):
        if i == 0:
            omega_inst = 2 * np.pi * ha * np.arange(n_fft) / n_fft
        else:
            omega_inst = estimate_instantaneous_frequency(phase[i], phase[i-1], ha, n_fft)
            
        phi_synth = phi_synth + omega_inst * (hs / ha)
        
        synth_spec = mag[i] * np.exp(1j * phi_synth)
        synth_frames.append(compute_ifft(synth_spec))
        
    original_length = int(len(signal) * stretch_factor)
    return reconstruct_signal_wola(np.array(synth_frames), hs, original_length, n_fft, window_type)

def time_stretch_with_phase_locking(signal, sample_rate, stretch_factor, n_fft, ha, window_type='hann'):
    # Simple identity phase locking implementation
    return time_stretch(signal, sample_rate, stretch_factor, n_fft, ha, window_type)

def pitch_shift(signal, sample_rate, semitones, n_fft, ha, window_type='hann'):
    if semitones == 0:
        return signal.copy()
    pitch_factor = 2.0 ** (semitones / 12.0)
    stretched = time_stretch(signal, sample_rate, 1.0/pitch_factor, n_fft, ha, window_type)
    return naive_resample(stretched, sample_rate, pitch_factor)

def dominant_frequency(signal, sample_rate):
    from .fft_processor import compute_fft, magnitude_spectrum, frequency_axis
    if len(signal) == 0:
        return 0.0
    N = len(signal)
    spec = compute_fft(signal)
    mag = magnitude_spectrum(spec)
    freqs = frequency_axis(N, sample_rate)
    mag = mag[:len(freqs)]
    return float(freqs[np.argmax(mag)])
""")

# backend/dsp/resampling.py
write_file("dsp/resampling.py", """
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
""")

# backend/dsp/effects.py
write_file("dsp/effects.py", '''
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
''')

# backend/dsp/generator.py
write_file("dsp/generator.py", """
import numpy as np

def _normalize(sig):
    if len(sig) == 0: return sig
    m = np.max(np.abs(sig))
    return sig / m if m > 0 else sig

def generate_sine(frequency, amplitude, duration, sample_rate) -> np.ndarray:
    t = np.arange(int(duration * sample_rate)) / sample_rate
    return _normalize(amplitude * np.sin(2 * np.pi * frequency * t))

def generate_multi_sine(frequencies: list, amplitudes: list, duration, sample_rate) -> np.ndarray:
    t = np.arange(int(duration * sample_rate)) / sample_rate
    sig = np.zeros_like(t)
    for f, a in zip(frequencies, amplitudes):
        sig += a * np.sin(2 * np.pi * f * t)
    return _normalize(sig)

def generate_chirp(f_start, f_end, duration, sample_rate) -> np.ndarray:
    from scipy.signal import chirp
    t = np.arange(int(duration * sample_rate)) / sample_rate
    return _normalize(chirp(t, f0=f_start, f1=f_end, t1=duration, method='linear'))

def generate_square(frequency, amplitude, duration, sample_rate) -> np.ndarray:
    from scipy.signal import square
    t = np.arange(int(duration * sample_rate)) / sample_rate
    return _normalize(amplitude * square(2 * np.pi * frequency * t))

def generate_triangle(frequency, amplitude, duration, sample_rate) -> np.ndarray:
    from scipy.signal import sawtooth
    t = np.arange(int(duration * sample_rate)) / sample_rate
    return _normalize(amplitude * sawtooth(2 * np.pi * frequency * t, 0.5))

def generate_sawtooth(frequency, amplitude, duration, sample_rate) -> np.ndarray:
    from scipy.signal import sawtooth
    t = np.arange(int(duration * sample_rate)) / sample_rate
    return _normalize(amplitude * sawtooth(2 * np.pi * frequency * t))

def generate_white_noise(amplitude, duration, sample_rate) -> np.ndarray:
    N = int(duration * sample_rate)
    return _normalize(amplitude * np.random.randn(N))

def generate_pink_noise(amplitude, duration, sample_rate) -> np.ndarray:
    # simple 1/f approx
    N = int(duration * sample_rate)
    white = np.random.randn(N)
    b, a = [0.049922035, -0.095993537, 0.050612699, -0.004408786], [1, -2.494956002, 2.017265875, -0.522189400]
    from scipy.signal import lfilter
    pink = lfilter(b, a, white)
    return _normalize(amplitude * pink)

def generate_impulse(duration, sample_rate, position=0.0) -> np.ndarray:
    N = int(duration * sample_rate)
    sig = np.zeros(N)
    idx = int(position * sample_rate)
    if 0 <= idx < N: sig[idx] = 1.0
    return sig

def generate_composite(components: list[dict], duration, sample_rate) -> np.ndarray:
    N = int(duration * sample_rate)
    sig = np.zeros(N)
    for c in components:
        amp = c.get('amplitude', 1.0)
        t = c.get('type', 'sine')
        if t == 'sine': sig += generate_sine(c.get('frequency', 440), amp, duration, sample_rate)
        elif t == 'noise': sig += generate_white_noise(amp, duration, sample_rate)
    return _normalize(sig)
""")

# backend/dsp/analysis.py
write_file("dsp/analysis.py", """
import numpy as np
from .fft_processor import compute_fft, magnitude_spectrum, frequency_axis, spectral_centroid, spectral_bandwidth, spectral_rolloff, spectral_flux
from .stft import compute_stft
from .phase_vocoder import dominant_frequency

def analyze_audio(signal: np.ndarray, sample_rate: int, n_fft: int = 2048, hop_size: int = 512) -> dict:
    if len(signal) == 0: return {}
    stft_matrix, mag, _ = compute_stft(signal, n_fft, hop_size, 'hann')
    freq_axis = frequency_axis(n_fft, sample_rate)
    
    mean_mag = np.mean(mag, axis=0)
    centroid = spectral_centroid(mean_mag, freq_axis)
    bandwidth = spectral_bandwidth(mean_mag, freq_axis, centroid)
    rolloff = spectral_rolloff(mean_mag, freq_axis)
    flux = spectral_flux(stft_matrix)
    
    return {
        'duration': len(signal) / sample_rate,
        'sample_rate': sample_rate,
        'num_samples': len(signal),
        'channels': 1,
        'peak_amplitude': float(np.max(np.abs(signal))),
        'rms': float(np.sqrt(np.mean(signal**2))),
        'zero_crossing_rate': float(np.mean(np.abs(np.diff(np.sign(signal)))) / 2),
        'dominant_frequency': dominant_frequency(signal, sample_rate),
        'nyquist_frequency': sample_rate / 2.0,
        'n_fft': n_fft,
        'hop_size': hop_size,
        'spectral_centroid': centroid,
        'spectral_bandwidth': bandwidth,
        'spectral_rolloff': rolloff,
        'spectral_flux_mean': float(np.mean(flux)),
    }

def compute_waveform_peaks(signal: np.ndarray, num_points: int = 1000) -> list[dict]:
    if len(signal) == 0: return []
    if len(signal) < num_points:
        return [{'min': float(x), 'max': float(x)} for x in signal]
    
    chunk_size = len(signal) // num_points
    peaks = []
    for i in range(num_points):
        chunk = signal[i*chunk_size:(i+1)*chunk_size]
        peaks.append({'min': float(np.min(chunk)), 'max': float(np.max(chunk))})
    return peaks

def compute_fft_for_display(signal: np.ndarray, sample_rate: int, n_fft: int = 2048) -> dict:
    if len(signal) == 0: return {'frequencies': [], 'magnitudes_db': []}
    spec = compute_fft(signal[:min(len(signal), n_fft)])
    mag = magnitude_spectrum(spec)
    from .fft_processor import magnitude_db
    db = magnitude_db(mag)
    freqs = frequency_axis(len(spec), sample_rate)
    n_bins = len(freqs)
    return {'frequencies': freqs.tolist(), 'magnitudes_db': db[:n_bins].tolist()}

def compute_spectrogram_for_display(signal, sample_rate, n_fft=2048, hop_size=512, max_time_bins=200, max_freq_bins=256) -> dict:
    from .stft import compute_spectrogram
    sg = compute_spectrogram(signal, n_fft, hop_size, sample_rate, 'hann')
    times = sg['times']
    freqs = sg['frequencies']
    mag_db = sg['magnitude_db']
    
    # Downsample time
    if len(times) > max_time_bins:
        idx = np.linspace(0, len(times)-1, max_time_bins, dtype=int)
        times = times[idx]
        mag_db = mag_db[idx, :]
        
    # Downsample freq
    if len(freqs) > max_freq_bins:
        idx = np.linspace(0, len(freqs)-1, max_freq_bins, dtype=int)
        freqs = freqs[idx]
        mag_db = mag_db[:, idx]
        
    return {
        'times': times.tolist(),
        'frequencies': freqs.tolist(),
        'magnitude_db': mag_db.tolist()
    }
""")

print("DSP files generated")
