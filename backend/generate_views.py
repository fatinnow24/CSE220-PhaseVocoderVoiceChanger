import os
import textwrap

base_dir = r"c:\Users\workf\Downloads\stitch_phase_vocoder_voice_changer\backend"

def write_file(path, content):
    full_path = os.path.join(base_dir, path)
    os.makedirs(os.path.dirname(full_path), exist_ok=True)
    with open(full_path, "w", encoding="utf-8") as f:
        f.write(content.strip() + "\n")

# api/audio_utils.py
write_file("api/audio_utils.py", """
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
""")

# api/views.py
write_file("api/views.py", """
import os
import uuid
import numpy as np
from django.conf import settings
from django.http import FileResponse, JsonResponse
from rest_framework.decorators import api_view, parser_classes
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from django.views.decorators.csrf import csrf_exempt
from .models import AudioProject, AudioFile, EffectPreset
from .serializers import AudioFileSerializer, AudioProjectSerializer, EffectPresetSerializer
from .audio_utils import read_audio_file, write_wav, get_audio_info

from dsp.analysis import analyze_audio, compute_waveform_peaks, compute_fft_for_display, compute_spectrogram_for_display
from dsp.phase_vocoder import pitch_shift, time_stretch, time_stretch_with_phase_locking
from dsp.resampling import naive_resample, semitones_to_pitch_factor
from dsp.effects import apply_effect_chain, EFFECT_PRESETS
import dsp.effects as effects_module
from dsp.generator import generate_sine, generate_multi_sine, generate_chirp, generate_square, generate_triangle, generate_sawtooth, generate_white_noise, generate_pink_noise, generate_impulse, generate_composite

def _success(data=None):
    return JsonResponse({'success': True, 'data': data, 'error': None})

def _error(msg, status=400):
    return JsonResponse({'success': False, 'data': None, 'error': msg}, status=status)

def _save_new_audio(signal, sr, original_filename, file_type, parent=None, project=None, params=None):
    os.makedirs(settings.MEDIA_ROOT, exist_ok=True)
    file_id = uuid.uuid4()
    filename = f"{file_id}.wav"
    path = os.path.join(settings.MEDIA_ROOT, filename)
    write_wav(signal, sr, path)
    
    info = get_audio_info(path)
    af = AudioFile.objects.create(
        id=file_id,
        project=project,
        original_filename=original_filename,
        file_path=path,
        sample_rate=info['sample_rate'],
        num_samples=info['num_samples'],
        channels=1,
        duration_seconds=info['duration'],
        file_size_bytes=info['file_size_bytes'],
        file_type=file_type,
        parent=parent,
        processing_params=params or {}
    )
    return af

@csrf_exempt
@api_view(['POST'])
@parser_classes([MultiPartParser, FormParser])
def upload_audio(request):
    try:
        file_obj = request.FILES.get('file')
        if not file_obj:
            return _error('No file provided')
            
        os.makedirs(settings.MEDIA_ROOT, exist_ok=True)
        temp_path = os.path.join(settings.MEDIA_ROOT, f"temp_{uuid.uuid4()}_{file_obj.name}")
        with open(temp_path, 'wb+') as destination:
            for chunk in file_obj.chunks():
                destination.write(chunk)
                
        signal, sr = read_audio_file(temp_path)
        af = _save_new_audio(signal, sr, file_obj.name, 'original')
        os.remove(temp_path)
        
        analysis = analyze_audio(signal, sr)
        data = AudioFileSerializer(af).data
        data['analysis'] = analysis
        return _success(data)
    except Exception as e:
        return _error(str(e))

@api_view(['GET'])
def list_files(request):
    files = AudioFile.objects.all().order_by('-created_at')
    return _success(AudioFileSerializer(files, many=True).data)

@api_view(['GET'])
def get_file(request, file_id):
    try:
        af = AudioFile.objects.get(id=file_id)
        return _success(AudioFileSerializer(af).data)
    except AudioFile.DoesNotExist:
        return _error('File not found', 404)

@api_view(['DELETE'])
def delete_file(request, file_id):
    try:
        af = AudioFile.objects.get(id=file_id)
        if os.path.exists(af.file_path):
            os.remove(af.file_path)
        af.delete()
        return _success()
    except AudioFile.DoesNotExist:
        return _error('File not found', 404)

@api_view(['GET'])
def get_waveform(request, file_id):
    try:
        af = AudioFile.objects.get(id=file_id)
        points = int(request.GET.get('points', 1000))
        signal, _ = read_audio_file(af.file_path)
        peaks = compute_waveform_peaks(signal, points)
        return _success(peaks)
    except Exception as e:
        return _error(str(e))

@api_view(['GET'])
def get_fft(request, file_id):
    try:
        af = AudioFile.objects.get(id=file_id)
        signal, sr = read_audio_file(af.file_path)
        data = compute_fft_for_display(signal, sr)
        return _success(data)
    except Exception as e:
        return _error(str(e))

@api_view(['GET'])
def get_spectrogram(request, file_id):
    try:
        af = AudioFile.objects.get(id=file_id)
        signal, sr = read_audio_file(af.file_path)
        data = compute_spectrogram_for_display(signal, sr)
        return _success(data)
    except Exception as e:
        return _error(str(e))

@api_view(['GET'])
def analyze_file(request, file_id):
    try:
        af = AudioFile.objects.get(id=file_id)
        signal, sr = read_audio_file(af.file_path)
        data = analyze_audio(signal, sr)
        return _success(data)
    except Exception as e:
        return _error(str(e))

@api_view(['POST'])
def process_pitch_shift(request):
    try:
        data = request.data
        af = AudioFile.objects.get(id=data['file_id'])
        semitones = float(data.get('semitones', 0.0))
        n_fft = int(data.get('n_fft', 2048))
        ha = int(data.get('ha', 512))
        window_type = data.get('window_type', 'hann')
        
        signal, sr = read_audio_file(af.file_path)
        res = pitch_shift(signal, sr, semitones, n_fft, ha, window_type)
        new_af = _save_new_audio(res, sr, f"pitch_{semitones}_{af.original_filename}", 'processed', parent=af, params=data)
        metrics = analyze_audio(res, sr)
        return _success({'file': AudioFileSerializer(new_af).data, 'metrics': metrics})
    except Exception as e:
        return _error(str(e))

@api_view(['POST'])
def process_time_stretch(request):
    try:
        data = request.data
        af = AudioFile.objects.get(id=data['file_id'])
        stretch_factor = float(data.get('stretch_factor', 1.0))
        n_fft = int(data.get('n_fft', 2048))
        ha = int(data.get('ha', 512))
        window_type = data.get('window_type', 'hann')
        
        signal, sr = read_audio_file(af.file_path)
        res = time_stretch(signal, sr, stretch_factor, n_fft, ha, window_type)
        new_af = _save_new_audio(res, sr, f"stretch_{stretch_factor}_{af.original_filename}", 'processed', parent=af, params=data)
        metrics = analyze_audio(res, sr)
        return _success({'file': AudioFileSerializer(new_af).data, 'metrics': metrics})
    except Exception as e:
        return _error(str(e))

@api_view(['POST'])
def process_compare(request):
    try:
        data = request.data
        af = AudioFile.objects.get(id=data['file_id'])
        semitones = float(data.get('semitones', 0.0))
        
        signal, sr = read_audio_file(af.file_path)
        
        # PV
        res_pv = pitch_shift(signal, sr, semitones, 2048, 512, 'hann')
        af_pv = _save_new_audio(res_pv, sr, f"pv_{semitones}_{af.original_filename}", 'processed', parent=af, params={'algo': 'pv', 'semitones': semitones})
        
        # Naive
        factor = semitones_to_pitch_factor(semitones)
        res_naive = naive_resample(signal, sr, factor)
        af_naive = _save_new_audio(res_naive, sr, f"naive_{semitones}_{af.original_filename}", 'processed', parent=af, params={'algo': 'naive', 'semitones': semitones})
        
        cmp = {
            'duration': {'pv_value': len(res_pv)/sr, 'naive_value': len(res_naive)/sr},
            'algorithm': {'pv_value': 'Phase Vocoder', 'naive_value': 'Resampling'}
        }
        
        return _success({'pv_file': AudioFileSerializer(af_pv).data, 'naive_file': AudioFileSerializer(af_naive).data, 'comparison': cmp})
    except Exception as e:
        return _error(str(e))

@api_view(['POST'])
def process_effect_chain(request):
    try:
        data = request.data
        af = AudioFile.objects.get(id=data['file_id'])
        effects_data = data.get('effects', [])
        
        chain = []
        for e in effects_data:
            name = e['name'] + "Effect"
            params = {k: v for k, v in e.get('parameters', {}).items() if k != 'value'}
            if hasattr(effects_module, name):
                cls = getattr(effects_module, name)
                chain.append(cls(**{k: v.get('value', v) if isinstance(v, dict) else v for k, v in e.get('parameters', {}).items()}))
        
        signal, sr = read_audio_file(af.file_path)
        res = apply_effect_chain(signal, sr, chain)
        new_af = _save_new_audio(res, sr, f"effects_{af.original_filename}", 'processed', parent=af, params=data)
        return _success(AudioFileSerializer(new_af).data)
    except Exception as e:
        return _error(str(e))

@api_view(['POST'])
def process_trim(request):
    try:
        data = request.data
        af = AudioFile.objects.get(id=data['file_id'])
        start_sec = float(data.get('start_sec', 0.0))
        end_sec = float(data.get('end_sec', af.duration_seconds))
        
        signal, sr = read_audio_file(af.file_path)
        start_idx = int(start_sec * sr)
        end_idx = int(end_sec * sr)
        res = signal[start_idx:end_idx]
        
        new_af = _save_new_audio(res, sr, f"trim_{af.original_filename}", 'processed', parent=af, params=data)
        return _success(AudioFileSerializer(new_af).data)
    except Exception as e:
        return _error(str(e))

@api_view(['GET'])
def list_presets(request):
    data = []
    for k, f in EFFECT_PRESETS.items():
        chain = f()
        data.append({
            'id': k,
            'name': k,
            'effect_chain': [e.to_dict() for e in chain],
            'is_builtin': True
        })
    user_presets = EffectPreset.objects.all()
    data.extend(EffectPresetSerializer(user_presets, many=True).data)
    return _success(data)

@api_view(['POST'])
def create_preset(request):
    try:
        serializer = EffectPresetSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return _success(serializer.data)
        return _error(serializer.errors)
    except Exception as e:
        return _error(str(e))

@api_view(['DELETE'])
def delete_preset(request, preset_id):
    try:
        preset = EffectPreset.objects.get(id=preset_id)
        if preset.is_builtin:
            return _error('Cannot delete builtin preset')
        preset.delete()
        return _success()
    except EffectPreset.DoesNotExist:
        return _error('Not found', 404)

@api_view(['POST'])
def generate_signal(request):
    try:
        data = request.data
        sig_type = data.get('type', 'sine')
        params = data.get('params', {})
        sr = int(params.get('sample_rate', 44100))
        duration = float(params.get('duration', 1.0))
        
        if sig_type == 'sine':
            sig = generate_sine(params.get('frequency', 440), params.get('amplitude', 1.0), duration, sr)
        elif sig_type == 'multi_sine':
            sig = generate_multi_sine(params.get('frequencies', [440, 880]), params.get('amplitudes', [0.5, 0.5]), duration, sr)
        elif sig_type == 'chirp':
            sig = generate_chirp(params.get('f_start', 20), params.get('f_end', 20000), duration, sr)
        elif sig_type == 'square':
            sig = generate_square(params.get('frequency', 440), params.get('amplitude', 1.0), duration, sr)
        elif sig_type == 'triangle':
            sig = generate_triangle(params.get('frequency', 440), params.get('amplitude', 1.0), duration, sr)
        elif sig_type == 'sawtooth':
            sig = generate_sawtooth(params.get('frequency', 440), params.get('amplitude', 1.0), duration, sr)
        elif sig_type == 'white_noise':
            sig = generate_white_noise(params.get('amplitude', 1.0), duration, sr)
        elif sig_type == 'pink_noise':
            sig = generate_pink_noise(params.get('amplitude', 1.0), duration, sr)
        elif sig_type == 'impulse':
            sig = generate_impulse(duration, sr, params.get('position', 0.0))
        elif sig_type == 'composite':
            sig = generate_composite(params.get('components', []), duration, sr)
        else:
            return _error('Unknown type')
            
        af = _save_new_audio(sig, sr, f"gen_{sig_type}.wav", 'generated', params=data)
        return _success(AudioFileSerializer(af).data)
    except Exception as e:
        return _error(str(e))

@api_view(['GET'])
def export_file(request, file_id):
    try:
        af = AudioFile.objects.get(id=file_id)
        if not os.path.exists(af.file_path):
            return _error('File not found on disk', 404)
        response = FileResponse(open(af.file_path, 'rb'), as_attachment=True, filename=af.original_filename)
        return response
    except Exception as e:
        return _error(str(e))

@api_view(['GET'])
def list_projects(request):
    projects = AudioProject.objects.all().order_by('-created_at')
    return _success(AudioProjectSerializer(projects, many=True).data)

@api_view(['POST'])
def create_project(request):
    try:
        serializer = AudioProjectSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return _success(serializer.data)
        return _error(serializer.errors)
    except Exception as e:
        return _error(str(e))

@api_view(['GET'])
def get_project(request, project_id):
    try:
        proj = AudioProject.objects.get(id=project_id)
        return _success(AudioProjectSerializer(proj).data)
    except AudioProject.DoesNotExist:
        return _error('Project not found', 404)
""")
print("Django views generated")
