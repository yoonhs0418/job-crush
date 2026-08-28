type TimelineItem = {
  id: string;
  question: string;
  score: number;
  feedback: string;
};

type TimelineViewProps = {
  items: TimelineItem[];
};

const TimelineView = ({ items }: TimelineViewProps) => {
  return (
    <div className="rounded-2xl border border-stroke bg-white p-6 shadow-sm dark:border-strokedark dark:bg-boxdark">
      <h3 className="mb-4 text-lg font-semibold text-black dark:text-white">질문별 평가 타임라인</h3>
      <ol className="relative border-l border-stroke pl-6 dark:border-strokedark">
        {items.map((item, index) => (
          <li key={item.id} className="mb-8 ml-4">
            <div className="absolute -left-2 mt-1 flex h-4 w-4 items-center justify-center rounded-full border border-primary bg-white dark:bg-boxdark" />
            <div className="rounded-lg border border-stroke p-4 dark:border-strokedark">
              <div className="flex items-center justify-between text-xs text-gray-500">
                <span>질문 {index + 1}</span>
                <span className="font-semibold text-black dark:text-white">{item.score}점</span>
              </div>
              <p className="mt-2 text-sm font-semibold text-black dark:text-white">{item.question}</p>
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-300">{item.feedback}</p>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
};

export default TimelineView;

