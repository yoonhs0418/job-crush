// 로깅 인터셉터
// 모든 HTTP 요청과 응답을 로깅합니다

// TODO: 구현 필요
// import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
// import { Observable } from 'rxjs';
// import { tap } from 'rxjs/operators';
// 
// @Injectable()
// export class LoggingInterceptor implements NestInterceptor {
//   intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
//     const request = context.switchToHttp().getRequest();
//     const { method, url } = request;
//     const now = Date.now();
// 
//     return next.handle().pipe(
//       tap(() => {
//         const response = context.switchToHttp().getResponse();
//         console.log(`${method} ${url} ${response.statusCode} ${Date.now() - now}ms`);
//       }),
//     );
//   }
// }

