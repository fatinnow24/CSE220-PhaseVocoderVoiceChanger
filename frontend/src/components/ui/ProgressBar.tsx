interface ProgressBarProps {
  progress: number; // 0 to 100
  label?: string;
}

export default function ProgressBar({ progress, label }: ProgressBarProps) {
  return (
    <div className="w-full">
      {label && (
        <div className="flex justify-between items-center mb-2">
          <span className="text-body-sm font-medium text-on-surface-variant">{label}</span>
          <span className="text-label-caps font-bold text-primary">{Math.round(progress)}%</span>
        </div>
      )}
      <div className="w-full h-2 bg-surface-container-high rounded-full overflow-hidden">
        <div 
          className="h-full bg-primary transition-all duration-300 ease-out"
          style={{ width: `${Math.max(0, Math.min(100, progress))}%` }}
        ></div>
      </div>
    </div>
  );
}
