from __future__ import annotations

from typing import List, Optional, Tuple

import numpy as np
from scipy import signal

from app.config import get_settings


def estimate_bpm(
    roi_means: List[np.ndarray], fps: float
) -> Tuple[Optional[float], float, int]:
    """
    이마 ROI의 시간에 따른 RGB 평균 시퀀스에서 심박(bpm)을 추정한다.
    green 채널 위주 + detrend + 대역통과 + FFT 피크. (bpm, confidence, samples) 반환.
    """
    settings = get_settings()
    n = len(roi_means)
    if n < int(fps * 4) or fps <= 0:
        # 신뢰할 만한 추정에는 최소 4초 이상 신호 필요
        return None, 0.0, n

    arr = np.asarray(roi_means, dtype=np.float64)  # (n, 3) = R,G,B
    green = arr[:, 1]

    # 1) 정규화 + detrend
    green = (green - np.mean(green)) / (np.std(green) + 1e-8)
    green = signal.detrend(green)

    # 2) 대역통과 필터 (심박 대역)
    nyquist = fps / 2.0
    low = settings.rppg_low_hz / nyquist
    high = min(settings.rppg_high_hz / nyquist, 0.99)
    if low <= 0 or high <= low:
        return None, 0.0, n
    b, a = signal.butter(3, [low, high], btype="band")
    filtered = signal.filtfilt(b, a, green)

    # 3) FFT로 주파수 스펙트럼 → 심박 대역 내 피크
    fft = np.abs(np.fft.rfft(filtered * np.hanning(len(filtered))))
    freqs = np.fft.rfftfreq(len(filtered), d=1.0 / fps)
    band = (freqs >= settings.rppg_low_hz) & (freqs <= settings.rppg_high_hz)
    if not np.any(band):
        return None, 0.0, n

    band_power = fft[band]
    band_freqs = freqs[band]
    peak_idx = int(np.argmax(band_power))
    peak_freq = float(band_freqs[peak_idx])
    bpm = round(peak_freq * 60.0, 1)

    # 신뢰도: 피크 파워가 대역 전체 평균 대비 얼마나 두드러지는지
    mean_power = float(np.mean(band_power)) + 1e-8
    snr = float(band_power[peak_idx]) / mean_power
    confidence = float(max(0.0, min(1.0, (snr - 1.0) / 5.0)))

    return bpm, round(confidence, 3), n
