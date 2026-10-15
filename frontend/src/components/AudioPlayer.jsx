import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, Download, Volume2, VolumeX } from 'lucide-react';
import api from '../services/api';

const AudioPlayer = ({
  originalAudioId,
  filteredAudioId,
  originalTitle = 'Original Signal (A)',
  filteredTitle = 'Filtered Signal (B)',
}) => {
  const [activeTrack, setActiveTrack] = useState('original');
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.85);
  const [isMuted, setIsMuted] = useState(false);

  const audioRef = useRef(null);

  const currentAudioId = activeTrack === 'filtered' && filteredAudioId ? filteredAudioId : originalAudioId;
  const audioSrc = currentAudioId ? api.getAudioStreamUrl(currentAudioId) : '';

  useEffect(() => {
    if (!filteredAudioId && activeTrack === 'filtered') {
      setActiveTrack('original');
    }
  }, [filteredAudioId, activeTrack]);

  useEffect(() => {
    if (audioRef.current && audioSrc) {
      const wasPlaying = isPlaying;
      const prevTime = currentTime;
      audioRef.current.load();
      audioRef.current.currentTime = prevTime;
      if (wasPlaying) {
        audioRef.current.play().catch(() => setIsPlaying(false));
      }
    }
  }, [audioSrc]);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
      if (!duration && audioRef.current.duration) {
        setDuration(audioRef.current.duration);
      }
    }
  };

  const handleSeek = (e) => {
    const target = parseFloat(e.target.value);
    setCurrentTime(target);
    if (audioRef.current) {
      audioRef.current.currentTime = target;
    }
  };

  const handleVolumeChange = (e) => {
    const v = parseFloat(e.target.value);
    setVolume(v);
    if (audioRef.current) audioRef.current.volume = v;
    if (v > 0 && isMuted) setIsMuted(false);
  };

  const toggleMute = () => {
    if (!audioRef.current) return;
    const next = !isMuted;
    setIsMuted(next);
    audioRef.current.muted = next;
  };

  const formatTime = (secs) => {
    if (isNaN(secs) || secs < 0) return '00:00.0';
    const m = Math.floor(secs / 60);
    const s = (secs % 60).toFixed(1);
    const sStr = s < 10 ? `0${s}` : `${s}`;
    return `${m < 10 ? '0' : ''}${m}:${sStr}`;
  };

  if (!originalAudioId) return null;

  return (
    <div className="p-3.5 rounded-xl bg-[#111a2e] border border-[#1e3050] shadow-md space-y-3">
      <audio
        ref={audioRef}
        src={audioSrc}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={() => audioRef.current && setDuration(audioRef.current.duration)}
        onEnded={() => setIsPlaying(false)}
      />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* A/B Channel Selector Buttons */}
        <div className="flex items-center space-x-2">
          <div className="inline-flex rounded-lg bg-[#0c1220] p-1 border border-[#1e3050] text-xs font-semibold">
            <button
              onClick={() => setActiveTrack('original')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md transition-all ${
                activeTrack === 'original'
                  ? 'bg-violet-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${activeTrack === 'original' ? 'bg-violet-200 animate-pulse' : 'bg-slate-600'}`}></span>
              <span>{originalTitle}</span>
            </button>
            <button
              onClick={() => setActiveTrack('filtered')}
              disabled={!filteredAudioId}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md transition-all ${
                activeTrack === 'filtered'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : filteredAudioId
                  ? 'text-slate-400 hover:text-slate-200'
                  : 'text-slate-600 cursor-not-allowed opacity-50'
              }`}
              title={!filteredAudioId ? 'Apply a filter first to enable track B playback' : 'Switch to Filtered signal'}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${activeTrack === 'filtered' ? 'bg-emerald-200 animate-pulse' : 'bg-slate-600'}`}></span>
              <span>{filteredTitle}</span>
            </button>
          </div>

          <span className="text-[11px] font-mono text-slate-500 hidden md:inline">
            Active: <strong className={activeTrack === 'filtered' ? 'text-emerald-400' : 'text-violet-400'}>CHANNEL {activeTrack === 'filtered' ? 'B' : 'A'}</strong>
          </span>
        </div>

        {/* Download Action if Filtered output exists */}
        {filteredAudioId && (
          <a
            href={api.getAudioDownloadUrl(filteredAudioId)}
            download
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/20 transition-all shrink-0"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Filtered WAV</span>
          </a>
        )}
      </div>

      {/* Main Transport Bar */}
      <div className="flex items-center space-x-3.5 pt-1">
        <button
          onClick={togglePlay}
          className={`w-9 h-9 rounded-lg flex items-center justify-center text-white transition-all active:scale-95 shadow-sm ${
            activeTrack === 'filtered'
              ? 'bg-emerald-600 hover:bg-emerald-500'
              : 'bg-violet-600 hover:bg-violet-500'
          }`}
        >
          {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
        </button>

        <span className="text-xs font-mono text-slate-400 w-16 text-right select-none">
          {formatTime(currentTime)}
        </span>

        <input
          type="range"
          min="0"
          max={duration || 1}
          step="0.01"
          value={currentTime}
          onChange={handleSeek}
          className="flex-1 h-1.5 bg-[#0c1220] rounded-lg appearance-none cursor-pointer accent-violet-500 focus:outline-none"
        />

        <span className="text-xs font-mono text-slate-400 w-16 select-none">
          {formatTime(duration)}
        </span>

        <div className="hidden sm:flex items-center space-x-2 pl-2 border-l border-[#1e3050]">
          <button onClick={toggleMute} className="text-slate-400 hover:text-slate-200">
            {isMuted || volume === 0 ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={isMuted ? 0 : volume}
            onChange={handleVolumeChange}
            className="w-16 h-1 bg-[#0c1220] rounded-lg appearance-none cursor-pointer accent-slate-400"
          />
        </div>
      </div>
    </div>
  );
};

export default AudioPlayer;
