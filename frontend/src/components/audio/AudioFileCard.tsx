import { AudioFile } from '../../types';
import Card from '../ui/Card';

interface AudioFileCardProps {
  file: AudioFile;
  onClick?: () => void;
  selected?: boolean;
}

export default function AudioFileCard({ file, onClick, selected }: AudioFileCardProps) {
  const formatDuration = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <Card 
      onClick={onClick}
      className={`relative overflow-hidden ${selected ? 'ring-2 ring-primary border-transparent' : ''}`}
      variant={selected ? 'low' : 'default'}
    >
      <div className="flex items-start gap-4">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
          file.file_type === 'original' ? 'bg-primary-container text-on-primary-container' : 'bg-secondary-container text-on-secondary-fixed'
        }`}>
          <span className="material-symbols-outlined">
            {file.file_type === 'original' ? 'audio_file' : 'auto_fix_high'}
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="text-body-lg font-bold text-on-surface truncate" title={file.original_filename}>
            {file.original_filename}
          </h4>
          <div className="flex items-center gap-2 mt-1 text-body-sm text-on-surface-variant flex-wrap">
            <span className="flex items-center gap-1"><span className="material-symbols-outlined text-[16px]">schedule</span> {formatDuration(file.duration_seconds)}</span>
            <span>•</span>
            <span>{(file.sample_rate / 1000).toFixed(1)} kHz</span>
            <span>•</span>
            <span className="uppercase">{file.file_type}</span>
          </div>
        </div>
      </div>
    </Card>
  );
}
