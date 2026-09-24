const fs = require('fs');

let c = fs.readFileSync('src/components/studio/StudioVisualizers.tsx', 'utf8');
c = c.replace(/const \{ waveformData, currentTime, duration \} = useAudioStore\(\);/g, "const { waveformData, currentTime, duration, theme } = useAudioStore();");
c = c.replace(/color: '#26211c',/g, "color: theme === 'dark' ? '#E5E7EB' : '#1f2328',");

c = c.replace(/const \{ isPlaying \} = useAudioStore\(\);/g, "const { isPlaying, theme } = useAudioStore();");
c = c.replace(/ctx\.strokeStyle = '#26211c';/g, "ctx.strokeStyle = theme === 'dark' ? '#E5E7EB' : '#1f2328';");
c = c.replace(/ctx\.strokeStyle = 'rgba\\(38,33,28,0.2\\)';/g, "ctx.strokeStyle = theme === 'dark' ? 'rgba(229,231,235,0.2)' : 'rgba(38,33,28,0.2)';");

c = c.replace(/const \{ isPlaying, fftData \} = useAudioStore\(\);/g, "const { isPlaying, fftData, theme } = useAudioStore();");
c = c.replace(/ctx\.fillStyle = '#26211c';/g, "ctx.fillStyle = theme === 'dark' ? '#E5E7EB' : '#1f2328';");
c = c.replace(/ctx\.fillStyle = 'rgba\\(38,33,28,0.15\\)';/g, "ctx.fillStyle = theme === 'dark' ? 'rgba(229,231,235,0.15)' : 'rgba(38,33,28,0.15)';");

c = c.replace(/\[isPlaying, analyserNode\]/g, "[isPlaying, analyserNode, theme]");
c = c.replace(/\[isPlaying, analyserNode, fftData\]/g, "[isPlaying, analyserNode, fftData, theme]");

fs.writeFileSync('src/components/studio/StudioVisualizers.tsx', c);
