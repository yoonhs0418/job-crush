// 채용 공고 컨트롤러
// 채용 공고 관련 API 엔드포인트를 정의합니다

import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { JobsService } from './jobs.service';

@Controller('jobs')
export class JobsController {
  constructor(private readonly jobsService: JobsService) {}

  // TODO: CRUD 로직 구현
  // @Get()
  // async findAll() {
  //   return this.jobsService.findAll();
  // }
}

