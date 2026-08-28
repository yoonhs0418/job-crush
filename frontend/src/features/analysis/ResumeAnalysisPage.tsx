import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaMagic,
  FaSpinner,
  FaFilePdf,
  FaTimes,
  FaCloudUploadAlt,
} from "react-icons/fa";
import AnalysisSection from "./components/AnalysisSection";
import { apiClient } from "@/api/client";

/** Gemini 가드+본분석 등으로 10초 기본 타임아웃을 넘기기 쉬움 */
const ANALYSIS_REQUEST_MS = 180_000;

const ResumeAnalysisPage = () => {
  const navigate = useNavigate();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [formData, setFormData] = useState({
    companyName: "",
    jobDescription: "",
    resumeContent: "",
    resumeFile: null as File | null,
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFormData((prev) => ({ ...prev, resumeFile: e.target.files![0] }));
    }
  };

  const handleRemoveFile = () => {
    setFormData((prev) => ({ ...prev, resumeFile: null }));
  };

  const handleAnalyzeClick = async () => {
    if (
      !formData.companyName ||
      !formData.jobDescription ||
      (!formData.resumeContent && !formData.resumeFile)
    ) {
      alert(
        "기업명, 직무 공고, 자소서 내용을 모두 입력하거나 PDF를 업로드해주세요.",
      );
      return;
    }

    setIsAnalyzing(true);
    try {
      let response;
      if (formData.resumeFile) {
        const dataToSend = new FormData();
        dataToSend.append("companyName", formData.companyName);
        dataToSend.append("jobDescription", formData.jobDescription);
        if (formData.resumeContent) {
          dataToSend.append("resumeText", formData.resumeContent);
        }
        dataToSend.append("resumeFile", formData.resumeFile);

        response = await apiClient.post(
          "/analysis/resume/upload",
          dataToSend,
          { timeout: ANALYSIS_REQUEST_MS },
        );
      } else {
        response = await apiClient.post(
          "/analysis/resume",
          {
            companyName: formData.companyName,
            jobDescription: formData.jobDescription,
            resumeText: formData.resumeContent,
          },
          { timeout: ANALYSIS_REQUEST_MS },
        );
      }

      navigate("/analysis/result", { state: response.data });
    } catch (error: unknown) {
      if (error && typeof error === "object" && "code" in error) {
        const ax = error as { code?: string; message?: string };
        if (ax.code === "ECONNABORTED") {
          alert(
            "분석 실패: 응답 시간이 초과되었습니다. 잠시 후 다시 시도하거나 네트워크를 확인해 주세요.",
          );
          return;
        }
      }
      if (error && typeof error === "object" && "response" in error) {
        const ax = error as { response?: { data?: { message?: string | string[] } } };
        const backendError = ax.response?.data;
        const errorMessage = Array.isArray(backendError?.message)
          ? backendError.message[0]
          : backendError?.message;
        alert(`분석 실패: ${errorMessage || "다시 시도해주세요. (로그인 필요)"}`);
      } else {
        alert("분석 실패: 다시 시도해주세요.");
      }
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl pb-10">
      <div className="mb-10 text-center">
        <h1 className="mb-2 text-3xl font-bold text-black dark:text-white">
          AI 분석 시작하기
        </h1>
        <p className="text-gray-500 dark:text-gray-400">
          기업 정보와 자기소개서를 바탕으로 면접 질문을 생성합니다.
        </p>
      </div>

      <div className="flex flex-col gap-6">
        <AnalysisSection step={1} title="지원할 기업">
          <input
            type="text"
            name="companyName"
            value={formData.companyName}
            onChange={handleChange}
            placeholder="기업명을 입력하세요"
            className="w-full rounded-lg border-[1.5px] border-stroke bg-transparent px-5 py-3 outline-none focus:border-primary dark:border-form-strokedark dark:bg-form-input"
          />
        </AnalysisSection>

        <AnalysisSection step={2} title="지원할 직무 (공고)">
          <textarea
            rows={4}
            name="jobDescription"
            value={formData.jobDescription}
            onChange={handleChange}
            placeholder="공고 내용을 붙여넣으세요"
            className="w-full rounded-lg border-[1.5px] border-stroke bg-transparent px-5 py-3 outline-none focus:border-primary dark:border-form-strokedark dark:bg-form-input"
          ></textarea>
        </AnalysisSection>

        <AnalysisSection step={3} title="내 자기소개서">
          <textarea
            rows={6}
            name="resumeContent"
            value={formData.resumeContent}
            onChange={handleChange}
            placeholder="자소서 내용을 입력하세요"
            className="mb-6 w-full rounded-lg border-[1.5px] border-stroke bg-transparent px-5 py-3 outline-none focus:border-primary dark:border-form-strokedark dark:bg-form-input"
          ></textarea>

          <div className="mb-6 flex items-center gap-4 text-gray-400">
            <span className="h-px flex-1 bg-gray-200 dark:bg-gray-700"></span>
            <span className="text-xs uppercase">OR</span>
            <span className="h-px flex-1 bg-gray-200 dark:bg-gray-700"></span>
          </div>

          <div className="relative rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 p-8 text-center transition-all hover:bg-gray-100 dark:border-gray-600 dark:bg-meta-4">
            {formData.resumeFile ? (
              <div className="flex flex-col items-center justify-center gap-3">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-100 text-red-500 dark:bg-red-500/20">
                  <FaFilePdf className="h-8 w-8" />
                </div>
                <div className="max-w-xs">
                  <p className="truncate text-sm font-bold text-black dark:text-white">
                    {formData.resumeFile.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {(formData.resumeFile.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleRemoveFile}
                  className="mt-2 flex items-center gap-1.5 rounded-full bg-white px-4 py-1.5 text-xs font-bold text-red-500 shadow-sm border border-red-100 hover:bg-red-50"
                >
                  <FaTimes /> 파일 삭제
                </button>
              </div>
            ) : (
              <>
                <input
                  type="file"
                  onChange={handleFileChange}
                  accept=".pdf"
                  className="absolute inset-0 cursor-pointer opacity-0"
                />
                <div className="flex flex-col items-center justify-center gap-2">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-primary shadow-sm dark:bg-boxdark">
                    <FaCloudUploadAlt className="h-6 w-6" />
                  </div>
                  <p className="text-sm font-bold text-primary">
                    자소서 PDF 업로드
                  </p>
                  <p className="text-xs text-gray-500">
                    클릭하거나 파일을 여기로 드래그하세요
                  </p>
                </div>
              </>
            )}
          </div>
        </AnalysisSection>

        <div className="mt-8 flex flex-col items-center gap-4">
          <button
            onClick={handleAnalyzeClick}
            disabled={isAnalyzing}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary py-4 font-bold text-white shadow-lg transition hover:bg-opacity-90 disabled:bg-gray-400"
          >
            {isAnalyzing ? <FaSpinner className="animate-spin" /> : <FaMagic />}
            AI 분석 요청하기
          </button>
        </div>
      </div>
    </div>
  );
};

export default ResumeAnalysisPage;
