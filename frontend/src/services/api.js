import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:5000/api';

const client = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
});

export const api = {
  healthCheck: async () => {
    const res = await client.get('/health');
    return res.data;
  },

  uploadAudio: async (file) => {
    const formData = new FormData();
    formData.append('audio', file);
    const res = await client.post('/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  },

  recordAudio: async (blob) => {
    const formData = new FormData();
    formData.append('audio', blob, 'recording.wav');
    const res = await client.post('/record', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  },

  generateDemoSignal: async (noiseTypes = ['hum', 'hiss']) => {
    const res = await client.post('/generate-demo', { noise_types: noiseTypes });
    return res.data;
  },

  analyzeSignal: async (audioId) => {
    const res = await client.post('/analyze', { audio_id: audioId });
    return res.data;
  },

  getFrequencyResponse: async (filterConfig, fs = 44100) => {
    const res = await client.post('/filter/response', {
      filter_config: filterConfig,
      fs,
    });
    return res.data;
  },

  applyFilter: async (audioId, filterConfig, zeroPhase = true) => {
    const res = await client.post('/filter/apply', {
      audio_id: audioId,
      filter_config: filterConfig,
      zero_phase: zeroPhase,
    });
    return res.data;
  },

  compareFilters: async (audioId, filters = null) => {
    const res = await client.post('/filter/compare', {
      audio_id: audioId,
      filters,
    });
    return res.data;
  },

  recommendFilter: async (audioId) => {
    const res = await client.post('/recommend', { audio_id: audioId });
    return res.data;
  },

  getAudioStreamUrl: (audioId) => {
    if (!audioId) return '';
    return `${API_BASE_URL}/audio/${audioId}`;
  },

  getAudioDownloadUrl: (audioId) => {
    if (!audioId) return '';
    return `${API_BASE_URL}/download/${audioId}`;
  },
};

export default api;
