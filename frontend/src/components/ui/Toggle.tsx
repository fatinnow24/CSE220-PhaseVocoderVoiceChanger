interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
}

export default function Toggle({ checked, onChange, label }: ToggleProps) {
  return (
    <label className="flex items-center gap-3 cursor-pointer">
      <div className="relative">
        <input 
          type="checkbox" 
          className="sr-only" 
          checked={checked} 
          onChange={(e) => onChange(e.target.checked)} 
        />
        <div className={`w-14 h-8 rounded-full transition-colors ${checked ? 'bg-primary' : 'bg-surface-container-high'}`}></div>
        <div className={`absolute top-1 bg-white w-6 h-6 rounded-full transition-transform shadow-sm flex items-center justify-center ${checked ? 'left-7' : 'left-1'}`}>
          {checked && <span className="material-symbols-outlined text-[16px] text-primary">check</span>}
        </div>
      </div>
      {label && <span className="text-body-lg font-medium text-on-surface">{label}</span>}
    </label>
  );
}
