# Job Crush - ML Service (FastAPI)

AI 면접의 무거운 멀티모달 분석을 담당하는 Python 마이크로서비스입니다.
Nest 백엔드가 이 서비스를 HTTP로 호출합니다(클라이언트가 직접 호출하지 않음).

## 책임

- `POST /stt`: 답변 오디오 → 텍스트(STT). faster-whisper(로컬). 턴 단위 꼬리질문 생성용.
- `POST /analyze-video`: 세션 전체 영상 → 표정/시선/음성톤/rPPG 심박 종합 분석. 세션 종료 후 일괄.
- `GET /health`: 상태 확인.

## 기술 스택

- FastAPI + Uvicorn
- faster-whisper (STT, 로컬)
- MediaPipe FaceMesh (표정/시선/머리자세)
- OpenCV + SciPy (rPPG 심박: 이마 ROI green 채널 + 대역통과 + FFT)
- librosa (음성 톤: pitch/energy/jitter/pause)

## 환경변수 (접두사 `ML_`)

| 변수 | 기본값 | 설명 |
|------|--------|------|
| `ML_WHISPER_MODEL` | `small` | whisper 모델 크기 |
| `ML_WHISPER_DEVICE` | `cpu` | `cpu` 또는 `cuda` |
| `ML_WHISPER_COMPUTE_TYPE` | `int8` | 연산 타입 |
| `ML_WHISPER_LANGUAGE` | `ko` | STT 언어 |
| `ML_VIDEO_FRAME_STRIDE` | `3` | 영상 프레임 샘플링 간격 |

## 로컬 실행

```bash
cd ml-service
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

## Docker

루트의 `docker-compose.yml`에 `ml-service`로 정의되어 있습니다.

```bash
docker compose up ml-service
```
