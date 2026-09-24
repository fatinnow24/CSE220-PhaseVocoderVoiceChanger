import { ReactNode } from 'react';
import Latex from '../ui/Latex';

interface EquationCardProps {
  label?: string;
  latex?: string;
  children?: ReactNode;
  description?: string;
  compact?: boolean;
}

/**
 * EquationCard — renders DSP equations using real KaTeX typesetting
 * or child fallback elements. Styled cleanly with soft minimalist tones.
 */
export default function EquationCard({
  label,
  latex,
  children,
  description,
  compact = false,
}: EquationCardProps) {
  return (
    <div
      className={`rounded-[18px] bg-surface border border-hairline transition-all ${
        compact ? 'p-3.5' : 'p-4 md:p-5'
      }`}
    >
      {label && (
        <div className="flex items-center justify-between mb-2">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-secondary">
            {label}
          </p>
        </div>
      )}

      <div className="overflow-x-auto py-1 text-ink-primary">
        {latex ? (
          <Latex math={latex} block={!compact} className={compact ? 'text-[14px]' : 'text-[16px]'} />
        ) : (
          <div className="font-mono text-[13px] md:text-[14px] text-ink-primary whitespace-nowrap">
            {children}
          </div>
        )}
      </div>

      {description && (
        <p className="text-[12px] text-ink-secondary mt-2.5 leading-relaxed border-t border-hairline/60 pt-2">
          {description}
        </p>
      )}
    </div>
  );
}

/** Inline math span with soft pill styling */
export function Eq({ math, children }: { math?: string; children?: ReactNode }) {
  if (math) {
    return (
      <span className="inline-flex items-center px-1.5 py-0.5 mx-0.5 rounded-ios-sm bg-[rgba(38,33,28,0.06)] text-ink-primary text-[12.5px]">
        <Latex math={math} />
      </span>
    );
  }
  return (
    <span className="font-mono text-[12px] text-ink-primary bg-[rgba(38,33,28,0.06)] px-1.5 py-0.5 mx-0.5 rounded-ios-sm">
      {children}
    </span>
  );
}
