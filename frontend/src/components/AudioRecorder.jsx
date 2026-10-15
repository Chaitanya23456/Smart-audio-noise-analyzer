import React, { useState, useRef, useEffect } from 'react';
import { Mic, Square, Send, AlertCircle } from 'lucide-react';
import { useAudio } from '../hooks/useAudio';

// ---------------------------------------------------------------------------
// Encode a Float32Array of PCM samples as a standard 16-bit mono WAV blob.
// This allows SoundFile on the backend to read it without ffmpeg or pydub.
// ---------------------------------------------------------------------------
function encodeWAV(samples, sampleRate) {
  const numSamples = samples.length;
  const buffer = new ArrayBuffer(44 + numSamples * 2);
  const view = new DataView(buffer);

  const writeString = (offset, str) => {
    for (let i = 0; i < str.length; i++) {
      view.setUint8(offset + i, str.charCodeAt(i));
    }
  };

  // RIFF chunk descriptor
  writeString(0, 'RIFF');
  view.setUint32(4, 36 + numSamples * 2, true);
  writeString(8, 'WAVE');

  // fmt sub-chunk
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true);       // sub-chunk size
  view.setUint16(20, 1, true);        // PCM = 1
  view.setUint16(22, 1, true);        // mono
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true); // byte rate
  view.setUint16(32, 2, true);        // block align
  view.setUint16(34, 16, true);       // bits per sample

  // data sub-chunk
  writeString(36, 'data');
  view.setUint32(40, numSamples * 2, true);

  // Write 16-bit signed PCM samples
  let offset = 44;
  for (let i = 0; i < numSamples; i++) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true);
    offset += 2;
  }

  return new Blob([buffer], { type: 'audio/wav' });
}

// ---------------------------------------------------------------------------
// AudioRecorder component
// Uses Web AudioContext + ScriptProcessor to capture raw float32 PCM, then
// encodes to WAV client-side — no ffmpeg/pydub needed on the backend.
// ---------------------------------------------------------------------------
const AudioRecorder = ({ onRecordSuccess }) => {
  const { handleRecord, loading } = useAudio();

  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [wavBlob, setWavBlob] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');

  const audioContextRef = useRef(null);
  const streamRef = useRef(null);
  const processorRef = useRef(null);
  const sourceRef = useRef(null);
  const pcmSamplesRef = useRef([]);
  const timerRef = useRef(null);

  useEffect(() => {
    return () => {
      stopStream();
      if (timerRef.current) clearInterval(timerRef.current);
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, []);

  const stopStream = () => {
    if (processorRef.current) {
      processorRef.current.disconnect();
      processorRef.current = null;
    }
    if (sourceRef.current) {
      sourceRef.current.disconnect();
      sourceRef.current = null;
    }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
  };

  const startRecording = async () => {
    setErrorMsg('');
    setWavBlob(null);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    pcmSamplesRef.current = [];

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      streamRef.current = stream;

      const ctx = new AudioContext({ sampleRate: 44100 });
      audioContextRef.current = ctx;

      const source = ctx.createMediaStreamSource(stream);
      sourceRef.current = source;

      // ScriptProcessor: 4096 frame buffer, 1 input channel, 1 output channel
      const processor = ctx.createScriptProcessor(4096, 1, 1);
      processorRef.current = processor;

      processor.onaudioprocess = (e) => {
        // Copy float32 PCM into accumulator array
        const channelData = e.inputBuffer.getChannelData(0);
        pcmSamplesRef.current.push(new Float32Array(channelData));
      };

      source.connect(processor);
      processor.connect(ctx.destination);

      setIsRecording(true);
      setRecordingTime(0);
      timerRef.current = setInterval(() => setRecordingTime((t) => t + 1), 1000);
    } catch (err) {
      console.error(err);
      setErrorMsg('Could not access microphone. Check browser permissions and try again.');
    }
  };

  const stopRecording = () => {
    if (!isRecording) return;

    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    // Merge all accumulated PCM chunks into a single Float32Array
    const totalLength = pcmSamplesRef.current.reduce((n, c) => n + c.length, 0);
    const merged = new Float32Array(totalLength);
    let offset = 0;
    for (const chunk of pcmSamplesRef.current) {
      merged.set(chunk, offset);
      offset += chunk.length;
    }

    const sampleRate = audioContextRef.current?.sampleRate || 44100;
    const blob = encodeWAV(merged, sampleRate);
    setWavBlob(blob);
    setPreviewUrl(URL.createObjectURL(blob));
    setIsRecording(false);

    stopStream();
  };

  const submitRecording = async () => {
    if (!wavBlob) return;
    try {
      const res = await handleRecord(wavBlob);
      if (onRecordSuccess && res) onRecordSuccess(res);
    } catch (err) {
      setErrorMsg(err?.response?.data?.error || err.message || 'Failed to submit recording.');
    }
  };

  const formatTimer = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="p-4 rounded-xl bg-[#0a0f1d]/60 border border-slate-800 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wide">Microphone Capture</h4>
          <p className="text-[11px] text-slate-400">Captures uncompressed 16-bit PCM WAV (44.1 kHz) via AudioContext</p>
        </div>
        {isRecording && (
          <span className="flex items-center space-x-1.5 px-2.5 py-1 rounded-md bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-mono">
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
            <span>REC {formatTimer(recordingTime)}</span>
          </span>
        )}
      </div>

      {/* Recording button area */}
      <div className="flex flex-col items-center justify-center p-6 rounded-xl bg-[#080c14] border border-slate-800/80 space-y-2">
        {!isRecording ? (
          <button
            onClick={startRecording}
            disabled={loading}
            className="w-13 h-13 rounded-full bg-slate-900 border-2 border-rose-500/60 hover:border-rose-400 text-rose-400 hover:text-rose-300 hover:bg-rose-950/20 flex items-center justify-center transition-all duration-150 active:scale-95 disabled:opacity-50 shadow-sm"
            title="Start Microphone Recording"
          >
            <Mic className="w-5 h-5 stroke-[2.2]" />
          </button>
        ) : (
          <button
            onClick={stopRecording}
            className="w-13 h-13 rounded-full bg-rose-600 hover:bg-rose-500 text-white flex items-center justify-center shadow-lg shadow-rose-950/60 transition-transform active:scale-95 animate-pulse"
            title="Stop Recording"
          >
            <Square className="w-5 h-5 fill-current" />
          </button>
        )}
        <span className="text-xs text-slate-400 font-mono text-[11px]">
          {isRecording
            ? 'Recording... Click to Stop'
            : wavBlob
            ? 'Recording Ready • Click to Re-Record'
            : 'Click to Start Recording'}
        </span>
      </div>

      {/* Preview and submit */}
      {previewUrl && !isRecording && (
        <div className="p-3 rounded-lg bg-[#0e1626] border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
          <audio src={previewUrl} controls className="h-8 w-full sm:w-60" />
          <button
            onClick={submitRecording}
            disabled={loading}
            className="w-full sm:w-auto flex items-center justify-center space-x-2 px-4 py-2 rounded-lg text-xs font-semibold bg-cyan-600 hover:bg-cyan-500 text-white shadow-md shadow-cyan-950/50 transition-all disabled:opacity-50"
          >
            <Send className="w-3.5 h-3.5" />
            <span>{loading ? 'Processing...' : 'Analyze Recording'}</span>
          </button>
        </div>
      )}

      {errorMsg && (
        <div className="p-2.5 rounded-lg bg-rose-950/40 border border-rose-800 text-rose-300 text-xs flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
          <span>{errorMsg}</span>
        </div>
      )}
    </div>
  );
};

export default AudioRecorder;
