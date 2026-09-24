import { ReactNode, useRef, useEffect, useState } from 'react';
import Latex from '../ui/Latex';

/** Plain flowing text column — full width, no card chrome. */
export function Prose({ children }: { children: ReactNode }) {
  return (
    <div className="w-full space-y-5 text-[15px] leading-[1.8] text-ink-primary/90">
      {children}
    </div>
  );
}

/** Centred display equation — typeset, not boxed. */
export function DisplayMath({ math }: { math: string }) {
  return (
    <div className="py-2 overflow-x-auto text-center">
      <Latex math={math} block className="text-[17px]" />
    </div>
  );
}

/** Tiny monospace pointer to the backend implementation. */
export function Footnote({
  file,
  fn,
  note,
}: {
  file: string;
  fn?: string;
  note: string;
}) {
  return (
    <p className="w-full pt-1 font-mono text-[12px] text-ink-tertiary">
      <span className="text-ink-secondary">{file}</span>
      {fn && <span> → {fn}()</span>}
      <span> — {note}</span>
    </p>
  );
}

/** Soft one-liner context — plain text, never a box. */
export function SoftNote({ children }: { children: ReactNode }) {
  return (
    <p className="w-full text-[14px] italic leading-relaxed text-ink-secondary">
      {children}
    </p>
  );
}

function useReveal<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [shown, setShown] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) setShown(true);
      },
      { threshold: 0.25 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return { ref, shown };
}

/**
 * ModuleHeader — large, airy chapter opener so crossing into a new
 * module is an obvious beat, not a quiet border.
 */
export function ModuleHeader({
  id,
  number,
  title,
  description,
}: {
  id: string;
  number: string;
  title: string;
  description: string;
}) {
  const { ref, shown } = useReveal<HTMLDivElement>();
  return (
    <div
      id={id}
      ref={ref}
      className={`scroll-mt-24 pt-14 pb-2 transition-all duration-700 ease-out ${
        shown ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
      }`}
    >
      <div className="w-full mb-5">
        <div className="flex items-center gap-4 mb-4">
          <span className="font-mono text-[12px] tracking-[0.2em] uppercase text-ink-tertiary">
            {number}
          </span>
          <span className="h-px flex-1 bg-hairline" />
        </div>
        <h2 className="text-[32px] md:text-[40px] font-semibold text-ink-primary tracking-tight leading-[1.15]">
          {title}
        </h2>
        <p className="mt-3 text-[15px] text-ink-secondary leading-relaxed w-full max-w-3xl">
          {description}
        </p>
      </div>
      <div className="w-full h-px bg-ink-primary/15" />
    </div>
  );
}

/**
 * ModuleClose — end-of-chapter beat so finishing a module feels done.
 */
export function ModuleClose({ label }: { label: string }) {
  const { ref, shown } = useReveal<HTMLDivElement>();
  return (
    <div
      ref={ref}
      className={`pt-16 pb-2 flex items-center gap-5 transition-all duration-700 ${
        shown ? 'opacity-100' : 'opacity-0'
      }`}
    >
      <span className="h-px flex-1 bg-hairline" />
      <span className="font-mono text-[11px] tracking-[0.22em] uppercase text-ink-tertiary whitespace-nowrap">
        {label} · complete
      </span>
      <span className="h-px flex-1 bg-hairline" />
    </div>
  );
}
