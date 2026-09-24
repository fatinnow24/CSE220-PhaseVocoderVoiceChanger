const fs = require('fs');
const path = require('path');

const files = [
  'src/components/visualization/AnimatedSignalGraph.tsx',
  'src/components/visualization/SpectrumAnalyzer.tsx',
  'src/components/compare/ComparisonSignalGraphs.tsx',
  'src/components/visualization/SpectrogramView.tsx',
  'src/components/processing/EffectsSignalGraphs.tsx'
];

files.forEach(f => {
  const fullPath = path.join(__dirname, f);
  if (!fs.existsSync(fullPath)) return;
  let c = fs.readFileSync(fullPath, 'utf8');

  // Inject `theme` into useAudioStore calls
  // Be careful if it's already there or if the hook call looks different.
  if (!c.includes('theme } = useAudioStore')) {
    c = c.replace(/(const \{[^}]+)\} = useAudioStore\(\);/g, "$1, theme } = useAudioStore();");
  }
  
  // Also add `theme` to useWaveformCanvas if needed. (Wait, useWaveformCanvas doesn't take theme, it takes color)
  c = c.replace(/color:\s*['"]#26211c['"]/g, "color: theme === 'dark' ? '#E5E7EB' : '#1f2328'");

  // Replace canvas fillStyle/strokeStyle explicit hex codes
  c = c.replace(/fillStyle\s*=\s*['"]#26211c['"]/g, "fillStyle = theme === 'dark' ? '#E5E7EB' : '#1f2328'");
  c = c.replace(/strokeStyle\s*=\s*['"]#26211c['"]/g, "strokeStyle = theme === 'dark' ? '#E5E7EB' : '#1f2328'");
  c = c.replace(/fillStyle\s*=\s*['"]#1f2328['"]/g, "fillStyle = theme === 'dark' ? '#E5E7EB' : '#1f2328'");
  c = c.replace(/strokeStyle\s*=\s*['"]#1f2328['"]/g, "strokeStyle = theme === 'dark' ? '#E5E7EB' : '#1f2328'");

  // Replace light grid lines
  c = c.replace(/strokeStyle\s*=\s*['"]rgba\(38,33,28,0\.15\)['"]/g, "strokeStyle = theme === 'dark' ? 'rgba(229,231,235,0.15)' : 'rgba(38,33,28,0.15)'");
  c = c.replace(/fillStyle\s*=\s*['"]rgba\(38,33,28,0\.15\)['"]/g, "fillStyle = theme === 'dark' ? 'rgba(229,231,235,0.15)' : 'rgba(38,33,28,0.15)'");

  c = c.replace(/strokeStyle\s*=\s*['"]rgba\(38,33,28,0\.2\)['"]/g, "strokeStyle = theme === 'dark' ? 'rgba(229,231,235,0.2)' : 'rgba(38,33,28,0.2)'");
  c = c.replace(/fillStyle\s*=\s*['"]rgba\(38,33,28,0\.2\)['"]/g, "fillStyle = theme === 'dark' ? 'rgba(229,231,235,0.2)' : 'rgba(38,33,28,0.2)'");
  
  c = c.replace(/fillStyle\s*=\s*['"]rgba\(38,33,28,0\.18\)['"]/g, "fillStyle = theme === 'dark' ? 'rgba(229,231,235,0.18)' : 'rgba(38,33,28,0.18)'");

  // Add theme to dependency arrays of useEffects that might now rely on theme
  // Just blanket replace `[isPlaying, analyserNode]` etc. where theme might be used.
  // Using regex for dependency array could be tricky, let's just do it directly.
  const regexes = [
    /\[waveformData,\s*isPlaying,\s*analyserNode,\s*duration,\s*currentTime\]/g,
    /\[isPlaying,\s*analyserNode\]/g,
    /\[fftData,\s*isPlaying,\s*analyserNode\]/g,
    /\[comparisonResult,\s*currentTime\]/g
  ];
  regexes.forEach(r => {
    c = c.replace(r, (match) => {
      if (!match.includes('theme')) return match.replace(/]$/, ', theme]');
      return match;
    });
  });

  fs.writeFileSync(fullPath, c, 'utf8');
  console.log(`Fixed canvas in ${f}`);
});
