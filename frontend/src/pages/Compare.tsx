import { useState } from 'react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Slider from '../components/ui/Slider';
import ComparisonView from '../components/compare/ComparisonView';
import { useAudioStore } from '../store/useAudioStore';
import { processCompare } from '../api/client';
import { useNavigate } from 'react-router-dom';

export default function Compare() {
  const [semitones, setSemitones] = useState(5);
  const [stretchFactor, setStretchFactor] = useState(1.0);
  const [isComparing, setIsComparing] = useState(false);
  const { comparisonResult, setComparisonResult, selectedFile } = useAudioStore();
  const navigate = useNavigate();

  const handleCompare = async () => {
    if (!selectedFile) {
      alert("Please go to the Studio tab and select or upload a file first.");
      navigate('/studio');
      return;
    }

    setIsComparing(true);
    try {
      const res = await processCompare({
        file_id: selectedFile.id,
        semitones: semitones,
        stretch_factor: stretchFactor,
        n_fft: 2048,
        ha: 512,
        window_type: 'hann',
      });
      setComparisonResult(res.data.data);
    } catch (e) {
      console.error('Comparison failed:', e);
      alert('Comparison failed.');
    } finally {
      setIsComparing(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto animate-in fade-in duration-500">
      <header className="mb-8">
        <h1 className="text-display font-bold text-on-surface mb-2">Algorithm Comparison</h1>
        <p className="text-headline-lg font-medium text-on-surface-variant">Analyze Phase Vocoder vs Naive Resampling</p>
      </header>

      <Card className="mb-8 flex flex-col gap-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Slider
            label="Target Pitch Shift"
            min={-12} max={12} step={1}
            value={semitones}
            onChange={setSemitones}
            formatValue={(v) => `${v > 0 ? '+' : ''}${v} st`}
          />
          <Slider
            label="Target Time Stretch"
            min={0.25} max={2.0} step={0.05}
            value={stretchFactor}
            onChange={setStretchFactor}
            formatValue={(v) => `${v.toFixed(2)}x`}
          />
        </div>
        <Button
          variant="primary"
          size="lg"
          icon="compare"
          loading={isComparing}
          onClick={handleCompare}
          className="w-full md:w-auto self-end"
        >
          Run Comparison
        </Button>
      </Card>

      {comparisonResult && <ComparisonView result={comparisonResult} />}
    </div>
  );
}
