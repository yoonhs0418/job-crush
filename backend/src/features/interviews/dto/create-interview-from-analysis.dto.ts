import { IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateInterviewFromAnalysisDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  analysisResultId: number;
}
