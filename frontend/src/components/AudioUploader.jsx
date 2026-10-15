import React, { useRef, useState } from 'react';
import { UploadCloud, FileAudio, Check, AlertCircle } from 'lucide-react';
import { useAudio } from '../hooks/useAudio';

const AudioUploader = ({ onUploadSuccess }) => {
  const { handleUpload, loading, filename, audioId } = useAudio();
  const [dragActive, setDragActive] = useState(false);
  const [localError, setLocalError] = useState('');
  const inputRef = useRef(null);

  const allowedExtensions = ['wav', 'mp3', 'ogg', 'flac', 'm4a'];

  const validateAndUpload = async (file) => {
    setLocalError('');
    if (!file) return;

    const ext = file.name.split('.').pop().toLowerCase();
    if (!allowedExtensions.includes(ext)) {
      setLocalError(`Unsupported file format .${ext}. Please upload a WAV, MP3, OGG, or FLAC audio file.`);
      return;
    }

    if (file.size > 25 * 1024 * 1024) {
      setLocalError('File size exceeds 25 MB limit.');
      return;
    }

    try {
      const res = await handleUpload(file);
      if (onUploadSuccess && res) {
        onUploadSuccess(res);
      }
    } catch (err) {
      setLocalError(err.message || 'Upload failed');
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndUpload(e.dataTransfer.files[0]);
    }
  };

  return (
    <div className="space-y-3">
      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={`border border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-200 flex flex-col items-center justify-center ${
          dragActive
            ? 'border-cyan-400 bg-cyan-950/20 scale-[0.99]'
            : 'border-slate-800 bg-[#0a0f1d]/60 hover:border-slate-700 hover:bg-[#0a0f1d]'
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".wav,.mp3,.ogg,.flac,.m4a"
          onChange={(e) => e.target.files?.[0] && validateAndUpload(e.target.files[0])}
          className="hidden"
        />

        <div className="w-11 h-11 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 flex items-center justify-center mb-3">
          <UploadCloud className="w-5 h-5 stroke-[2.2]" />
        </div>

        <p className="text-xs font-bold text-slate-200 tracking-wide">
          Select or drop an audio signal file here
        </p>
        <p className="text-[11px] text-slate-500 mt-1">
          Supports uncompressed PCM WAV (recommended for laboratory DSP), MP3, FLAC
        </p>

        <div className="mt-3 flex items-center space-x-2">
          <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-[10px] font-mono text-slate-400">
            WAV • 16/24-bit
          </span>
          <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-[10px] font-mono text-slate-400">
            Max 25 MB
          </span>
        </div>
      </div>

      {localError && (
        <div className="p-3 rounded-lg bg-rose-950/40 border border-rose-800 text-rose-300 text-xs flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
          <span>{localError}</span>
        </div>
      )}

      {audioId && filename && !localError && (
        <div className="p-2.5 rounded-lg bg-[#0e1626] border border-slate-800 text-xs flex items-center justify-between text-slate-300">
          <div className="flex items-center space-x-2 truncate">
            <FileAudio className="w-4 h-4 text-cyan-400 shrink-0" />
            <span className="truncate font-semibold">{filename}</span>
          </div>
          <span className="flex items-center space-x-1 text-emerald-400 font-medium shrink-0 ml-2 text-[11px]">
            <Check className="w-3.5 h-3.5" />
            <span>Ready for Processing</span>
          </span>
        </div>
      )}
    </div>
  );
};

export default AudioUploader;
