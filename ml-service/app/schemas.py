from typing import List, Optional

from pydantic import BaseModel


class WordTiming(BaseModel):
    word: str
    start: float
    end: float


class SttResponse(BaseModel):
    transcript: str
    language: str
    duration_sec: float
    speech_rate_wpm: Optional[float] = None
    words: List[WordTiming] = []


class FaceMetrics(BaseModel):
    """영상 전체 집계된 표정/시선 지표 (0~1 또는 비율)."""

    frames_analyzed: int
    face_detection_rate: float  # 얼굴이 검출된 프레임 비율
    eye_contact_score: float  # 평균 시선 안정성 (1=정면 응시)
    eye_contact_ratio: float  # 시선이 정면이었던 프레임 비율
    gaze_stability: float  # 시선 흔들림이 적을수록 1에 가까움
    head_stability: float  # 머리 움직임이 적을수록 1에 가까움
    dominant_expression: str
    expression_distribution: dict


class VoiceMetrics(BaseModel):
    pitch_mean_hz: float
    pitch_std_hz: float
    energy_mean: float
    jitter: float  # 음정 변동성
    speech_rate_wpm: Optional[float] = None
    pause_ratio: float  # 무음(침묵) 비율


class HeartRateMetrics(BaseModel):
    bpm: Optional[float] = None
    confidence: float  # 0~1 (신호 품질)
    samples: int


class VideoAnalysisResponse(BaseModel):
    face: FaceMetrics
    voice: Optional[VoiceMetrics] = None
    heart_rate: HeartRateMetrics


class HealthResponse(BaseModel):
    status: str
    whisper_model: str
    device: str
