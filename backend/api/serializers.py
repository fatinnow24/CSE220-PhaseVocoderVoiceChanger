from rest_framework import serializers
from .models import AudioProject, AudioFile, EffectPreset

class AudioFileSerializer(serializers.ModelSerializer):
    stream_url = serializers.SerializerMethodField()

    class Meta:
        model = AudioFile
        fields = '__all__'

    def get_stream_url(self, obj):
        return f'/api/stream/{obj.id}/'

class AudioProjectSerializer(serializers.ModelSerializer):
    audio_files = AudioFileSerializer(many=True, read_only=True)
    class Meta:
        model = AudioProject
        fields = '__all__'

class EffectPresetSerializer(serializers.ModelSerializer):
    class Meta:
        model = EffectPreset
        fields = '__all__'
