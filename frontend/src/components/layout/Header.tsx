import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  FaHome,
  FaBriefcase,
  FaUserCircle,
  FaSignOutAlt,
} from "react-icons/fa";
import { ACCESS_TOKEN_STORAGE_KEY } from "@/api/client";

type HeaderProps = {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
};

const Header = (props: HeaderProps) => {
  const navigate = useNavigate();
  const [user, setUser] = useState<{ name: string } | null>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem("jobcrush_user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem(ACCESS_TOKEN_STORAGE_KEY);
    localStorage.removeItem("jobcrush_user");
    setUser(null);
    navigate("/login");
  };

  return (
    <header className="sticky top-0 z-999 flex w-full bg-white drop-shadow-1 dark:bg-boxdark dark:drop-shadow-none">
      <div className="flex flex-grow items-center justify-between px-4 py-4 shadow-2 md:px-6 2xl:px-11">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 sm:gap-4 lg:hidden">
            <button
              aria-controls="sidebar"
              onClick={(e) => {
                e.stopPropagation();
                props.setSidebarOpen(!props.sidebarOpen);
              }}
              className="z-99999 block rounded-sm border border-stroke bg-white p-1.5 shadow-sm dark:border-strokedark dark:bg-boxdark"
            >
              <span className="relative block h-5.5 w-5.5 cursor-pointer">
                <span className="du-block absolute right-0 h-full w-full">
                  <span
                    className={`relative left-0 top-0 my-1 block h-0.5 w-0 rounded-sm bg-black delay-[0] duration-200 ease-in-out dark:bg-white ${!props.sidebarOpen && "!w-full delay-300"}`}
                  ></span>
                  <span
                    className={`relative left-0 top-0 my-1 block h-0.5 w-0 rounded-sm bg-black delay-150 duration-200 ease-in-out dark:bg-white ${!props.sidebarOpen && "delay-400 !w-full"}`}
                  ></span>
                  <span
                    className={`relative left-0 top-0 my-1 block h-0.5 w-0 rounded-sm bg-black delay-200 duration-200 ease-in-out dark:bg-white ${!props.sidebarOpen && "!w-full delay-500"}`}
                  ></span>
                </span>
              </span>
            </button>

            <Link className="block flex-shrink-0 lg:hidden" to="/">
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 text-primary">
                <FaBriefcase size={20} />
              </div>
            </Link>
          </div>

          <Link
            to="/"
            className="hidden lg:flex items-center gap-2 hover:opacity-80 transition-opacity"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 text-primary dark:bg-meta-4">
              <FaHome className="h-6 w-6" />
            </div>
            <h1 className="text-xl font-bold text-black dark:text-white">
              JobCrush
            </h1>
          </Link>
        </div>

        <div className="flex items-center gap-3">
          {user ? (
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="text-right hidden xsm:block">
                <p className="text-sm font-bold text-black dark:text-white">
                  {user.name}님 환영합니다
                </p>
                <p className="text-[10px] text-gray-500 text-right">MEMBER</p>
              </div>
              <button
                onClick={handleLogout}
                className="flex h-10 w-10 items-center justify-center rounded-full border border-stroke hover:text-primary dark:border-strokedark transition-colors"
                title="로그아웃"
              >
                <FaSignOutAlt size={18} />
              </button>
            </div>
          ) : (
            <Link
              to="/login"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-6 py-2 text-center text-sm font-bold text-white hover:bg-opacity-90 transition-all shadow-md"
            >
              <FaUserCircle size={18} />
              로그인
            </Link>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
