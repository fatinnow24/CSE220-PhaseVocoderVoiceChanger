import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAudioStore } from '../store/useAudioStore';
import AudioPlayer from '../components/audio/AudioPlayer';
import { StudioWaveform, StudioLiveSignal, StudioLiveSpectrum } from '../components/studio/StudioVisualizers';
import StudioProcessingPanel from '../components/studio/StudioProcessingPanel';
import StudioEffectsChain from '../components/studio/StudioEffectsChain';
import { StudioAnalysisMetrics, StudioSpectrogramCard } from '../components/studio/StudioAnalysisCards';
import UploadZone from '../components/audio/UploadZone';
import Button from '../components/ui/Button';
import {
  uploadAudio,
  getWaveform,
  getSpectrogram,
  analyzeFile,
  getStreamUrl,
  getExportUrl,
} from '../api/client';

export default function Studio() {
  const navigate = useNavigate();
  const {
    selectedFile,
    setSelectedFile,
    addFile,
    waveformData,
    setWaveformData,
    analysis,
    setAnalysis,
    spectrogramData,
    setSpectrogramData,
  } = useAudioStore();

  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  useEffect(() => {
    if (selectedFile) {
      if (!waveformData) {
        getWaveform(selectedFile.id, 1200)
          .then((res) => setWaveformData(res.data.data))
          .catch(() => {});
      }
      if (!spectrogramData) {
        getSpectrogram(selectedFile.id)
          .then((res) => setSpectrogramData(res.data.data))
          .catch(() => {});
      }
      if (!analysis) {
        analyzeFile(selectedFile.id)
          .then((res) => setAnalysis(res.data.data))
          .catch(() => {});
      }
    }
  }, [selectedFile?.id]);

  const handleFileSelect = async (file: File) => {
    setIsUploading(true);
    setUploadError(null);
    try {
      const res = await uploadAudio(file);
      const { data } = res.data;
      const af = data;
      addFile(af);
      setSelectedFile(af);

      if (data.analysis) {
        setAnalysis(data.analysis);
      }

      try {
        const wRes = await getWaveform(af.id, 1200);
        setWaveformData(wRes.data.data);
      } catch {}

      try {
        const sRes = await getSpectrogram(af.id);
        setSpectrogramData(sRes.data.data);
      } catch {}
    } catch (e: any) {
      const msg = e?.response?.data?.error || e?.message || 'Upload failed';
      setUploadError(msg);
    } finally {
      setIsUploading(false);
    }
  };

  if (!selectedFile) {
    return (
      <div className="max-w-2xl mx-auto mt-8 animate-in fade-in duration-300 space-y-4">
        <div className="text-center space-y-1 mb-6">
          <h1 className="text-[26px] font-semibold text-ink-primary">Audio Input</h1>
          <p className="text-[13px] text-ink-secondary">Upload or record audio to adjust pitch, time-scale, and inspect spectral domains.</p>
        </div>
        <UploadZone
          onFileSelect={handleFileSelect}
          isUploading={isUploading}
        />
        {uploadError && (
          <p className="text-center text-error text-[12px]">{uploadError}</p>
        )}
      </div>
    );
  }

  const streamUrl = getStreamUrl(selectedFile.id);

  return (
    <div className="space-y-4 max-w-6xl mx-auto animate-in fade-in duration-300">
      {/* Top action header */}
      <div className="flex items-center justify-between">
        <h1 className="text-[20px] font-semibold text-ink-primary">Studio Workspace</h1>
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            icon="compare_arrows"
            onClick={() => navigate('/compare')}
            title="Compare Phase Vocoder vs Naive Resampling"
          >
            Compare
          </Button>
          <a
            href={getExportUrl(selectedFile.id)}
            download={selectedFile.original_filename}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-ios-lg text-[13px] font-medium border border-[rgba(38,33,28,0.18)] text-[#26211c] hover:bg-[rgba(38,33,28,0.04)] active:scale-[0.98] transition-all"
            title="Download active processed WAV file"
          >
            <span className="material-symbols-outlined text-[16px]">download</span>
            <span>Download WAV</span>
          </a>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setSelectedFile(null);
              setWaveformData(null);
              setAnalysis(null);
              setSpectrogramData(null);
            }}
          >
            Close Audio
          </Button>
        </div>
      </div>

      {/* Main player */}
      <AudioPlayer url={streamUrl} title={selectedFile.original_filename} />

      {/* Row 1: Direct Bento Visualizers in Checklist Soft Color Variants */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StudioWaveform />
        <StudioLiveSignal />
        <StudioLiveSpectrum />
      </div>

      {/* Row 2: 2-Column Processing and Deep Analysis Bento Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        <div className="lg:col-span-7 space-y-4">
          <StudioProcessingPanel />
          <StudioEffectsChain />
        </div>

        <div className="lg:col-span-5 space-y-4">
          <StudioAnalysisMetrics />
          <StudioSpectrogramCard />
        </div>
      </div>
    </div>
  );
}
