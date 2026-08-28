import React from "react";
import { FaBuilding, FaTrashAlt } from "react-icons/fa";

// 타입 정의도 공용으로 쓰기 위해 export 합니다.
export interface AnalysisData {
  id: number;
  company: string;
  role: string;
  logoBgColor: string;
  logoTextColor: string;
  status: "완료" | "진행중";
  fitScore: string;
  jobScore: string;
  date: string;
}

const AnalysisCard = ({
  data,
  onClick,
  onDelete,
}: {
  data: AnalysisData;
  onClick?: () => void;
  onDelete?: () => void;
}) => {
  const statusBadgeClass =
    data.status === "완료"
      ? "bg-success text-success"
      : "bg-warning text-warning";

  return (
    <div
      onClick={onClick}
      className="rounded-lg border border-stroke bg-white p-6 shadow-default dark:border-strokedark dark:bg-boxdark transition-transform hover:-translate-y-1 hover:shadow-lg cursor-pointer"
    >
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center gap-4">
          <div
            className={`flex h-14 w-14 items-center justify-center rounded-lg ${data.logoBgColor} ${data.logoTextColor} dark:bg-meta-4 dark:text-white`}
          >
            <FaBuilding className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-black dark:text-white">
              {data.company}
            </h3>
            <p className="text-sm font-medium text-body">{data.role}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={`inline-flex rounded-full bg-opacity-10 px-3 py-1 text-sm font-medium ${statusBadgeClass}`}
          >
            {data.status}
          </span>
          {onDelete && (
            <button
              type="button"
              aria-label="삭제"
              title="삭제"
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
              className="flex h-8 w-8 items-center justify-center rounded-md text-gray-400 transition-colors hover:bg-danger/10 hover:text-danger"
            >
              <FaTrashAlt className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-2 mb-6">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-body">인재상 부합도</span>
          <span className="text-sm font-bold text-black dark:text-white">
            {data.fitScore}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-body">직무 적합도</span>
          <span className="text-sm font-bold text-black dark:text-white">
            {data.jobScore}
          </span>
        </div>
      </div>

      <div className="flex items-center justify-between border-t border-stroke pt-4 dark:border-strokedark">
        <span className="text-sm font-medium text-body">{data.date}</span>
        <span className="text-sm font-medium text-primary hover:underline">
          {data.status === "진행중" ? "진행상황" : "자세히 보기"}
        </span>
      </div>
    </div>
  );
};

export default AnalysisCard;
