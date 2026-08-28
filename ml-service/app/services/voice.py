from __future__ import annotations

from typing import Optional

import numpy as np

from app.schemas import VoiceMetrics


def analyze_voice(media_path: str) -> Optional[VoiceMetrics]:
    """
    오디오(또는 영상의 오디오 트랙)에서 음성 톤 지표를 추출한다.
    pitch(f0), energy(rms), jitter(음정 변동성), pause_ratio(무음 비율).
    """
    import librosa

    try:
        y, sr = librosa.load(media_path, sr=16000, mono=True)
    except Exception:
        return None

    if y is None or len(y) == 0:
        return None

    # 1) 에너지(RMS) 및 무음 비율
    rms = librosa.feature.rms(y=y)[0]
    energy_mean = float(np.mean(rms)) if rms.size else 0.0
    silence_threshold = max(1e-4, energy_mean * 0.3)
    pause_ratio = (
        float(np.mean(rms < silence_threshold)) if rms.size else 0.0
    )

    # 2) 기본 주파수(f0) 추정 → pitch 통계 + jitter
    try:
        f0, voiced_flag, _ = librosa.pyin(
            y,
            sr=sr,
            fmin=float(librosa.note_to_hz("C2")),
            fmax=float(librosa.note_to_hz("C6")),
        )
    except Exception:
        f0 = None

    pitch_mean = 0.0
    pitch_std = 0.0
    jitter = 0.0
    if f0 is not None:
        voiced = f0[~np.isnan(f0)]
        if voiced.size > 1:
            pitch_mean = float(np.mean(voiced))
            pitch_std = float(np.std(voiced))
            diffs = np.abs(np.diff(voiced))
            jitter = float(np.mean(diffs) / (pitch_mean + 1e-8))

    return VoiceMetrics(
        pitch_mean_hz=round(pitch_mean, 2),
        pitch_std_hz=round(pitch_std, 2),
        energy_mean=round(energy_mean, 5),
        jitter=round(jitter, 4),
        pause_ratio=round(pause_ratio, 3),
    )
