import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { FaEnvelope, FaLock, FaSignInAlt, FaArrowLeft } from "react-icons/fa";
import { isAxiosError } from "axios";
import { apiClient, ACCESS_TOKEN_STORAGE_KEY } from "@/api/client";
import { API_ENDPOINTS } from "@/constants/api";

type LoginResponse = {
  accessToken: string;
  user: { id: number; email: string; name: string };
};

const LoginPage = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsLoading(true);
    try {
      const { data } = await apiClient.post<LoginResponse>(
        API_ENDPOINTS.AUTH.LOGIN,
        { email, password },
      );
      localStorage.setItem(ACCESS_TOKEN_STORAGE_KEY, data.accessToken);
      // 레이아웃(헤더 등)과 호환: 기존 키 유지
      localStorage.setItem(
        "jobcrush_user",
        JSON.stringify({
          id: data.user.id,
          name: data.user.name,
          email: data.user.email,
        }),
      );
      navigate("/");
    } catch (err: unknown) {
      if (isAxiosError<{ message?: string | string[] }>(err)) {
        const status = err.response?.status;
        const body = err.response?.data;
        const msg = body?.message;
        if (status === 401) {
          setErrorMessage(
            typeof msg === "string"
              ? msg
              : "이메일 또는 비밀번호가 올바르지 않습니다.",
          );
        } else if (typeof msg === "string") {
          setErrorMessage(msg);
        } else {
          setErrorMessage("로그인에 실패했습니다. 잠시 후 다시 시도해 주세요.");
        }
      } else {
        setErrorMessage("네트워크 오류가 발생했습니다.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 dark:bg-boxdark-2 px-4 py-12">
      {/* 🚀 1. 메인으로 돌아가기 (상단 배치) */}
      <div className="mb-6 w-full max-w-[420px]">
        <Link
          to="/"
          className="group inline-flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-primary transition-colors"
        >
          <FaArrowLeft className="transition-transform group-hover:-translate-x-1" />
          메인 화면으로 돌아가기
        </Link>
      </div>

      <div className="w-full max-w-[420px] rounded-2xl bg-white p-10 shadow-2xl dark:bg-boxdark border border-gray-100 dark:border-strokedark">
        {/* 🚀 2. 로고 클릭 시 메인 이동 */}
        <div className="mb-12 text-center">
          <Link
            to="/"
            className="inline-block transition-transform hover:scale-105"
          >
            <h2 className="text-4xl font-extrabold text-primary mb-3">
              Job Crush
            </h2>
          </Link>
          <p className="text-gray-500 dark:text-gray-400 font-medium">
            스마트한 취업 준비의 시작
          </p>
        </div>

        {errorMessage && (
          <div
            role="alert"
            className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900/50 dark:bg-red-900/20 dark:text-red-200"
          >
            {errorMessage}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="mb-2 block text-sm font-semibold text-black dark:text-white">
              이메일 주소
            </label>
            <div className="relative">
              <input
                type="email"
                placeholder="example@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl border border-stroke bg-gray-50 py-4 pl-12 pr-5 outline-none focus:border-primary focus:bg-white transition-all dark:border-form-strokedark dark:bg-form-input"
                required
              />
              <FaEnvelope className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-black dark:text-white">
              비밀번호
            </label>
            <div className="relative">
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl border border-stroke bg-gray-50 py-4 pl-12 pr-5 outline-none focus:border-primary focus:bg-white transition-all dark:border-form-strokedark dark:bg-form-input"
                required
              />
              <FaLock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="flex w-full items-center justify-center gap-3 rounded-xl bg-primary py-4.5 text-lg font-bold text-white shadow-lg transition hover:bg-opacity-90 active:scale-[0.98] disabled:bg-gray-400"
          >
            {isLoading ? (
              <span className="animate-pulse">로그인 중...</span>
            ) : (
              <>
                <FaSignInAlt /> 로그인
              </>
            )}
          </button>
        </form>

        <div className="mt-10 border-t border-gray-100 dark:border-strokedark pt-8 text-center">
          <p className="text-sm text-gray-500 text-center w-full">
            아직 Job Crush 회원이 아니신가요?
          </p>
          <Link
            to="/signup"
            className="mt-2 inline-block font-bold text-primary hover:underline"
          >
            지금 바로 회원가입 하기
          </Link>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
