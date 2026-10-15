import numpy as np
import scipy.signal as signal
import soundfile as sf
import time
import io
import math

class DSPAnalyzer:
    """
    Core Digital Signal Processing (DSP) Engine
    Provides:
      - Audio loading, normalization, mono-conversion
      - Time-domain statistics & waveform decimation
      - Discrete Fourier Transform (DFT) & Fast Fourier Transform (FFT) analysis
      - Spectral peak picking & automated noise detection
      - Finite Impulse Response (FIR) filter design & application
      - Infinite Impulse Response (IIR) filter design & application (SOS format)
      - Theoretical frequency response calculation (magnitude dB & phase)
      - Objective performance metrics (SNR, delta SNR, Noise Reduction, PSNR, Execution time)
      - Intelligent Filter Recommendation Engine
      - Calibrated Synthetic Test Signal Generator with ground truth reference
    """

    MAX_DISPLAY_POINTS = 1500  # Decimated points for fast web visualization

    @staticmethod
    def load_audio(file_path):
        """Loads audio file, handles multi-channel downmixing, returns normalized float32 array and Fs."""
        data, fs = sf.read(file_path, dtype='float32')
        # If stereo or multichannel, downmix to mono for signal analysis while preserving shape info
        channels = 1 if data.ndim == 1 else data.shape[1]
        if data.ndim > 1:
            mono_data = np.mean(data, axis=1)
        else:
            mono_data = data

        return mono_data, fs, channels

    @staticmethod
    def save_audio(file_path, data, fs):
        """Saves audio data to WAV format, preventing clipping."""
        # Normalize slightly if peak exceeds 1.0 to prevent harsh DAC clipping
        peak = np.max(np.abs(data))
        if peak > 1.0:
            data = data / (peak + 1e-6)
        sf.write(file_path, data, fs, subtype='PCM_16')

    @classmethod
    def get_time_domain_stats(cls, data, fs):
        """Computes comprehensive time-domain statistics and decimated waveform."""
        n_samples = len(data)
        duration = n_samples / fs
        peak_amp = float(np.max(np.abs(data)))
        rms_val = float(np.sqrt(np.mean(data**2)))
        crest_factor_db = float(20 * np.log10((peak_amp / (rms_val + 1e-12)) + 1e-12)) if rms_val > 0 else 0.0

        # Downsample waveform for responsive UI plotting
        if n_samples > cls.MAX_DISPLAY_POINTS:
            step = int(math.ceil(n_samples / cls.MAX_DISPLAY_POINTS))
            time_axis = np.linspace(0, duration, cls.MAX_DISPLAY_POINTS).tolist()
            # Use max-min envelope or decimation for faithful visualization
            decimated_samples = data[::step][:cls.MAX_DISPLAY_POINTS].tolist()
        else:
            time_axis = (np.arange(n_samples) / fs).tolist()
            decimated_samples = data.tolist()

        return {
            "sampling_rate": int(fs),
            "num_samples": int(n_samples),
            "duration": round(float(duration), 3),
            "peak_amplitude": round(peak_amp, 4),
            "rms_amplitude": round(rms_val, 4),
            "crest_factor_db": round(crest_factor_db, 2),
            "nyquist_freq": float(fs / 2.0),
            "waveform": {
                "time": [round(t, 4) for t in time_axis],
                "amplitude": [round(float(a), 4) for a in decimated_samples]
            }
        }

    @classmethod
    def compute_fft(cls, data, fs, n_points=None):
        """
        Calculates the real FFT spectrum using NumPy, peak picking, and dB scale.
        Includes educational complexity statistics (DFT vs FFT).
        """
        n = len(data)
        # Apply Hann window to reduce spectral leakage during FFT analysis
        window = np.hanning(n)
        windowed_data = data * window

        # Compute one-sided Real FFT
        fft_complex = np.fft.rfft(windowed_data)
        freqs = np.fft.rfftfreq(n, d=1.0 / fs)

        # Magnitude and dBFS scale
        mag = np.abs(fft_complex) / (n / 2.0)
        peak_mag = np.max(mag) if np.max(mag) > 0 else 1.0
        # Normalize relative to peak (0 dB peak) or dBFS
        mag_db = 20 * np.log10(np.clip(mag / peak_mag, 1e-5, None))

        # Peak detection for dominant frequencies
        peaks, properties = signal.find_peaks(mag_db, height=-40, distance=max(5, int(len(freqs) / 200)), prominence=6)
        
        dominant_freqs = []
        if len(peaks) > 0:
            # Sort peaks by magnitude descending
            sorted_indices = np.argsort(mag_db[peaks])[::-1][:8]
            for idx in sorted_indices:
                p = peaks[idx]
                dominant_freqs.append({
                    "frequency": round(float(freqs[p]), 1),
                    "magnitude_db": round(float(mag_db[p]), 2)
                })

        # Decimate spectrum for smooth frontend visualization
        total_bins = len(freqs)
        if total_bins > cls.MAX_DISPLAY_POINTS:
            step = int(math.ceil(total_bins / cls.MAX_DISPLAY_POINTS))
            disp_freqs = freqs[::step][:cls.MAX_DISPLAY_POINTS]
            disp_mag_db = mag_db[::step][:cls.MAX_DISPLAY_POINTS]
        else:
            disp_freqs = freqs
            disp_mag_db = mag_db

        # Educational DFT vs FFT algorithmic comparison
        dft_operations = n * n  # O(N^2)
        fft_operations = int(n * np.log2(n)) if n > 0 else 0  # O(N log2 N)
        speedup_factor = round(dft_operations / (fft_operations + 1e-9), 1)

        return {
            "dominant_frequencies": dominant_freqs,
            "spectrum": {
                "frequency": [round(float(f), 1) for f in disp_freqs],
                "magnitude_db": [round(float(m), 2) for m in disp_mag_db]
            },
            "educational_dsp": {
                "n_samples": int(n),
                "dft_complexity_formula": "O(N^2) = N x N complex multiplications",
                "fft_complexity_formula": "O(N log2 N) Cooley-Tukey Radix-2 / Split-Radix algorithm",
                "dft_theoretical_ops": int(dft_operations),
                "fft_theoretical_ops": int(fft_operations),
                "theoretical_speedup": f"{speedup_factor}x faster with FFT",
                "frequency_resolution_hz": round(float(fs / n), 3)
            }
        }

    @classmethod
    def detect_noise_components(cls, data, fs):
        """
        Analyzes the spectrum for unwanted noise components:
        - 50 Hz & 60 Hz electrical mains hum (+ 100/120 Hz harmonics)
        - Low-frequency rumble (< 100 Hz)
        - High-frequency hiss (> 4000 Hz)
        - Narrowband tonal whistles
        """
        n = len(data)
        freqs = np.fft.rfftfreq(n, d=1.0 / fs)
        mag = np.abs(np.fft.rfft(data * np.hanning(n))) / (n / 2.0)
        peak_mag = np.max(mag) if np.max(mag) > 0 else 1.0
        mag_db = 20 * np.log10(np.clip(mag / peak_mag, 1e-5, None))

        detected_noise = []

        # 1. Check for 50 Hz or 60 Hz Electrical Mains Hum
        for hum_freq, label in [(50.0, "50 Hz Power Line Mains Hum"), (60.0, "60 Hz Power Line Mains Hum")]:
            idx_range = np.where((freqs >= hum_freq - 3) & (freqs <= hum_freq + 3))[0]
            if len(idx_range) > 0:
                local_peak_idx = idx_range[np.argmax(mag_db[idx_range])]
                peak_val = mag_db[local_peak_idx]
                # Compare against surrounding baseline (hum_freq - 15 to hum_freq + 15, excluding hum)
                surrounding = np.where(((freqs >= hum_freq - 25) & (freqs < hum_freq - 5)) |
                                       ((freqs > hum_freq + 5) & (freqs <= hum_freq + 25)))[0]
                baseline = np.median(mag_db[surrounding]) if len(surrounding) > 0 else -60.0
                prominence = peak_val - baseline

                if prominence > 8.0 and peak_val > -45.0:
                    detected_noise.append({
                        "id": f"hum_{int(hum_freq)}",
                        "name": label,
                        "type": "mains_hum",
                        "frequency": round(float(freqs[local_peak_idx]), 1),
                        "frequency_range": [round(hum_freq - 3, 1), round(hum_freq + 3, 1)],
                        "magnitude_db": round(float(peak_val), 1),
                        "prominence_db": round(float(prominence), 1),
                        "description": f"Electrical interference likely caused by AC mains power coupling ({int(hum_freq)} Hz).",
                        "suggested_filter": {
                            "family": "IIR",
                            "filter_type": "bandstop",
                            "subtype": "butterworth",
                            "order": 2,
                            "low_cutoff": max(10, hum_freq - 4),
                            "high_cutoff": min(fs/2 - 5, hum_freq + 4),
                            "label": f"Notch Filter at {int(hum_freq)} Hz"
                        },
                        "is_potential": True,
                        "severity": "High" if prominence > 15 else "Moderate"
                    })

        # 2. Check for Low-Frequency Acoustic Rumble (< 90 Hz, excluding identified mains hum)
        rumble_indices = np.where((freqs >= 15) & (freqs <= 90))[0]
        if len(rumble_indices) > 0:
            avg_rumble_energy = np.mean(mag_db[rumble_indices])
            mid_band_indices = np.where((freqs >= 300) & (freqs <= 2000))[0]
            avg_mid_energy = np.mean(mag_db[mid_band_indices]) if len(mid_band_indices) > 0 else -40.0

            if avg_rumble_energy > (avg_mid_energy + 6.0) and avg_rumble_energy > -35.0:
                detected_noise.append({
                    "id": "low_rumble",
                    "name": "Low-Frequency Acoustic Rumble",
                    "type": "low_rumble",
                    "frequency": 60.0,
                    "frequency_range": [20.0, 90.0],
                    "magnitude_db": round(float(avg_rumble_energy), 1),
                    "prominence_db": round(float(avg_rumble_energy - avg_mid_energy), 1),
                    "description": "Sub-bass vibrations, wind turbulence, mechanical HVAC noise, or microphone handling thumps.",
                    "suggested_filter": {
                        "family": "IIR",
                        "filter_type": "highpass",
                        "subtype": "butterworth",
                        "order": 4,
                        "cutoff": 100.0,
                        "label": "High-Pass Filter (Cutoff: 100 Hz)"
                    },
                    "is_potential": True,
                    "severity": "Moderate"
                })

        # 3. Check for High-Frequency Hiss / Thermal Noise (> 4500 Hz)
        hiss_cutoff = 4500.0
        if (fs / 2.0) > (hiss_cutoff + 500):
            hiss_indices = np.where((freqs >= hiss_cutoff) & (freqs <= (fs / 2.0) - 200))[0]
            if len(hiss_indices) > 0:
                avg_hiss_energy = np.mean(mag_db[hiss_indices])
                voice_band_indices = np.where((freqs >= 300) & (freqs <= 3000))[0]
                avg_voice_energy = np.mean(mag_db[voice_band_indices]) if len(voice_band_indices) > 0 else -40.0

                if avg_hiss_energy > -40.0 and (avg_hiss_energy - avg_voice_energy) > -12.0:
                    detected_noise.append({
                        "id": "high_hiss",
                        "name": "High-Frequency Hiss / Electronic Noise",
                        "type": "high_hiss",
                        "frequency": round((hiss_cutoff + fs/2)/2, 1),
                        "frequency_range": [round(hiss_cutoff, 1), round((fs / 2.0) - 100, 1)],
                        "magnitude_db": round(float(avg_hiss_energy), 1),
                        "prominence_db": round(float(avg_hiss_energy - avg_voice_energy), 1),
                        "description": "Broadband high-frequency hiss from preamplifiers, thermal noise, or digital quantization.",
                        "suggested_filter": {
                            "family": "FIR",
                            "filter_type": "lowpass",
                            "subtype": "fir_window",
                            "order": 51,
                            "window": "hamming",
                            "cutoff": 3800.0,
                            "label": "FIR Low-Pass Filter (Cutoff: 3800 Hz)"
                        },
                        "is_potential": True,
                        "severity": "Moderate"
                    })

        # 4. Search for Narrowband Tonal Whistle (> 100 Hz, sharp isolated spikes)
        peaks, properties = signal.find_peaks(mag_db, height=-35, distance=int(len(freqs)/150), prominence=14)
        for p in peaks:
            f = freqs[p]
            # Exclude 50/60Hz mains already handled
            if abs(f - 50) < 5 or abs(f - 60) < 5 or abs(f - 100) < 5 or abs(f - 120) < 5:
                continue
            if f > 800 and f < (fs / 2.0) - 500:
                detected_noise.append({
                    "id": f"tone_{int(f)}",
                    "name": f"Narrowband Tonal Whistle ({int(f)} Hz)",
                    "type": "narrowband_tone",
                    "frequency": round(float(f), 1),
                    "frequency_range": [round(f - 25, 1), round(f + 25, 1)],
                    "magnitude_db": round(float(mag_db[p]), 1),
                    "prominence_db": round(float(properties["prominences"][np.where(peaks == p)[0][0]]), 1),
                    "description": f"Sharp tonal harmonic or acoustic feedback spike located at {int(f)} Hz.",
                    "suggested_filter": {
                        "family": "IIR",
                        "filter_type": "bandstop",
                        "subtype": "butterworth",
                        "order": 2,
                        "low_cutoff": max(20, round(f - 30, 1)),
                        "high_cutoff": min(fs/2 - 10, round(f + 30, 1)),
                        "label": f"Notch Filter at {int(f)} Hz"
                    },
                    "is_potential": True,
                    "severity": "High"
                })

        return detected_noise

    @classmethod
    def design_filter(cls, filter_config, fs):
        """
        Designs either an FIR filter (b, a) or IIR filter (SOS format).
        Validates cutoff frequencies against Nyquist (fs/2).
        Returns:
          - 'kind': 'fir' or 'iir'
          - 'coefficients': b array or SOS matrix
          - 'details': metadata for logging and display
        """
        nyquist = fs / 2.0
        family = filter_config.get("family", "FIR").upper()  # 'FIR' or 'IIR'
        ftype = filter_config.get("filter_type", "lowpass").lower()  # lowpass, highpass, bandpass, bandstop
        order = int(filter_config.get("order", 31))

        if family == "FIR":
            # FIR Window-based design using scipy.signal.firwin
            window = filter_config.get("window", "hamming")
            
            # For highpass and bandstop FIR filters, number of taps MUST be odd
            numtaps = order if (order % 2 != 0) else order + 1

            if ftype in ["lowpass", "highpass"]:
                cutoff = float(filter_config.get("cutoff", 1000.0))
                if cutoff <= 0 or cutoff >= nyquist:
                    raise ValueError(f"Cutoff frequency {cutoff} Hz must be between 0 and Nyquist ({nyquist} Hz)")
                
                pass_zero = True if ftype == "lowpass" else False
                b = signal.firwin(numtaps, cutoff, window=window, pass_zero=pass_zero, fs=fs)
                
            elif ftype in ["bandpass", "bandstop"]:
                low_c = float(filter_config.get("low_cutoff", 300.0))
                high_c = float(filter_config.get("high_cutoff", 3000.0))
                if low_c >= high_c:
                    raise ValueError(f"Low cutoff ({low_c} Hz) must be strictly less than high cutoff ({high_c} Hz)")
                if low_c <= 0 or high_c >= nyquist:
                    raise ValueError(f"Cutoffs [{low_c}, {high_c}] must be within (0, {nyquist}) Hz")

                pass_zero = False if ftype == "bandpass" else True
                b = signal.firwin(numtaps, [low_c, high_c], window=window, pass_zero=pass_zero, fs=fs)
            else:
                raise ValueError(f"Unsupported FIR filter type: {ftype}")

            return {
                "kind": "fir",
                "b": b,
                "a": np.array([1.0]),
                "order": numtaps - 1,
                "taps": numtaps,
                "window": window,
                "family": "FIR",
                "filter_type": ftype
            }

        elif family == "IIR":
            # IIR Filter design using Second-Order Sections (SOS) for numerical stability
            subtype = filter_config.get("subtype", "butterworth").lower()
            rp = float(filter_config.get("ripple", 1.0))  # dB ripple for Chebyshev Type I

            if ftype in ["lowpass", "highpass"]:
                cutoff = float(filter_config.get("cutoff", 1000.0))
                if cutoff <= 0 or cutoff >= nyquist:
                    raise ValueError(f"Cutoff {cutoff} Hz must be between 0 and Nyquist ({nyquist} Hz)")

                if subtype == "chebyshev1":
                    sos = signal.cheby1(order, rp, cutoff, btype=ftype, output='sos', fs=fs)
                else:  # butterworth
                    sos = signal.butter(order, cutoff, btype=ftype, output='sos', fs=fs)

            elif ftype in ["bandpass", "bandstop"]:
                low_c = float(filter_config.get("low_cutoff", 300.0))
                high_c = float(filter_config.get("high_cutoff", 3000.0))
                if low_c >= high_c:
                    raise ValueError(f"Low cutoff ({low_c} Hz) must be strictly less than high cutoff ({high_c} Hz)")
                if low_c <= 0 or high_c >= nyquist:
                    raise ValueError(f"Cutoffs [{low_c}, {high_c}] must be within (0, {nyquist}) Hz")

                if subtype == "chebyshev1":
                    sos = signal.cheby1(order, rp, [low_c, high_c], btype=ftype, output='sos', fs=fs)
                else:  # butterworth
                    sos = signal.butter(order, [low_c, high_c], btype=ftype, output='sos', fs=fs)
            else:
                raise ValueError(f"Unsupported IIR filter type: {ftype}")

            return {
                "kind": "iir",
                "sos": sos,
                "order": order,
                "subtype": subtype,
                "ripple": rp if subtype == "chebyshev1" else None,
                "family": "IIR",
                "filter_type": ftype
            }
        else:
            raise ValueError(f"Unknown filter family: {family}. Use 'FIR' or 'IIR'.")

    @classmethod
    def compute_frequency_response(cls, filter_config, fs, n_points=1024):
        """
        Calculates theoretical magnitude (dB) and phase (degrees) frequency response.
        Highlights passband, stopband, cutoffs, and 3dB points.
        """
        f_design = cls.design_filter(filter_config, fs)
        nyquist = fs / 2.0

        if f_design["kind"] == "fir":
            w, h = signal.freqz(f_design["b"], f_design["a"], worN=n_points, fs=fs)
        else:
            w, h = signal.sosfreqz(f_design["sos"], worN=n_points, fs=fs)

        mag = np.abs(h)
        # Avoid log of zero
        mag_db = 20 * np.log10(np.clip(mag, 1e-6, None))
        phase_deg = np.unwrap(np.angle(h)) * (180.0 / np.pi)

        # Annotations for passband, cutoff, stopband
        ftype = filter_config.get("filter_type", "lowpass").lower()
        annotations = []
        if ftype == "lowpass":
            c = float(filter_config.get("cutoff", 1000.0))
            annotations.append({"type": "cutoff", "frequency": c, "label": f"Cutoff (-3dB): {c} Hz"})
            annotations.append({"type": "passband", "range": [0, c], "label": "Passband"})
            annotations.append({"type": "stopband", "range": [c, nyquist], "label": "Stopband"})
        elif ftype == "highpass":
            c = float(filter_config.get("cutoff", 1000.0))
            annotations.append({"type": "cutoff", "frequency": c, "label": f"Cutoff (-3dB): {c} Hz"})
            annotations.append({"type": "stopband", "range": [0, c], "label": "Stopband"})
            annotations.append({"type": "passband", "range": [c, nyquist], "label": "Passband"})
        elif ftype == "bandpass":
            l_c = float(filter_config.get("low_cutoff", 300.0))
            h_c = float(filter_config.get("high_cutoff", 3000.0))
            annotations.append({"type": "cutoff", "frequency": l_c, "label": f"Low Cutoff: {l_c} Hz"})
            annotations.append({"type": "cutoff", "frequency": h_c, "label": f"High Cutoff: {h_c} Hz"})
            annotations.append({"type": "passband", "range": [l_c, h_c], "label": "Passband"})
        elif ftype == "bandstop":
            l_c = float(filter_config.get("low_cutoff", 300.0))
            h_c = float(filter_config.get("high_cutoff", 3000.0))
            annotations.append({"type": "cutoff", "frequency": l_c, "label": f"Notch Low: {l_c} Hz"})
            annotations.append({"type": "cutoff", "frequency": h_c, "label": f"Notch High: {h_c} Hz"})
            annotations.append({"type": "stopband", "range": [l_c, h_c], "label": "Stopband / Notch"})

        return {
            "frequency": [round(float(f), 1) for f in w],
            "magnitude_db": [round(float(m), 2) for m in mag_db],
            "phase_deg": [round(float(p), 2) for p in phase_deg],
            "annotations": annotations,
            "filter_specs": {
                "family": filter_config.get("family"),
                "type": filter_config.get("filter_type"),
                "order": f_design.get("order"),
                "taps": f_design.get("taps"),
                "phase_linearity": "Linear Phase (Zero Phase Distortion)" if f_design["kind"] == "fir" else "Non-linear Phase (Minimum Phase)"
            }
        }

    @classmethod
    def apply_filter(cls, data, fs, filter_config, zero_phase=True):
        """
        Applies FIR or IIR filter to audio data.
        Measures real execution time using time.perf_counter().
        """
        f_design = cls.design_filter(filter_config, fs)

        t_start = time.perf_counter()

        if f_design["kind"] == "fir":
            b = f_design["b"]
            a = f_design["a"]
            if zero_phase:
                filtered_data = signal.filtfilt(b, a, data)
            else:
                filtered_data = signal.lfilter(b, a, data)
        else:
            sos = f_design["sos"]
            if zero_phase:
                filtered_data = signal.sosfiltfilt(sos, data)
            else:
                filtered_data = signal.sosfilt(sos, data)

        elapsed_ms = (time.perf_counter() - t_start) * 1000.0

        # Avoid NaN or Inf values
        filtered_data = np.nan_to_num(filtered_data, nan=0.0, posinf=0.0, neginf=0.0)

        # Normalize to prevent clipping if magnitude grew
        peak = np.max(np.abs(filtered_data))
        if peak > 1.0:
            filtered_data = filtered_data / (peak + 1e-6)

        return filtered_data.astype(np.float32), round(elapsed_ms, 3)

    @classmethod
    def compute_metrics(cls, original_data, filtered_data, fs, clean_reference=None, filter_config=None):
        """
        Computes DSP performance metrics:
        - SNR (Signal-to-Noise Ratio)
        - Delta SNR (SNR Improvement)
        - Estimated Noise Reduction (dB)
        - PSNR (Peak Signal-to-Noise Ratio)
        - Processing Time (ms)
        - Clear scientific labeling indicating Ground Truth vs Spectral Estimation
        """
        orig_power = np.mean(original_data**2)
        filt_power = np.mean(filtered_data**2)

        has_ground_truth = (clean_reference is not None and len(clean_reference) == len(original_data))

        if has_ground_truth:
            # Rigorous College DSP Ground-Truth Formula
            clean_power = np.mean(clean_reference**2)
            noise_in = original_data - clean_reference
            noise_out = filtered_data - clean_reference

            noise_in_power = np.mean(noise_in**2)
            noise_out_power = np.mean(noise_out**2)

            snr_in = 10 * np.log10(clean_power / (noise_in_power + 1e-12))
            snr_out = 10 * np.log10(clean_power / (noise_out_power + 1e-12))
            delta_snr = snr_out - snr_in

            # Noise power reduction in dB
            noise_reduction_db = 10 * np.log10((noise_in_power + 1e-12) / (noise_out_power + 1e-12))

            metric_type = "Ground Truth (Exact Reference Available)"
            metric_notes = "Metrics computed against calibrated synthetic clean signal reference."
        else:
            # Blind / Real-World Audio: Reference-free spectral noise power reduction estimation
            # Measure spectral energy removed in the attenuated / stopband frequencies
            n = len(original_data)
            orig_spec = np.abs(np.fft.rfft(original_data))**2
            filt_spec = np.abs(np.fft.rfft(filtered_data))**2
            
            # Attenuation ratio of removed noise energy
            diff_spec = np.maximum(0, orig_spec - filt_spec)
            attenuated_energy = np.sum(diff_spec)
            total_orig_energy = np.sum(orig_spec) + 1e-12

            # Estimated Noise Reduction in dB
            if attenuated_energy > 0:
                noise_reduction_db = min(50.0, 10 * np.log10(total_orig_energy / (np.sum(filt_spec) + 1e-12)))
            else:
                noise_reduction_db = 0.0

            # Blind SNR estimation based on spectral crest / in-band vs floor
            snr_in = 10 * np.log10((orig_power + 1e-12) / (np.var(original_data - filtered_data) + 1e-12))
            snr_out = snr_in + max(0.0, min(25.0, noise_reduction_db * 0.75))
            delta_snr = snr_out - snr_in

            metric_type = "Estimated (Reference-Free Spectral Estimation)"
            metric_notes = (
                "No pristine clean reference signal was uploaded. True SNR improvement cannot be known "
                "mathematically without ground truth. Metrics represent estimated stopband spectral attenuation."
            )

        # Peak Signal-to-Noise Ratio (PSNR)
        mse = np.mean((original_data - filtered_data)**2)
        max_val = np.max(np.abs(original_data))
        psnr = float(10 * np.log10((max_val**2) / (mse + 1e-12))) if mse > 0 else 99.0

        return {
            "has_ground_truth": has_ground_truth,
            "metric_type": metric_type,
            "metric_notes": metric_notes,
            "snr_input_db": round(float(snr_in), 2),
            "snr_output_db": round(float(snr_out), 2),
            "delta_snr_db": round(float(delta_snr), 2),
            "noise_reduction_db": round(float(noise_reduction_db), 2),
            "psnr_db": round(float(psnr), 2),
            "residual_rms": round(float(np.sqrt(np.mean((original_data - filtered_data)**2))), 4),
            "filter_order": filter_config.get("order", "N/A") if filter_config else "N/A",
            "filter_family": filter_config.get("family", "N/A") if filter_config else "N/A"
        }

    @classmethod
    def compare_filters(cls, data, fs, filter_list, clean_reference=None):
        """
        Executes a battery of candidate FIR and IIR filters on the same audio signal,
        gathering execution speed, noise reduction, and SNR comparisons.
        """
        results = []
        for config in filter_list:
            try:
                filt_data, elapsed_ms = cls.apply_filter(data, fs, config)
                metrics = cls.compute_metrics(data, filt_data, fs, clean_reference, config)
                metrics["processing_time_ms"] = elapsed_ms
                metrics["filter_name"] = config.get("name", f"{config.get('family')} {config.get('filter_type')}")
                metrics["family"] = config.get("family")
                metrics["filter_type"] = config.get("filter_type")
                metrics["subtype"] = config.get("subtype", config.get("window", ""))
                metrics["order"] = config.get("order")
                metrics["phase_response"] = "Linear" if config.get("family").upper() == "FIR" else "Non-linear"
                results.append(metrics)
            except Exception as e:
                results.append({
                    "filter_name": config.get("name", "Filter"),
                    "error": str(e)
                })

        return results

    @classmethod
    def recommend_best_filter(cls, data, fs, detected_noise, clean_reference=None):
        """
        Intelligent Recommendation Engine:
        Evaluates detected noise types and audio characteristics to suggest the optimal filter.
        Considers:
          1. Noise suppression efficiency (Stopband rejection)
          2. Signal preservation (Passband flatness)
          3. Phase linearity vs latency
          4. Computational efficiency
        """
        if not detected_noise or len(detected_noise) == 0:
            return {
                "recommendation_status": "insufficient_data",
                "message": "No prominent noise components were automatically detected in this audio signal.",
                "reason": "The frequency spectrum shows a balanced distribution without dominant uncharacteristic spikes.",
                "candidate_filters": []
            }

        primary_noise = detected_noise[0]
        noise_type = primary_noise.get("type")
        noise_freq = primary_noise.get("frequency")

        candidates = []

        if noise_type == "mains_hum":
            # 50 Hz or 60 Hz hum: Compare Butterworth Notch vs FIR Notch
            candidates = [
                {
                    "name": "IIR Butterworth Notch Filter (Order 2)",
                    "family": "IIR",
                    "subtype": "butterworth",
                    "filter_type": "bandstop",
                    "order": 2,
                    "low_cutoff": max(15, noise_freq - 3),
                    "high_cutoff": min(fs/2 - 5, noise_freq + 3),
                    "expected_latency": "Extremely Low (~0.1ms)",
                    "phase_linearity": "Non-linear near notch"
                },
                {
                    "name": "IIR Butterworth Notch Filter (Order 4)",
                    "family": "IIR",
                    "subtype": "butterworth",
                    "filter_type": "bandstop",
                    "order": 4,
                    "low_cutoff": max(15, noise_freq - 4),
                    "high_cutoff": min(fs/2 - 5, noise_freq + 4),
                    "expected_latency": "Very Low (~0.2ms)",
                    "phase_linearity": "Non-linear near notch"
                },
                {
                    "name": "FIR Hamming Bandstop Filter (Taps 101)",
                    "family": "FIR",
                    "subtype": "fir_window",
                    "window": "hamming",
                    "filter_type": "bandstop",
                    "order": 101,
                    "low_cutoff": max(15, noise_freq - 6),
                    "high_cutoff": min(fs/2 - 5, noise_freq + 6),
                    "expected_latency": "Moderate (~1.5ms)",
                    "phase_linearity": "Strictly Linear"
                }
            ]
            primary_reason = (
                f"Detected dominant AC powerline interference at {noise_freq} Hz. "
                "An IIR Second-Order Notch (Bandstop) filter is mathematically superior because it achieves "
                "> 35 dB attenuation in an extremely narrow 6 Hz notch band with minimal computation and virtually "
                "zero coloration to speech/music frequencies outside the notch."
            )
            top_filter_name = "IIR Butterworth Notch Filter (Order 2)"

        elif noise_type == "low_rumble":
            candidates = [
                {
                    "name": "IIR Butterworth High-Pass Filter (Order 4)",
                    "family": "IIR",
                    "subtype": "butterworth",
                    "filter_type": "highpass",
                    "order": 4,
                    "cutoff": 100.0,
                    "expected_latency": "Extremely Low (~0.15ms)",
                    "phase_linearity": "Non-linear"
                },
                {
                    "name": "IIR Chebyshev Type I High-Pass (Order 4, 1dB Ripple)",
                    "family": "IIR",
                    "subtype": "chebyshev1",
                    "ripple": 1.0,
                    "filter_type": "highpass",
                    "order": 4,
                    "cutoff": 100.0,
                    "expected_latency": "Low (~0.18ms)",
                    "phase_linearity": "Non-linear"
                },
                {
                    "name": "FIR Blackman High-Pass (Taps 81)",
                    "family": "FIR",
                    "subtype": "fir_window",
                    "window": "blackman",
                    "filter_type": "highpass",
                    "order": 81,
                    "cutoff": 100.0,
                    "expected_latency": "Moderate (~1.2ms)",
                    "phase_linearity": "Strictly Linear"
                }
            ]
            primary_reason = (
                "Sub-bass acoustic rumble below 100 Hz detected. An IIR Butterworth High-Pass (Order 4) "
                "provides a steep 24 dB/octave attenuation curve below 100 Hz with maximally flat passband "
                "response in the audible vocal range."
            )
            top_filter_name = "IIR Butterworth High-Pass Filter (Order 4)"

        elif noise_type == "high_hiss":
            candidates = [
                {
                    "name": "FIR Hamming Low-Pass Filter (Taps 65)",
                    "family": "FIR",
                    "subtype": "fir_window",
                    "window": "hamming",
                    "filter_type": "lowpass",
                    "order": 65,
                    "cutoff": 3800.0,
                    "expected_latency": "Low-Moderate (~1.0ms)",
                    "phase_linearity": "Strictly Linear (Zero Phase Distortion)"
                },
                {
                    "name": "IIR Butterworth Low-Pass (Order 6)",
                    "family": "IIR",
                    "subtype": "butterworth",
                    "filter_type": "lowpass",
                    "order": 6,
                    "cutoff": 3800.0,
                    "expected_latency": "Extremely Low (~0.2ms)",
                    "phase_linearity": "Non-linear near cutoff"
                },
                {
                    "name": "IIR Chebyshev Type I Low-Pass (Order 5, 0.5dB Ripple)",
                    "family": "IIR",
                    "subtype": "chebyshev1",
                    "ripple": 0.5,
                    "filter_type": "lowpass",
                    "order": 5,
                    "cutoff": 3800.0,
                    "expected_latency": "Very Low (~0.2ms)",
                    "phase_linearity": "Non-linear with ripple"
                }
            ]
            primary_reason = (
                "High-frequency electronic hiss detected above 4 kHz. FIR Hamming Low-Pass (65 taps) is recommended "
                "for audio fidelity because its strictly linear phase preserves natural voice and musical timbre "
                "without phase dispersion artifacts."
            )
            top_filter_name = "FIR Hamming Low-Pass Filter (Taps 65)"

        else:  # Narrowband tone
            candidates = [
                {
                    "name": f"IIR Butterworth Notch at {int(noise_freq)} Hz (Order 2)",
                    "family": "IIR",
                    "subtype": "butterworth",
                    "filter_type": "bandstop",
                    "order": 2,
                    "low_cutoff": max(20, noise_freq - 25),
                    "high_cutoff": min(fs/2 - 10, noise_freq + 25),
                    "expected_latency": "Ultra Fast (~0.1ms)",
                    "phase_linearity": "Local phase shift"
                },
                {
                    "name": f"FIR Bandstop at {int(noise_freq)} Hz (Taps 91)",
                    "family": "FIR",
                    "subtype": "fir_window",
                    "window": "hamming",
                    "filter_type": "bandstop",
                    "order": 91,
                    "low_cutoff": max(20, noise_freq - 35),
                    "high_cutoff": min(fs/2 - 10, noise_freq + 35),
                    "expected_latency": "Moderate (~1.4ms)",
                    "phase_linearity": "Strictly Linear"
                }
            ]
            primary_reason = (
                f"Isolated acoustic feedback / whistle detected at {int(noise_freq)} Hz. A sharp second-order "
                "IIR notch filter cuts the unwanted spike by > 30 dB while keeping 99% of spectral audio intact."
            )
            top_filter_name = f"IIR Butterworth Notch at {int(noise_freq)} Hz (Order 2)"

        # Run real metrics on each candidate to prove actual performance
        benchmark_results = cls.compare_filters(data, fs, candidates, clean_reference)

        # Select recommended filter configuration
        recommended_filter_cfg = next((c for c in candidates if c["name"] == top_filter_name), candidates[0])
        matching_metric = next((m for m in benchmark_results if m.get("filter_name") == top_filter_name), benchmark_results[0])

        return {
            "recommendation_status": "success",
            "primary_noise_addressed": primary_noise,
            "recommended_filter_name": top_filter_name,
            "recommended_config": recommended_filter_cfg,
            "reason": primary_reason,
            "measured_performance": matching_metric,
            "all_evaluated_candidates": benchmark_results,
            "academic_tradeoffs": {
                "fir_advantages": "Guaranteed stability, strictly linear phase, zero phase distortion in audio.",
                "iir_advantages": "High attenuation with low order, 10x-50x less computation, ideal for real-time sharp notches.",
                "selection_criterion": "Balanced noise rejection in stopband vs passband signal preservation & phase preservation."
            }
        }

    @classmethod
    def generate_demo_signal(cls, fs=44100, duration=3.0, noise_types=None):
        """
        Generates a calibrated synthetic audio signal containing known clean harmonics
        plus user-selected noise types (50Hz hum, high hiss, low rumble).
        Saves both noisy signal and ground truth clean signal for 100% exact SNR calculation.
        """
        if noise_types is None:
            noise_types = ["hum", "hiss"]

        n_samples = int(fs * duration)
        t = np.linspace(0, duration, n_samples, endpoint=False)

        # Clean Signal: Musical chord (A4 440 Hz + E5 660 Hz + A5 880 Hz) with gentle envelope
        envelope = np.sin(np.pi * t / duration) ** 0.5  # Soft attack and release
        clean_audio = (
            0.50 * np.sin(2 * np.pi * 440.0 * t) +
            0.30 * np.sin(2 * np.pi * 660.0 * t) +
            0.20 * np.sin(2 * np.pi * 880.0 * t)
        ) * envelope

        # Normalize clean audio
        clean_audio = clean_audio / np.max(np.abs(clean_audio)) * 0.7

        noisy_audio = np.copy(clean_audio)

        added_noise_components = []

        # 1. Add 50 Hz AC Power Line Hum (+ 100 Hz harmonic)
        if "hum" in noise_types:
            hum = 0.35 * np.sin(2 * np.pi * 50.0 * t) + 0.12 * np.sin(2 * np.pi * 100.0 * t)
            noisy_audio += hum
            added_noise_components.append("50 Hz Power Line Hum (with 100 Hz harmonic)")

        # 2. Add High-Frequency Hiss (Gaussian noise bandpassed 5 kHz - 12 kHz)
        if "hiss" in noise_types:
            white_noise = np.random.normal(0, 0.18, n_samples)
            # Bandpass between 5000 and 12000 Hz
            sos_hiss = signal.butter(4, [5000, min(14000, fs/2 - 500)], btype='bandpass', output='sos', fs=fs)
            hiss = signal.sosfilt(sos_hiss, white_noise) * 2.0
            noisy_audio += hiss
            added_noise_components.append("High-Frequency Hiss (5 kHz - 12 kHz)")

        # 3. Add Low-Frequency Rumble (40 Hz sub-rumble)
        if "rumble" in noise_types:
            rumble = 0.30 * np.sin(2 * np.pi * 35.0 * t) + 0.15 * np.sin(2 * np.pi * 70.0 * t)
            noisy_audio += rumble
            added_noise_components.append("Low-Frequency Acoustic Rumble (35 Hz - 70 Hz)")

        # Peak normalize composite noisy signal
        peak = np.max(np.abs(noisy_audio))
        if peak > 0.95:
            noisy_audio = (noisy_audio / peak) * 0.95

        return clean_audio.astype(np.float32), noisy_audio.astype(np.float32), fs, added_noise_components
