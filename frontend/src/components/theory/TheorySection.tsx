import { ReactNode, useRef, useEffect, useState } from 'react';

interface TheorySectionProps {
  id: string;
  index?: string;
  title: string;
  subtitle?: string;
  whyCard?: string;
  children: ReactNode;
  onVisible?: (id: string) => void;
  initiallyVisible?: boolean;
}

/**
 * TheorySection — section wrapper for the Theory page with calm checklist design
 * and reliable scroll spy observation.
 */
export default function TheorySection({
  id,
  index,
  title,
  subtitle,
  whyCard,
  initiallyVisible = false,
  children,
  onVisible,
}: TheorySectionProps) {
  const ref = useRef<HTMLElement>(null);
  const [visible, setVisible] = useState(initiallyVisible);

  useEffect(() => {
    if (!ref.current) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          onVisible?.(id);
        }
      },
      { rootMargin: '-10% 0px -40% 0px', threshold: 0 }
    );
    obs.observe(ref.current);
    return () => obs.disconnect();
  }, [id, onVisible]);

  return (
    <section
      id={id}
      ref={ref}
      className={`scroll-mt-20 pt-6 transition-all duration-500 ${
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
      }`}
    >
      {/* Section header */}
      <div className="mb-5">
        <div className="flex items-center gap-2 mb-1.5">
          {index && (
            <span className="text-[11px] font-semibold tracking-wider text-ink-tertiary uppercase">
              Part {index}
            </span>
          )}
        </div>
        <h2 className="text-[22px] md:text-[24px] font-semibold text-ink-primary tracking-tight leading-tight">
          {title}
        </h2>
        {subtitle && (
          <p className="text-[13.5px] text-ink-secondary mt-1 leading-relaxed w-full">
            {subtitle}
          </p>
        )}
      </div>

      {/* "Why is this here?" — plain italic line, not a card */}
      {whyCard && (
        <p className="w-full mb-5 text-[14px] italic leading-relaxed text-ink-secondary">
          {whyCard}
        </p>
      )}

      {/* Content */}
      <div className="space-y-4 w-full">{children}</div>
    </section>
  );
}
