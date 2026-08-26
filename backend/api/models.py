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
