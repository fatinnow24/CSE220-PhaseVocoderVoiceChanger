import { useState } from 'react';
import Card from '../ui/Card';
import Button from '../ui/Button';
import Slider from '../ui/Slider';
import Select from '../ui/Select';
import { useAudioStore } from '../../store/useAudioStore';
import { generateSignal, getWaveform, getSpectrogram } from '../../api/client';
import { useNavigate } from 'react-router-dom';

export default function SignalGenerator() {
  const [signalType, setSignalType] = useState('sine');
  const [frequency, setFrequency] = useState(440);
  const [amplitude, setAmplitude] = useState(0.8);
  const [duration, setDuration] = useState(2.0);
  const [sampleRate, setSampleRate] = useState('44100');
  
  const { isProcessing, setIsProcessing, setSelectedFile, addFile, setWaveformData, setSpectrogramData } = useAudioStore();
  const navigate = useNavigate();

  const handleGenerate = async () => {
    setIsProcessing(true);
    try {
      const res = await generateSignal({
        type: signalType,
        params: {
          frequency: frequency,
          amplitude: amplitude,
          duration: duration,
          sample_rate: parseInt(sampleRate)
        }
      });
      const af = res.data.data;
      addFile(af);
      setSelectedFile(af);
      
      // Load visualizations in background
      getWaveform(af.id, 1200).then(r => setWaveformData(r.data.data)).catch(() => {});
      getSpectrogram(af.id).then(r => setSpectrogramData(r.data.data)).catch(() => {});
      
      navigate('/studio');
    } catch (e) {
      console.error('Generation failed:', e);
      alert('Generation failed');
    } finally {
      setIsProcessing(false);
    }
  };

  const types = ['sine', 'square', 'sawtooth', 'triangle', 'chirp', 'white_noise', 'impulse'];

  return (
    <Card className="flex flex-col gap-6">
      <h3 className="text-title-md font-bold text-on-surface">Signal Generator</h3>
      
      <div className="flex flex-wrap gap-2">
        {types.map(t => (
          <button 
            key={t}
            onClick={() => setSignalType(t)}
            className={`px-4 py-2 rounded-full text-body-sm font-bold capitalize transition-colors ${
              signalType === t 
                ? 'bg-primary-container text-on-primary-container' 
                : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container-high'
            }`}
          >
            {t.replace('_', ' ')}
          </button>
        ))}
      </div>

      <div className="space-y-6">
        {(signalType !== 'white_noise' && signalType !== 'impulse') && (
          <Slider 
            label="Frequency" 
            min={20} max={2000} step={1} 
            value={frequency} 
            onChange={setFrequency}
            formatValue={(v) => `${v} Hz`}
          />
        )}
        
        <Slider 
          label="Amplitude" 
          min={0} max={1} step={0.01} 
          value={amplitude} 
          onChange={setAmplitude}
          formatValue={(v) => v.toFixed(2)}
        />
        
        <Slider 
          label="Duration" 
          min={0.1} max={10} step={0.1} 
          value={duration} 
          onChange={setDuration}
          formatValue={(v) => `${v.toFixed(1)} s`}
        />

        <Select 
          label="Sample Rate"
          value={sampleRate}
          onChange={(e) => setSampleRate(e.target.value)}
          options={[
            { value: '22050', label: '22050 Hz' },
            { value: '44100', label: '44100 Hz' },
            { value: '48000', label: '48000 Hz' },
          ]}
        />
      </div>

      <Button 
        variant="primary" 
        fullWidth 
        size="lg"
        icon="waves"
        loading={isProcessing}
        onClick={handleGenerate}
      >
        Generate Signal
      </Button>
    </Card>
  );
}
