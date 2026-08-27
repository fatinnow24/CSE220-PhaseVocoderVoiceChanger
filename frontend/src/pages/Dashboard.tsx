import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import UploadZone from '../components/audio/UploadZone';
import Card from '../components/ui/Card';
import AudioFileCard from '../components/audio/AudioFileCard';
import { useAudioStore } from '../store/useAudioStore';
import { uploadAudio, getWaveform, getSpectrogram, listFiles, deleteFile } from '../api/client';
import Button from '../components/ui/Button';

export default function Dashboard() {
  const navigate = useNavigate();
  const { files, addFile, setSelectedFile, setWaveformData, setAnalysis, setSpectrogramData, clearFiles } = useAudioStore();
  const [isUploading, setIsUploading] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const handleClearSessions = async () => {
    if (!window.confirm("Are you sure you want to delete all recent sessions? This cannot be undone.")) {
      return;
    }
    
    setIsClearing(true);
    try {
      // Use allSettled so if one file fails to delete, we still clear the rest
      await Promise.allSettled(files.map(f => deleteFile(f.id)));
      // Clear local store to update UI instantly without refresh
      clearFiles();
    } catch (e) {
      console.error("Failed to clear sessions", e);
    } finally {
      setIsClearing(false);
    }
  };

  // Load existing files from backend on mount
  useEffect(() => {
    listFiles().then(res => {
      const backendFiles = res.data.data || [];
      backendFiles.forEach((f: any) => addFile(f));
    }).catch(() => {/* backend offline — ignore */});
  }, []);

  const handleFileSelect = async (file: File) => {
    setIsUploading(true);
    setUploadError(null);
    try {
      const res = await uploadAudio(file);
      const af = res.data.data;
      addFile(af);
      setSelectedFile(af);
      if (res.data.data.analysis) setAnalysis(res.data.data.analysis);

      // Pre-load waveform & spectrogram in background
      getWaveform(af.id, 1200).then(r => setWaveformData(r.data.data)).catch(() => {});
      getSpectrogram(af.id).then(r => setSpectrogramData(r.data.data)).catch(() => {});

      navigate('/studio');
    } catch (e: any) {
      setUploadError(e?.response?.data?.error || e?.message || 'Upload failed');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <header className="mb-8">
        <h1 className="text-display font-bold text-on-surface mb-2">Welcome to PhasePlay</h1>
        <p className="text-headline-lg font-medium text-on-surface-variant">An Interactive Phase Vocoder Voice Changer</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        <div className="md:col-span-8">
          <UploadZone onFileSelect={handleFileSelect} isUploading={isUploading} />
          {uploadError && (
            <p className="text-center text-error mt-3 text-body-sm">{uploadError}</p>
          )}
        </div>

        <div className="md:col-span-4">
          <Card className="h-full bg-secondary-fixed flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-title-md font-bold text-on-secondary-fixed">Engine Status</h3>
                <div className="flex items-center gap-2 bg-white/50 px-3 py-1 rounded-full">
                  <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                  <span className="text-label-caps font-bold">ONLINE</span>
                </div>
              </div>
              <div className="space-y-4">
                <div className="bg-white/50 p-3 rounded-xl flex justify-between items-center">
                  <span className="text-body-sm font-medium">Default N_FFT</span>
                  <span className="font-mono font-bold">2048</span>
                </div>
                <div className="bg-white/50 p-3 rounded-xl flex justify-between items-center">
                  <span className="text-body-sm font-medium">Hop Size</span>
                  <span className="font-mono font-bold">512</span>
                </div>
                <div className="bg-white/50 p-3 rounded-xl flex justify-between items-center">
                  <span className="text-body-sm font-medium">Algorithm</span>
                  <span className="font-mono font-bold">Phase Vocoder</span>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>

      <div>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-headline-lg font-bold text-on-surface">Recent Sessions</h3>
          {files.length > 0 && (
            <Button 
              variant="destructive" 
              size="sm" 
              icon="delete" 
              loading={isClearing} 
              onClick={handleClearSessions}
            >
              Clear Sessions
            </Button>
          )}
        </div>
        {files.length === 0 ? (
          <div className="text-center p-12 border-2 border-dashed border-surface-container-high rounded-3xl text-on-surface-variant">
            No recent sessions found. Upload an audio file to get started.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {files.map(f => (
              <AudioFileCard
                key={f.id}
                file={f}
                onClick={() => {
                  setSelectedFile(f);
                  getWaveform(f.id, 1200).then(r => setWaveformData(r.data.data)).catch(() => {});
                  getSpectrogram(f.id).then(r => setSpectrogramData(r.data.data)).catch(() => {});
                  navigate('/studio');
                }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

