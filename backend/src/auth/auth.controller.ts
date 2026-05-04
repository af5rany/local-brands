import {
  Controller,
  Post,
  Body,
  Req,
  UseGuards,
  UsePipes,
  ValidationPipe,
  Param,
  ParseIntPipe,
  ForbiddenException,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LocalAuthGuard } from './local-auth.guard';
import { JwtAuthGuard } from './jwt-auth.guard';
import { CreateUserDto } from './dto/create-user.dto';
import { SocialLoginDto } from './dto/social-login.dto';
import { User } from 'src/users/user.entity';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post('register')
  @UsePipes(new ValidationPipe({ whitelist: true }))
  async register(@Body() userDto: CreateUserDto) {
    return this.authService.register(userDto);
  }

  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @UseGuards(LocalAuthGuard)
  @Post('login')
  async login(
    @Req()
    req: {
      user: User;
    },
  ) {
    return this.authService.login(req.user);
  }

  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @Post('guest-login')
  @ApiOperation({ summary: 'Create a temporary guest session' })
  @ApiResponse({ status: 201, description: 'Guest token issued' })
  async guestLogin() {
    return this.authService.loginAsGuest();
  }

  @UseGuards(JwtAuthGuard)
  @Post('convert-guest/:id')
  @UsePipes(new ValidationPipe({ whitelist: true }))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Convert guest account to registered user' })
  @ApiResponse({ status: 201, description: 'Account converted successfully' })
  @ApiResponse({ status: 403, description: 'Not a guest or wrong account' })
  @ApiResponse({ status: 409, description: 'Email already registered' })
  async convertGuest(
    @Param('id', ParseIntPipe) id: number,
    @Body() userDto: CreateUserDto,
    @Req() req: { user: User },
  ) {
    if (req.user.id !== id || !req.user.isGuest) {
      throw new ForbiddenException('Unauthorized to convert this account');
    }
    return this.authService.convertGuestToUser(id, userDto);
  }

  @UseGuards(JwtAuthGuard)
  @Post('protected')
  getProtected(
    @Req()
    req: {
      user: User;
    },
  ) {
    return { message: 'This is protected!', user: req.user };
  }

  @Post('social')
  @UsePipes(new ValidationPipe({ whitelist: true }))
  async socialLogin(@Body() dto: SocialLoginDto) {
    return this.authService.socialLogin(dto.provider, dto.token);
  }

  @Post('forgot-password')
  async forgotPassword(@Body('email') email: string) {
    return this.authService.forgotPassword(email);
  }

  @Post('reset-password')
  async resetPassword(
    @Body('token') token: string,
    @Body('newPassword') newPass: string,
  ) {
    return this.authService.resetPassword(token, newPass);
  }

  // @Post('verify-email')
  // async verifyEmail(@Body('token') token: string) {
  //   return this.authService.verifyEmail(token);
  // }
}
