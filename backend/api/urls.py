from django.urls import path
from . import views

urlpatterns = [
    path('files/upload/', views.upload_audio, name='upload_audio'),
    path('files/', views.list_files, name='list_files'),
    path('files/<uuid:file_id>/', views.get_file, name='get_file'),
    path('files/<uuid:file_id>/delete/', views.delete_file, name='delete_file'),
    path('files/<uuid:file_id>/rename/', views.rename_file, name='rename_file'),
    path('files/<uuid:file_id>/waveform/', views.get_waveform, name='get_waveform'),
    path('files/<uuid:file_id>/fft/', views.get_fft, name='get_fft'),
    path('files/<uuid:file_id>/spectrogram/', views.get_spectrogram, name='get_spectrogram'),
    path('files/<uuid:file_id>/analyze/', views.analyze_file, name='analyze_file'),

    path('stream/<uuid:file_id>/', views.stream_file, name='stream_file'),

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
