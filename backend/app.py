import os
import uuid
import time
import shutil
from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
from dsp_analyzer import DSPAnalyzer
import numpy as np

app = Flask(__name__)
# Enable CORS for React frontend
CORS(app, resources={r"/api/*": {"origins": "*"}})

UPLOAD_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)

# In-memory storage for active audio sessions (audio_id -> metadata & file paths)
AUDIO_STORE = {}

def cleanup_old_files():
    """Removes temporary audio files older than 2 hours."""
    now = time.time()
    for fname in os.listdir(UPLOAD_DIR):
        fpath = os.path.join(UPLOAD_DIR, fname)
        if os.path.isfile(fpath) and (now - os.path.getmtime(fpath)) > 7200:
            try:
                os.remove(fpath)
            except Exception:
                pass

@app.route("/api/health", methods=["GET"])
def health_check():
    return jsonify({
        "status": "online",
        "service": "Smart Audio Noise Analyzer DSP API",
        "version": "1.0.0"
    })

@app.route("/api/upload", methods=["POST"])
def upload_audio():
    cleanup_old_files()
    if "audio" not in request.files:
        return jsonify({"error": "No audio file provided in request"}), 400

    file = request.files["audio"]
    if file.filename == "":
        return jsonify({"error": "Empty filename provided"}), 400

    audio_id = str(uuid.uuid4())
    filename = file.filename
    ext = os.path.splitext(filename)[1].lower()
    if ext not in [".wav", ".mp3", ".ogg", ".flac", ".m4a"]:
        ext = ".wav"

    saved_path = os.path.join(UPLOAD_DIR, f"{audio_id}_orig{ext}")
    wav_path = os.path.join(UPLOAD_DIR, f"{audio_id}.wav")

    try:
        file.save(saved_path)
        # Load and convert to standard 32-bit float mono WAV
        data, fs, channels = DSPAnalyzer.load_audio(saved_path)
        DSPAnalyzer.save_audio(wav_path, data, fs)

        time_stats = DSPAnalyzer.get_time_domain_stats(data, fs)
        fft_stats = DSPAnalyzer.compute_fft(data, fs)
        noise_components = DSPAnalyzer.detect_noise_components(data, fs)

        AUDIO_STORE[audio_id] = {
            "file_path": wav_path,
            "filename": filename,
            "fs": fs,
            "channels": channels,
            "clean_ref_id": None
        }

        return jsonify({
            "success": True,
            "audio_id": audio_id,
            "filename": filename,
            "channels": channels,
            "time_stats": time_stats,
            "fft_stats": fft_stats,
            "noise_components": noise_components
        })
    except Exception as e:
        return jsonify({"error": f"Failed to process audio file: {str(e)}"}), 500

@app.route("/api/record", methods=["POST"])
def record_audio():
    cleanup_old_files()
    if "audio" not in request.files:
        return jsonify({"error": "No recorded audio stream received"}), 400

    file = request.files["audio"]
    audio_id = str(uuid.uuid4())
    raw_path = os.path.join(UPLOAD_DIR, f"{audio_id}_record_raw.wav")
    wav_path = os.path.join(UPLOAD_DIR, f"{audio_id}.wav")

    try:
        file.save(raw_path)
        data, fs, channels = DSPAnalyzer.load_audio(raw_path)
        DSPAnalyzer.save_audio(wav_path, data, fs)

        time_stats = DSPAnalyzer.get_time_domain_stats(data, fs)
        fft_stats = DSPAnalyzer.compute_fft(data, fs)
        noise_components = DSPAnalyzer.detect_noise_components(data, fs)

        AUDIO_STORE[audio_id] = {
            "file_path": wav_path,
            "filename": "Microphone_Recording.wav",
            "fs": fs,
            "channels": channels,
            "clean_ref_id": None
        }

        return jsonify({
            "success": True,
            "audio_id": audio_id,
            "filename": "Microphone_Recording.wav",
            "channels": channels,
            "time_stats": time_stats,
            "fft_stats": fft_stats,
            "noise_components": noise_components
        })
    except Exception as e:
        return jsonify({"error": f"Failed to decode microphone recording: {str(e)}"}), 500

@app.route("/api/generate-demo", methods=["POST"])
def generate_demo():
    """Generates synthetic test signal with known ground truth clean reference."""
    cleanup_old_files()
    payload = request.get_json() or {}
    noise_types = payload.get("noise_types", ["hum", "hiss"])

    audio_id = str(uuid.uuid4())
    clean_id = str(uuid.uuid4())

    noisy_wav_path = os.path.join(UPLOAD_DIR, f"{audio_id}.wav")
    clean_wav_path = os.path.join(UPLOAD_DIR, f"{clean_id}.wav")

    try:
        clean_audio, noisy_audio, fs, added_noise = DSPAnalyzer.generate_demo_signal(
            fs=44100, duration=3.0, noise_types=noise_types
        )

        DSPAnalyzer.save_audio(noisy_wav_path, noisy_audio, fs)
        DSPAnalyzer.save_audio(clean_wav_path, clean_audio, fs)

        AUDIO_STORE[audio_id] = {
            "file_path": noisy_wav_path,
            "filename": "Calibrated_DSP_Demo_Signal.wav",
            "fs": fs,
            "channels": 1,
            "clean_ref_id": clean_id
        }

        AUDIO_STORE[clean_id] = {
            "file_path": clean_wav_path,
            "filename": "Ground_Truth_Clean_Reference.wav",
            "fs": fs,
            "channels": 1,
            "clean_ref_id": None
        }

        time_stats = DSPAnalyzer.get_time_domain_stats(noisy_audio, fs)
        fft_stats = DSPAnalyzer.compute_fft(noisy_audio, fs)
        noise_components = DSPAnalyzer.detect_noise_components(noisy_audio, fs)

        return jsonify({
            "success": True,
            "audio_id": audio_id,
            "clean_audio_id": clean_id,
            "filename": "Calibrated_DSP_Demo_Signal.wav",
            "added_noise_components": added_noise,
            "time_stats": time_stats,
            "fft_stats": fft_stats,
            "noise_components": noise_components,
            "is_calibrated_demo": True
        })
    except Exception as e:
        return jsonify({"error": f"Demo generation failed: {str(e)}"}), 500

@app.route("/api/analyze", methods=["POST"])
def analyze_signal():
    payload = request.get_json() or {}
    audio_id = payload.get("audio_id")
    if not audio_id or audio_id not in AUDIO_STORE:
        return jsonify({"error": "Audio session not found or expired"}), 404

    session = AUDIO_STORE[audio_id]
    try:
        data, fs, _ = DSPAnalyzer.load_audio(session["file_path"])
        time_stats = DSPAnalyzer.get_time_domain_stats(data, fs)
        fft_stats = DSPAnalyzer.compute_fft(data, fs)
        noise_components = DSPAnalyzer.detect_noise_components(data, fs)

        return jsonify({
            "success": True,
            "time_stats": time_stats,
            "fft_stats": fft_stats,
            "noise_components": noise_components
        })
    except Exception as e:
        return jsonify({"error": f"Analysis failed: {str(e)}"}), 500

@app.route("/api/filter/response", methods=["POST"])
def get_frequency_response():
    """Calculates theoretical filter frequency response without applying to audio."""
    payload = request.get_json() or {}
    filter_config = payload.get("filter_config")
    fs = float(payload.get("fs", 44100))

    if not filter_config:
        return jsonify({"error": "Missing filter_config"}), 400

    try:
        resp = DSPAnalyzer.compute_frequency_response(filter_config, fs)
        return jsonify({"success": True, "response": resp})
    except Exception as e:
        return jsonify({"error": f"Filter response error: {str(e)}"}), 400

@app.route("/api/filter/apply", methods=["POST"])
def apply_digital_filter():
    payload = request.get_json() or {}
    audio_id = payload.get("audio_id")
    filter_config = payload.get("filter_config")
    zero_phase = payload.get("zero_phase", True)

    if not audio_id or audio_id not in AUDIO_STORE:
        return jsonify({"error": "Audio session not found or expired"}), 404
    if not filter_config:
        return jsonify({"error": "Missing filter_config"}), 400

    session = AUDIO_STORE[audio_id]
    try:
        data, fs, _ = DSPAnalyzer.load_audio(session["file_path"])

        # Check if ground truth reference exists
        clean_reference = None
        if session.get("clean_ref_id") and session["clean_ref_id"] in AUDIO_STORE:
            clean_path = AUDIO_STORE[session["clean_ref_id"]]["file_path"]
            clean_reference, _, _ = DSPAnalyzer.load_audio(clean_path)

        # Apply FIR/IIR filter
        filtered_data, elapsed_ms = DSPAnalyzer.apply_filter(data, fs, filter_config, zero_phase=zero_phase)

        # Save filtered output
        filtered_id = str(uuid.uuid4())
        filtered_wav_path = os.path.join(UPLOAD_DIR, f"{filtered_id}.wav")
        DSPAnalyzer.save_audio(filtered_wav_path, filtered_data, fs)

        AUDIO_STORE[filtered_id] = {
            "file_path": filtered_wav_path,
            "filename": f"Filtered_{filter_config.get('family', 'Filter')}.wav",
            "fs": fs,
            "channels": 1,
            "clean_ref_id": session.get("clean_ref_id")
        }

        # Calculate time & FFT stats for filtered signal
        filt_time_stats = DSPAnalyzer.get_time_domain_stats(filtered_data, fs)
        filt_fft_stats = DSPAnalyzer.compute_fft(filtered_data, fs)

        # Compute scientific metrics
        metrics = DSPAnalyzer.compute_metrics(data, filtered_data, fs, clean_reference, filter_config)
        metrics["processing_time_ms"] = elapsed_ms

        # Frequency response of the applied filter
        freq_response = DSPAnalyzer.compute_frequency_response(filter_config, fs)

        return jsonify({
            "success": True,
            "filtered_audio_id": filtered_id,
            "filtered_time_stats": filt_time_stats,
            "filtered_fft_stats": filt_fft_stats,
            "metrics": metrics,
            "frequency_response": freq_response
        })
    except Exception as e:
        return jsonify({"error": f"Filter application failed: {str(e)}"}), 500

@app.route("/api/filter/compare", methods=["POST"])
def compare_filter_options():
    payload = request.get_json() or {}
    audio_id = payload.get("audio_id")
    custom_filters = payload.get("filters", None)

    if not audio_id or audio_id not in AUDIO_STORE:
        return jsonify({"error": "Audio session not found or expired"}), 404

    session = AUDIO_STORE[audio_id]
    try:
        data, fs, _ = DSPAnalyzer.load_audio(session["file_path"])

        clean_reference = None
        if session.get("clean_ref_id") and session["clean_ref_id"] in AUDIO_STORE:
            clean_path = AUDIO_STORE[session["clean_ref_id"]]["file_path"]
            clean_reference, _, _ = DSPAnalyzer.load_audio(clean_path)

        if not custom_filters:
            # Default battery of comprehensive candidate filters
            custom_filters = [
                {
                    "name": "FIR Hamming Low-Pass (Order 65, fc=3500Hz)",
                    "family": "FIR",
                    "subtype": "fir_window",
                    "window": "hamming",
                    "filter_type": "lowpass",
                    "order": 65,
                    "cutoff": 3500.0
                },
                {
                    "name": "IIR Butterworth Low-Pass (Order 4, fc=3500Hz)",
                    "family": "IIR",
                    "subtype": "butterworth",
                    "filter_type": "lowpass",
                    "order": 4,
                    "cutoff": 3500.0
                },
                {
                    "name": "IIR Chebyshev Type I Low-Pass (Order 4, 1dB Ripple, fc=3500Hz)",
                    "family": "IIR",
                    "subtype": "chebyshev1",
                    "ripple": 1.0,
                    "filter_type": "lowpass",
                    "order": 4,
                    "cutoff": 3500.0
                },
                {
                    "name": "IIR Butterworth Notch (Order 2, 48-52Hz)",
                    "family": "IIR",
                    "subtype": "butterworth",
                    "filter_type": "bandstop",
                    "order": 2,
                    "low_cutoff": 48.0,
                    "high_cutoff": 52.0
                },
                {
                    "name": "IIR Butterworth High-Pass (Order 4, fc=100Hz)",
                    "family": "IIR",
                    "subtype": "butterworth",
                    "filter_type": "highpass",
                    "order": 4,
                    "cutoff": 100.0
                }
            ]

        results = DSPAnalyzer.compare_filters(data, fs, custom_filters, clean_reference)
        return jsonify({"success": True, "comparison": results})
    except Exception as e:
        return jsonify({"error": f"Filter comparison failed: {str(e)}"}), 500

@app.route("/api/recommend", methods=["POST"])
def recommend_filter():
    payload = request.get_json() or {}
    audio_id = payload.get("audio_id")

    if not audio_id or audio_id not in AUDIO_STORE:
        return jsonify({"error": "Audio session not found or expired"}), 404

    session = AUDIO_STORE[audio_id]
    try:
        data, fs, _ = DSPAnalyzer.load_audio(session["file_path"])

        clean_reference = None
        if session.get("clean_ref_id") and session["clean_ref_id"] in AUDIO_STORE:
            clean_path = AUDIO_STORE[session["clean_ref_id"]]["file_path"]
            clean_reference, _, _ = DSPAnalyzer.load_audio(clean_path)

        noise_components = DSPAnalyzer.detect_noise_components(data, fs)
        recommendation = DSPAnalyzer.recommend_best_filter(data, fs, noise_components, clean_reference)

        return jsonify({"success": True, "recommendation": recommendation})
    except Exception as e:
        return jsonify({"error": f"Recommendation failed: {str(e)}"}), 500

@app.route("/api/audio/<audio_id>", methods=["GET"])
def stream_audio(audio_id):
    if audio_id not in AUDIO_STORE:
        return jsonify({"error": "Audio not found"}), 404

    session = AUDIO_STORE[audio_id]
    file_path = session["file_path"]
    if not os.path.exists(file_path):
        return jsonify({"error": "File on disk missing"}), 404

    return send_file(file_path, mimetype="audio/wav")

@app.route("/api/download/<audio_id>", methods=["GET"])
def download_audio(audio_id):
    if audio_id not in AUDIO_STORE:
        return jsonify({"error": "Audio not found"}), 404

    session = AUDIO_STORE[audio_id]
    file_path = session["file_path"]
    if not os.path.exists(file_path):
        return jsonify({"error": "File on disk missing"}), 404

    filename = session.get("filename", f"audio_{audio_id}.wav")
    return send_file(file_path, as_attachment=True, download_name=filename, mimetype="audio/wav")

if __name__ == "__main__":
    print("=" * 60)
    print("DSP Lab: Smart Audio Noise Analyzer & Digital Filter Selection")
    print("Backend Server running on http://127.0.0.1:5000")
    print("=" * 60)
    app.run(host="127.0.0.1", port=5000, debug=True)
