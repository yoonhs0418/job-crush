import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath, URL } from "node:url";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  server: {
    host: true, // 외부 접속 허용 (Docker 환경 필수)
    // Cloudflare 터널 Host 헤더 (jobcrush.jicp.cloud 등)
    allowedHosts: ["jobcrush.jicp.cloud", ".jicp.cloud"],
    proxy: {
      // '/api'로 시작하는 요청을 백엔드(3000번 포트)로 보냄
      "/api": {
        // Docker Compose 환경에서는 'backend' 서비스명을 사용해야 함
        // (프론트엔드 컨테이너 입장에서는 localhost가 아니라 backend 컨테이너)
        target: "http://backend:3000",
        changeOrigin: true,
        // ✅ 정규식 슬래시 이스케이프
        //   /api/analysis  ->  /analysis
        rewrite: (path) => path.replace(/^\/api/, ""),
      },
    },
  },
});
