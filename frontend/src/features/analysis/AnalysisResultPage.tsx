import React, { useEffect, useState } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import {
  FaCheckCircle,
  FaExclamationCircle,
  FaLightbulb,
  FaChartLine,
  FaArrowRight,
  FaCommentDots,
} from "react-icons/fa";
import { BiSolidQuoteLeft } from "react-icons/bi";
import { ROUTES } from "@/constants/routes";
import { apiClient } from "@/api/client";
import { API_ENDPOINTS } from "@/constants/api";
import { analysisApi } from "./api/analysis.api";

// ----------------------------------------------------------------------
// 1. 데이터 타입 정의 (백엔드 응답 스키마 예상)
// ----------------------------------------------------------------------
interface FeedbackItem {
  type: "good" | "bad" | "suggestion";
  title: string;
  content: string;
}

interface AnalysisItem {
  id: number;
  question: string;
  answer: string;
  score: number; // 항목별 점수
  feedbacks: FeedbackItem[];
}

interface AnalysisResult {
  companyName: string;
  jobRole: string;
  totalScore: number;
  summary: string;
  items: AnalysisItem[];
  analysisResultId?: number;
  resumeId?: number;
  companyId?: number;
}

// ----------------------------------------------------------------------
// 2. 가짜 데이터 (스크린샷 내용 반영)
// ----------------------------------------------------------------------
const mockResultData: AnalysisResult = {
  companyName: "삼성전자",
  jobRole: "반도체 공정설계",
  totalScore: 82,
  summary:
    "직무 역량은 잘 드러나지만, 기업 인재상 키워드가 부족합니다. '도전', '혁신' 등의 키워드를 추가하여 삼성전자의 인재상에 더 부합하도록 개선해보세요.",
  items: [
    {
      id: 1,
      question:
        "삼성전자를 지원한 이유와 입사 후 회사에서 이루고 싶은 꿈을 기술하십시오.",
      answer:
        "저는 반도체 기술이 미래 사회의 핵심 동력이라고 생각합니다. 삼성전자는 세계 최고의 반도체 기술력을 보유하고 있으며... (중략) ...입사 후에는 차세대 반도체 공정 기술 개발에 참여하여 더 효율적이고 혁신적인 제품 개발에 기여하고 싶습니다.",
      score: 60,
      feedbacks: [
        {
          type: "bad",
          title: "아쉬운 점",
          content:
            "'도전', '혁신' 등 삼성전자 핵심 인재상 키워드가 부족합니다. 구체적인 성과 수치도 추가하면 좋겠습니다.",
        },
        {
          type: "suggestion",
          title: "AI 수정 제안",
          content:
            "'혁신적인 도전을 통해 반도체 기술의 한계를 뛰어넘고 싶습니다'와 같은 표현으로 기업 가치를 반영해보세요.",
        },
      ],
    },
    {
      id: 2,
      question:
        "본인의 성장과정을 간략히 기술하되 현재의 자신에게 가장 큰 영향을 준 사건을 포함하여 기술하시오.",
      answer:
        "어릴 때부터 호기심이 많아 전자제품을 분해하고 조립하는 것을 좋아했습니다... (중략) ...이 경험을 통해 반도체 분야에서의 커리어를 확신하게 되었고, 지속적인 학습과 도전을 통해 전문성을 기르고 있습니다.",
      score: 90,
      feedbacks: [
        {
          type: "good",
          title: "좋은 점",
          content:
            "'데이터 분석을 통한 불량률 감소' 등 구체적인 성과와 직무 관련 역량이 잘 드러납니다.",
        },
        {
          type: "suggestion", // 파란색 추가 제안
          title: "추가 제안",
          content:
            "팀워크나 리더십 경험을 추가하면 더욱 완성도 높은 자소서가 될 것 같습니다.",
        },
      ],
    },
  ],
};

// ----------------------------------------------------------------------
// 3. 메인 페이지 컴포넌트
// ----------------------------------------------------------------------
const AnalysisResultPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  // 이전 페이지(ResumeAnalysisPage)에서 넘겨준 데이터 받기
  const receivedData = location.state as AnalysisResult | null;
  // 분석 기록(자세히 보기)에서 들어온 경우 ?id= 로 저장된 결과를 조회
  const idParam = searchParams.get("id");

  // state로 데이터가 넘어온 경우 즉시 사용, 없으면 id로 서버에서 로드
  const [loadedData, setLoadedData] = useState<AnalysisResult | null>(
    receivedData,
  );
  const [isLoading, setIsLoading] = useState<boolean>(
    !receivedData && !!idParam,
  );
  const [loadError, setLoadError] = useState<string | null>(null);
  // 모의 면접 생성 중복 클릭 방지
  const [isCreatingInterview, setIsCreatingInterview] = useState(false);

  useEffect(() => {
    if (receivedData || !idParam) return;
    let mounted = true;
    setIsLoading(true);
    analysisApi
      .getById(Number(idParam))
      .then((detail) => {
        if (mounted) setLoadedData(detail as AnalysisResult);
      })
      .catch(() => {
        if (mounted) setLoadError("분석 결과를 불러오지 못했습니다.");
      })
      .finally(() => {
        if (mounted) setIsLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, [receivedData, idParam]);

  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="flex h-96 flex-col items-center justify-center gap-4">
        <p className="text-sm text-danger">{loadError}</p>
        <button
          onClick={() => navigate("/history")}
          className="rounded-md border border-primary px-5 py-2 text-sm font-medium text-primary hover:bg-primary hover:text-white"
        >
          분석 기록으로 돌아가기
        </button>
      </div>
    );
  }

  // 로드된 실제 결과 우선, 없으면 mock 데이터로 대체
  const data: AnalysisResult = loadedData || mockResultData;

  return (
    <div className="mx-auto max-w-7xl pb-24 relative">
      {/* 헤더 섹션 */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-black dark:text-white flex items-center gap-3">
          {data.companyName}
          <span className="text-gray-400 font-light">|</span>
          {data.jobRole} 분석 리포트
        </h1>
        <p className="mt-2 text-gray-500">
          AI가 분석한 자소서 피드백과 개선사항을 확인하세요
        </p>
      </div>

      {/* 1. 종합 요약 카드 */}
      <div className="mb-10 rounded-xl border border-stroke bg-white p-8 shadow-default dark:border-strokedark dark:bg-boxdark">
        <div className="flex flex-col gap-6">
          {/* [1행] 제목과 종합 점수를 한 줄에 배치 */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <h2 className="text-xl font-bold text-black dark:text-white">
              종합 요약
            </h2>

            {/* 종합 점수 박스 */}
            <div className="flex items-center gap-4 rounded-xl border border-stroke bg-gray-50 px-6 py-3 dark:border-strokedark dark:bg-meta-4">
              <div className="text-right">
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
                  종합 점수
                </p>
                <p className="text-2xl font-black text-primary">
                  {data.totalScore}점
                </p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-white shadow-md">
                <FaChartLine className="text-sm" />
              </div>
            </div>
          </div>

          {/* [2행] AI 총평 (가로 전체 채움) */}
          <div className="relative rounded-lg bg-blue-50 p-6 dark:bg-meta-4 border border-blue-100 dark:border-strokedark w-full">
            <BiSolidQuoteLeft className="absolute top-4 left-4 text-4xl text-blue-200 dark:text-strokedark" />
            <div className="relative z-10 pl-6">
              <h4 className="mb-2 font-bold text-blue-800 dark:text-white flex items-center gap-2">
                <FaLightbulb className="text-blue-600" /> AI 총평
              </h4>
              <p className="text-blue-900 dark:text-gray-300 leading-relaxed font-medium">
                {data.summary}
              </p>
            </div>
          </div>
        </div>
      </div>
      {/* 2. 메인 컨텐츠 (내 자소서 vs AI 피드백) */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        {/* 왼쪽 컬럼: 내 자소서 */}
        <div className="flex flex-col gap-6">
          <h3 className="text-xl font-bold text-black dark:text-white">
            내 자소서
          </h3>

          {data.items.map((item) => (
            <div
              key={item.id}
              className="rounded-xl border border-stroke bg-white p-6 shadow-default dark:border-strokedark dark:bg-boxdark"
            >
              <div className="mb-4 flex items-center gap-2">
                <span className="rounded bg-primary/10 px-2.5 py-0.5 text-sm font-bold text-primary">
                  {item.id}번 문항
                </span>
              </div>
              <h4 className="mb-4 font-bold text-black dark:text-white leading-snug">
                {item.question}
              </h4>
              <p className="text-sm text-body leading-relaxed whitespace-pre-line text-justify">
                {item.answer}
              </p>
            </div>
          ))}
        </div>

        {/* 오른쪽 컬럼: AI 첨삭 및 피드백 */}
        <div className="flex flex-col gap-6">
          <h3 className="text-xl font-bold text-black dark:text-white">
            AI 첨삭 및 피드백
          </h3>

          {data.items.map((item) => (
            <div
              key={item.id}
              className="rounded-xl border border-stroke bg-white p-6 shadow-default dark:border-strokedark dark:bg-boxdark h-full"
            >
              <div className="mb-6 flex items-center justify-between border-b border-stroke pb-4 dark:border-strokedark">
                <span className="font-bold text-black dark:text-white">
                  {item.id}번 문항 피드백
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-500">인재상 부합도</span>
                  <span
                    className={`text-lg font-bold ${
                      item.score >= 80 ? "text-success" : "text-danger"
                    }`}
                  >
                    {item.score}점
                  </span>
                </div>
              </div>

              <div className="flex flex-col gap-4">
                {item.feedbacks.map((fb, idx) => (
                  <div
                    key={idx}
                    className={`rounded-lg border p-4 ${
                      fb.type === "bad"
                        ? "bg-red-50 border-red-100 text-red-700"
                        : fb.type === "good"
                        ? "bg-green-50 border-green-100 text-green-700"
                        : "bg-blue-50 border-blue-100 text-blue-700" // suggestion
                    } dark:bg-opacity-10`}
                  >
                    <div className="mb-1 flex items-center gap-2 font-bold">
                      {fb.type === "bad" && <FaExclamationCircle />}
                      {fb.type === "good" && <FaCheckCircle />}
                      {fb.type === "suggestion" && <FaLightbulb />}
                      {fb.title}
                    </div>
                    <p className="text-sm leading-relaxed opacity-90">
                      {fb.content}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 3. 하단 플로팅 버튼 (모의 면접 시작) */}
      <div className="fixed bottom-10 left-0 right-0 flex justify-center z-50 pointer-events-none">
        <button
          disabled={isCreatingInterview}
          onClick={async () => {
            // 이미 생성 요청 중이면 무시 (중복 클릭 방지)
            if (isCreatingInterview) return;
            const id = data.analysisResultId;
            if (!id) {
              navigate(ROUTES.INTERVIEWS.SETUP);
              return;
            }
            setIsCreatingInterview(true);
            try {
              const { data: created } = await apiClient.post<{ id: number }>(
                API_ENDPOINTS.INTERVIEWS.FROM_ANALYSIS,
                { analysisResultId: id },
                { timeout: 60000 }, // Gemini 질문 생성이 10초를 넘길 수 있어 이 요청만 60초 허용
              );
              if (created?.id != null) {
                // 질문 생성이 끝난 뒤에만 이동
                navigate(ROUTES.INTERVIEWS.SESSION(String(created.id)));
              } else {
                navigate(ROUTES.INTERVIEWS.SETUP);
              }
            } catch {
              alert(
                "모의 면접 준비 생성에 실패했습니다. 로그인 상태를 확인한 뒤 다시 시도해 주세요.",
              );
              // 실패 시 다시 시도할 수 있도록 잠금 해제
              setIsCreatingInterview(false);
            }
          }}
          className={`pointer-events-auto flex items-center gap-2 rounded-full bg-primary px-8 py-4 text-lg font-bold text-white shadow-2xl transition-all ${
            isCreatingInterview
              ? "cursor-not-allowed opacity-70"
              : "hover:-translate-y-1 hover:bg-opacity-90 hover:shadow-primary/50"
          }`}
        >
          <FaCommentDots className="text-xl" />
          {isCreatingInterview
            ? "면접 질문 생성 중..."
            : "이 내용으로 모의 면접 시작하기"}
          <FaArrowRight className="text-sm ml-1" />
        </button>
      </div>
    </div>
  );
};

export default AnalysisResultPage;
