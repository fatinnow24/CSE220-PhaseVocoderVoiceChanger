import { useState } from 'react';
import { useAudioStore } from '../store/useAudioStore';
import AudioPlayer from '../components/audio/AudioPlayer';
import WaveformViewer from '../components/audio/WaveformViewer';
import AnimatedSignalGraph from '../components/visualization/AnimatedSignalGraph';
import ProcessingControls from '../components/processing/ProcessingControls';
import SpectrumAnalyzer from '../components/visualization/SpectrumAnalyzer';
import AudioAnalysisPanel from '../components/analysis/AudioAnalysisPanel';
import SpectrogramView from '../components/visualization/SpectrogramView';
import EffectChain from '../components/processing/EffectChain';
import UploadZone from '../components/audio/UploadZone';
import {
  uploadAudio,
  getWaveform,
  getSpectrogram,
  getStreamUrl,
} from '../api/client';

export default function Studio() {
  const {
    selectedFile,
    setSelectedFile,
    addFile,
    setWaveformData,
    setAnalysis,
    setSpectrogramData,
  } = useAudioStore();

  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const handleFileSelect = async (file: File) => {
    setIsUploading(true);
    setUploadError(null);
    try {
      const res = await uploadAudio(file);
      const { data } = res.data;
      // data contains AudioFile fields plus an analysis field from the backend
      const af = data;
      addFile(af);
      setSelectedFile(af);

      // Store initial analysis returned alongside the upload
      if (data.analysis) {
        setAnalysis(data.analysis);
      }

      // Load waveform data for the WaveformViewer
      try {
        const wRes = await getWaveform(af.id, 1200);
        setWaveformData(wRes.data.data);
      } catch { /* non-fatal */ }

      // Load spectrogram in background
      try {
        const sRes = await getSpectrogram(af.id);
        setSpectrogramData(sRes.data.data);
      } catch { /* non-fatal */ }
    } catch (e: any) {
      const msg = e?.response?.data?.error || e?.message || 'Upload failed';
      setUploadError(msg);
    } finally {
      setIsUploading(false);
    }
  };

  if (!selectedFile) {
    return (
      <div className="max-w-4xl mx-auto mt-12 animate-in fade-in duration-500">
        <h1 className="text-display font-bold text-on-surface mb-8 text-center">Studio Workspace</h1>
        <UploadZone
          onFileSelect={handleFileSelect}
          isUploading={isUploading}
        />
        {uploadError && (
          <p className="text-center text-error mt-4 text-body-sm">{uploadError}</p>
        )}
      </div>
    );
  }

  // Use the backend streaming endpoint for playback (not the raw disk path)
  const streamUrl = getStreamUrl(selectedFile.id);

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <h1 className="text-headline-lg font-bold text-on-surface">Studio</h1>
        <button
          onClick={() => {
            setSelectedFile(null);
            setWaveformData(null);
            setAnalysis(null);
            setSpectrogramData(null);
          }}
          className="text-body-sm font-medium text-error hover:underline"
        >
          Close File
        </button>
      </div>

      <AudioPlayer url={streamUrl} title={selectedFile.original_filename} />

      <WaveformViewer />

      <AnimatedSignalGraph />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-5">
          <ProcessingControls />
        </div>
        <div className="lg:col-span-4">
          <SpectrumAnalyzer />
        </div>
        <div className="lg:col-span-3">
          <AudioAnalysisPanel />
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <SpectrogramView />
        <EffectChain />
      </div>
    </div>
  );
}


