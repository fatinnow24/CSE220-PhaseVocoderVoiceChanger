import pytest
import os
from django.urls import reverse
from rest_framework.test import APIClient
from api.models import AudioFile
from django.conf import settings

@pytest.mark.django_db
def test_delete_all_files():
    # 1. Setup mock audio files in database
    client = APIClient()
    
    # Create temporary files
    os.makedirs(settings.MEDIA_ROOT, exist_ok=True)
    temp_file_1 = os.path.join(settings.MEDIA_ROOT, "test_file_1.wav")
    temp_file_2 = os.path.join(settings.MEDIA_ROOT, "test_file_2.wav")
    
    with open(temp_file_1, "wb") as f:
        f.write(b"mock data 1")
    with open(temp_file_2, "wb") as f:
        f.write(b"mock data 2")
        
    af1 = AudioFile.objects.create(
        original_filename="test_file_1.wav",
        file_path=temp_file_1,
        sample_rate=44100,
        num_samples=100,
        duration_seconds=1.0,
        file_size_bytes=11
    )
    
    af2 = AudioFile.objects.create(
        original_filename="test_file_2.wav",
        file_path=temp_file_2,
        sample_rate=44100,
        num_samples=100,
        duration_seconds=1.0,
        file_size_bytes=11
    )
    
    # Assert database has records and files exist on disk
    assert AudioFile.objects.count() == 2
    assert os.path.exists(temp_file_1)
    assert os.path.exists(temp_file_2)
    
    # 2. Call the delete all endpoint
    url = reverse('delete_all_files')
    response = client.delete(url)
    
    # 3. Assert response is success
    assert response.status_code == 200
    assert response.json()['success'] is True
    
    # 4. Assert files are deleted from database and disk
    assert AudioFile.objects.count() == 0
    assert not os.path.exists(temp_file_1)
    assert not os.path.exists(temp_file_2)
