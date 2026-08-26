/**
 * AnimatedSignalGraph — reads the shared singleton AnalyserNode from useAudioEngine.
 * Does NOT create its own AudioContext. Reads time-domain data via getByteTimeDomainData
 * and animates with requestAnimationFrame, synchronized with actual playback.
 */
import { useRef, useEffect } from 'react';
import { useAnalyserNode } from '../../hooks/useAudioEngine';
import { useAudioStore } from '../../store/useAudioStore';

export default function AnimatedSignalGraph() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { isPlaying } = useAudioStore();
  const analyserNode = useAnalyserNode();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    let animationId: number;
    let lastResize = 0;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = Math.round(rect.width * dpr);
      canvas.height = Math.round(rect.height * dpr);
      lastResize = Date.now();
    };
    resize();
    const resizeObs = new ResizeObserver(resize);
    resizeObs.observe(canvas);

    const draw = () => {
      animationId = requestAnimationFrame(draw);
      // Don't draw until a fresh resize has settled
      if (Date.now() - lastResize < 16) return;

      const W = canvas.width;
      const H = canvas.height;
      const w = W / dpr;
      const h = H / dpr;

      ctx.save();
      ctx.scale(dpr, dpr);

      // Background — match surface-container-lowest
      ctx.fillStyle = '#f5f5ff';
      ctx.fillRect(0, 0, w, h);

      // Center baseline
      ctx.beginPath();
      ctx.strokeStyle = 'rgba(73,100,93,0.15)';
      ctx.lineWidth = 1;
      ctx.moveTo(0, h / 2);
      ctx.lineTo(w, h / 2);
      ctx.stroke();

      if (analyserNode && isPlaying) {
        analyserNode.fftSize = 2048;
        const bufLen = analyserNode.frequencyBinCount;
        const data = new Uint8Array(bufLen);
        analyserNode.getByteTimeDomainData(data);

        ctx.beginPath();
        ctx.lineWidth = 2;
        ctx.strokeStyle = '#49645d'; // primary color
        ctx.lineJoin = 'round';

        const sliceW = w / bufLen;
        for (let i = 0; i < bufLen; i++) {
          const v = data[i] / 128.0;
          const y = (v * h) / 2;
          if (i === 0) ctx.moveTo(0, y);
          else ctx.lineTo(i * sliceW, y);
        }
        ctx.stroke();
      } else {
        // Static idle line
        ctx.beginPath();
        ctx.strokeStyle = 'rgba(73,100,93,0.4)';
        ctx.lineWidth = 1.5;
        ctx.moveTo(0, h / 2);
        ctx.lineTo(w, h / 2);
        ctx.stroke();
      }

      ctx.restore();
    };

    draw();
    return () => {
      cancelAnimationFrame(animationId);
      resizeObs.disconnect();
    };
  }, [analyserNode, isPlaying]);

  return (
    <div className="w-full h-32 bg-surface-container-lowest rounded-3xl shadow-card overflow-hidden p-4">
      <h4 className="text-label-caps text-on-surface-variant mb-2">LIVE SIGNAL GRAPH</h4>
      <canvas ref={canvasRef} className="w-full h-[calc(100%-24px)]" />
    </div>
  );
}


