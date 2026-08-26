import os
import numpy as np
import soundfile as sf
import pydub

def read_audio_file(file_path: str) -> tuple[np.ndarray, int]:
    try:
        data, samplerate = sf.read(file_path)
        if len(data.shape) > 1:
            data = np.mean(data, axis=1) # convert to mono
        return data.astype(np.float64), samplerate
    except Exception as e:
        audio = pydub.AudioSegment.from_file(file_path)
        audio = audio.set_channels(1)
        samples = np.array(audio.get_array_of_samples())
        if audio.sample_width == 2:
            samples = samples.astype(np.float64) / 32768.0
        elif audio.sample_width == 4:
            samples = samples.astype(np.float64) / 2147483648.0
        else:
            samples = samples.astype(np.float64)
        return samples, audio.frame_rate

def write_wav(signal: np.ndarray, sample_rate: int, path: str) -> None:
    # Normalize to a consistent RMS level (−9 dBFS ≈ 0.35 RMS).
    # Peak normalization is wrong here because phase-vocoder outputs can have a
    # high crest factor (peak >> RMS from WOLA boundary spikes), which causes
    # write_wav to silently divide the level by 10–30× relative to naive resampling.
    # RMS normalization makes all processed outputs sound at the same loudness.
    target_rms = 0.35
    rms = float(np.sqrt(np.mean(signal.astype(np.float64) ** 2)))
    if rms > 1e-8:
        signal = signal * (target_rms / rms)
    # Hard-clip any residual spikes so PCM_16 doesn't wrap/distort
    signal = np.clip(signal, -1.0, 1.0)
    sf.write(path, signal, sample_rate, subtype='PCM_16')

def get_audio_info(file_path: str) -> dict:
    try:
        info = sf.info(file_path)
        return {
            'sample_rate': info.samplerate,
            'num_samples': info.frames,
            'channels': info.channels,
            'duration': info.duration,
            'file_size_bytes': os.path.getsize(file_path)
        }
    except Exception:
        audio = pydub.AudioSegment.from_file(file_path)
        return {
            'sample_rate': audio.frame_rate,
            'num_samples': int(audio.frame_count()),
            'channels': audio.channels,
            'duration': audio.duration_seconds,
            'file_size_bytes': os.path.getsize(file_path)
        }
