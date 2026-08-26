import { useEffect, RefObject } from 'react';
import { WaveformData } from '../types';

interface UseWaveformCanvasProps {
  canvasRef: RefObject<HTMLCanvasElement>;
  waveformData: WaveformData | null;
  currentTime: number;
  duration: number;
  selection: { start: number; end: number } | null;
  color?: string;
}

export const useWaveformCanvas = ({
  canvasRef,
  waveformData,
  currentTime,
  duration,
  selection,
  color = '#49645d'
}: UseWaveformCanvasProps) => {
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    
    // Setup for high DPI displays
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const width = rect.width;
    const height = rect.height;
    
    ctx.clearRect(0, 0, width, height);

    if (!waveformData || !waveformData.peaks || waveformData.peaks.length === 0 || duration === 0) {
      return;
    }

    const peaks = waveformData.peaks;
    const peakCount = peaks.length;
    
    // Draw waveform
    ctx.beginPath();
    ctx.moveTo(0, height / 2);
    
    const step = width / peakCount;
    
    // Draw top half
    for (let i = 0; i < peakCount; i++) {
      const x = i * step;
      const y = (1 - peaks[i].max) * (height / 2);
      ctx.lineTo(x, y);
    }
    
    // Draw bottom half
    for (let i = peakCount - 1; i >= 0; i--) {
      const x = i * step;
      const y = (1 - peaks[i].min) * (height / 2);
      ctx.lineTo(x, y);
    }
    
    ctx.lineTo(0, height / 2);
    ctx.closePath();

    ctx.fillStyle = `${color}99`; // 60% opacity
    ctx.fill();
    ctx.strokeStyle = color;
    ctx.lineWidth = 1;
    ctx.stroke();

    // Draw selection
    if (selection) {
      const startX = (selection.start / duration) * width;
      const endX = (selection.end / duration) * width;
      ctx.fillStyle = '#bae6fd66'; // 40% opacity
      ctx.fillRect(startX, 0, endX - startX, height);
      
      // Selection borders
      ctx.strokeStyle = '#396477';
      ctx.beginPath();
      ctx.moveTo(startX, 0); ctx.lineTo(startX, height);
      ctx.moveTo(endX, 0); ctx.lineTo(endX, height);
      ctx.stroke();
    }

    // Draw play cursor
    const cursorX = (currentTime / duration) * width;
    ctx.beginPath();
    ctx.moveTo(cursorX, 0);
    ctx.lineTo(cursorX, height);
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.stroke();

  }, [canvasRef, waveformData, currentTime, duration, selection, color]);
};
