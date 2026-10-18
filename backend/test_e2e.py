import sys
import json
from app import app

def run_tests():
    client = app.test_client()

    # 1. Health check
    res = client.get('/api/health')
    assert res.status_code == 200, f'Health check failed: {res.data}'
    print('[PASS] /api/health is online')

    # 2. Demo signal generation
    res = client.post('/api/generate-demo', json={'noise_types': ['hum', 'hiss']})
    assert res.status_code == 200, f'Generate demo failed: {res.data}'
    demo_data = res.get_json()
    audio_id = demo_data['audio_id']
    print(f'[PASS] /api/generate-demo generated audio_id: {audio_id}')

    # 3. Frequency response test for all 6 filters
    fir_windows = ['Hamming Window', 'Hann (Hanning) Window', 'Blackman Window', 'Rectangular Window']
    for win in fir_windows:
        cfg = {'family': 'FIR', 'method': win, 'filter_type': 'lowpass', 'order': 50, 'cutoff': 2000}
        r = client.post('/api/filter/response', json={'filter_config': cfg, 'fs': 44100})
        assert r.status_code == 200, f'FIR {win} response failed: {r.data}'
    print('[PASS] All 4 FIR windows frequency responses computed')

    for meth in ['Butterworth', 'Chebyshev']:
        cfg = {'family': 'IIR', 'method': meth, 'filter_type': 'lowpass', 'order': 4, 'cutoff': 2000, 'ripple': 1.0}
        r = client.post('/api/filter/response', json={'filter_config': cfg, 'fs': 44100})
        assert r.status_code == 200, f'IIR {meth} response failed: {r.data}'
    print('[PASS] Both IIR methods (Butterworth, Chebyshev) frequency responses computed')

    # 4. Filter apply test for each of the 6 filters
    configs_to_apply = [
        {'family': 'FIR', 'method': 'Hamming Window', 'filter_type': 'lowpass', 'order': 50, 'cutoff': 2000},
        {'family': 'FIR', 'method': 'Hann (Hanning) Window', 'filter_type': 'highpass', 'order': 50, 'cutoff': 500},
        {'family': 'FIR', 'method': 'Blackman Window', 'filter_type': 'bandpass', 'order': 50, 'low_cutoff': 300, 'high_cutoff': 3000},
        {'family': 'FIR', 'method': 'Rectangular Window', 'filter_type': 'bandstop', 'order': 50, 'low_cutoff': 45, 'high_cutoff': 55},
        {'family': 'IIR', 'method': 'Butterworth', 'filter_type': 'lowpass', 'order': 4, 'cutoff': 2000},
        {'family': 'IIR', 'method': 'Chebyshev', 'filter_type': 'bandpass', 'order': 4, 'low_cutoff': 300, 'high_cutoff': 3000, 'ripple': 1.0},
    ]

    for cfg in configs_to_apply:
        r = client.post('/api/filter/apply', json={'audio_id': audio_id, 'filter_config': cfg})
        assert r.status_code == 200, f'Apply filter {cfg} failed: {r.data}'
        resp_data = r.get_json()
        assert 'filtered_audio_id' in resp_data
        assert 'processing_time_ms' in resp_data['metrics']
        print(f"[PASS] Applied {cfg['family']} {cfg['method']} ({cfg['filter_type']}): {resp_data['metrics']['processing_time_ms']} ms")

    # 5. Filter compare test (all 6 filters simultaneously)
    r = client.post('/api/filter/compare', json={'audio_id': audio_id, 'filter_spec': {'filter_type': 'lowpass', 'cutoff': 2000}})
    assert r.status_code == 200, f'Filter compare failed: {r.data}'
    comp_data = r.get_json()['comparison']
    assert len(comp_data) == 6, f'Expected 6 filters, got {len(comp_data)}'
    print('[PASS] /api/filter/compare returned all 6 filters with real metrics and audio IDs:')
    for f in comp_data:
        print(f"   - {f['filter_name']}: {f['processing_time_ms']} ms | Noise Red: +{f['noise_reduction_db']} dB | AudioID: {f.get('filtered_audio_id')}")

    # 6. Validation tests
    bad_cfg = {'family': 'FIR', 'method': 'Hamming Window', 'filter_type': 'lowpass', 'order': 50, 'cutoff': 30000}
    r = client.post('/api/filter/apply', json={'audio_id': audio_id, 'filter_config': bad_cfg})
    assert r.status_code == 400, f'Expected 400 for cutoff > Nyquist, got {r.status_code}'
    print('[PASS] Validation rejected cutoff > Nyquist with HTTP 400')

    print('\nALL BACKEND DSP TESTS PASSED SUCCESSFULLY!')

if __name__ == '__main__':
    run_tests()
