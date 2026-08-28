// 전역 예외 필터
// 애플리케이션 전역에서 발생하는 예외를 처리합니다

// TODO: 구현 필요
// import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
// 
// @Catch()
// export class HttpExceptionFilter implements ExceptionFilter {
//   catch(exception: unknown, host: ArgumentsHost) {
//     const ctx = host.switchToHttp();
//     const response = ctx.getResponse();
//     const request = ctx.getRequest();
// 
//     const status =
//       exception instanceof HttpException
//         ? exception.getStatus()
//         : HttpStatus.INTERNAL_SERVER_ERROR;
// 
//     const message =
//       exception instanceof HttpException
//         ? exception.getResponse()
//         : 'Internal server error';
// 
//     response.status(status).json({
//       statusCode: status,
//       timestamp: new Date().toISOString(),
//       path: request.url,
//       message,
//     });
//   }
// }

