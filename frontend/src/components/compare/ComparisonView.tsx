import { ComparisonResult } from '../../types';
import Card from '../ui/Card';
import NativeAudioPlayer from '../audio/NativeAudioPlayer';
import { getStreamUrl } from '../../api/client';

interface ComparisonViewProps {
  result: ComparisonResult;
}

export default function ComparisonView({ result }: ComparisonViewProps) {
  const { metrics, pv_file, naive_file } = result;

  const pitchApplied = metrics.semitones !== 0;
  const stretchApplied = metrics.stretch_factor !== 1.0;

  return (
    <div className="flex flex-col gap-6 mt-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card variant="colored" color="primary">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-title-md font-bold text-on-primary-container">Phase Vocoder Output</h3>
            <span className="bg-primary text-on-primary px-3 py-1 rounded-full text-label-caps">Advanced</span>
          </div>
          <NativeAudioPlayer url={getStreamUrl(pv_file.id)} title="Phase Vocoder Output" />
        </Card>

        <Card variant="colored" color="secondary">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-title-md font-bold text-on-secondary-fixed">Naive Resampling</h3>
            <span className="bg-secondary text-on-secondary px-3 py-1 rounded-full text-label-caps">Basic</span>
          </div>
          <NativeAudioPlayer url={getStreamUrl(naive_file.id)} title="Naive Output" />
        </Card>
      </div>

      <Card>
        <h3 className="text-title-md font-bold text-on-surface mb-6">Algorithm Comparison</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[600px]">
            <thead>
              <tr className="border-b-2 border-surface-container-high text-body-sm text-on-surface-variant">
                <th className="py-4 px-4 font-bold">Property</th>
                <th className="py-4 px-4 font-bold text-primary">Phase Vocoder</th>
                <th className="py-4 px-4 font-bold text-secondary">Naive Resampling</th>
              </tr>
            </thead>
            <tbody className="text-body-lg">
              {pitchApplied && (
                <tr className="border-b border-surface-container-high">
                  <td className="py-4 px-4 font-medium">Pitch Shifted</td>
                  <td className="py-4 px-4"><span className="text-green-600 font-bold">?</span> {metrics.semitones > 0 ? '+' : ''}{metrics.semitones} st</td>
                  <td className="py-4 px-4"><span className="text-green-600 font-bold">?</span> {metrics.semitones > 0 ? '+' : ''}{metrics.semitones} st</td>
                </tr>
              )}
              {stretchApplied && (
                <tr className="border-b border-surface-container-high">
                  <td className="py-4 px-4 font-medium">Time Stretched</td>
                  <td className="py-4 px-4"><span className="text-green-600 font-bold">?</span> {metrics.stretch_factor.toFixed(2)}x</td>
                  <td className="py-4 px-4"><span className="text-green-600 font-bold">?</span> {metrics.stretch_factor.toFixed(2)}x</td>
                </tr>
              )}
              <tr className="border-b border-surface-container-high">
                <td className="py-4 px-4 font-medium">
                  {stretchApplied ? 'Output Duration' : 'Duration Preserved'}
                </td>
                <td className="py-4 px-4">
                  {stretchApplied
                    ? <><span className="text-primary font-bold">{metrics.pv.duration.toFixed(2)}s</span> ({(metrics.pv.duration / metrics.original.duration).toFixed(2)}x)</>
                    : Math.abs(metrics.pv.duration - metrics.original.duration) < 0.1
                      ? <><span className="text-green-600 font-bold">?</span> Same ({metrics.pv.duration.toFixed(2)}s)</>
                      : <><span className="text-yellow-600 font-bold">?</span> Slightly Off ({metrics.pv.duration.toFixed(2)}s)</>}
                </td>
                <td className="py-4 px-4">
                  {stretchApplied
                    ? <><span className="text-secondary font-bold">{metrics.naive.duration.toFixed(2)}s</span> ({(metrics.naive.duration / metrics.original.duration).toFixed(2)}x)</>
                    : Math.abs(metrics.naive.duration - metrics.original.duration) < 0.1
                      ? <><span className="text-green-600 font-bold">?</span> Same ({metrics.naive.duration.toFixed(2)}s)</>
                      : <><span className="text-red-600 font-bold">?</span> Changed ({metrics.naive.duration.toFixed(2)}s)</>}
                </td>
              </tr>
              {pitchApplied && (
                <tr className="border-b border-surface-container-high">
                  <td className="py-4 px-4 font-medium">Pitch Accuracy</td>
                  <td className="py-4 px-4">
                    {metrics.pv.dominant_freq > 0
                      ? <><span className="text-green-600 font-bold">?</span> {metrics.pv.dominant_freq.toFixed(1)} Hz (target {metrics.pv.expected_freq.toFixed(1)} Hz)</>
                      : <span className="text-on-surface-variant">—</span>}
                  </td>
                  <td className="py-4 px-4">
                    {metrics.naive.dominant_freq > 0
                      ? <>{metrics.naive.dominant_freq.toFixed(1)} Hz (target {metrics.naive.expected_freq.toFixed(1)} Hz)</>
                      : <span className="text-on-surface-variant">—</span>}
                  </td>
                </tr>
              )}
              <tr className="border-b border-surface-container-high">
                <td className="py-4 px-4 font-medium">Algorithm</td>
                <td className="py-4 px-4 text-on-surface-variant">STFT + Phase Propagation</td>
                <td className="py-4 px-4 text-on-surface-variant">Sample Rate Conversion</td>
              </tr>
              <tr>
                <td className="py-4 px-4 font-medium">Phase Coherence</td>
                <td className="py-4 px-4 text-on-surface-variant">Maintained</td>
                <td className="py-4 px-4 text-on-surface-variant">Not controlled</td>
              </tr>
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
