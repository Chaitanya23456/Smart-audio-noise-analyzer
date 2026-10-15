import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import api from '../services/api';

const AudioContext = createContext(null);

export const AudioProvider = ({ children }) => {
  const [audioId, setAudioId] = useState(null);
  const [cleanAudioId, setCleanAudioId] = useState(null);
  const [filename, setFilename] = useState('');
  const [channels, setChannels] = useState(1);
  const [timeStats, setTimeStats] = useState(null);
  const [fftStats, setFftStats] = useState(null);
  const [noiseComponents, setNoiseComponents] = useState([]);
  const [isCalibratedDemo, setIsCalibratedDemo] = useState(false);

  // Filtered audio state
  const [filteredAudioId, setFilteredAudioId] = useState(null);
  const [filteredTimeStats, setFilteredTimeStats] = useState(null);
  const [filteredFftStats, setFilteredFftStats] = useState(null);
  const [filterMetrics, setFilterMetrics] = useState(null);
  const [frequencyResponse, setFrequencyResponse] = useState(null);
  const [currentFilterConfig, setCurrentFilterConfig] = useState(null);

  // Comparison & Recommendations
  const [comparisonResults, setComparisonResults] = useState([]);
  const [recommendation, setRecommendation] = useState(null);

  // UI state
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [error, setError] = useState(null);
  const [serverOnline, setServerOnline] = useState(false);

  // Check backend health on mount
  useEffect(() => {
    const checkServer = async () => {
      try {
        await api.healthCheck();
        setServerOnline(true);
      } catch (err) {
        setServerOnline(false);
      }
    };
    checkServer();
    const interval = setInterval(checkServer, 10000);
    return () => clearInterval(interval);
  }, []);

  const resetFilteredState = useCallback(() => {
    setFilteredAudioId(null);
    setFilteredTimeStats(null);
    setFilteredFftStats(null);
    setFilterMetrics(null);
    setFrequencyResponse(null);
  }, []);

  const handleUpload = useCallback(async (file) => {
    try {
      setLoading(true);
      setLoadingMessage('Uploading & analyzing audio signal (FFT & noise detection)...');
      setError(null);
      resetFilteredState();
      setComparisonResults([]);
      setRecommendation(null);

      const res = await api.uploadAudio(file);
      if (res.success) {
        setAudioId(res.audio_id);
        setCleanAudioId(null);
        setFilename(res.filename);
        setChannels(res.channels || 1);
        setTimeStats(res.time_stats);
        setFftStats(res.fft_stats);
        setNoiseComponents(res.noise_components || []);
        setIsCalibratedDemo(false);
        return res;
      }
    } catch (err) {
      const errMsg = err.response?.data?.error || err.message || 'Audio upload failed';
      setError(errMsg);
      throw err;
    } finally {
      setLoading(false);
      setLoadingMessage('');
    }
  }, [resetFilteredState]);

  const handleRecord = useCallback(async (blob) => {
    try {
      setLoading(true);
      setLoadingMessage('Processing microphone recording & computing spectrum...');
      setError(null);
      resetFilteredState();
      setComparisonResults([]);
      setRecommendation(null);

      const res = await api.recordAudio(blob);
      if (res.success) {
        setAudioId(res.audio_id);
        setCleanAudioId(null);
        setFilename(res.filename);
        setChannels(res.channels || 1);
        setTimeStats(res.time_stats);
        setFftStats(res.fft_stats);
        setNoiseComponents(res.noise_components || []);
        setIsCalibratedDemo(false);
        return res;
      }
    } catch (err) {
      const errMsg = err.response?.data?.error || err.message || 'Microphone recording processing failed';
      setError(errMsg);
      throw err;
    } finally {
      setLoading(false);
      setLoadingMessage('');
    }
  }, [resetFilteredState]);

  const handleGenerateDemo = useCallback(async (noiseTypes = ['hum', 'hiss']) => {
    try {
      setLoading(true);
      setLoadingMessage('Synthesizing calibrated DSP test signal with ground truth reference...');
      setError(null);
      resetFilteredState();
      setComparisonResults([]);
      setRecommendation(null);

      const res = await api.generateDemoSignal(noiseTypes);
      if (res.success) {
        setAudioId(res.audio_id);
        setCleanAudioId(res.clean_audio_id);
        setFilename(res.filename);
        setChannels(1);
        setTimeStats(res.time_stats);
        setFftStats(res.fft_stats);
        setNoiseComponents(res.noise_components || []);
        setIsCalibratedDemo(true);
        return res;
      }
    } catch (err) {
      const errMsg = err.response?.data?.error || err.message || 'Demo generation failed';
      setError(errMsg);
      throw err;
    } finally {
      setLoading(false);
      setLoadingMessage('');
    }
  }, [resetFilteredState]);

  const handleApplyFilter = useCallback(async (filterConfig, zeroPhase = true) => {
    if (!audioId) {
      setError('Please upload or generate an audio signal first.');
      return;
    }
    try {
      setLoading(true);
      setLoadingMessage(`Applying ${filterConfig.family} ${filterConfig.filter_type} filter...`);
      setError(null);

      const res = await api.applyFilter(audioId, filterConfig, zeroPhase);
      if (res.success) {
        setFilteredAudioId(res.filtered_audio_id);
        setFilteredTimeStats(res.filtered_time_stats);
        setFilteredFftStats(res.filtered_fft_stats);
        setFilterMetrics(res.metrics);
        setFrequencyResponse(res.frequency_response);
        setCurrentFilterConfig(filterConfig);
        return res;
      }
    } catch (err) {
      const errMsg = err.response?.data?.error || err.message || 'Failed to apply filter';
      setError(errMsg);
      throw err;
    } finally {
      setLoading(false);
      setLoadingMessage('');
    }
  }, [audioId]);

  const handleFetchFrequencyResponse = useCallback(async (filterConfig) => {
    try {
      const fs = timeStats?.sampling_rate || 44100;
      const res = await api.getFrequencyResponse(filterConfig, fs);
      if (res.success) {
        setFrequencyResponse(res.response);
        return res.response;
      }
    } catch (err) {
      console.error('Failed to fetch frequency response:', err);
    }
  }, [timeStats]);

  const handleCompare = useCallback(async (customFilters = null) => {
    if (!audioId) {
      setError('Please upload or generate an audio signal first.');
      return;
    }
    try {
      setLoading(true);
      setLoadingMessage('Benchmarking candidate FIR and IIR digital filters...');
      setError(null);

      const res = await api.compareFilters(audioId, customFilters);
      if (res.success) {
        setComparisonResults(res.comparison);
        return res.comparison;
      }
    } catch (err) {
      const errMsg = err.response?.data?.error || err.message || 'Filter comparison failed';
      setError(errMsg);
      throw err;
    } finally {
      setLoading(false);
      setLoadingMessage('');
    }
  }, [audioId]);

  const handleRecommend = useCallback(async () => {
    if (!audioId) {
      setError('Please upload or generate an audio signal first.');
      return;
    }
    try {
      setLoading(true);
      setLoadingMessage('Evaluating spectral noise profile and generating academic recommendation...');
      setError(null);

      const res = await api.recommendFilter(audioId);
      if (res.success) {
        setRecommendation(res.recommendation);
        return res.recommendation;
      }
    } catch (err) {
      const errMsg = err.response?.data?.error || err.message || 'Recommendation failed';
      setError(errMsg);
      throw err;
    } finally {
      setLoading(false);
      setLoadingMessage('');
    }
  }, [audioId]);

  const value = {
    audioId,
    cleanAudioId,
    filename,
    channels,
    timeStats,
    fftStats,
    noiseComponents,
    isCalibratedDemo,
    filteredAudioId,
    filteredTimeStats,
    filteredFftStats,
    filterMetrics,
    frequencyResponse,
    currentFilterConfig,
    comparisonResults,
    recommendation,
    loading,
    loadingMessage,
    error,
    serverOnline,
    setError,
    clearError: () => setError(null),
    handleUpload,
    handleRecord,
    handleGenerateDemo,
    handleApplyFilter,
    handleFetchFrequencyResponse,
    handleCompare,
    handleRecommend,
    resetFilteredState,
  };

  return <AudioContext.Provider value={value}>{children}</AudioContext.Provider>;
};

export const useAudio = () => {
  const context = useContext(AudioContext);
  if (!context) {
    throw new Error('useAudio must be used within an AudioProvider');
  }
  return context;
};

export default useAudio;
