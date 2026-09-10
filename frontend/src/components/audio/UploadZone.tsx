import { useState, useCallback, useRef } from 'react';
import Button from '../ui/Button';
import ProgressBar from '../ui/ProgressBar';

interface UploadZoneProps {
  onFileSelect: (file: File) => void;
  isUploading?: boolean;
  uploadProgress?: number;
}

export default function UploadZone({ onFileSelect, isUploading, uploadProgress }: UploadZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setIsDragging(true);
    } else if (e.type === 'dragleave') {
      setIsDragging(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onFileSelect(e.dataTransfer.files[0]);
    }
  }, [onFileSelect]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files.length > 0) {
      onFileSelect(e.target.files[0]);
    }
  };

  if (isUploading) {
    return (
      <div className="w-full min-h-[200px] rounded-ios-2xl bg-surface border border-hairline flex flex-col items-center justify-center p-8 text-center">
        <div className="w-12 h-12 rounded-pill bg-lavender flex items-center justify-center mb-3">
          <span className="material-symbols-outlined text-[24px] text-ink-primary animate-spin">sync</span>
        </div>
        <h3 className="text-[15px] font-semibold text-ink-primary mb-3">Analyzing and loading audio...</h3>
        <div className="w-full max-w-xs">
          <ProgressBar progress={uploadProgress || 0} />
        </div>
      </div>
    );
  }

  return (
    <div
      className={`w-full min-h-[200px] rounded-ios-2xl border border-hairline flex flex-col items-center justify-center p-8 text-center transition-all cursor-pointer ${
        isDragging 
          ? 'bg-pastel-lavender scale-[1.005] border-lavender-ink/20' 
          : 'bg-surface hover:bg-surface-raised'
      }`}
      onDragEnter={handleDrag}
      onDragLeave={handleDrag}
      onDragOver={handleDrag}
      onDrop={handleDrop}
      onClick={() => fileInputRef.current?.click()}
    >
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleChange}
        accept="audio/*"
        className="hidden"
      />
      <div className={`w-12 h-12 rounded-pill flex items-center justify-center mb-3 transition-colors ${
        isDragging ? 'bg-lavender text-ink-primary' : 'bg-surface-raised text-ink-secondary'
      }`}>
        <span className="material-symbols-outlined text-[22px]">upload_file</span>
      </div>
      <h3 className="text-[16px] font-semibold text-ink-primary mb-1">Drop audio file here</h3>
      <p className="text-[13px] text-ink-secondary mb-4">WAV, MP3, FLAC, M4A, AAC up to 50MB</p>
      <Button 
        variant="secondary" 
        size="sm"
        className="hover:bg-lavender hover:text-ink-primary transition-all"
        onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
      >
        Choose File
      </Button>
    </div>
  );
}
