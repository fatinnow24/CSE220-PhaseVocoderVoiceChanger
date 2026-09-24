import { useRef, useState, useCallback, useEffect } from 'react';

type RecorderState = 'idle' | 'requesting' | 'recording' | 'recorded' | 'error';

interface UseAudioRecorderReturn {
  state: RecorderState;
  elapsed: number;
  recordedBlob: Blob | null;
  recordedUrl: string | null;
  recordedMime: string;
  error: string | null;
  analyserRef: React.MutableRefObject<AnalyserNode | null>;
  startRecording: () => Promise<void>;
  stopRecording: () => void;
  reset: () => void;
}

/**
 * Encode raw Float32 mono audio samples directly into a 16-bit PCM WAV Blob.
 * This completely avoids WebM container errors, codec incompatibilities, and missing headers.
 */
function encodeWavBlob(samples: Float32Array, sampleRate: number): Blob {
  const numSamples = samples.length;
  const buffer = new ArrayBuffer(44 + numSamples * 2);
  const view = new DataView(buffer);

  const writeString = (offset: number, str: string) => {
    for (let i = 0; i < str.length; i++) {
      view.setUint8(offset + i, str.charCodeAt(i));
    }
  };

  // RIFF identifier
  writeString(0, 'RIFF');
  view.setUint32(4, 36 + numSamples * 2, true);
  writeString(8, 'WAVE');

  // fmt subchunk
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true);            // subchunk1 size (16 for PCM)
  view.setUint16(20, 1, true);             // audio format (1 = PCM)
  view.setUint16(22, 1, true);             // num channels (1 = mono)
  view.setUint32(24, sampleRate, true);    // sample rate
  view.setUint32(28, sampleRate * 2, true);// byte rate (sampleRate * numChannels * bitsPerSample/8)
  view.setUint16(32, 2, true);             // block align (numChannels * bitsPerSample/8)
  view.setUint16(34, 16, true);            // bits per sample

  // data subchunk
  writeString(36, 'data');
  view.setUint32(40, numSamples * 2, true);

  // Write 16-bit PCM samples
  let offset = 44;
  for (let i = 0; i < numSamples; i++) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true);
    offset += 2;
  }

  return new Blob([buffer], { type: 'audio/wav' });
}

export function useAudioRecorder(): UseAudioRecorderReturn {
  const [state, setState] = useState<RecorderState>('idle');
  const [elapsed, setElapsed] = useState(0);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [recordedUrl, setRecordedUrl] = useState<string | null>(null);
  const [recordedMime, setRecordedMime] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  const streamRef = useRef<MediaStream | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const processorNodeRef = useRef<ScriptProcessorNode | null>(null);
  const recordedBuffersRef = useRef<Float32Array[]>([]);
  const startTimeRef = useRef<number>(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const prevUrlRef = useRef<string | null>(null);

  // Cleanup everything
  const cleanup = useCallback(() => {
    if (timerRef.current !== null) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (processorNodeRef.current) {
      processorNodeRef.current.onaudioprocess = null;
      try {
        processorNodeRef.current.disconnect();
      } catch {}
      processorNodeRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (audioCtxRef.current) {
      audioCtxRef.current.close().catch(() => {});
      audioCtxRef.current = null;
    }
    analyserRef.current = null;
    recordedBuffersRef.current = [];
  }, []);

  // Revoke previous object URL before creating new one
  const revokeOldUrl = useCallback(() => {
    if (prevUrlRef.current) {
      URL.revokeObjectURL(prevUrlRef.current);
      prevUrlRef.current = null;
    }
  }, []);

  const reset = useCallback(() => {
    cleanup();
    revokeOldUrl();
    setRecordedBlob(null);
    setRecordedUrl(null);
    setRecordedMime('');
    setElapsed(0);
    setError(null);
    setState('idle');
  }, [cleanup, revokeOldUrl]);

  const startRecording = useCallback(async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      setError('Audio recording is not supported in this browser. You can still upload an audio file.');
      setState('error');
      return;
    }

    // Discard any previous recording
    revokeOldUrl();
    setRecordedBlob(null);
    setRecordedUrl(null);
    setError(null);
    recordedBuffersRef.current = [];

    setState('requesting');

    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: false,
          autoGainControl: true,
        },
        video: false,
      });
    } catch (err: unknown) {
      const isDenied =
        err instanceof DOMException &&
        (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError');
      setError(
        isDenied
          ? 'Microphone access was denied. Allow microphone access in your browser settings and try again.'
          : 'Could not access the microphone. Please check your device and try again.'
      );
      setState('error');
      return;
    }

    streamRef.current = stream;

    try {
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioCtxClass();
      if (ctx.state === 'suspended') {
        await ctx.resume();
      }
      audioCtxRef.current = ctx;

      const source = ctx.createMediaStreamSource(stream);

      // Live Visualizer Analyser (Source -> Analyser, no speaker destination)
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      analyserRef.current = analyser;

      // Direct PCM stream recording: 4096 buffer size, 1 input channel, 1 output channel
      const processor = ctx.createScriptProcessor(4096, 1, 1);
      processor.onaudioprocess = (e) => {
        const inputData = e.inputBuffer.getChannelData(0);
        recordedBuffersRef.current.push(new Float32Array(inputData));
      };

      // Connect source to processor; processor connects to destination (with 0 output gain for WebKit lifecycle)
      source.connect(processor);
      const muteGain = ctx.createGain();
      muteGain.gain.value = 0;
      processor.connect(muteGain);
      muteGain.connect(ctx.destination);

      processorNodeRef.current = processor;

      // Elapsed timer
      startTimeRef.current = Date.now();
      timerRef.current = setInterval(() => {
        setElapsed(Math.floor((Date.now() - startTimeRef.current) / 1000));
      }, 500);

      setState('recording');
    } catch (err: any) {
      cleanup();
      setError('Failed to initialize audio capture. Please try again.');
      setState('error');
    }
  }, [cleanup, revokeOldUrl]);

  const stopRecording = useCallback(() => {
    if (timerRef.current !== null) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    const ctx = audioCtxRef.current;
    const sampleRate = ctx?.sampleRate || 44100;
    const buffers = recordedBuffersRef.current;

    // Disconnect and stop tracks to release mic icon immediately
    if (processorNodeRef.current) {
      processorNodeRef.current.onaudioprocess = null;
      try {
        processorNodeRef.current.disconnect();
      } catch {}
      processorNodeRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (audioCtxRef.current) {
      audioCtxRef.current.close().catch(() => {});
      audioCtxRef.current = null;
    }

    if (buffers.length === 0) {
      setError('No audio was recorded. Please try again.');
      setState('error');
      return;
    }

    // Merge recorded buffers into a single Float32Array
    let totalLength = 0;
    for (let i = 0; i < buffers.length; i++) {
      totalLength += buffers[i].length;
    }

    const mergedSamples = new Float32Array(totalLength);
    let offset = 0;
    for (let i = 0; i < buffers.length; i++) {
      mergedSamples.set(buffers[i], offset);
      offset += buffers[i].length;
    }

    // Direct encoding to standard 16-bit PCM WAV Blob
    const wavBlob = encodeWavBlob(mergedSamples, sampleRate);
    const url = URL.createObjectURL(wavBlob);
    prevUrlRef.current = url;

    setRecordedBlob(wavBlob);
    setRecordedUrl(url);
    setRecordedMime('audio/wav');
    setState('recorded');
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanup();
      revokeOldUrl();
    };
  }, [cleanup, revokeOldUrl]);

  return {
    state,
    elapsed,
    recordedBlob,
    recordedUrl,
    recordedMime,
    error,
    analyserRef,
    startRecording,
    stopRecording,
    reset,
  };
}
