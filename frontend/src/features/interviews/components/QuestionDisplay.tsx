import type { InterviewQuestion } from '../types/interview.types';

type QuestionDisplayProps = {
  question?: Pick<InterviewQuestion, 'order' | 'text' | 'type'>;
};

const QuestionDisplay = ({ question }: QuestionDisplayProps) => {
  if (!question) {
    return (
      <div className="rounded-xl border border-dashed border-stroke p-6 text-center text-sm text-gray-500 dark:border-strokedark dark:text-gray-400">
        AI가 최신 질문을 준비 중입니다.
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-stroke bg-white p-6 shadow-sm dark:border-strokedark dark:bg-boxdark">
      <div className="mb-3 flex items-center justify-between">
        <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold capitalize text-primary">
          {question.type}
        </span>
        <span className="text-xs font-medium text-gray-500">질문 {question.order}</span>
      </div>
      <p className="text-sm font-semibold leading-relaxed text-black dark:text-white">
        {question.text}
      </p>
    </div>
  );
};

export default QuestionDisplay;

