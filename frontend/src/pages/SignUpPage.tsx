import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  FaUser,
  FaEnvelope,
  FaLock,
  FaUserPlus,
  FaArrowLeft,
} from "react-icons/fa";
import { isAxiosError } from "axios";
import { apiClient } from "@/api/client";
import { API_ENDPOINTS } from "@/constants/api";

const SignUpPage = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (formData.password !== formData.confirmPassword) {
      setErrorMessage("비밀번호가 일치하지 않습니다.");
      return;
    }

    setIsLoading(true);
    try {
      await apiClient.post(API_ENDPOINTS.AUTH.REGISTER, {
        name: formData.name,
        email: formData.email,
        password: formData.password,
      });

      alert("회원가입이 완료되었습니다! 로그인해 주세요.");
      navigate("/login");
    } catch (err: unknown) {
      if (isAxiosError(err)) {
        if (err.code === 'ERR_NETWORK' || !err.response) {
          setErrorMessage(
            '서버에 연결할 수 없습니다. 백엔드(포트 3000)가 켜져 있는지, VITE_API_BASE_URL이 맞는지 확인해 주세요. 휴대폰·LAN IP로 접속 중이면 backend/.env의 CORS_ORIGIN에 해당 주소(예: http://192.168.x.x:5173)를 추가하거나 CORS_ORIGIN=* 로 잠시 허용해 보세요.',
          );
        } else {
          const message = err.response.data?.message;
          setErrorMessage(
            Array.isArray(message)
              ? message.join('\n')
              : typeof message === 'string'
                ? message
                : `회원가입에 실패했습니다. (${err.response.status})`,
          );
        }
      } else {
        setErrorMessage('네트워크 오류가 발생했습니다.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 dark:bg-boxdark-2 px-4 py-12">
      {/* 🚀 1. 메인으로 돌아가기 (로그인 페이지와 동일한 위치) */}
      <div className="mb-6 w-full max-w-[440px]">
        <Link
          to="/"
          className="group inline-flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-primary transition-colors"
        >
          <FaArrowLeft className="transition-transform group-hover:-translate-x-1" />
          메인 화면으로 돌아가기
        </Link>
      </div>

      <div className="w-full max-w-[440px] rounded-2xl bg-white p-10 shadow-2xl dark:bg-boxdark border border-gray-100 dark:border-strokedark">
        {/* 🚀 2. 로고 클릭 시 메인 이동 */}
        <div className="mb-10 text-center">
          <Link
            to="/"
            className="inline-block transition-transform hover:scale-105"
          >
            <h2 className="text-4xl font-extrabold text-primary mb-3">
              Job Crush
            </h2>
          </Link>
          <p className="text-gray-500 dark:text-gray-400 font-medium">
            새로운 시작을 위한 첫 걸음
          </p>
        </div>

        {errorMessage && (
          <p className="mb-4 whitespace-pre-line text-sm font-medium text-red-600 dark:text-red-400">
            {errorMessage}
          </p>
        )}

        <form onSubmit={handleSignUp} className="space-y-4">
          {/* 이름 입력 */}
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-black dark:text-white">
              이름
            </label>
            <div className="relative">
              <input
                type="text"
                placeholder="성재열"
                className="w-full rounded-xl border border-stroke bg-gray-50 py-3.5 pl-12 pr-5 outline-none focus:border-primary focus:bg-white transition-all dark:border-form-strokedark dark:bg-form-input"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                required
              />
              <FaUser className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            </div>
          </div>

          {/* 이메일 입력 */}
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-black dark:text-white">
              이메일 주소
            </label>
            <div className="relative">
              <input
                type="email"
                placeholder="example@email.com"
                className="w-full rounded-xl border border-stroke bg-gray-50 py-3.5 pl-12 pr-5 outline-none focus:border-primary focus:bg-white transition-all dark:border-form-strokedark dark:bg-form-input"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                required
              />
              <FaEnvelope className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            </div>
          </div>

          {/* 비밀번호 입력 */}
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-black dark:text-white">
              비밀번호
            </label>
            <div className="relative">
              <input
                type="password"
                placeholder="••••••••"
                className="w-full rounded-xl border border-stroke bg-gray-50 py-3.5 pl-12 pr-5 outline-none focus:border-primary focus:bg-white transition-all dark:border-form-strokedark dark:bg-form-input"
                value={formData.password}
                onChange={(e) =>
                  setFormData({ ...formData, password: e.target.value })
                }
                required
              />
              <FaLock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            </div>
          </div>

          {/* 비밀번호 확인 */}
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-black dark:text-white">
              비밀번호 확인
            </label>
            <div className="relative">
              <input
                type="password"
                placeholder="••••••••"
                className="w-full rounded-xl border border-stroke bg-gray-50 py-3.5 pl-12 pr-5 outline-none focus:border-primary focus:bg-white transition-all dark:border-form-strokedark dark:bg-form-input"
                value={formData.confirmPassword}
                onChange={(e) =>
                  setFormData({ ...formData, confirmPassword: e.target.value })
                }
                required
              />
              <FaLock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="flex w-full items-center justify-center gap-3 rounded-xl bg-primary py-4.5 mt-6 text-lg font-bold text-white shadow-lg transition hover:bg-opacity-90 active:scale-[0.98] disabled:bg-gray-400"
          >
            {isLoading ? (
              <span className="animate-pulse">가입 중...</span>
            ) : (
              <>
                <FaUserPlus /> 가입하기
              </>
            )}
          </button>
        </form>

        {/* 하단 로그인 유도 링크 */}
        <div className="mt-10 border-t border-gray-100 dark:border-strokedark pt-8 text-center">
          <p className="text-sm text-gray-500">
            이미 Job Crush 계정이 있으신가요?
          </p>
          <Link
            to="/login"
            className="mt-2 inline-block font-bold text-primary hover:underline"
          >
            기존 계정으로 로그인하기
          </Link>
        </div>
      </div>
    </div>
  );
};

export default SignUpPage;
