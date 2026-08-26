interface SliderProps {
  label?: string;
  min: number;
  max: number;
  step?: number;
  value: number;
  onChange: (val: number) => void;
  formatValue?: (val: number) => string;
}

export default function Slider({ label, min, max, step = 1, value, onChange, formatValue = (v) => v.toString() }: SliderProps) {
  return (
    <div className="flex flex-col gap-2 w-full">
      {label && (
        <div className="flex justify-between items-center">
          <label className="text-body-sm font-medium text-on-surface-variant">{label}</label>
          <span className="text-label-caps bg-surface-container px-2 py-1 rounded-md text-primary font-bold">
            {formatValue(value)}
          </span>
        </div>
      )}
      <div className="relative pt-1">
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(parseFloat(e.target.value))}
        />
      </div>
      <div className="flex justify-between text-xs text-outline-variant mt-1">
        <span>{formatValue(min)}</span>
        <span>{formatValue(max)}</span>
      </div>
    </div>
  );
}
