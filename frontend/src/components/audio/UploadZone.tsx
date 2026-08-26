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
      <div className="w-full min-h-[256px] rounded-3xl bg-surface-container flex flex-col items-center justify-center p-8 text-center border border-surface-container-high">
        <span className="material-symbols-outlined text-4xl text-primary animate-pulse mb-4">cloud_upload</span>
        <h3 className="text-title-md font-bold mb-4">Uploading audio...</h3>
        <div className="w-full max-w-md">
          <ProgressBar progress={uploadProgress || 0} />
        </div>
      </div>
    );
  }

  return (
    <div
      className={`w-full min-h-[256px] rounded-3xl flex flex-col items-center justify-center p-8 text-center transition-all cursor-pointer ${
        isDragging 
          ? 'bg-primary-fixed/10 border-2 border-dashed border-primary' 
          : 'bg-surface-container-lowest border border-surface-container-high hover:bg-surface-container-low'
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
      <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 ${isDragging ? 'bg-primary text-on-primary scale-110 transition-transform' : 'bg-surface-container-high text-primary'}`}>
        <span className="material-symbols-outlined text-3xl">upload_file</span>
      </div>
      <h3 className="text-headline-lg font-bold text-on-surface mb-2">Drop your audio file here</h3>
      <p className="text-body-lg text-on-surface-variant mb-6">WAV, MP3, FLAC, M4A, AAC • max 50 MB</p>
      <Button 
        variant="primary" 
        onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
      >
        Browse Files
      </Button>
    </div>
  );
}
