import React from 'react';

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options: { value: string | number; label: string }[];
}

export default function Select({ label, options, className = '', ...props }: SelectProps) {
  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      {label && <label className="text-body-sm font-medium text-on-surface-variant">{label}</label>}
      <div className="relative">
        <select 
          className="w-full bg-surface-container-low text-on-surface text-body-lg rounded-xl px-4 py-3 appearance-none focus:outline-none focus:ring-2 focus:ring-primary-container transition-shadow"
          {...props}
        >
          {options.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
        <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none">
          <span className="material-symbols-outlined text-outline">expand_more</span>
        </div>
      </div>
    </div>
  );
}
