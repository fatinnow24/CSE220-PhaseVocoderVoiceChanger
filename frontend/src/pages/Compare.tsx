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
        n_fft: 2048,
        ha: 512,
        window_type: 'hann'
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

      <Card className="mb-8 flex flex-col md:flex-row items-center gap-6">
        <div className="flex-1 w-full">
          <Slider 
            label="Target Pitch Shift" 
            min={-12} max={12} step={1} 
            value={semitones} 
            onChange={setSemitones}
            formatValue={(v) => `${v > 0 ? '+' : ''}${v} st`}
          />
        </div>
        <Button 
          variant="primary" 
          size="lg" 
          icon="compare" 
          loading={isComparing}
          onClick={handleCompare}
          className="shrink-0 w-full md:w-auto"
        >
          Run Comparison
        </Button>
      </Card>

      {comparisonResult && <ComparisonView result={comparisonResult} />}
    </div>
  );
}
