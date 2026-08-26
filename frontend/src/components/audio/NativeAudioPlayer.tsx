import { useRef, useEffect, useState } from 'react';
import Button from '../ui/Button';

interface NativeAudioPlayerProps {
  url: string | null;
  title?: string;
}

export default function NativeAudioPlayer({ url, title }: NativeAudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [playbackRate, setPlaybackRate] = useState(1);
  
  const progressRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef(false);

  const formatTime = (time: number) => {
    if (!isFinite(time) || isNaN(time)) return '0:00';
    const m = Math.floor(time / 60);
    const s = Math.floor(time % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const seek = (time: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setCurrentTime(time);
    }
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

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
  };

  const stop = () => {
    if (!audioRef.current) return;
    audioRef.current.pause();
    audioRef.current.currentTime = 0;
  };

  // Sync volume & playback rate to audio element
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.playbackRate = playbackRate;
    }
  }, [playbackRate]);

  const progressPct = duration > 0 ? (currentTime / duration) * 100 : 0;
  const rates = [0.5, 0.75, 1, 1.25, 1.5, 2];

  return (
    <div className="bg-surface-container-lowest rounded-3xl p-4 shadow-card flex flex-col gap-4">
      {url && (
        <audio
          ref={audioRef}
          src={url}
          onTimeUpdate={() => setCurrentTime(audioRef.current?.currentTime || 0)}
          onDurationChange={() => setDuration(audioRef.current?.duration || 0)}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          onEnded={() => {
            setIsPlaying(false);
            setCurrentTime(0);
          }}
        />
      )}
      
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
            onClick={togglePlay}
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
