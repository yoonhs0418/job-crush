import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const InterviewSetupPage = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    companyName: '',
    jobTitle: '',
    resumeId: '',
    notes: '',
  });

  const handleChange = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleStart = () => {
    // TODO: 실제 세션 생성 API 연동
    navigate('/interviews/session/preview');
  };

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6 pb-16">
      <header className="text-center">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-primary">
          Interview Simulator
        </p>
        <h1 className="text-3xl font-bold text-black dark:text-white">AI 모의 면접 준비</h1>
        <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">
          기업 정보와 직무를 선택하면 AI가 맞춤형 면접 질문을 생성합니다.
        </p>
      </header>

      <section className="rounded-2xl border border-stroke bg-white p-6 shadow-sm dark:border-strokedark dark:bg-boxdark">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 font-bold text-primary">
            1
          </div>
          <div>
            <h2 className="text-lg font-semibold text-black dark:text-white">기업 및 직무 설정</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">모의 면접 대상 정보를 입력하세요.</p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-gray-600 dark:text-gray-300">기업명</label>
            <input
              type="text"
              name="companyName"
              value={formData.companyName}
              onChange={handleChange}
              placeholder="예) 네이버"
              className="rounded-lg border border-stroke bg-transparent px-4 py-3 text-sm outline-none transition focus:border-primary dark:border-form-strokedark dark:bg-form-input"
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-gray-600 dark:text-gray-300">직무</label>
            <input
              type="text"
              name="jobTitle"
              value={formData.jobTitle}
              onChange={handleChange}
              placeholder="예) 프론트엔드 개발자"
              className="rounded-lg border border-stroke bg-transparent px-4 py-3 text-sm outline-none transition focus:border-primary dark:border-form-strokedark dark:bg-form-input"
            />
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-stroke bg-white p-6 shadow-sm dark:border-strokedark dark:bg-boxdark">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 font-bold text-primary">
            2
          </div>
          <div>
            <h2 className="text-lg font-semibold text-black dark:text-white">자기소개서 / 메모</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">면접 시 참고할 내용을 추가하세요.</p>
          </div>
        </div>

        <textarea
          name="notes"
          rows={6}
          value={formData.notes}
          onChange={handleChange}
          placeholder="강조하고 싶은 경험, 질문받고 싶은 주제 등을 적어주세요."
          className="w-full rounded-lg border border-stroke bg-transparent px-4 py-3 text-sm outline-none transition focus:border-primary dark:border-form-strokedark dark:bg-form-input"
        />
      </section>

      <div className="sticky bottom-6 flex items-center justify-center">
        <button
          onClick={handleStart}
          className="inline-flex items-center gap-2 rounded-full bg-primary px-10 py-4 text-lg font-semibold text-white shadow-lg transition hover:-translate-y-0.5 hover:bg-primary/90"
        >
          모의 면접 시작하기
        </button>
      </div>
    </div>
  );
};

export default InterviewSetupPage;

