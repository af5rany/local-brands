import { IsEnum, IsString, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AppleFullName {
  @IsOptional() familyName?: string | null;
  @IsOptional() givenName?: string | null;
  @IsOptional() middleName?: string | null;
  @IsOptional() namePrefix?: string | null;
  @IsOptional() nameSuffix?: string | null;
  @IsOptional() nickname?: string | null;
}

export class SocialLoginDto {
  @ApiProperty({ enum: ['google', 'facebook', 'apple'] })
  @IsEnum(['google', 'facebook', 'apple'])
  provider: 'google' | 'facebook' | 'apple';

  // Google / Facebook
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  token?: string;

  // Apple
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  identityToken?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  authorizationCode?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  user?: string;

  @ApiPropertyOptional()
  @IsOptional()
  fullName?: AppleFullName | null;

  @ApiPropertyOptional()
  @IsOptional()
  email?: string | null;
}
