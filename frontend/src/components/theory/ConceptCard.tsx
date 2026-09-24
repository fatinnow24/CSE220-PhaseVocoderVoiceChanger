import Latex from '../ui/Latex';

interface ConceptCardProps {
  concept: string;
  math?: string;
  latex?: string;
  mathDescription?: string;
  description: string;
  tags?: string[];
  variant?: 'default' | 'highlight' | 'muted';
}

/**
 * ConceptCard — displays a DSP concept with its mathematical definition
 * (supporting KaTeX LaTeX formatting) and clean calm checklist styling.
 */
export default function ConceptCard({
  concept,
  math,
  latex,
  mathDescription,
  description,
  tags,
  variant = 'default',
}: ConceptCardProps) {
  const bg = {
    default: 'bg-surface border border-hairline',
    highlight: 'bg-pastel-lavender border border-lavender-ink/20',
    muted: 'bg-surface-raised border border-hairline',
  }[variant];

  return (
    <div className={`rounded-[20px] p-5 transition-all ${bg}`}>
      <div className="flex items-start justify-between mb-2.5 gap-2">
        <h4 className="text-[15px] font-semibold text-ink-primary tracking-tight">{concept}</h4>
        {tags && (
          <div className="flex flex-wrap gap-1 justify-end flex-shrink-0">
            {tags.map((t) => (
              <span
                key={t}
                className="text-[10px] uppercase tracking-wider font-semibold bg-white/80 text-ink-secondary px-2 py-0.5 rounded-full border border-hairline whitespace-nowrap"
              >
                {t}
              </span>
            ))}
          </div>
        )}
      </div>

      {(latex || math) && (
        <div className="bg-white/80 border border-hairline/80 px-3 py-2 rounded-[12px] mb-3 overflow-x-auto whitespace-nowrap text-ink-primary">
          {latex ? (
            <Latex math={latex} />
          ) : (
            <span className="font-mono text-[12.5px]">{math}</span>
          )}
        </div>
      )}

      {mathDescription && (
        <p className="text-[11.5px] text-ink-secondary mb-2 italic">{mathDescription}</p>
      )}

      <p className="text-[13px] text-ink-secondary leading-relaxed">{description}</p>
    </div>
  );
}
