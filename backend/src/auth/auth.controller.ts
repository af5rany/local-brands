import {
  Controller,
  Post,
  Body,
  Req,
  UseGuards,
  UsePipes,
  ValidationPipe,
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
