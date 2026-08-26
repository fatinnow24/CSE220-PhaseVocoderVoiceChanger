import { useRef } from 'react';
import { useWaveformCanvas } from '../../hooks/useWaveformCanvas';
import { useAudioStore } from '../../store/useAudioStore';

export default function WaveformViewer() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { waveformData, currentTime, duration } = useAudioStore();

  useWaveformCanvas({
    canvasRef,
    waveformData,
    currentTime,
    duration,
    selection: null, // Basic implementation without selection for now
  });

  return (
    <div className="w-full h-48 bg-surface-container-lowest rounded-3xl shadow-card overflow-hidden p-4 relative">
      <canvas 
        ref={canvasRef} 
        className="canvas-viz w-full h-full"
      />
      {!waveformData && (
        <div className="absolute inset-0 flex items-center justify-center bg-surface-container-lowest/80 text-on-surface-variant">
          Loading waveform...
        </div>
      )}
    </div>
  );
}
