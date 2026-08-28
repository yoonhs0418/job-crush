from __future__ import annotations

from typing import List

import cv2
import numpy as np

from app.config import get_settings
from app.schemas import HeartRateMetrics, VideoAnalysisResponse
from app.services.face import FaceAnalyzer
from app.services.rppg import estimate_bpm
from app.services.voice import analyze_voice


def analyze_video(video_path: str) -> VideoAnalysisResponse:
    """영상 1회 순회로 표정/시선 + rPPG 심박을 구하고, 오디오로 음성 톤을 구한다."""
    settings = get_settings()
    capture = cv2.VideoCapture(video_path)
    fps = capture.get(cv2.CAP_PROP_FPS) or 0.0
    if fps <= 0:
        fps = 30.0

    stride = max(1, settings.video_frame_stride)
    effective_fps = fps / stride

    analyzer = FaceAnalyzer()
    roi_means: List[np.ndarray] = []
    frame_idx = 0

    try:
        while True:
            ok, frame = capture.read()
            if not ok:
                break
            if frame_idx % stride == 0:
                rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
                roi = analyzer.process_frame(rgb)
                if roi is not None:
                    roi_means.append(roi)
            frame_idx += 1
    finally:
        capture.release()
        face_metrics = analyzer.aggregate()
        analyzer.close()

    bpm, confidence, samples = estimate_bpm(roi_means, effective_fps)
    heart_rate = HeartRateMetrics(bpm=bpm, confidence=confidence, samples=samples)

    voice_metrics = analyze_voice(video_path)

    return VideoAnalysisResponse(
        face=face_metrics,
        voice=voice_metrics,
        heart_rate=heart_rate,
    )
