import {
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
  MaxLength,
} from 'class-validator';

export class AnalyzeResumeDto {
  @IsString()
  @IsNotEmpty()
  companyName: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(100)
  resumeText: string; // 자소서 원문

  @IsString()
  @IsNotEmpty()
  @MinLength(50)
  jobDescription: string; // 채용 공고 (JD) 내용

  @IsOptional()
  @IsString()
  @MaxLength(200)
  resumeTitle?: string;
}
