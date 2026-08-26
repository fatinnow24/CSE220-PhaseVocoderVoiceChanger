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
    # Normalize
    max_val = np.max(np.abs(signal))
    if max_val > 1.0:
        signal = signal / max_val
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
