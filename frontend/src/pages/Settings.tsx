import Card from '../components/ui/Card';
import { useAudioStore } from '../store/useAudioStore';

export default function Settings() {
  const { theme, setTheme } = useAudioStore();
  
  return (
    <div className="max-w-3xl mx-auto space-y-4 animate-in fade-in duration-300">
      <header className="space-y-1">
        <h1 className="text-[26px] font-semibold text-ink-primary">Settings</h1>
        <p className="text-[13px] text-ink-secondary">Configure defaults for audio synthesis and analysis.</p>
      </header>

      <Card className="!p-5 space-y-3">
        <h3 className="text-[14px] font-semibold text-ink-primary">System Parameters</h3>
        
        <div className="space-y-2">
          <div className="p-3 bg-surface-raised rounded-ios-lg flex justify-between items-center text-[13px]">
            <div>
              <h4 className="font-semibold text-ink-primary">Processing Pipeline Sample Rate</h4>
              <p className="text-[11px] text-ink-secondary">Internal DSP rate for phase calculation</p>
            </div>
            <div className=" text-[12px] text-ink-primary bg-lavender/70 px-2.5 py-1 rounded-pill font-semibold">
              44,100 Hz
            </div>
          </div>

          <div className="p-3 bg-surface-raised rounded-ios-lg flex justify-between items-center text-[13px]">
            <div>
              <h4 className="font-semibold text-ink-primary">Default Analysis Window</h4>
              <p className="text-[11px] text-ink-secondary">Hann windowing with 75% overlap</p>
            </div>
            <div className=" text-[12px] text-ink-primary bg-lavender/70 px-2.5 py-1 rounded-pill font-semibold">
              2048 / 512
            </div>
          </div>
        </div>
      </Card>

      <Card className="!p-5 space-y-3 mt-4">
        <h3 className="text-[14px] font-semibold text-ink-primary">Appearance</h3>
        
        <div className="space-y-2">
          <div className="p-3 bg-surface-raised rounded-ios-lg flex justify-between items-center text-[13px]">
            <div>
              <h4 className="font-semibold text-ink-primary">Dark Mode</h4>
              <p className="text-[11px] text-ink-secondary">Switch between light and dark themes</p>
            </div>
            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none ${theme === 'dark' ? 'bg-success' : 'bg-ink-tertiary'}`}
            >
              <span
                className={`inline-block h-3.5 w-3.5 transform rounded-full bg-surface transition-transform ${theme === 'dark' ? 'translate-x-4.5' : 'translate-x-1'}`}
                style={{ transform: theme === 'dark' ? 'translateX(18px)' : 'translateX(4px)' }}
              />
            </button>
          </div>
        </div>
      </Card>
    </div>
  );
}
