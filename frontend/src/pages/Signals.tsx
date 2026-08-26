import SignalGenerator from '../components/generator/SignalGenerator';
import AnimatedSignalGraph from '../components/visualization/AnimatedSignalGraph';
import SpectrumAnalyzer from '../components/visualization/SpectrumAnalyzer';
import { useAudioStore } from '../store/useAudioStore';
import AudioPlayer from '../components/audio/AudioPlayer';
import { getStreamUrl } from '../api/client';

export default function Signals() {
  const { selectedFile } = useAudioStore();

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500">
      <header className="mb-4">
        <h1 className="text-display font-bold text-on-surface mb-2">Signal Laboratory</h1>
        <p className="text-headline-lg font-medium text-on-surface-variant">Generate primitive signals for analysis and testing.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-4">
          <SignalGenerator />
        </div>

        <div className="lg:col-span-8 space-y-6">
          {selectedFile && (
            <div className="mb-6">
              <AudioPlayer url={getStreamUrl(selectedFile.id)} title={selectedFile.original_filename} />
            </div>
          )}
          
          <AnimatedSignalGraph />
          <SpectrumAnalyzer />
        </div>
      </div>
    </div>
  );
}
