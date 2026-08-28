from __future__ import annotations

from collections import Counter
from typing import Dict, List, Optional

import numpy as np

from app.schemas import FaceMetrics

# MediaPipe FaceMesh 랜드마크 인덱스
_LEFT_EYE = 133
_RIGHT_EYE = 362
_NOSE_TIP = 1
_CHIN = 152
_FOREHEAD = 10
_LEFT_CHEEK = 234
_RIGHT_CHEEK = 454
_MOUTH_TOP = 13
_MOUTH_BOTTOM = 14
_MOUTH_LEFT = 61
_MOUTH_RIGHT = 291


class FaceAnalyzer:
    """프레임 단위 표정/시선/머리자세 분석 후 세션 단위로 집계."""

    def __init__(self) -> None:
        import mediapipe as mp

        self._face_mesh = mp.solutions.face_mesh.FaceMesh(
            max_num_faces=1,
            refine_landmarks=True,
            min_detection_confidence=0.5,
            min_tracking_confidence=0.5,
            static_image_mode=False,
        )
        self._frames = 0
        self._detected = 0
        self._gaze_x: List[float] = []
        self._gaze_y: List[float] = []
        self._eye_contact: List[float] = []
        self._yaw: List[float] = []
        self._pitch: List[float] = []
        self._expressions: List[str] = []

    def close(self) -> None:
        self._face_mesh.close()

    @staticmethod
    def _expression(landmarks) -> str:
        mouth_top = landmarks[_MOUTH_TOP]
        mouth_bottom = landmarks[_MOUTH_BOTTOM]
        mouth_height = abs(mouth_bottom.y - mouth_top.y)
        smile_left = landmarks[_MOUTH_LEFT]
        smile_right = landmarks[_MOUTH_RIGHT]
        smile_curve = smile_right.y - smile_left.y

        if mouth_height > 0.07:
            return "surprised"
        if smile_curve < -0.005:
            return "happy"
        return "neutral"

    def process_frame(self, rgb_frame: np.ndarray) -> Optional[np.ndarray]:
        """프레임 처리. rPPG용 이마 ROI의 평균 RGB(np.array)를 반환(얼굴 미검출 시 None)."""
        self._frames += 1
        results = self._face_mesh.process(rgb_frame)
        if not results.multi_face_landmarks:
            return None

        self._detected += 1
        landmarks = results.multi_face_landmarks[0].landmark

        left_eye = landmarks[_LEFT_EYE]
        right_eye = landmarks[_RIGHT_EYE]
        gaze_x = ((left_eye.x + right_eye.x) / 2 - 0.5) * 2
        gaze_y = ((left_eye.y + right_eye.y) / 2 - 0.5) * 2
        gaze_distance = float(np.sqrt(gaze_x**2 + gaze_y**2))
        eye_contact = max(0.0, 1.0 - gaze_distance)

        yaw = (landmarks[_LEFT_CHEEK].x - landmarks[_RIGHT_CHEEK].x) * 90
        pitch = (landmarks[_FOREHEAD].z - landmarks[_CHIN].z) * 90

        self._gaze_x.append(gaze_x)
        self._gaze_y.append(gaze_y)
        self._eye_contact.append(eye_contact)
        self._yaw.append(float(yaw))
        self._pitch.append(float(pitch))
        self._expressions.append(self._expression(landmarks))

        return self._forehead_roi_mean(rgb_frame, landmarks)

    @staticmethod
    def _forehead_roi_mean(rgb_frame: np.ndarray, landmarks) -> Optional[np.ndarray]:
        h, w, _ = rgb_frame.shape
        fx = landmarks[_FOREHEAD].x * w
        fy = landmarks[_FOREHEAD].y * h
        box = int(min(w, h) * 0.06)
        x0 = max(0, int(fx - box))
        x1 = min(w, int(fx + box))
        y0 = max(0, int(fy - box))
        y1 = min(h, int(fy + box))
        if x1 <= x0 or y1 <= y0:
            return None
        roi = rgb_frame[y0:y1, x0:x1]
        if roi.size == 0:
            return None
        return roi.reshape(-1, 3).mean(axis=0)

    @staticmethod
    def _stability(values: List[float]) -> float:
        if len(values) < 2:
            return 1.0
        std = float(np.std(values))
        return float(max(0.0, 1.0 - min(1.0, std)))

    def aggregate(self) -> FaceMetrics:
        detection_rate = self._detected / self._frames if self._frames else 0.0
        eye_contact_score = float(np.mean(self._eye_contact)) if self._eye_contact else 0.0
        eye_contact_ratio = (
            float(np.mean([1.0 if v >= 0.8 else 0.0 for v in self._eye_contact]))
            if self._eye_contact
            else 0.0
        )
        gaze_stability = (
            (self._stability(self._gaze_x) + self._stability(self._gaze_y)) / 2
            if self._gaze_x
            else 0.0
        )
        head_stability = (
            (self._stability(self._yaw) + self._stability(self._pitch)) / 2
            if self._yaw
            else 0.0
        )

        distribution: Dict[str, float] = {}
        dominant = "neutral"
        if self._expressions:
            counts = Counter(self._expressions)
            total = sum(counts.values())
            distribution = {k: round(v / total, 3) for k, v in counts.items()}
            dominant = counts.most_common(1)[0][0]

        return FaceMetrics(
            frames_analyzed=self._frames,
            face_detection_rate=round(detection_rate, 3),
            eye_contact_score=round(eye_contact_score, 3),
            eye_contact_ratio=round(eye_contact_ratio, 3),
            gaze_stability=round(gaze_stability, 3),
            head_stability=round(head_stability, 3),
            dominant_expression=dominant,
            expression_distribution=distribution,
        )
