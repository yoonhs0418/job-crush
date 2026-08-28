import { IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class SubmitAnswerDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  questionId: number;
}
