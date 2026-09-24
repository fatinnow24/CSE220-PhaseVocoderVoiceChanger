import { useNavigate } from 'react-router-dom';
import { useAudioStore } from '../../store/useAudioStore';

export default function StudioEffectsChain() {
  const navigate = useNavigate();
  const { effectChain, removeFromEffectChain } = useAudioStore();

  return (
    <div className="bg-pastel-green rounded-[24px] p-6 flex flex-col gap-4 select-none shadow-none">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-[18px] font-semibold text-ink-primary tracking-tight">DSP Effect Chain</h3>
          <p className="text-[12px] text-ink-secondary">Sequential audio processing flow</p>
        </div>
        <span className="text-[12px] font-medium text-ink-secondary">
          Serial Chain
        </span>
      </div>

      {effectChain.length === 0 ? (
        <div className="py-3 px-2 text-ink-secondary text-[12px] flex items-center justify-between">
          <span>No active inline filters in the chain.</span>
          <button
            onClick={() => navigate('/effects')}
            className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[12px] font-medium border border-hairline text-ink-primary hover:bg-hairline active:scale-[0.98] transition-all cursor-pointer"
          >
            <span>Add Effects & Presets</span>
            <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
          </button>
        </div>
      ) : (
        <div className="flex flex-wrap items-center gap-2 pt-1">
          {effectChain.map((item, idx) => (
            <div
              key={idx}
              className="flex items-center gap-1.5 border border-hairline px-3 py-1.5 rounded-full transition-all bg-transparent"
            >
              <span className="text-[12.5px] font-medium text-ink-primary">
                <span className="text-ink-tertiary text-[11px] mr-1">{idx + 1}.</span>
                {item.effect.name}
              </span>
              <button
                onClick={() => removeFromEffectChain(idx)}
                className="text-ink-tertiary hover:text-ink-primary p-0.5 rounded-full hover:bg-hairline transition-colors cursor-pointer"
                title="Remove"
              >
                <span className="material-symbols-outlined text-[14px]">close</span>
              </button>
            </div>
          ))}

          <button
            onClick={() => navigate('/effects')}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-[11px] font-medium text-ink-secondary hover:text-ink-primary hover:bg-hairline border border-dashed border-[rgba(38,33,28,0.25)] transition-all cursor-pointer"
          >
            <span className="material-symbols-outlined text-[14px]">add</span>
            <span>Manage in Rack</span>
          </button>
        </div>
      )}
    </div>
  );
}
