import { IsEnum, IsString } from 'class-validator';

export class SocialLoginDto {
  @IsEnum(['google', 'facebook'])
  provider: 'google' | 'facebook';

  @IsString()
  token: string;
}
