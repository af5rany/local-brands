// users.controller.ts

import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Put,
  Delete,
  UseGuards,
  Request,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { User } from './user.entity';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from 'src/common/enums/user.enum';

@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsersController {
  constructor(private usersService: UsersService) { }

  @Roles(UserRole.ADMIN)
  @Get()
  async findAll(@Request() req): Promise<User[]> {
    console.log('Admin accessing all users:', req.user);
    return this.usersService.findAll();
  }

  // View a single user (Admin or self)
  @Get(':id')
  async findOne(@Param('id') id: string, @Request() req): Promise<User> {
    const currentUser = req.user;
    const userId = parseInt(id, 10);

    // Validate the ID is a valid number
    if (isNaN(userId)) {
      throw new BadRequestException('Invalid user ID');
    }

    if (currentUser.role === UserRole.ADMIN || currentUser.userId === userId) {
      return this.usersService.findOne(userId);
    } else {
      throw new ForbiddenException(
        'You are not allowed to view this user data',
      );
    }
  }

  @Roles(UserRole.ADMIN)
  @Post()
  async create(@Body() userData: Partial<User>, @Request() req): Promise<User> {
    console.log('Admin creating user:', req.user);
    return this.usersService.create(userData);
  }

  @Put(':id')
  async update(
    @Param('id') id: number,
    @Body() updateData: Partial<User>,
    @Request() req,
  ): Promise<User> {
    const currentUser = req.user;
    if (currentUser.role === UserRole.ADMIN || currentUser.userId === id) {
      console.log('Admin or user updating data:', currentUser);
      return this.usersService.update(id, updateData);
    } else {
      throw new ForbiddenException(
        'You are not allowed to update this user data',
      );
    }
  }

  @Delete(':id')
  async remove(@Param('id') id: number, @Request() req): Promise<void> {
    const currentUser = req.user;
    // Only allow admin to delete users
    if (currentUser.role === UserRole.ADMIN) {
      console.log('Admin deleting user:', req.user);
      return this.usersService.remove(id);
    } else {
      throw new ForbiddenException(
        'You are not allowed to delete this user data',
      );
    }
  }
}
