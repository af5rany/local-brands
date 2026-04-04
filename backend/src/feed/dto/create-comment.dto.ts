import { IsString, MaxLength, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateCommentDto {
  @ApiProperty({ description: 'Comment text (1-1000 chars)' })
  @IsString()
  @MinLength(1)
  @MaxLength(1000)
  text: string;
}
