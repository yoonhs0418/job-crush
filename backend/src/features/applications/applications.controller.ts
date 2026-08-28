// 지원 현황 컨트롤러
// 지원 현황 관련 API 엔드포인트를 정의합니다

import { Controller, Get, Post, Body } from '@nestjs/common';
import { ApplicationsService } from './applications.service';

@Controller('applications')
export class ApplicationsController {
  constructor(private readonly applicationsService: ApplicationsService) {}

  // TODO: 지원 현황 로직 구현
  // @Post()
  // async create(@Body() createDto: CreateApplicationDto) {
  //   return this.applicationsService.create(createDto);
  // }
}

