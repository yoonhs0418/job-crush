from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """환경변수 기반 설정. ML_ 접두사 사용 (예: ML_WHISPER_MODEL)."""

    model_config = SettingsConfigDict(env_prefix="ML_", env_file=".env")

    # STT (faster-whisper)
    whisper_model: str = "small"  # tiny|base|small|medium|large-v3
    whisper_device: str = "cpu"  # cpu|cuda
    whisper_compute_type: str = "int8"  # int8|float16|float32
    whisper_language: str = "ko"

    # 영상 분석 샘플링: 무거운 프레임 단위 연산을 줄이기 위해 N프레임마다 1회 처리
    video_frame_stride: int = 3
    # rPPG 심박 추정 대역 (Hz) - 약 42~240 bpm
    rppg_low_hz: float = 0.7
    rppg_high_hz: float = 4.0

    cors_origins: str = "*"


@lru_cache
def get_settings() -> Settings:
    return Settings()
