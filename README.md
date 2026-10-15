# Smart Audio Noise Analyzer & Digital Filter Selection
### DSP Laboratory Mini-Project — DFT, FFT, FIR and IIR Filters

---

## Project Overview

A full-stack college Digital Signal Processing (DSP) laboratory project implementing:

- **Real FFT/DFT Analysis** using NumPy (Cooley-Tukey algorithm)
- **FIR Filters** — windowed design (Hamming, Hann, Blackman) via SciPy `firwin`
- **IIR Filters** — Butterworth and Chebyshev Type I using **Second-Order Sections (SOS)** for numerical stability
- **Automated Noise Detection** — 50/60 Hz hum, low-frequency rumble, high-frequency hiss, narrowband tones
- **Real-time Audio Filtering** with waveform and spectrum before/after comparison
- **Performance Metrics** — SNR, ΔSNR (with exact ground-truth when calibrated demo used), Noise Reduction (dB), PSNR, Execution Time
- **Intelligent Best-Filter Recommendation Engine**
- **Calibrated Synthetic Test Signal** — known harmonics + quantified noise for exact college viva SNR calculations

---

## Project Structure

```
Digital signal processing mini project/
├── backend/
│   ├── app.py              ← Flask REST API server (all endpoints)
│   ├── dsp_analyzer.py     ← Core DSP engine (FFT, FIR, IIR, metrics)
│   ├── requirements.txt
│   └── uploads/            ← Auto-created temp audio directory
│
└── frontend/
    ├── src/
    │   ├── components/
    │   │   ├── Navbar.jsx
    │   │   ├── Sidebar.jsx
    │   │   ├── AudioUploader.jsx
    │   │   ├── AudioRecorder.jsx
    │   │   ├── WaveformChart.jsx
    │   │   ├── FFTChart.jsx
    │   │   ├── FilterControls.jsx
    │   │   ├── FrequencyResponseChart.jsx
    │   │   ├── ComparisonTable.jsx
    │   │   ├── AudioPlayer.jsx
    │   │   └── MetricCard.jsx
    │   ├── pages/
    │   │   ├── Dashboard.jsx
    │   │   ├── AudioAnalysis.jsx
    │   │   ├── DigitalFilters.jsx
    │   │   ├── FilterComparison.jsx
    │   │   └── Results.jsx
    │   ├── services/api.js
    │   ├── hooks/useAudio.jsx
    │   ├── App.jsx
    │   ├── main.jsx
    │   └── index.css
    ├── package.json
    ├── vite.config.js
    └── .env
```

---

## Technology Stack

| Layer | Technology |
|---|---|
| Frontend | React 19 + Vite 8 |
| Styling | Tailwind CSS v4 |
| Charts | Recharts |
| Routing | React Router v7 |
| HTTP Client | Axios |
| Backend | Python 3.10 + Flask 3 |
| Signal Processing | NumPy + SciPy |
| Audio I/O | SoundFile |

---

## Setup & Installation

### Prerequisites
- Python 3.9+
- Node.js 18+

### Step 1 — Backend Setup

```bash
cd "Digital signal processing mini project/backend"
pip install flask flask-cors numpy scipy soundfile
python app.py
```

Backend runs at: **http://127.0.0.1:5000**

### Step 2 — Frontend Setup

```bash
cd "Digital signal processing mini project/frontend"
npm install
npm run dev
```

Frontend runs at: **http://localhost:5173**

> **Run both simultaneously** — backend in one terminal, frontend in another.

---

## How to Use the Application

### 1. Load Audio
- **Upload WAV file** — drag & drop or click the upload area (supports WAV, MP3, FLAC, OGG)
- **Record from Microphone** — click the mic button in the Audio Recorder card
- **Load Calibrated Demo Signal** — click the **"Load Calibrated Demo Signal"** button in the top navigation bar

> **Strongly recommended for college practical**: Use the Calibrated Demo Signal — it contains a known harmonic chord (440 Hz + 660 Hz + 880 Hz) with added 50 Hz AC hum and high-frequency hiss, giving access to **exact ground-truth SNR calculations**.

### 2. Signal Analysis Page
- View time-domain waveform x(t)
- View FFT magnitude spectrum |X(f)| in dBFS
- Inspect dominant spectral peaks
- Review automatically detected noise components
- Click the **confirm checkbox** on noise items you want to filter

### 3. Digital Filters Page
- Select **FIR** (windowed) or **IIR** (Butterworth/Chebyshev Type I)
- Choose filter type: Low-Pass, High-Pass, Band-Pass, Band-Stop/Notch
- Adjust filter order and cutoff frequencies (validated against Nyquist fs/2)
- Click **"Preview Frequency Response"** to see |H(e^jω)| before applying
- Click **"Apply Filter to Audio"** to run real SciPy filtering on the backend
- Overlay original vs filtered waveform and spectrum charts
- Use A/B audio playback toggle to hear the difference
- Download filtered WAV file

### 4. Filter Comparison Page
- Click **"Run Filter Battery"** to benchmark 5 candidate filters simultaneously
- Compare Noise Reduction, ΔSNR, execution latency, and phase linearity in the table
- Use the calibrated demo signal for exact SNR improvement values

### 5. Results & Recommendation Page
- The recommendation engine automatically evaluates the primary noise type
- View the recommended filter with engineering rationale and measured performance
- Click **"Apply Recommended Filter"** for one-click optimal filtering
- Read the college DSP viva Q&A reference at the bottom

---

## Backend API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/health` | Server health check |
| POST | `/api/upload` | Upload WAV/audio file |
| POST | `/api/record` | Submit microphone recording |
| POST | `/api/generate-demo` | Generate calibrated synthetic signal |
| POST | `/api/analyze` | Re-analyze loaded audio |
| POST | `/api/filter/response` | Theoretical frequency response |
| POST | `/api/filter/apply` | Apply FIR/IIR filter to audio |
| POST | `/api/filter/compare` | Benchmark multiple filters |
| POST | `/api/recommend` | Intelligent filter recommendation |
| GET | `/api/audio/<id>` | Stream audio for playback |
| GET | `/api/download/<id>` | Download filtered WAV |

---

## DSP Academic Reference

### DFT vs FFT
```
DFT: X[k] = Σ x[n] · e^(-j2πkn/N)    Complexity: O(N²)
FFT: Cooley-Tukey Radix-2 butterfly     Complexity: O(N log₂ N)
```
For N = 65,536 samples: FFT is ~4,000× faster than direct DFT.

### FIR Filter Design
```python
# Window-based FIR (Hamming, Hann, Blackman)
b = scipy.signal.firwin(numtaps, cutoff, window='hamming', fs=fs)
y = scipy.signal.filtfilt(b, [1.0], x)   # zero-phase
```

### IIR Filter Design
```python
# Butterworth using Second-Order Sections (numerically stable)
sos = scipy.signal.butter(N, cutoff, btype='lowpass', output='sos', fs=fs)
y = scipy.signal.sosfiltfilt(sos, x)     # zero-phase
```

### SNR Definitions
```
SNR_input  = 10·log₁₀(P_signal / P_noise_in)
SNR_output = 10·log₁₀(P_signal / P_noise_out)
ΔSNR       = SNR_output - SNR_input   (requires clean reference)
```

---

## VS Code — Starting the Project

Open two integrated terminals:

**Terminal 1 — Backend:**
```
cd backend
python app.py
```

**Terminal 2 — Frontend:**
```
cd frontend
npm run dev
```

Open browser at **http://localhost:5173**
