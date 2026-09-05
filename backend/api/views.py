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
        phase_locking = bool(data.get('phase_locking', False))

        signal, sr = read_audio_file(af.file_path)
        res = pitch_shift(signal, sr, semitones, n_fft, ha, window_type, phase_locking=phase_locking)
        new_af = _save_new_audio(res, sr, f"pitch_{semitones:+.1f}st_{af.original_filename}", 'processed', parent=af, params=data)
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
        phase_locking = bool(data.get('phase_locking', False))

        from dsp.phase_vocoder import time_stretch as ts, time_stretch_with_phase_locking as tswpl
        stretch_fn = tswpl if phase_locking else ts

        signal, sr = read_audio_file(af.file_path)
        res = stretch_fn(signal, sr, stretch_factor, n_fft, ha, window_type)
        new_af = _save_new_audio(res, sr, f"stretch_{stretch_factor:.2f}x_{af.original_filename}", 'processed', parent=af, params=data)
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
        stretch_factor = float(data.get('stretch_factor', 1.0))
        n_fft = int(data.get('n_fft', 2048))
        ha = int(data.get('ha', 512))
        window_type = data.get('window_type', 'hann')

        signal, sr = read_audio_file(af.file_path)
        orig_duration = len(signal) / sr
        orig_dominant = 0.0
        try:
            from dsp.phase_vocoder import dominant_frequency
            orig_dominant = dominant_frequency(signal, sr)
        except Exception:
            pass

        # --- Phase Vocoder pipeline ---
        # Step 1: pitch shift (duration-preserving via phase vocoder)
        res_pv = pitch_shift(signal, sr, semitones, n_fft, ha, window_type)
        # Step 2: time stretch independently via phase vocoder
        if stretch_factor != 1.0:
            res_pv = time_stretch(res_pv, sr, stretch_factor, n_fft, ha, window_type)
        af_pv = _save_new_audio(
            res_pv, sr,
            f"pv_{semitones:+.1f}st_{stretch_factor:.2f}x_{af.original_filename}",
            'processed', parent=af,
            params={'algo': 'pv', 'semitones': semitones, 'stretch_factor': stretch_factor}
        )
        pv_dominant = 0.0
        try:
            pv_dominant = dominant_frequency(res_pv, sr)
        except Exception:
            pass

        # --- Naive Resampling pipeline ---
        # Naive pitch shift via resampling (entangles pitch and duration)
        pitch_factor = semitones_to_pitch_factor(semitones)
        res_naive = naive_resample(signal, sr, pitch_factor)
        # Naive time stretch: a second resample to hit the desired duration
        if stretch_factor != 1.0:
            res_naive = naive_resample(res_naive, sr, stretch_factor)
        af_naive = _save_new_audio(
            res_naive, sr,
            f"naive_{semitones:+.1f}st_{stretch_factor:.2f}x_{af.original_filename}",
            'processed', parent=af,
            params={'algo': 'naive', 'semitones': semitones, 'stretch_factor': stretch_factor}
        )
        naive_dominant = 0.0
        try:
            naive_dominant = dominant_frequency(res_naive, sr)
        except Exception:
            pass

        expected_freq = orig_dominant * (2.0 ** (semitones / 12.0)) if orig_dominant > 0 else 0.0

        metrics = {
            'semitones': semitones,
            'stretch_factor': stretch_factor,
            'pitch_factor': pitch_factor,
            'original': {
                'duration': orig_duration,
                'dominant_freq': orig_dominant,
            },
            'pv': {
                'duration': len(res_pv) / sr,
                'dominant_freq': pv_dominant,
                'expected_freq': expected_freq,
            },
            'naive': {
                'duration': len(res_naive) / sr,
                'dominant_freq': naive_dominant,
                'expected_freq': expected_freq,
            },
        }

        return _success({
            'pv_file': AudioFileSerializer(af_pv).data,
            'naive_file': AudioFileSerializer(af_naive).data,
            'metrics': metrics,
        })
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

@api_view(['POST'])
def process_cut(request):
    """Remove a region from [cut_start_sec, cut_end_sec] and concatenate the remaining segments."""
    try:
        data = request.data
        af = AudioFile.objects.get(id=data['file_id'])
        cut_start = float(data.get('cut_start_sec', 0.0))
        cut_end = float(data.get('cut_end_sec', af.duration_seconds))

        signal, sr = read_audio_file(af.file_path)
        start_idx = int(cut_start * sr)
        end_idx = int(cut_end * sr)

        before = signal[:start_idx]
        after = signal[end_idx:]
        res = np.concatenate([before, after]) if (len(before) > 0 or len(after) > 0) else signal

        new_af = _save_new_audio(res, sr, f"cut_{af.original_filename}", 'processed', parent=af, params=data)
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

@api_view(['GET'])
def stream_file(request, file_id):
    """Serve audio file inline for browser playback (no Content-Disposition: attachment)."""
    try:
        af = AudioFile.objects.get(id=file_id)
        if not os.path.exists(af.file_path):
            return _error('File not found on disk', 404)
        import mimetypes
        content_type, _ = mimetypes.guess_type(af.file_path)
        if not content_type:
            content_type = 'audio/wav'
        response = FileResponse(
            open(af.file_path, 'rb'),
            content_type=content_type,
        )
        response['Content-Disposition'] = f'inline; filename="{os.path.basename(af.file_path)}"'
        response['Accept-Ranges'] = 'bytes'
        return response
    except AudioFile.DoesNotExist:
        return _error('File not found', 404)
    except Exception as e:
        return _error(str(e))

@api_view(['PATCH'])
def rename_file(request, file_id):
    """Rename a file's display name."""
    try:
        af = AudioFile.objects.get(id=file_id)
        new_name = request.data.get('name', '').strip()
        if not new_name:
            return _error('Name is required')
        af.original_filename = new_name
        af.save()
        return _success(AudioFileSerializer(af).data)
    except AudioFile.DoesNotExist:
        return _error('File not found', 404)
    except Exception as e:
        return _error(str(e))

@api_view(['DELETE'])
def delete_all_files(request):
    """Delete all uploaded/processed audio files and their database records."""
    try:
        files = AudioFile.objects.all()
        for af in files:
            if os.path.exists(af.file_path):
                try:
                    os.remove(af.file_path)
                except Exception:
                    pass
        files.delete()
        return _success()
    except Exception as e:
        return _error(str(e))


