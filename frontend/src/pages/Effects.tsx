import { useState, useEffect } from 'react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import EffectChain from '../components/processing/EffectChain';
import { useAudioStore } from '../store/useAudioStore';
import { listPresets, processEffectChain, getWaveform, getSpectrogram } from '../api/client';
import { useNavigate } from 'react-router-dom';

export default function Effects() {
  const { selectedFile, isProcessing, setIsProcessing, setSelectedFile, addProcessedFile, addFile, setWaveformData, setSpectrogramData } = useAudioStore();
  const [presets, setPresets] = useState<any[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    listPresets().then(res => {
      if (res.data && res.data.data) {
        setPresets(res.data.data);
      }
    }).catch(e => console.error("Failed to load presets", e));
  }, []);

  const applyPreset = async (preset: any) => {
    if (!selectedFile) {
      alert("Please go to the Studio tab and select a file first.");
      navigate('/studio');
      return;
    }

    setIsProcessing(true);
    try {
      const res = await processEffectChain({
        file_id: selectedFile.id,
        effects: preset.effect_chain
      });
      const newFile = res.data.data;
      addFile(newFile);
      addProcessedFile(newFile);
      setSelectedFile(newFile);
      
      // Update visualizers
      getWaveform(newFile.id, 1200).then(r => setWaveformData(r.data.data)).catch(() => {});
      getSpectrogram(newFile.id).then(r => setSpectrogramData(r.data.data)).catch(() => {});

      navigate('/studio');
    } catch (e) {
      console.error("Effect application failed:", e);
      alert("Failed to apply preset.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500">
      <header className="mb-4">
        <h1 className="text-display font-bold text-on-surface mb-2">Effect Studio</h1>
        <p className="text-headline-lg font-medium text-on-surface-variant">Build and apply custom DSP effect chains.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8">
          <EffectChain />
        </div>

        <div className="lg:col-span-4 space-y-6">
          <Card>
            <h3 className="text-title-md font-bold text-on-surface mb-4">Factory Presets</h3>
            <div className="space-y-3">
              {presets.length === 0 ? (
                <p className="text-body-sm text-on-surface-variant">Loading presets...</p>
              ) : (
                presets.map((preset, idx) => (
                  <div key={idx} className="p-4 bg-surface-container-lowest border border-surface-container-high rounded-2xl">
                    <h4 className="font-bold text-on-surface mb-1">{preset.name}</h4>
                    <p className="text-body-sm text-on-surface-variant mb-4">{preset.description}</p>
                    <Button 
                      variant="secondary" 
                      size="sm" 
                      fullWidth 
                      loading={isProcessing}
                      onClick={() => applyPreset(preset)}
                    >
                      Apply Preset
                    </Button>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
