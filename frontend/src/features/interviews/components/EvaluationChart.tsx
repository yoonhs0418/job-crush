import type { InterviewEvaluation, InterviewEvaluationMetric } from '../types/interview.types';

type EvaluationChartProps = {
  evaluation: Pick<
    InterviewEvaluation,
    'overallScore' | 'contentScore' | 'deliveryScore' | 'confidenceScore'
  > & {
    metrics?: InterviewEvaluationMetric[];
  };
};

const MetricRow = ({ metric }: { metric: InterviewEvaluationMetric }) => (
  <div className="flex items-center justify-between rounded-lg border border-stroke px-4 py-2 text-sm dark:border-strokedark">
    <span>{metric.name}</span>
    <span className="font-semibold text-black dark:text-white">{metric.score}점</span>
  </div>
);

const EvaluationChart = ({ evaluation }: EvaluationChartProps) => {
  const chartStyle = {
    background: `conic-gradient(#3b82f6 ${evaluation.overallScore}%, #e5e7eb ${evaluation.overallScore}%)`,
  };

  const baseMetrics: InterviewEvaluationMetric[] = [
    { name: '내용 전달', score: evaluation.contentScore },
    { name: '커뮤니케이션', score: evaluation.deliveryScore },
    { name: '자신감', score: evaluation.confidenceScore },
  ];

  const detailMetrics = evaluation.metrics ?? baseMetrics;

  return (
    <div className="grid gap-6 rounded-2xl border border-stroke bg-white p-6 shadow-sm dark:border-strokedark dark:bg-boxdark lg:grid-cols-2">
      <div className="flex flex-col items-center justify-center gap-2">
        <div className="relative h-48 w-48 rounded-full bg-gray-100 dark:bg-gray-800" style={chartStyle}>
          <div className="absolute inset-6 rounded-full bg-white text-center dark:bg-boxdark">
            <p className="mt-10 text-xs font-semibold uppercase text-gray-500">Overall</p>
            <p className="text-4xl font-bold text-black dark:text-white">{evaluation.overallScore}</p>
            <p className="text-xs text-gray-400">/ 100</p>
          </div>
        </div>
        <p className="text-sm text-gray-500">AI가 평가한 종합 점수입니다.</p>
      </div>
      <div className="flex flex-col gap-3">
        {detailMetrics.map((metric) => (
          <MetricRow key={metric.name} metric={metric} />
        ))}
      </div>
    </div>
  );
};

export default EvaluationChart;

