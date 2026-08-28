// frontend/src/features/dashboard/MainDashboardPage.tsx

import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { SiBookstack } from "react-icons/si";
import { FaTrophy, FaMicrophone, FaCalendar } from "react-icons/fa";

// 👇 공용 컴포넌트 및 타입 import
import AnalysisCard from "../../components/ui/AnalysisCard";
import { analysisApi } from "../analysis/api/analysis.api";
import type {
  AnalysisListItem,
  DashboardStats,
} from "../analysis/api/analysis.api";
import { toAnalysisCardData } from "../history/AnalysisHistoryPage";

// ----------------------------------------------------------------------
// 메인 페이지 컴포넌트
// ----------------------------------------------------------------------
const MainDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recent, setRecent] = useState<AnalysisListItem[]>([]);

  useEffect(() => {
    let mounted = true;
    Promise.all([analysisApi.getDashboardStats(), analysisApi.list()])
      .then(([statsData, listData]) => {
        if (!mounted) return;
        setStats(statsData);
        setRecent(listData.slice(0, 3));
      })
      .catch(() => {
        // 통계 조회 실패 시 빈 상태 유지 (대시보드는 부가 정보이므로 치명적이지 않음)
      });
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div className="flex flex-col gap-8 p-6 md:p-8 2xl:p-10">
      {/* 1. 상단 '새로운 자소서 분석' 섹션 */}
      <div className="bg-white dark:bg-boxdark rounded-lg p-6 md:p-8 shadow-default">
        <h1 className="text-xl font-bold text-black dark:text-white mb-6">
          새로운 자소서 분석을 시작하세요
        </h1>
        <h4 className="text-s text-black dark:text-white mb-6">
          AI가 당신의 자소서를 분석하고 맞춤형 피드백을 제공합니다
        </h4>
        <button
          onClick={() => navigate("/analysis")}
          className="inline-flex items-center justify-center gap-2 rounded-md border border-primary py-3 px-6 text-center font-medium text-primary hover:bg-primary hover:text-white transition-all"
        >
          <SiBookstack className="h-5 w-5" />새 분석 시작하기
        </button>
      </div>

      {/* 2. 통계 카드 섹션 (실데이터) */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {/* 총 분석 횟수 */}
        <div className="rounded-lg border border-stroke bg-white dark:bg-boxdark py-6 px-7.5 shadow-default">
          <h4 className="text-title-md font-semibold text-black dark:text-white">
            총 분석 횟수
          </h4>
          <div className="mt-4 flex items-end justify-between">
            <p className="text-3xl font-bold text-black dark:text-white">
              {stats?.totalAnalyses ?? 0}
            </p>
            <div className="h-9 w-9 rounded-md bg-blue-100 text-blue-600 flex items-center justify-center">
              <SiBookstack className="h-5 w-5" />
            </div>
          </div>
        </div>

        {/* 평균 점수 */}
        <div className="rounded-lg border border-stroke bg-white dark:bg-boxdark py-6 px-7.5 shadow-default">
          <h4 className="text-title-md font-semibold text-black dark:text-white">
            평균 점수
          </h4>
          <div className="mt-4 flex items-end justify-between">
            <p className="text-3xl font-bold text-black dark:text-white">
              {stats?.averageScore ?? 0}
              <span className="text-sm">점</span>
            </p>
            <div className="h-9 w-9 rounded-md bg-green-100 text-green-600 flex items-center justify-center">
              <FaTrophy />
            </div>
          </div>
        </div>

        {/* 면접 연습 */}
        <div className="rounded-lg border border-stroke bg-white dark:bg-boxdark py-6 px-7.5 shadow-default">
          <h4 className="text-title-md font-semibold text-black dark:text-white">
            면접 연습
          </h4>
          <div className="mt-4 flex items-end justify-between">
            <p className="text-3xl font-bold text-black dark:text-white">
              {stats?.interviewCount ?? 0}
              <span className="text-sm">회</span>
            </p>
            <div className="h-9 w-9 rounded-md bg-purple-100 text-purple-600 flex items-center justify-center">
              <FaMicrophone />
            </div>
          </div>
        </div>

        {/* 이번 달 분석 */}
        <div className="rounded-lg border border-stroke bg-white dark:bg-boxdark py-6 px-7.5 shadow-default">
          <h4 className="text-title-md font-semibold text-black dark:text-white">
            이번 달 분석
          </h4>
          <div className="mt-4 flex items-end justify-between">
            <p className="text-3xl font-bold text-black dark:text-white">
              {stats?.thisMonthAnalyses ?? 0}
            </p>
            <div className="h-9 w-9 rounded-md bg-orange-100 text-orange-600 flex items-center justify-center">
              <FaCalendar />
            </div>
          </div>
        </div>
      </div>

      {/* 3. 최근 분석 기록 섹션 (실데이터) */}
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-black dark:text-white">
            최근 분석 기록
          </h2>
          <button
            onClick={() => navigate("/history")}
            className="text-sm font-medium text-primary hover:underline"
          >
            전체보기
          </button>
        </div>

        {recent.length > 0 ? (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {recent.map((item, index) => (
              <AnalysisCard
                key={item.id}
                data={toAnalysisCardData(item, index)}
                onClick={() => navigate(`/analysis/result?id=${item.id}`)}
              />
            ))}
          </div>
        ) : (
          <div className="flex h-40 flex-col items-center justify-center rounded-lg border border-dashed border-gray-300 bg-gray-50 p-10 dark:border-strokedark dark:bg-meta-4">
            <p className="text-gray-500">아직 분석 기록이 없습니다. 새 분석을 시작해 보세요.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default MainDashboardPage;
