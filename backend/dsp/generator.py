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
