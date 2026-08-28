// 역할 가드
// 사용자의 역할(role)을 기반으로 접근을 제어합니다

// TODO: 구현 필요
// import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
// import { Reflector } from '@nestjs/core';
// import { Roles } from '../decorators/roles.decorator';
// 
// @Injectable()
// export class RolesGuard implements CanActivate {
//   constructor(private reflector: Reflector) {}
// 
//   canActivate(context: ExecutionContext): boolean {
//     const requiredRoles = this.reflector.getAllAndOverride<string[]>('roles', [
//       context.getHandler(),
//       context.getClass(),
//     ]);
// 
//     if (!requiredRoles) {
//       return true;
//     }
// 
//     const { user } = context.switchToHttp().getRequest();
//     return requiredRoles.some(role => user.roles?.includes(role));
//   }
// }

