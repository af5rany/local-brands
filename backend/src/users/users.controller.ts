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
} from '@nestjs/common';
import { UsersService } from './users.service';
import { User } from './user.entity';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from 'src/common/enums/user.enum';

@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get()
  async findAll(@Request() req): Promise<User[]> {
    console.log('Admin accessing all users:', req.user);
    return this.usersService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: number, @Request() req): Promise<User> {
    console.log('Admin accessing user by ID:', req.user);
    return this.usersService.findOne(id);
  }

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
    console.log('Admin updating user:', req.user);
    return this.usersService.update(id, updateData);
  }

  @Delete(':id')
  async remove(@Param('id') id: number, @Request() req): Promise<void> {
    console.log('Admin deleting user:', req.user);
    return this.usersService.remove(id);
  }
}
