/**
 * AudioPlayer — uses the singleton useAudioEngine (shared AudioContext + AnalyserNode)
 * so there is only ever ONE AudioContext in the app. This eliminates conflicts with
 * AnimatedSignalGraph and SpectrumAnalyzer which also read the same AnalyserNode.
 */
import { useRef, useEffect } from 'react';
import { useAudioEngine } from '../../hooks/useAudioEngine';
import { useAudioStore } from '../../store/useAudioStore';
import Button from '../ui/Button';

interface AudioPlayerProps {
  url: string | null;
  title?: string;
}

export default function AudioPlayer({ url, title }: AudioPlayerProps) {
  const { play, pause, stop, seek } = useAudioEngine(url);
  const {
    isPlaying, currentTime, duration,
    volume, playbackRate,
    setVolume, setPlaybackRate,
  } = useAudioStore();
  const progressRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef(false);

  const formatTime = (time: number) => {
    if (!isFinite(time) || isNaN(time)) return '0:00';
    const m = Math.floor(time / 60);
    const s = Math.floor(time % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const seekFromEvent = (clientX: number) => {
    if (!progressRef.current || duration === 0) return;
    const rect = progressRef.current.getBoundingClientRect();
    const pos = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    seek(pos * duration);
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    isDraggingRef.current = true;
    seekFromEvent(e.clientX);
  };

  useEffect(() => {
    const onMove = (e: MouseEvent) => { if (isDraggingRef.current) seekFromEvent(e.clientX); };
    const onUp = () => { isDraggingRef.current = false; };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
  });

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA') return;
      if (e.code === 'Space') { e.preventDefault(); isPlaying ? pause() : play(); }
      else if (e.code === 'ArrowLeft') seek(Math.max(0, currentTime - 5));
      else if (e.code === 'ArrowRight') seek(Math.min(duration, currentTime + 5));
      else if (e.key === 'm') setVolume(volume > 0 ? 0 : 1);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPlaying, currentTime, duration, volume, play, pause, seek, setVolume]);

  const progressPct = duration > 0 ? (currentTime / duration) * 100 : 0;
  const rates = [0.5, 0.75, 1, 1.25, 1.5, 2];

  return (
    <div className="bg-surface-container-lowest rounded-3xl p-4 shadow-card flex flex-col gap-4">
      <div className="flex items-center justify-between px-2">
        <div className="flex items-center gap-3">
          <span className="material-symbols-outlined text-primary">audio_file</span>
          <span className="font-bold text-title-md truncate max-w-[200px] md:max-w-md">{title || 'Unknown Audio'}</span>
        </div>
        <div className="text-body-sm font-medium font-mono bg-surface-container-low px-3 py-1 rounded-md select-none">
          {formatTime(currentTime)} / {formatTime(duration)}
        </div>
      </div>

      {/* Draggable seek bar */}
      <div
        ref={progressRef}
        className="h-10 bg-surface-container-low rounded-xl relative cursor-pointer flex items-center px-1 overflow-hidden group select-none"
        onMouseDown={handleMouseDown}
      >
        <div className="absolute inset-0 bg-surface-container-high opacity-0 group-hover:opacity-30 transition-opacity rounded-xl" />
        <div
          className="absolute h-full left-0 top-0 bg-primary/20 rounded-xl"
          style={{ width: `${progressPct}%` }}
        />
        <div
          className="absolute h-8 w-1.5 bg-primary rounded-full shadow-md z-10"
          style={{ left: `calc(${progressPct}% - 3px)` }}
        />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4 px-2">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" icon="replay_10" onClick={() => seek(Math.max(0, currentTime - 10))}> </Button>
          <Button
            variant="primary"
            size="lg"
            icon={isPlaying ? 'pause' : 'play_arrow'}
            onClick={isPlaying ? pause : play}
            className="w-14 h-14 !p-0 !rounded-full shadow-active"
          > </Button>
          <Button variant="ghost" size="sm" icon="forward_10" onClick={() => seek(Math.min(duration, currentTime + 10))}> </Button>
          <Button variant="ghost" size="sm" icon="stop" onClick={stop}> </Button>
        </div>

        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2 group">
            <span className="material-symbols-outlined text-on-surface-variant cursor-pointer" onClick={() => setVolume(volume > 0 ? 0 : 1)}>
              {volume === 0 ? 'volume_off' : volume < 0.5 ? 'volume_down' : 'volume_up'}
            </span>
            <input
              type="range"
              min="0" max="1" step="0.01"
              value={volume}
              onChange={(e) => setVolume(parseFloat(e.target.value))}
              className="w-24 opacity-70 group-hover:opacity-100 transition-opacity"
            />
          </div>

          <div className="flex items-center gap-1 bg-surface-container-low p-1 rounded-xl">
            <span className="material-symbols-outlined text-[18px] px-1 text-on-surface-variant">speed</span>
            <select
              className="bg-transparent text-body-sm font-medium outline-none cursor-pointer pr-1"
              value={playbackRate}
              onChange={(e) => setPlaybackRate(parseFloat(e.target.value))}
            >
              {rates.map(r => <option key={r} value={r}>{r}x</option>)}
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}
