import os

base_dir = r"c:\Users\workf\Downloads\stitch_phase_vocoder_voice_changer\backend"

def write_file(path, content):
    full_path = os.path.join(base_dir, path)
    os.makedirs(os.path.dirname(full_path), exist_ok=True)
    with open(full_path, "w", encoding="utf-8") as f:
        f.write(content.strip() + "\n")

# config/__init__.py
write_file("config/__init__.py", "")

# config/settings.py
write_file("config/settings.py", """
from pathlib import Path
BASE_DIR = Path(__file__).resolve().parent.parent
DEBUG = True
SECRET_KEY = 'dev-secret-key-change-in-production-phase-vocoder'
ALLOWED_HOSTS = ['*']
INSTALLED_APPS = ['django.contrib.contenttypes', 'django.contrib.auth', 'rest_framework', 'corsheaders', 'api']
MIDDLEWARE = ['corsheaders.middleware.CorsMiddleware', 'django.middleware.common.CommonMiddleware']
CORS_ALLOW_ALL_ORIGINS = True
MEDIA_ROOT = BASE_DIR / 'media'
MEDIA_URL = '/media/'
MAX_UPLOAD_SIZE = 50 * 1024 * 1024  # 50 MB
DEFAULT_DSP_N_FFT = 2048
DEFAULT_DSP_HOP_SIZE = 512
DATABASES = {'default': {'ENGINE': 'django.db.backends.sqlite3', 'NAME': BASE_DIR / 'db.sqlite3'}}
REST_FRAMEWORK = {'DEFAULT_RENDERER_CLASSES': ['rest_framework.renderers.JSONRenderer']}
ROOT_URLCONF = 'config.urls'
WSGI_APPLICATION = 'config.wsgi.application'
""")

# config/urls.py
write_file("config/urls.py", """
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('api/', include('api.urls')),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
""")

# config/wsgi.py
write_file("config/wsgi.py", """
import os
from django.core.wsgi import get_wsgi_application
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
application = get_wsgi_application()
""")

# manage.py
write_file("manage.py", """
#!/usr/bin/env python
import os
import sys

def main():
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
    try:
        from django.core.management import execute_from_command_line
    except ImportError as exc:
        raise ImportError(
            "Couldn't import Django. Are you sure it's installed and "
            "available on your PYTHONPATH environment variable? Did you "
            "forget to activate a virtual environment?"
        ) from exc
    execute_from_command_line(sys.argv)

if __name__ == '__main__':
    main()
""")

# api/__init__.py
write_file("api/__init__.py", "")

# api/apps.py
write_file("api/apps.py", """
from django.apps import AppConfig
class ApiConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'api'
""")

# api/models.py
write_file("api/models.py", """
from django.db import models
import uuid

class AudioProject(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=255, default='Untitled Project')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
class AudioFile(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    project = models.ForeignKey(AudioProject, on_delete=models.CASCADE, related_name='audio_files', null=True, blank=True)
    original_filename = models.CharField(max_length=500)
    file_path = models.CharField(max_length=1000)
    sample_rate = models.IntegerField(default=0)
    num_samples = models.IntegerField(default=0)
    channels = models.IntegerField(default=1)
    duration_seconds = models.FloatField(default=0.0)
    file_size_bytes = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    file_type = models.CharField(max_length=20, default='original')
    parent = models.ForeignKey('self', null=True, blank=True, on_delete=models.SET_NULL, related_name='children')
    processing_params = models.JSONField(default=dict, blank=True)

class EffectPreset(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    effect_chain = models.JSONField()
    is_builtin = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
""")

# api/serializers.py
write_file("api/serializers.py", """
from rest_framework import serializers
from .models import AudioProject, AudioFile, EffectPreset

class AudioFileSerializer(serializers.ModelSerializer):
    class Meta:
        model = AudioFile
        fields = '__all__'

class AudioProjectSerializer(serializers.ModelSerializer):
    audio_files = AudioFileSerializer(many=True, read_only=True)
    class Meta:
        model = AudioProject
        fields = '__all__'

class EffectPresetSerializer(serializers.ModelSerializer):
    class Meta:
        model = EffectPreset
        fields = '__all__'
""")

# api/urls.py
write_file("api/urls.py", """
from django.urls import path
from . import views

urlpatterns = [
    path('upload/', views.upload_audio, name='upload_audio'),
    path('files/', views.list_files, name='list_files'),
    path('files/<uuid:file_id>/', views.get_file, name='get_file'),
    path('files/<uuid:file_id>/delete/', views.delete_file, name='delete_file'),
    path('files/<uuid:file_id>/waveform/', views.get_waveform, name='get_waveform'),
    path('files/<uuid:file_id>/fft/', views.get_fft, name='get_fft'),
    path('files/<uuid:file_id>/spectrogram/', views.get_spectrogram, name='get_spectrogram'),
    path('files/<uuid:file_id>/analyze/', views.analyze_file, name='analyze_file'),
    
    path('process/pitch-shift/', views.process_pitch_shift, name='process_pitch_shift'),
    path('process/time-stretch/', views.process_time_stretch, name='process_time_stretch'),
    path('process/compare/', views.process_compare, name='process_compare'),
    path('process/effect-chain/', views.process_effect_chain, name='process_effect_chain'),
    path('process/trim/', views.process_trim, name='process_trim'),
    
    path('effects/presets/', views.list_presets, name='list_presets'),
    path('effects/presets/create/', views.create_preset, name='create_preset'),
    path('effects/presets/<uuid:preset_id>/delete/', views.delete_preset, name='delete_preset'),
    
    path('generate/', views.generate_signal, name='generate_signal'),
    path('export/<uuid:file_id>/', views.export_file, name='export_file'),
    
    path('projects/', views.list_projects, name='list_projects'),
    path('projects/create/', views.create_project, name='create_project'),
    path('projects/<uuid:project_id>/', views.get_project, name='get_project'),
]
""")
print("Django core files generated")
