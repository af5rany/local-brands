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
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { LocalAuthGuard } from './local-auth.guard';
import { JwtAuthGuard } from './jwt-auth.guard';
import { CreateUserDto } from './dto/create-user.dto';
import { User } from 'src/users/user.entity';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  // Register new user
  @Post('register')
  @UsePipes(new ValidationPipe({ whitelist: true }))
  async register(@Body() userDto: CreateUserDto) {
    return this.authService.register(userDto);
  }

  // Login and return a JWT token
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

  // Guest login - no credentials required
  @Post('guest-login')
  async guestLogin() {
    return this.authService.loginAsGuest();
  }

  // Convert guest user to regular user
  @UseGuards(JwtAuthGuard)
  @Post('convert-guest/:id')
  @UsePipes(new ValidationPipe({ whitelist: true }))
  async convertGuest(
    @Param('id', ParseIntPipe) id: number,
    @Body() userDto: CreateUserDto,
    @Req() req: { user: User },
  ) {
    // Ensure user can only convert their own guest account
    if (req.user.id !== id || !req.user.isGuest) {
      throw new Error('Unauthorized to convert this account');
    }
    return this.authService.convertGuestToUser(id, userDto);
  }

  // Protected route example
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
}
