// 사용자 컨트롤러
// 사용자 프로필 관련 API 엔드포인트를 정의합니다

import { Controller, Get, Put, Body, Param } from '@nestjs/common';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // TODO: 사용자 프로필 로직 구현
  // @Get(':id')
  // async findOne(@Param('id') id: string) {
  //   return this.usersService.findOne(id);
  // }
}

