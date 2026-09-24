const fs = require('fs');
let c = fs.readFileSync('src/components/visualization/AnimatedSignalGraph.tsx', 'utf8');
c = c.replace(/const GRID_COLOR = 'rgba\\(38, 33, 28, 0\\.05\\)';/g, '');
c = c.replace(/const BASELINE_COLOR = 'rgba\\(38, 33, 28, 0\\.12\\)';/g, '');
c = c.replace(/const WAVE_STROKE = '#26211c';/g, '');

c = c.replace(/GRID_COLOR/g, "(theme === 'dark' ? 'rgba(229, 231, 235, 0.05)' : 'rgba(38, 33, 28, 0.05)')");
c = c.replace(/BASELINE_COLOR/g, "(theme === 'dark' ? 'rgba(229, 231, 235, 0.12)' : 'rgba(38, 33, 28, 0.12)')");
c = c.replace(/WAVE_STROKE/g, "(theme === 'dark' ? '#E5E7EB' : '#26211c')");

fs.writeFileSync('src/components/visualization/AnimatedSignalGraph.tsx', c);

c = fs.readFileSync('src/components/visualization/SpectrumAnalyzer.tsx', 'utf8');
c = c.replace(/const GRID_COLOR = 'rgba\\(38, 33, 28, 0\\.05\\)';/g, '');
c = c.replace(/const FILL_COLOR = '#26211c';/g, '');
c = c.replace(/GRID_COLOR/g, "(theme === 'dark' ? 'rgba(229, 231, 235, 0.05)' : 'rgba(38, 33, 28, 0.05)')");
c = c.replace(/FILL_COLOR/g, "(theme === 'dark' ? '#E5E7EB' : '#26211c')");
fs.writeFileSync('src/components/visualization/SpectrumAnalyzer.tsx', c);
