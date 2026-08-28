from __future__ import annotations

from threading import Lock
from typing import List, Optional, Tuple

from app.config import get_settings
from app.schemas import WordTiming

# faster-whisper 모델은 로딩 비용이 크므로 프로세스 내 1회만 로드(지연 로딩 + 락).
_model = None
_model_lock = Lock()


def _get_model():
    global _model
    if _model is None:
        with _model_lock:
            if _model is None:
                from faster_whisper import WhisperModel

                settings = get_settings()
                _model = WhisperModel(
                    settings.whisper_model,
                    device=settings.whisper_device,
                    compute_type=settings.whisper_compute_type,
                )
    return _model


def transcribe(audio_path: str) -> Tuple[str, str, float, List[WordTiming]]:
    """오디오 파일을 텍스트로 변환. (transcript, language, duration_sec, words) 반환."""
    settings = get_settings()
    model = _get_model()

    segments, info = model.transcribe(
        audio_path,
        language=settings.whisper_language,
        word_timestamps=True,
        vad_filter=True,
    )

    texts: List[str] = []
    words: List[WordTiming] = []
    for segment in segments:
        texts.append(segment.text.strip())
        for word in getattr(segment, "words", None) or []:
            words.append(
                WordTiming(
                    word=word.word.strip(),
                    start=float(word.start),
                    end=float(word.end),
                )
            )

    transcript = " ".join(t for t in texts if t).strip()
    duration = float(getattr(info, "duration", 0.0) or 0.0)
    language = getattr(info, "language", settings.whisper_language)
    return transcript, language, duration, words


def estimate_speech_rate_wpm(
    word_count: int, duration_sec: float
) -> Optional[float]:
    """발화 속도(분당 단어 수) 추정. 한국어는 어절 기준 근사값."""
    if duration_sec <= 0 or word_count <= 0:
        return None
    return round(word_count / (duration_sec / 60.0), 1)
