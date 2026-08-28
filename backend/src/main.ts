import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
// import { HttpExceptionFilter } from './shared/filters/http-exception.filter';
// import { LoggingInterceptor } from './shared/interceptors/logging.interceptor';
// import { TransformInterceptor } from './shared/interceptors/transform.interceptor';

/** CORS_ORIGIN 쉼표 구분(예: http://localhost:5173,http://127.0.0.1:5173). 비어 있으면 로컬 두 호스트 기본 */
function parseCorsOrigins(): string[] {
  const raw = process.env.CORS_ORIGIN?.trim();
  if (raw && raw !== '*') {
    return [...new Set(raw.split(',').map((o) => o.trim()).filter(Boolean))];
  }
  return ['http://localhost:5173', 'http://127.0.0.1:5173'];
}

/** true면 요청 Origin을 그대로 허용(모바일/LAN IP로 Vite 접속 시). 프로덕션에서는 CORS_ORIGIN 열거 권장 */
function corsOriginOption(): true | string[] {
  if (process.env.CORS_ORIGIN?.trim() === '*') {
    return true;
  }
  return parseCorsOrigins();
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // DTO에 없는 필드는 제거(Prisma로 안 넘어감)
      // false: confirmPassword 등 프록시/구버전 클라이언트가 실어 보내도 400 나지 않음
      forbidNonWhitelisted: false,
      transform: true,
    }),
  );

  // 전역 필터 설정 (예외 처리)
  // app.useGlobalFilters(new HttpExceptionFilter());

  // 전역 인터셉터 설정 (로깅, 응답 변환)
  // app.useGlobalInterceptors(
  //   new LoggingInterceptor(),
  //   new TransformInterceptor(),
  // );

  app.enableCors({
    origin: corsOriginOption(),
    credentials: true,
  });

  const port = Number(process.env.PORT) || 3000;
  await app.listen(port);
  console.log(
    `Application is running on: http://localhost:${port} | http://127.0.0.1:${port}`,
  );
}
bootstrap();
