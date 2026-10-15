import React, { useState, useRef, useEffect } from 'react';
import { Mic, Square, Send, AlertCircle, Volume2, CheckCircle2 } from 'lucide-react';
import { useAudio } from '../hooks/useAudio';

// ---------------------------------------------------------------------------
// Encode a Float32Array of PCM samples as a standard 16-bit mono WAV blob.
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
  view.setUint32(16, 16, true);             // Sub-chunk size (16 for PCM)
  view.setUint16(20, 1, true);              // PCM format = 1
  view.setUint16(22, 1, true);              // Mono channel = 1
  view.setUint32(24, sampleRate, true);     // Sample rate
  view.setUint32(28, sampleRate * 2, true); // Byte rate (SampleRate * 1 * 16/8)
  view.setUint16(32, 2, true);              // Block align (1 * 16/8)
  view.setUint16(34, 16, true);             // Bits per sample = 16

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

const AudioRecorder = ({ onRecordSuccess }) => {
  const { handleRecord, loading } = useAudio();

  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [liveLevel, setLiveLevel] = useState(0); // 0 to 100 for VU meter
  const [wavBlob, setWavBlob] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [recordedPeak, setRecordedPeak] = useState(null);

  const audioContextRef = useRef(null);
  const streamRef = useRef(null);
  const processorRef = useRef(null);
  const sourceRef = useRef(null);
  const muteGainRef = useRef(null);
  const pcmSamplesRef = useRef([]);
  const timerRef = useRef(null);
  const animFrameRef = useRef(null);
  const analyserRef = useRef(null);

  useEffect(() => {
    return () => {
      cleanupRecording();
      if (timerRef.current) clearInterval(timerRef.current);
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, []);

  const cleanupRecording = () => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    if (processorRef.current) {
      processorRef.current.disconnect();
      processorRef.current = null;
    }
    if (sourceRef.current) {
      sourceRef.current.disconnect();
      sourceRef.current = null;
    }
    if (muteGainRef.current) {
      muteGainRef.current.disconnect();
      muteGainRef.current = null;
    }
    if (analyserRef.current) {
      analyserRef.current.disconnect();
      analyserRef.current = null;
    }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setLiveLevel(0);
  };

  const startRecording = async () => {
    setErrorMsg('');
    setWavBlob(null);
    setRecordedPeak(null);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    pcmSamplesRef.current = [];

    try {
      // 1. Request microphone with explicit parameters to prevent Windows/browser echo cancellation muting
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: true,
        },
        video: false,
      });
      streamRef.current = stream;

      // 2. Initialize AudioContext using hardware native sample rate
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      const ctx = new AudioContextClass();
      audioContextRef.current = ctx;

      // CRITICAL: Always resume AudioContext to activate audio processing graph
      if (ctx.state === 'suspended') {
        await ctx.resume();
      }

      // 3. Create audio source from microphone stream
      const source = ctx.createMediaStreamSource(stream);
      sourceRef.current = source;

      // 4. Create AnalyserNode for live visual VU meter
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      analyserRef.current = analyser;
      source.connect(analyser);

      // 5. ScriptProcessor for raw PCM collection
      const bufferSize = 4096;
      const processor = ctx.createScriptProcessor(bufferSize, 1, 1);
      processorRef.current = processor;

      processor.onaudioprocess = (e) => {
        const inputChannel = e.inputBuffer.getChannelData(0);
        // Make a detached clone so it won't be overwritten in the next tick
        const clone = new Float32Array(inputChannel.length);
        clone.set(inputChannel);
        pcmSamplesRef.current.push(clone);
      };

      // 6. Connect source -> processor -> muteGain -> destination
      // Using gain = 0 prevents acoustic feedback while keeping the processor alive in the WebAudio graph
      const muteGain = ctx.createGain();
      muteGain.gain.setValueAtTime(0, ctx.currentTime);
      muteGainRef.current = muteGain;

      source.connect(processor);
      processor.connect(muteGain);
      muteGain.connect(ctx.destination);

      // 7. Live volume meter animation loop
      const pcmData = new Uint8Array(analyser.frequencyBinCount);
      const updateMeter = () => {
        if (!analyserRef.current) return;
        analyserRef.current.getByteFrequencyData(pcmData);
        let sum = 0;
        for (let i = 0; i < pcmData.length; i++) {
          sum += pcmData[i];
        }
        const avg = sum / pcmData.length;
        const normalized = Math.min(100, Math.round((avg / 128) * 100));
        setLiveLevel(normalized);
        animFrameRef.current = requestAnimationFrame(updateMeter);
      };
      animFrameRef.current = requestAnimationFrame(updateMeter);

      setIsRecording(true);
      setRecordingTime(0);
      timerRef.current = setInterval(() => setRecordingTime((t) => t + 1), 1000);
    } catch (err) {
      console.error('Microphone access error:', err);
      setErrorMsg(
        err.name === 'NotAllowedError'
          ? 'Microphone permission was denied. Please allow microphone access in your browser settings.'
          : `Could not access microphone: ${err.message || 'Check audio hardware connection.'}`
      );
    }
  };

  const stopRecording = () => {
    if (!isRecording) return;

    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    const recordedSampleRate = audioContextRef.current?.sampleRate || 44100;

    // 1. Merge all PCM slices
    const totalSamples = pcmSamplesRef.current.reduce((acc, chunk) => acc + chunk.length, 0);
    if (totalSamples === 0) {
      setErrorMsg('No audio samples were captured. Please check your microphone input.');
      cleanupRecording();
      setIsRecording(false);
      return;
    }

    const merged = new Float32Array(totalSamples);
    let offset = 0;
    let peakVal = 0;
    for (const chunk of pcmSamplesRef.current) {
      merged.set(chunk, offset);
      for (let i = 0; i < chunk.length; i++) {
        const abs = Math.abs(chunk[i]);
        if (abs > peakVal) peakVal = abs;
      }
      offset += chunk.length;
    }

    setRecordedPeak(peakVal);

    // 2. Validate non-silent recording
    if (peakVal < 0.002) {
      setErrorMsg(
        'Warning: Microphone recording is completely silent. Please ensure your microphone is not muted in Windows settings.'
      );
    }

    // 3. Encode to standard WAV blob
    const blob = encodeWAV(merged, recordedSampleRate);
    setWavBlob(blob);
    setPreviewUrl(URL.createObjectURL(blob));
    setIsRecording(false);

    cleanupRecording();
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
    <div className="p-4 rounded-xl bg-[#0c1220]/70 border border-[#1e3050] space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wide">Microphone Capture</h4>
          <p className="text-[11px] text-slate-500">
            Real-time PCM capture encoded directly to 16-bit WAV
          </p>
        </div>
        {isRecording && (
          <span className="flex items-center space-x-1.5 px-2.5 py-1 rounded-md bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-mono">
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
            <span>REC {formatTimer(recordingTime)}</span>
          </span>
        )}
      </div>

      {/* Recording tactile button & live VU meter */}
      <div className="flex flex-col items-center justify-center p-6 rounded-xl bg-[#111a2e] border border-[#1e3050] space-y-3">
        {!isRecording ? (
          <button
            onClick={startRecording}
            disabled={loading}
            className="w-14 h-14 rounded-full bg-[#0c1220] border-2 border-rose-500/70 hover:border-rose-400 text-rose-400 hover:text-rose-300 hover:bg-rose-950/20 flex items-center justify-center transition-all duration-150 active:scale-95 disabled:opacity-50 shadow-lg shadow-rose-950/30"
            title="Start Microphone Recording"
          >
            <Mic className="w-6 h-6 stroke-[2.2]" />
          </button>
        ) : (
          <button
            onClick={stopRecording}
            className="w-14 h-14 rounded-full bg-rose-600 hover:bg-rose-500 text-white flex items-center justify-center shadow-lg shadow-rose-950/60 transition-transform active:scale-95 animate-pulse"
            title="Stop Recording"
          >
            <Square className="w-6 h-6 fill-current" />
          </button>
        )}

        <div className="text-center space-y-1">
          <span className="text-xs text-slate-300 font-mono">
            {isRecording
              ? 'Recording in progress... Click red button to stop'
              : wavBlob
              ? 'Recording completed. Listen to preview below or re-record.'
              : 'Click microphone button to begin speaking'}
          </span>

          {/* Live Audio Level Meter when recording */}
          {isRecording && (
            <div className="flex items-center justify-center space-x-2 pt-2">
              <Volume2 className="w-3.5 h-3.5 text-violet-400 shrink-0" />
              <div className="w-48 h-2 bg-[#0c1220] rounded-full overflow-hidden border border-[#1e3050]">
                <div
                  className={`h-full transition-all duration-75 ${
                    liveLevel > 60
                      ? 'bg-rose-500'
                      : liveLevel > 20
                      ? 'bg-emerald-400'
                      : 'bg-violet-400'
                  }`}
                  style={{ width: `${Math.max(5, liveLevel)}%` }}
                />
              </div>
              <span className="text-[10px] font-mono text-slate-400 w-8 text-right">
                {liveLevel}%
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Preview player and submit action */}
      {previewUrl && !isRecording && (
        <div className="p-3.5 rounded-xl bg-[#111a2e] border border-[#1e3050] space-y-2.5">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-300 flex items-center space-x-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Recording Preview</span>
            </span>
            {recordedPeak !== null && (
              <span className="text-[11px] font-mono text-slate-400">
                Peak: <strong className={recordedPeak < 0.005 ? 'text-rose-400' : 'text-emerald-400'}>
                  {(recordedPeak * 100).toFixed(1)}%
                </strong>
              </span>
            )}
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1">
            <audio src={previewUrl} controls className="h-9 w-full sm:flex-1 accent-violet-500" />
            <button
              onClick={submitRecording}
              disabled={loading}
              className="w-full sm:w-auto flex items-center justify-center space-x-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white shadow-lg shadow-violet-500/20 transition-all disabled:opacity-50 active:scale-[0.97]"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{loading ? 'Processing...' : 'Analyze Recording'}</span>
            </button>
          </div>
        </div>
      )}

      {errorMsg && (
        <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-300 text-xs flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
          <span>{errorMsg}</span>
        </div>
      )}
    </div>
  );
};

export default AudioRecorder;
