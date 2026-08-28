# Job Crush — AI 취업 준비 플랫폼

자기소개서를 분석하고, 그 내용을 바탕으로 **AI 모의 면접**을 진행한 뒤
영상·음성·텍스트를 함께 평가해 피드백을 돌려주는 웹 서비스입니다.

> **출처**
> 한신대학교 AI·SW캡스톤디자인2(2026-1) 팀 프로젝트입니다.
> 원본 저장소: [Hanshin-OSS-Hub/capstone25-job-crush](https://github.com/Hanshin-OSS-Hub/capstone25-job-crush)
> **이 저장소는 최종 산출물(`Release` 브랜치)을 개인 계정에 정리한 사본입니다.**
> fork가 아닌 독립 저장소이며, 원본의 커밋 히스토리는 포함되어 있지 않습니다.

---

## 1. 역할 분담

3인 팀 프로젝트입니다. 아래 비율은 원본 저장소 `Release` 브랜치에서
`git blame`으로 집계한 **라인 수 기준**입니다. (`.ts/.tsx/.js/.py/.yml/.sql/.css` 소스 파일만)

| 담당 | 주요 영역 | 근거 |
|:--|:--|:--|
| **윤현석** | **LLM 응답 신뢰성·보안**(`analysis`) · **CI** · 면접 세션 조회 API | `analysis` 73.6% · `.github` 100% · backend 47.5% |
| **박지성** | **ml-service 전체**(멀티모달·rPPG·STT) · `interviews` 주도 | `ml-service` 100% · `interviews` 71.0% · backend 52.2% |
| **성재열** | **프론트엔드** | frontend 44.6% |

디렉터리별 집계:

| 영역 | 총 라인 | 윤현석 | 박지성 | 성재열 |
|:--|--:|--:|--:|--:|
| `ml-service` | 569 | — | **100.0%** | — |
| `.github` (CI) | 44 | **100.0%** | — | — |
| `backend/…/analysis` | 1522 | **73.6%** | 25.9% | 0.5% |
| `backend/…/interviews` | 976 | 29.0% | **71.0%** | — |
| `backend` 전체 | 3497 | 47.5% | **52.2%** | 0.2% |
| `frontend` 전체 | 4457 | 7.9% | **47.4%** | **44.6%** |

**이 저장소가 개인 계정에 있다고 해서 혼자 만든 프로젝트가 아닙니다.**
4장(LLM 응답 신뢰성·보안)이 본인 담당이고, 나머지 영역은 팀원 기여가 더 큽니다.

<!-- TODO(확인): 성재열님 담당을 "프론트엔드"로만 적었습니다.
     blame은 코드 라인만 세므로 기획·디자인·발표·문서 등 코드 외 기여는 잡히지 않습니다.
     해당 기여가 있었다면 표에 추가할 것. -->

---

## 2. 무엇을 하는 서비스인가

1. **자기소개서 분석** — 채용공고(JD)와 자소서를 넣으면 Gemini가 점수·총평·첨삭·강약점을 반환
2. **AI 모의 면접** — 분석 결과를 바탕으로 질문을 생성하고 답변을 영상으로 녹화
3. **멀티모달 평가** — 음성(STT·운율), 표정, 심박 추정을 함께 분석해 종합 피드백

구현된 화면 (`frontend/src/router/routes.tsx`):

```
/                          대시보드
/analysis                  자소서 분석 입력
/analysis/result           분석 결과
/history                   분석 이력
/interviews/setup          면접 설정
/interviews/session/:id    면접 진행 (녹화)
/interviews/result/:id     면접 결과
/settings  /login  /signup
```

---

## 3. 아키텍처

모노레포에 **4개 컨테이너**를 두고 Docker Compose로 함께 띄웁니다. (`docker-compose.yml`)

```
┌──────────────┐   ┌──────────────┐   ┌──────────────────┐
│  frontend    │──▶│   backend    │──▶│   ml-service     │
│  React+Vite  │   │  NestJS      │   │  FastAPI(Python) │
│  :5173       │   │  :3000       │   │  :8000           │
└──────────────┘   └──────┬───────┘   └──────────────────┘
                          │                    │
                          │ Prisma             ├─ faster-whisper (STT)
                          ▼                    ├─ MediaPipe (얼굴/표정)
                   ┌──────────────┐            ├─ librosa (음성 운율)
                   │  db          │            └─ OpenCV + SciPy (rPPG)
                   │  MySQL 8.0   │
                   │  :3306       │
                   └──────────────┘
```

- `backend`가 Gemini 호출과 비즈니스 로직을 맡고, 무거운 신호처리는 `ml-service`로 위임합니다.
- 두 서비스는 컨테이너 네트워크로만 통신합니다 (`ML_SERVICE_URL=http://ml-service:8000`).
- `ml-service`는 모델 캐시를 볼륨(`ml_model_cache`)에 유지해 재기동 시 재다운로드를 피합니다.
- DB 스키마는 backend 기동 시 `npx prisma db push`로 동기화합니다 (migrate/shadow DB 없이).

### 배포 구조

```
사용자 → Cloudflare → Nginx Proxy Manager → Proxmox VM → Docker Compose (4 컨테이너)
```

저장소에서 확인되는 것은 프론트가 바라보는 API 도메인과 NPM 경유 표기입니다.

```
# frontend/.env.example
# 터널/NPM: https://apijob.jicp.cloud
```

<!-- TODO(확인): Cloudflare·Proxmox 구성은 저장소에 설정 파일이 없어 코드로 검증되지 않습니다.
     Cloudflare Tunnel을 쓴 것인지 DNS/프록시만 쓴 것인지, VM 스펙은 어땠는지 확인해 보강할 것. -->

---

## 4. LLM 응답 신뢰성·보안 (담당: 윤현석)

> `backend/src/features/analysis/analysis.service.ts` — 1287줄 중 931줄

LLM을 서비스에 붙일 때 실제로 어려운 건 좋은 답을 받는 게 아니라
**나쁜 응답이 그대로 사용자에게 나가지 않게 막는 것**이었습니다.
자소서와 채용공고는 **사용자가 자유롭게 넣는 텍스트**라 그 안에 지시문을 숨길 수 있습니다.

### 4-1. 구조 이탈 응답 거절 — Zod 스키마 검증

모델 출력을 그대로 신뢰하지 않고 **애플리케이션 경계에서 한 번 더 검증**합니다.
Gemini의 `responseSchema`(API 레벨)와 Zod 스키마(애플리케이션 레벨)를 **이중으로** 둔 이유는,
structured output이 형식은 맞춰 줘도 **값의 범위까지 보장하지는 않기** 때문입니다.

```ts
const aiResponseSchema = z.object({
  totalScore: z.number().min(0).max(100),
  overallAssessment: z.string().max(8000),
  proofreading: z.array(z.object({
    original: z.string().max(4000),
    corrected: z.string().max(4000),
    advice: z.string().max(2000),
  })).max(10).optional(),
  strengths: z.array(z.string().max(2000)).max(5).optional(),
  weaknesses: z.array(z.string().max(2000)).max(5).optional(),
});
```

`totalScore`의 `min(0).max(100)`이 핵심입니다.
인젝션이 앞의 방어를 뚫고 "점수를 9999로 주라"를 성공시켜도
**이 단계에서 `ZodError`로 떨어져 사용자에게 도달하지 못합니다.**
배열 길이 상한(`.max(10)`, `.max(5)`)과 문자열 길이 상한도 같은 목적입니다.

```ts
const validated = aiResponseSchema.parse(parsed);
// ...
if (error instanceof z.ZodError) {
  throw new InternalServerErrorException('AI 응답이 허용 범위 또는 형식을 만족하지 않습니다.');
}
```

### 4-2. 프롬프트 인젝션 2단계 방어

**1차 — 정규식 사전 차단 (호출 비용 0)**

모델을 호출하기 **전에** 걸러 냅니다. 명백한 패턴에 API 비용을 쓸 이유가 없습니다.

```ts
private readonly FORBIDDEN_PATTERNS = [
  /무\s*조\s*건\s*합\s*격/,
  /점\s*수.*무\s*시/,
  /이\s*전.*지\s*시.*잊/,
  /ignore\s+previous/i,
  /system\s+prompt/i,
  // 역할 전환·평가 조작 (자소서 본문에 끼워 넣는 간접 인젝션)
  /채용\s*담당자가\s*아니라\s*제\s*개인\s*비서/i,
  /내용은\s*모두\s*긍정만/i,
  // JD에 숨긴 점수·평가 조작 (공고 본문 위장)
  /공고문\s*보다\s*우선/i,
  /모든\s*항목에서\s*최고점을\s*부여/i,
  /약점은\s*비우(?:세요|시오|라)/i,
];
```

글자 사이마다 `\s*`를 넣은 것은 **"무 조 건 합 격"처럼 공백을 끼워 우회하는 시도**를 막기 위해서입니다.
그리고 자소서뿐 아니라 **채용공고도 함께 검사합니다** — 공고 본문에 지시를 숨기는 간접 인젝션이 가능하기 때문입니다.

```ts
const resumeBad = this.FORBIDDEN_PATTERNS.some((p) => p.test(resumeText));
const jdBad     = this.FORBIDDEN_PATTERNS.some((p) => p.test(jobDescription));
```

**2차 — Gemini Guard (의미 기반)**

정규식은 표현을 바꾸면 뚫립니다. 그래서 **판정만 하는 별도의 경량 모델 호출**을 둡니다.
본 분석 모델과 분리해, 가드가 사용자 텍스트에 오염되지 않게 했습니다.

```ts
generationConfig: {
  temperature: 0,                                  // 판정은 결정적이어야 함
  maxOutputTokens: 512,
  responseMimeType: 'application/json',
  responseSchema: this.geminiGuardResponseSchema,  // verdict를 enum으로 고정
}
```

사용자 입력은 `<job_description>`, `<resume>` 태그로 감싸 **데이터임을 명시**하고,
가드 출력은 `SAFE | MALICIOUS` **enum으로 고정**해 임의 문자열이 나오지 못하게 했습니다.

가장 신경 쓴 부분은 **실패를 차단으로 오해하지 않는 것**입니다.

```ts
/**
 * verdict가 MALICIOUS일 때만 false.
 * 그 외 빈 응답·파싱 실패·API 오류는 보안 차단이 아니라 예외(503/500)로 구분.
 */
```

가드 호출이 실패했다고 사용자를 공격자로 처리하면 **API 장애 때마다 정상 사용자가 차단당합니다.**
그래서 빈 응답·파싱 실패·API 오류를 각각 다른 예외로 갈라내고, 로그에도 `(인젝션 아님)`을 남겼습니다.
입력이 길어 1차 판정이 실패하면 **6000자 → 3000자로 축약해 1회 재시도**합니다.

### 4-3. JSON 복구 파서

모델은 스키마를 줘도 종종 코드펜스나 앞뒤 잡문을 섞어 뱉습니다.
`JSON.parse` 한 번으로 끝내면 그때마다 요청이 실패하므로 3단계로 복구합니다.

```
stripJsonFences          ```json ... ``` 껍데기 제거 (안이 비면 원문 유지)
        ↓
JSON.parse 직접 시도
        ↓ 실패 시
extractFirstJsonObject   첫 번째 균형 잡힌 { ... } 블록만 잘라내기
```

`extractFirstJsonObject`는 첫 `{`와 마지막 `}`를 단순히 자르지 않습니다.
**문자열 리터럴 안의 중괄호와 이스케이프를 상태로 추적**하며 깊이를 셉니다.

```ts
for (let i = start; i < s.length; i++) {
  const c = s[i];
  if (inString) {
    if (escape) { escape = false; continue; }
    if (c === '\\') { escape = true; continue; }
    if (c === '"') { inString = false; }
    continue;
  }
  if (c === '"') { inString = true; continue; }
  if (c === '{') { depth++; }
  else if (c === '}') { depth--; if (depth === 0) return s.slice(start, i + 1); }
}
```

자소서 본문에 `{`나 `"`가 들어 있어도 잘리지 않게 하기 위한 것입니다.
다만 코드 주석에 적어 둔 대로 **완전히 깨진 출력에는 소용없습니다.**

### 4-4. 재시도할 오류만 골라내기

모든 실패를 재시도하면 잘못된 요청을 반복해 쿼터만 태웁니다.
**일시적 오류만** 재시도 대상으로 분류했습니다.

```ts
private isTransientGeminiError(e: unknown): boolean {
  const status = (e as { status?: number })?.status;
  return status === 503 || status === 429 || status === 502 || status === 408;
}
```

400(잘못된 요청)이나 403(키 문제)은 몇 번을 보내도 결과가 같으므로 제외했습니다.

### 4-5. 호출량 제한

Gemini 호출은 비용과 쿼터가 걸린 자원이라 **분당 5회**로 묶었습니다.

```ts
// backend/src/app.module.ts
ThrottlerModule.forRoot([{ ttl: 60_000, limit: 5 }])
```

```ts
// backend/src/features/analysis/analysis.controller.ts
@UseGuards(ThrottlerGuard, JwtAuthGuard)
```

전역 가드가 아니라 **분석 라우트에만** 붙였습니다. 로그인·조회까지 묶으면 일반 사용성이 나빠집니다.

### 4-6. CI

`.github/workflows/ci.yml` — `backend`·`frontend` 이미지를 각각 빌드해 **통과 여부를 확인**합니다.
GitHub Actions 캐시(`type=gha`)를 붙여 반복 빌드 시간을 줄였습니다.
(한계는 7장에 적었습니다.)

---

## 5. 멀티모달 면접 분석 (담당: 박지성)

`ml-service`는 FastAPI로 두 개의 엔드포인트를 제공합니다. (`ml-service/app/main.py`)

| 엔드포인트 | 내용 |
|:--|:--|
| `POST /stt` | faster-whisper로 음성 → 텍스트 |
| `POST /analyze-video` | 표정·시선·심박 추정 등 영상 멀티모달 분석 |

주요 설정 (`ml-service/app/config.py`):

```python
whisper_model: str = "small"       # tiny|base|small|medium|large-v3
whisper_device: str = "cpu"        # cpu|cuda
whisper_compute_type: str = "int8"
video_frame_stride: int = 3        # N프레임마다 1회 처리 (연산량 절감)
rppg_low_hz: float = 0.7           # 약 42 bpm
rppg_high_hz: float = 4.0          # 약 240 bpm
```

**rPPG 심박 추정** (`ml-service/app/services/rppg.py`) — 이마 ROI의 RGB 평균 시퀀스에서
green 채널을 뽑아 정규화 → detrend → 대역통과 → FFT 피크로 bpm을 추정합니다.
신뢰할 만한 추정을 위해 **최소 4초 이상의 신호**를 요구합니다.

```python
if n < int(fps * 4) or fps <= 0:
    return None, 0.0, n
```

---

## 6. 로컬 실행

```bash
cp backend/.env.example backend/.env
```

`GOOGLE_API_KEY`를 채운 뒤 실행합니다.

```bash
docker compose up --build
```

frontend `:5173` · backend `:3000` · ml-service `:8000` 로 뜹니다.

> `docker-compose.yml`의 MySQL 계정(`app`/`app`, root `root`)은 **로컬 개발용 기본값**입니다.
> 실제 배포에서는 반드시 교체해야 합니다.

---

## 7. 알려진 한계

정직하게 남겨둡니다.

### 성능

- **STT가 로컬 CPU에서 동작합니다.** `whisper_device: cpu`, `compute_type: int8`, 모델 `small` 설정으로
  GPU를 쓰지 않습니다. 답변 길이에 따라 체감 지연이 큽니다.
  backend는 ML 호출에 **120초 타임아웃**을 둡니다 (`backend/src/shared/ml/ml.service.ts`).
  <!-- TODO(확인): "최대 30초 지연"이 실제 측정값인지 확인할 것.
       코드에서 확인되는 것은 120초 타임아웃 예산뿐이고 30초의 근거는 저장소에 없습니다.
       측정값이면 조건(답변 길이·머신 스펙)과 함께 적고, 체감이면 수치를 빼는 편이 낫습니다. -->
- **rPPG 심박 추정이 조명·카메라 품질에 민감합니다.** 피부색 변화를 광학적으로 읽는 방식이라
  조명 변화나 움직임이 그대로 잡음이 됩니다. 4초 미만 신호에서는 추정을 포기합니다(`None` 반환).
- **Gemini 무료 티어의 일일 호출 제한**이 있어 연속 사용에 제약이 있습니다.
  <!-- TODO(확인): "일일 20회"가 사용 당시 티어 기준인지 확인할 것. 모델·시점에 따라 달라집니다. -->

### 미완성 모듈

- **채용공고 크롤링(`jobs`)과 지원현황 관리(`applications`)가 미완성입니다.**
  두 컨트롤러 모두 라우트 데코레이터가 **주석 처리**되어 있어 동작하는 엔드포인트가 없습니다.

  ```ts
  // backend/src/features/jobs/jobs.controller.ts
  // @Get()
  ```

  프론트에도 `constants/api.ts`·`constants/routes.ts`에 경로 상수만 정의돼 있고
  대응하는 화면 라우트가 없습니다. **설계만 잡고 구현하지 못한 부분입니다.**

### 코드를 다시 읽으며 발견한 것

- **CI가 최종 브랜치에서 돌지 않았습니다.** `ci.yml`의 트리거는 `main`·`dev`인데
  최종 산출물은 `Release` 브랜치입니다. 즉 최종 코드는 CI 빌드 검증을 거치지 않았습니다.
- **CI는 빌드만 확인하고 테스트를 실행하지 않습니다.** 이미지 빌드 성공 여부까지가 범위입니다.
- `analysis.service.ts`가 **1287줄 단일 파일**입니다. Gemini 호출·가드·파싱·DB 접근이
  한 클래스에 모여 있어, 다시 만든다면 파서와 가드를 별도 모듈로 분리하는 편이 낫습니다.
- JSON 복구 파서는 주석에 적어 둔 대로 **완전히 깨진 출력은 복구하지 못합니다.**

---

## 8. 기술 스택

| 영역 | 스택 |
|:--|:--|
| Frontend | React · TypeScript · Vite · Tailwind CSS · Flowbite · React Router · Axios |
| Backend | NestJS · TypeScript · Prisma · Zod · `@nestjs/throttler` |
| LLM | Google Gemini (`@google/generative-ai`) · structured output |
| ML | FastAPI · faster-whisper · MediaPipe · librosa · OpenCV · SciPy · NumPy |
| DB | MySQL 8.0 |
| Infra | Docker Compose · GitHub Actions · Nginx Proxy Manager · Cloudflare |
