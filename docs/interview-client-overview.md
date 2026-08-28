## 면접 클라이언트 개요 (2025-12-03)

### 1. 현재 프론트엔드 구현 현황

#### 1-1. 폴더 구조

```
frontend/src/
├── pages/interviews/
│   ├── InterviewSetupPage.tsx      # 기업/직무 입력 및 데모 세션 시작
│   ├── InterviewSessionPage.tsx    # 실시간 면접 진행 화면
│   └── InterviewResultPage.tsx     # 모의 평가 리포트
└── features/interviews/
    ├── components/                 # 재사용 가능한 UI 블록
    │   ├── VideoCapture.tsx        # 카메라 스트림 표시
    │   ├── AudioIndicator.tsx      # 마이크 레벨 게이지
    │   ├── QuestionDisplay.tsx     # 질문 카드
    │   ├── SessionControls.tsx     # 시작/일시정지/종료 버튼
    │   ├── RealtimeFeedback.tsx    # 실시간 피드백 래퍼
    │   ├── GazeIndicator.tsx       # 시선 집중도
    │   ├── ExpressionIndicator.tsx # 표정/헤드포즈
    │   ├── AudioFeedback.tsx       # 피치·에너지·WPM·Jitter
    │   ├── EvaluationChart.tsx     # 종합 점수 차트
    │   ├── TimelineView.tsx        # 질문별 타임라인
    │   └── StrengthsWeaknesses.tsx # 강점/약점/제안 정리
    ├── hooks/
    │   ├── useMediaStream.ts       # getUserMedia 래퍼
    │   ├── useMediaPipe.ts         # MediaPipe FaceMesh 분석
    │   ├── useAudioAnalysis.ts     # Web Audio API + pitchfinder
    │   ├── useRealtimeAnalysis.ts  # 분석 데이터 패키징/전송
    │   ├── useInterviewSocket.ts   # Socket.IO 연결/이벤트
    │   └── useInterviewSession.ts  # REST 세션 상태 관리
    ├── services/
    │   ├── interview.service.ts    # REST (세션 생성/조회/평가)
    │   └── socket.service.ts       # Socket.IO 클라이언트
    └── types/
        ├── interview.types.ts      # 세션/질문/평가 모델
        ├── analysis.types.ts       # 얼굴·음성 분석 페이로드
        └── socket.types.ts         # WS 이벤트 정의
```

#### 1-2. 사용 라이브러리

- React 19 + Vite + Tailwind (UI)
- `socket.io-client` (WebSocket)
- `@mediapipe/face_mesh`, `@tensorflow-models/face-landmarks-detection`, `kalidokit` (시선·표정 추정)
- Web Audio API + `pitchfinder` (피치/에너지)
- React Router / Axios 등 공통 스택

#### 1-3. 구현 기능

- **라우팅**: `/interviews/setup`, `/interviews/session/:sessionId`, `/interviews/result/:sessionId` (DefaultLayout 사용, 세션 페이지는 사이드바 숨김)
- **카메라/마이크 제어**: `useMediaStream` → `VideoCapture`, `AudioIndicator`
- **실시간 분석(프론트)**: MediaPipe FaceMesh + Web Audio API로 시선/표정/헤드포즈/피치/에너지를 측정해 UI에 표시
- **WebSocket 뼈대**: `socket.service.ts`와 `useInterviewSocket`이 질문/피드백 이벤트를 구독하고, `useRealtimeAnalysis`가 실시간 데이터를 emit하도록 설계
- **면접 결과 UI**: 차트/타임라인/강점·약점 카드로 Mock 데이터를 시각화
- **CTA 연동**: 분석 결과 페이지 및 사이드바에서 면접 페이지로 자연스럽게 연결

> ⚠️ 설치 시 `@mediapipe/face_mesh`, `@tensorflow-models/face-landmarks-detection`, `kalidokit`, `pitchfinder`, `socket.io-client`를 함께 설치해야 하며, npm 레지스트리에 존재하는 버전으로 지정해야 합니다. (`@tensorflow-models/face-landmarks-detection`은 현재 `^1.0.4`를 권장)

---

### 2. Nest.js 기반 백엔드 계획

#### 2-1. API & 소켓 책임

| 역할                 | 상세                                                                                                                                                                                                   |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 세션 REST API        | `POST /interviews/sessions` (세션 생성), `GET /interviews/sessions/:id`, `GET /interviews/sessions/:id/evaluation`                                                                                     |
| Socket.IO 게이트웨이 | 네임스페이스 `/ws/interviews`에서 <br/>`interview:question`, `interview:feedback`, `interview:completed` 이벤트 송신 및 <br/>`interview:audio`, `interview:analysis`, `interview:answer_complete` 수신 |
| 인증                 | Front → Socket 연결 시 토큰 전달 후 게이트웨이에서 검증 (예: JWT)                                                                                                                                      |
| 데이터 저장          | PostgreSQL/Prisma(TypeORM)로 세션, 질문, 답변, 분석 프레임, 평가 결과 저장                                                                                                                             |

> **LLM/STT/TTS도 Nest.js 서비스에서 처리**
>
> - OpenAI SDK(또는 LangChain.js)를 Nest Provider로 등록하여 질문/피드백 생성
> - Whisper API로 STT 호출 후 답변 텍스트 저장
> - 필요 시 에이전트 패턴도 Node 진영에서 구현 가능

#### 2-2. 데이터 흐름

1. 프론트: 카메라/마이크 스트림 수집 → 간단한 로컬 분석 → `RealtimeAnalysisPayload` emit
2. Nest 소켓 게이트웨이: payload 수신 → STT/LLM 호출에 참고 → 질문/피드백 생성 후 프론트로 push
3. Nest REST API: 세션 생성·조회·평가 저장, 클라이언트 결과 페이지에서 조회
4. 프론트: 서버에서 온 질문/피드백/평가 데이터를 UI에 반영

#### 2-3. 백엔드 Checklist

1. **엔티티/스키마**: `interview_sessions`, `interview_questions`, `interview_answers`, `analysis_frames`, `interview_evaluations`
2. **Auth & Session Guard**: JWT/쿠키 기반 인증 후 소켓 연결 시 토큰 검증
3. **파일/스트림 처리**: 오디오 청크 포맷 정의, Whisper API 호출 파이프라인 마련
4. **큐/캐시**: Redis로 실시간 분석 값 캐싱 및 세션 상태 관리
5. **모니터링**: WebSocket 연결 수, LLM/Whisper 호출 지연, 에러 로깅

---

### 3. Python/OpenCV 확장 시나리오 (별도 계획)

| 구분           | 현재 (브라우저+Nest)            | 확장 (Python/OpenCV)                      |
| -------------- | ------------------------------- | ----------------------------------------- |
| 얼굴/표정 인식 | MediaPipe FaceMesh + TF.js      | OpenCV DNN + MediaPipe Python             |
| 음성 분석      | Web Audio API + pitchfinder     | librosa/PyTorch 기반                      |
| LLM/에이전트   | Nest.js 서비스에서 OpenAI 호출  | Python LangChain/에이전트 파이프라인      |
| 장점           | 즉시 피드백, 서버 부하 적음     | 정밀도/일관성 ↑, ML 생태계 활용           |
| 단점           | 디바이스 성능 의존, 정확도 한계 | 인프라/비용 증가, 네트워크 지연 고려 필요 |

#### 3-1. 확장 전략

1. 브라우저에서 수집한 원시 스트림을 WebRTC/Socket/WebTransport로 Python 서비스에 전송
2. Python(OpenCV·MediaPipe·PyTorch)이 고정밀 분석 수행
3. Nest.js는 게이트웨이 역할로 남아 Python 결과를 받아 WebSocket/REST로 전달
4. 브라우저 분석 로직은 Feature Flag로 유지해 장애 시 기본 피드백 제공

#### 3-2. Python 서비스 구성 예시

| 모듈    | 기술                                     | 설명                                         |
| ------- | ---------------------------------------- | -------------------------------------------- |
| Vision  | OpenCV + MediaPipe Python                | 시선, 표정, 자세, 감정 분석 (고정밀)         |
| Audio   | librosa, pyAudioAnalysis                 | 피치, 에너지, jitter, 말하기 속도, 휴지 분석 |
| LLM     | GPT-4o / HuggingFace / LangChain         | 질문 생성, 꼬리 질문, 평가 멘트              |
| STT/TTS | Whisper API, Google Speech-to-Text / TTS | 음성 인/아웃                                 |

> 현재 버전은 Nest.js 단독 백엔드를 기본 전제로 하며, Python/OpenCV는 **완전 별도 확장 시나리오**입니다.

---

### 4. 향후 작업 항목 요약

1. **백엔드**
   - Nest.js에 인터뷰 모듈 추가 (REST + Socket 게이트웨이)
   - Prisma/TypeORM으로 DB 스키마 구성
   - LLM/STT/TTS Provider 작성 및 서비스 레이어 연동
2. **프론트-백엔드 연동**
   - `useInterviewSocket`에 실제 WS URL/토큰 연동
   - `interviewService` REST 호출 연결 및 로딩/에러 핸들링
   - 서버 피드백(점수/멘션)을 RealtimeFeedback/Evaluation UI에 주입
3. **배포/운영**
   - HTTPS(카메라 권한) 및 CORS 설정
   - 환경 변수 템플릿 (`VITE_SOCKET_URL`, API 키) 업데이트
   - npm 패키지 버전 고정 및 Docker 캐시 전략
4. **(옵션) Python/OpenCV 확장 준비**
   - 스트림 전송 포맷 정의, gRPC/WebRTC 브릿지 설계
   - OpenCV/MediaPipe Python 파이프라인 프로토타입
   - Nest ↔ Python 간 장애 대응/재전송 전략 마련

이 문서를 기준으로 프론트 현황과 Nest.js 백엔드 요구사항을 공유하고, 필요 시 Python/OpenCV 확장은 별도 단계로 진행하면 됩니다. 문의 사항이 있으면 알려주세요!
