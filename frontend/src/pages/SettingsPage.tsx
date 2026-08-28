import React from "react";
import {
  FaUser,
  FaRobot,
  FaPalette,
  FaLock,
  FaBell,
  FaTrashAlt,
  FaSave,
} from "react-icons/fa";

const SettingsPage = () => {
  return (
    <div className="mx-auto max-w-4xl pb-20">
      <div className="mb-10">
        <h1 className="text-3xl font-bold text-black dark:text-white">설정</h1>
        <p className="mt-2 text-gray-500 dark:text-gray-400">
          내 정보와 AI 분석 환경을 관리합니다.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-8">
        {/* 1. 프로필 설정 섹션 */}
        <section className="rounded-2xl border border-stroke bg-white p-8 shadow-sm dark:border-strokedark dark:bg-boxdark">
          <div className="mb-6 flex items-center gap-3 border-b border-stroke pb-4 dark:border-strokedark">
            <FaUser className="text-primary" />
            <h2 className="text-xl font-bold text-black dark:text-white">
              내 프로필
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="mb-2 block text-sm font-medium text-black dark:text-white">
                이름
              </label>
              <input
                type="text"
                placeholder="성재열"
                className="w-full rounded-lg border border-stroke bg-gray-50 px-4 py-2.5 outline-none focus:border-primary dark:border-form-strokedark dark:bg-form-input"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-black dark:text-white">
                목표 직무
              </label>
              <select className="w-full rounded-lg border border-stroke bg-gray-50 px-4 py-2.5 outline-none focus:border-primary dark:border-form-strokedark dark:bg-form-input">
                <option>프론트엔드 개발자</option>
                <option>백엔드 개발자</option>
                <option>데이터 엔지니어</option>
              </select>
            </div>
          </div>
        </section>

        {/* 2. AI 분석 환경 설정 (확장 가능 포인트!) */}
        <section className="rounded-2xl border border-stroke bg-white p-8 shadow-sm dark:border-strokedark dark:bg-boxdark">
          <div className="mb-6 flex items-center gap-3 border-b border-stroke pb-4 dark:border-strokedark">
            <FaRobot className="text-primary" />
            <h2 className="text-xl font-bold text-black dark:text-white">
              AI 분석 스타일
            </h2>
          </div>
          <div className="flex flex-wrap gap-4">
            {["친절한 멘토", "엄격한 면접관", "핵심 요약형"].map(
              (style, idx) => (
                <label
                  key={idx}
                  className="flex cursor-pointer items-center gap-2 rounded-full border border-stroke px-5 py-2 hover:bg-gray-50 dark:border-strokedark dark:hover:bg-meta-4"
                >
                  <input
                    type="radio"
                    name="ai-style"
                    defaultChecked={idx === 0}
                    className="accent-primary"
                  />
                  <span className="text-sm font-medium text-black dark:text-white">
                    {style}
                  </span>
                </label>
              ),
            )}
          </div>
          <p className="mt-4 text-xs text-gray-500">
            ※ 선택한 스타일에 맞춰 Gemini AI의 피드백 말투가 변경됩니다.
          </p>
        </section>

        {/* 3. 앱 설정 (다크모드 등) */}
        <section className="rounded-2xl border border-stroke bg-white p-8 shadow-sm dark:border-strokedark dark:bg-boxdark">
          <div className="mb-6 flex items-center gap-3 border-b border-stroke pb-4 dark:border-strokedark">
            <FaPalette className="text-primary" />
            <h2 className="text-xl font-bold text-black dark:text-white">
              앱 테마
            </h2>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-bold text-black dark:text-white">다크 모드</p>
              <p className="text-sm text-gray-500">
                시스템 설정에 맞추거나 직접 변경합니다.
              </p>
            </div>
            {/* 💡 추후 테마 스위치 컴포넌트 들어갈 자리 */}
            <div className="h-6 w-12 rounded-full bg-gray-300 dark:bg-primary relative cursor-pointer">
              <div className="absolute right-1 top-1 h-4 w-4 rounded-full bg-white transition-all"></div>
            </div>
          </div>
        </section>

        {/* 4. 계정 관리 (위험 구역) */}
        <section className="rounded-2xl border border-red-100 bg-red-50/30 p-8 dark:border-red-900/30 dark:bg-red-900/10">
          <div className="mb-6 flex items-center gap-3 border-b border-red-100 pb-4 dark:border-red-900/30">
            <FaLock className="text-red-500" />
            <h2 className="text-xl font-bold text-red-500">계정 관리</h2>
          </div>
          <button className="flex items-center gap-2 text-sm font-bold text-red-500 hover:underline">
            <FaTrashAlt /> 회원 탈퇴하기
          </button>
        </section>

        {/* 하단 저장 버튼 */}
        <div className="flex justify-end mt-4">
          <button className="flex items-center gap-2 rounded-xl bg-primary px-10 py-3.5 font-bold text-white shadow-lg hover:bg-opacity-90 active:scale-[0.98] transition-all">
            <FaSave /> 설정 저장하기
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
