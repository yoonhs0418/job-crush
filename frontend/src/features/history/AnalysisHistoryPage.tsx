import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import type { AnalysisData } from "../../components/ui/AnalysisCard.tsx";
import AnalysisCard from "../../components/ui/AnalysisCard";
import { FaSearch, FaMicrophone, FaTrashAlt } from "react-icons/fa";
import { analysisApi } from "../analysis/api/analysis.api";
import type { AnalysisListItem } from "../analysis/api/analysis.api";
import { interviewService } from "../interviews/services/interview.service";
import type { InterviewListItem } from "../interviews/types/interview.types";

/** 면접 상태 코드 → 한글 라벨/배지 색 */
const INTERVIEW_STATUS_META: Record<
  string,
  { label: string; className: string }
> = {
  COMPLETED: { label: "완료", className: "bg-success/10 text-success" },
  PROCESSING: { label: "분석중", className: "bg-warning/10 text-warning" },
  IN_PROGRESS: { label: "진행중", className: "bg-warning/10 text-warning" },
  PENDING: { label: "대기", className: "bg-gray-100 text-gray-500" },
  FAILED: { label: "실패", className: "bg-danger/10 text-danger" },
};

const LOGO_PALETTE = [
  { bg: "bg-blue-50", text: "text-blue-600" },
  { bg: "bg-red-50", text: "text-red-500" },
  { bg: "bg-green-50", text: "text-green-600" },
  { bg: "bg-cyan-50", text: "text-cyan-600" },
  { bg: "bg-orange-50", text: "text-orange-600" },
];

/** 서버 분석 기록을 카드 표시용 데이터로 변환 */
export const toAnalysisCardData = (
  item: AnalysisListItem,
  index: number,
): AnalysisData => {
  const palette = LOGO_PALETTE[index % LOGO_PALETTE.length];
  const date = new Date(item.createdAt);
  const formattedDate = `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, "0")}.${String(date.getDate()).padStart(2, "0")}`;
  return {
    id: item.id,
    company: item.companyName,
    role: item.jobRole,
    logoBgColor: palette.bg,
    logoTextColor: palette.text,
    status: "완료",
    fitScore: `${item.totalScore}점`,
    jobScore: `${item.totalScore}점`,
    date: formattedDate,
  };
};

const AnalysisHistoryPage = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [items, setItems] = useState<AnalysisListItem[]>([]);
  const [interviews, setInterviews] = useState<InterviewListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    analysisApi
      .list()
      .then((data) => {
        if (mounted) setItems(data);
      })
      .catch(() => {
        if (mounted) setError("분석 기록을 불러오지 못했습니다.");
      })
      .finally(() => {
        if (mounted) setIsLoading(false);
      });
    // 면접 기록은 부가 정보이므로 실패해도 페이지 전체를 막지 않는다.
    interviewService
      .listSessions()
      .then((data) => {
        if (mounted) setInterviews(data);
      })
      .catch(() => undefined);
    return () => {
      mounted = false;
    };
  }, []);

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}`;
  };

  const handleDeleteAnalysis = async (id: number) => {
    if (
      !window.confirm(
        "이 분석 기록을 삭제할까요? 연결된 면접 기록도 함께 삭제됩니다.",
      )
    )
      return;
    try {
      await analysisApi.remove(id);
      setItems((prev) => prev.filter((it) => it.id !== id));
      // 연결된 면접도 서버에서 함께 삭제되므로 목록을 다시 불러온다.
      interviewService
        .listSessions()
        .then(setInterviews)
        .catch(() => undefined);
    } catch {
      alert("삭제에 실패했습니다. 잠시 후 다시 시도해 주세요.");
    }
  };

  const handleDeleteInterview = async (id: string) => {
    if (!window.confirm("이 면접 기록을 삭제할까요?")) return;
    try {
      await interviewService.deleteSession(id);
      setInterviews((prev) => prev.filter((iv) => iv.id !== id));
    } catch {
      alert("삭제에 실패했습니다. 잠시 후 다시 시도해 주세요.");
    }
  };

  const cardData = useMemo(
    () => items.map((item, index) => toAnalysisCardData(item, index)),
    [items],
  );

  const filteredData = cardData.filter(
    (item) =>
      item.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.role.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <div className="flex flex-col gap-6">
      {/* 1. 헤더 및 검색바 */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-title-md2 font-bold text-black dark:text-white">
            분석 기록
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            지금까지 분석한 {filteredData.length}개의 자소서가 있습니다.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <input
              type="text"
              placeholder="기업명, 직무 검색..."
              className="w-full rounded-lg border border-stroke bg-white py-2.5 pl-10 pr-4 text-black outline-none focus:border-primary dark:border-strokedark dark:bg-meta-4 dark:text-white dark:focus:border-primary"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
          </div>
        </div>
      </div>

      {/* 2. 상태별 렌더링 */}
      {isLoading ? (
        <div className="flex h-64 items-center justify-center">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      ) : error ? (
        <div className="flex h-64 flex-col items-center justify-center rounded-lg border border-dashed border-danger/40 bg-danger/5 p-10">
          <p className="text-sm text-danger">{error}</p>
        </div>
      ) : filteredData.length > 0 ? (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3">
          {filteredData.map((data) => (
            <AnalysisCard
              key={data.id}
              data={data}
              onClick={() => navigate(`/analysis/result?id=${data.id}`)}
              onDelete={() => handleDeleteAnalysis(data.id)}
            />
          ))}
        </div>
      ) : (
        <div className="flex h-64 flex-col items-center justify-center rounded-lg border border-dashed border-gray-300 bg-gray-50 p-10 dark:border-strokedark dark:bg-meta-4">
          <p className="text-gray-500">
            {items.length === 0 ? "아직 분석한 자소서가 없습니다." : "검색 결과가 없습니다."}
          </p>
        </div>
      )}

      {/* 3. 면접 기록 */}
      {interviews.length > 0 && (
        <div className="mt-4 flex flex-col gap-4">
          <h3 className="text-title-md2 font-bold text-black dark:text-white">
            면접 기록
          </h3>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {interviews.map((it) => {
              const meta =
                INTERVIEW_STATUS_META[it.status?.toUpperCase()] ?? {
                  label: it.status,
                  className: "bg-gray-100 text-gray-500",
                };
              return (
                <div
                  key={it.id}
                  onClick={() => navigate(`/interviews/result/${it.id}`)}
                  className="flex cursor-pointer flex-col gap-4 rounded-lg border border-stroke bg-white p-6 text-left shadow-default transition-transform hover:-translate-y-1 hover:shadow-lg dark:border-strokedark dark:bg-boxdark"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-purple-50 text-purple-600 dark:bg-meta-4 dark:text-white">
                        <FaMicrophone className="h-5 w-5" />
                      </div>
                      <div>
                        <h4 className="text-base font-bold text-black dark:text-white">
                          {it.companyName}
                        </h4>
                        <p className="line-clamp-1 text-sm text-body">
                          {it.jobTitle}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${meta.className}`}
                      >
                        {meta.label}
                      </span>
                      <button
                        type="button"
                        aria-label="삭제"
                        title="삭제"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteInterview(it.id);
                        }}
                        className="flex h-8 w-8 items-center justify-center rounded-md text-gray-400 transition-colors hover:bg-danger/10 hover:text-danger"
                      >
                        <FaTrashAlt className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between border-t border-stroke pt-4 dark:border-strokedark">
                    <span className="text-sm font-medium text-body">
                      {formatDate(it.completedAt ?? it.createdAt)}
                    </span>
                    <span className="text-sm font-bold text-black dark:text-white">
                      {it.overallScore != null
                        ? `${it.overallScore}점`
                        : "결과 보기"}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default AnalysisHistoryPage;
