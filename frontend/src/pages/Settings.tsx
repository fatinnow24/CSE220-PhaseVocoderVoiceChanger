import { useAudioStore } from '../store/useAudioStore';
import Card from '../components/ui/Card';
import Toggle from '../components/ui/Toggle';

export default function Settings() {
  const { theme, setTheme } = useAudioStore();

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500">
      <header className="mb-4">
        <h1 className="text-display font-bold text-on-surface mb-2">Settings</h1>
        <p className="text-headline-lg font-medium text-on-surface-variant">Customize your DSP laboratory experience.</p>
      </header>

      <Card>
        <h3 className="text-title-md font-bold text-on-surface mb-6">Appearance</h3>
        
        <div className="flex items-center justify-between p-4 bg-surface-container-low rounded-2xl border border-surface-container-high">
          <div>
            <h4 className="font-bold text-body-lg text-on-surface mb-1">Dark Mode</h4>
            <p className="text-body-sm text-on-surface-variant">Toggle dark theme across the application for easier viewing in low-light environments.</p>
          </div>
          
          <Toggle 
            checked={theme === 'dark'} 
            onChange={(checked) => setTheme(checked ? 'dark' : 'light')} 
            label={theme === 'dark' ? 'Dark' : 'Light'} 
          />
        </div>
      </Card>
      
      <Card>
        <h3 className="text-title-md font-bold text-on-surface mb-6">Audio Processing Defaults</h3>
        
        <div className="space-y-4">
           <div className="p-4 bg-surface-container-low rounded-2xl border border-surface-container-high">
            <h4 className="font-bold text-body-lg text-on-surface mb-1">Global Sample Rate</h4>
            <p className="text-body-sm text-on-surface-variant mb-3">Target processing rate for the engine.</p>
            <div className="font-mono text-primary font-bold">44100 Hz</div>
          </div>
        </div>
      </Card>
    </div>
  );
}
