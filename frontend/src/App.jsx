import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AudioProvider } from './hooks/useAudio';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import AudioAnalysis from './pages/AudioAnalysis';
import DigitalFilters from './pages/DigitalFilters';
import FilterComparison from './pages/FilterComparison';
import Results from './pages/Results';

function App() {
  return (
    <BrowserRouter>
      <AudioProvider>
        <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
          {/* Top Navigation */}
          <Navbar />

          <div className="flex-1 flex overflow-hidden">
            {/* Left Sidebar */}
            <Sidebar />

            {/* Main Application Content Area */}
            <main className="flex-1 overflow-y-auto p-6 bg-slate-950/60">
              <div className="max-w-7xl mx-auto">
                <Routes>
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/analysis" element={<AudioAnalysis />} />
                  <Route path="/filters" element={<DigitalFilters />} />
                  <Route path="/comparison" element={<Navigate to="/results" replace />} />
                  <Route path="/results" element={<Results />} />
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </div>
            </main>
          </div>
        </div>
      </AudioProvider>
    </BrowserRouter>
  );
}

export default App;
