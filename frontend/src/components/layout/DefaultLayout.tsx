import React, { useState } from "react";
import Header from "./Header";
import Sidebar from "./Sidebar";
import { useLocation } from "react-router-dom";

const DefaultLayout = ({ children }: { children: React.ReactNode }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  // 1. [기존 코드] 아예 레이아웃(헤더+사이드바)을 안 보여줄 경로들 (로그인 등)
  const excludedRoutes = ["/login", "/signup"];
  const isExcludedRoute = excludedRoutes.includes(location.pathname);

  // 2. [추가 코드] "사이드바만" 숨길 경로들 정의
  const noSidebarRoutes = [
    "/analysis",
    "/analysis/result",
    "/interviews/setup",
    "/interviews/session",
    "/interviews/result",
  ];
  const isSidebarHidden = noSidebarRoutes.some((route) => location.pathname.startsWith(route));

  // 사이드바를 보여줄지 최종 결정 (전체 제외 경로가 아니고 && 사이드바 숨김 경로도 아닐 때)
  const showSidebar = !isExcludedRoute && !isSidebarHidden;

  return (
    <div className="dark:bg-boxdark-2 dark:text-bodydark">
      <div className="flex h-screen overflow-hidden">
        {/* 3. [수정] showSidebar 변수를 사용하여 조건부 렌더링 */}
        {showSidebar && (
          <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
        )}

        <div className="relative flex flex-1 flex-col overflow-y-auto overflow-x-hidden">
          {/* 헤더는 여전히 보여줍니다 (로그인 페이지가 아니라면) */}
          {!isExcludedRoute && (
            <Header sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
          )}

          <main>
            <div className="mx-auto max-w-screen-2xl p-4 md:p-6 2xl:p-10">
              {children}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
};

export default DefaultLayout;
