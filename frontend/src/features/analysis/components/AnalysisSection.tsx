import React from 'react';

interface AnalysisSectionProps {
  step: number;
  title: string;
  children: React.ReactNode;
}

const AnalysisSection = ({ step, title, children }: AnalysisSectionProps) => {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-strokedark dark:bg-boxdark md:p-8">
      <div className="mb-6 flex items-center gap-3">
        {/* 파란색 숫자 뱃지 */}
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100 text-blue-600 font-bold dark:bg-meta-4 dark:text-white">
          {step}
        </div>
        {/* 섹션 제목 */}
        <h3 className="text-lg font-bold text-black dark:text-white">
          {title}
        </h3>
      </div>
      {/* 입력 폼이 들어갈 자리 */}
      <div>{children}</div>
    </div>
  );
};

export default AnalysisSection;