interface TheoryNavProps {
  activeSection: string;
  onNavigate: (id: string) => void;
}

const NAV_ITEMS = [
  { id: 'sub-foundations', label: 'Foundations' },
  { id: 'dft-fft', label: 'Spectral' },
  { id: 'stft', label: 'STFT' },
  { id: 'phase-vocoder', label: 'Phase Vocoder' },
  { id: 'time-stretching', label: 'Time & Pitch' },
  { id: 'wola', label: 'WOLA & LTI' },
  { id: 'pipeline', label: 'Pipeline' },
];

/**
 * TheoryNav — compact sticky horizontal navigation for the Theory page.
 * Highlights the currently visible section, scrolls on overflow.
 */
export default function TheoryNav({ activeSection, onNavigate }: TheoryNavProps) {
  return (
    <div className="sticky top-0 z-30 bg-surface-container-lowest/90 backdrop-blur-sm border-b border-surface-container-high shadow-card/30">
      <div className="w-full">
        <div className="flex items-center justify-center gap-1 overflow-x-auto py-2.5 scrollbar-hide">
          {NAV_ITEMS.map((item) => {
            const isActive = activeSection === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={`flex-shrink-0 text-label-caps px-3 py-1.5 rounded-full transition-all duration-200 whitespace-nowrap ${
                  isActive
                    ? 'bg-primary-container text-on-primary-container font-bold'
                    : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface'
                }`}
                aria-current={isActive ? 'page' : undefined}
              >
                {item.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export { NAV_ITEMS };
