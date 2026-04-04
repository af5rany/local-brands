import {
  Controller,
  Get,
  Post as HttpPost,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  Request,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { FeedService } from './feed.service';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { CreateCommentDto } from './dto/create-comment.dto';
import { FeedQueryDto } from './dto/feed-query.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { RegisteredUsersOnlyGuard } from '../auth/registered-users-only.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '../common/enums/user.enum';
import { Public } from '../auth/public.decorator';

@ApiTags('feed')
@Controller('feed')
export class FeedController {
  constructor(private readonly feedService: FeedService) {}

  // ── Posts ──

  @HttpPost('posts')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.BRAND_OWNER)
  @ApiOperation({ summary: 'Create a new post (brand owners only)' })
  async createPost(@Body() dto: CreatePostDto, @Request() req) {
    return this.feedService.createPost(dto, req.user.id);
  }

  @Get()
  @Public()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get feed (public, chronological)' })
  async getFeed(@Query() query: FeedQueryDto, @Request() req) {
    const userId = req.user?.id;
    return this.feedService.getFeed(query, userId);
  }

  @Get('brand/:brandId')
  @Public()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get posts by a specific brand' })
  async getBrandPosts(
    @Param('brandId', ParseIntPipe) brandId: number,
    @Query() query: FeedQueryDto,
    @Request() req,
  ) {
    return this.feedService.getFeed({ ...query, brandId }, req.user?.id);
  }

  @Get('posts/:id')
  @Public()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get a single post' })
  async getPost(
    @Param('id', ParseIntPipe) id: number,
    @Request() req,
  ) {
    return this.feedService.findPostById(id, req.user?.id);
  }

  @Patch('posts/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.BRAND_OWNER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Update a post (caption, tagged products)' })
  async updatePost(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdatePostDto,
    @Request() req,
  ) {
    return this.feedService.updatePost(id, dto, req.user.id);
  }

  @Delete('posts/:id')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Delete a post (brand owner or admin)' })
  async deletePost(@Param('id', ParseIntPipe) id: number, @Request() req) {
    return this.feedService.deletePost(id, req.user.id, req.user.role);
  }

  // ── Likes ──

  @HttpPost('posts/:id/like')
  @UseGuards(JwtAuthGuard, RegisteredUsersOnlyGuard)
  @ApiOperation({ summary: 'Toggle like on a post' })
  async toggleLike(@Param('id', ParseIntPipe) id: number, @Request() req) {
    return this.feedService.toggleLike(id, req.user.id);
  }

  @Get('posts/:id/liked')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Check if current user liked a post' })
  async isLiked(@Param('id', ParseIntPipe) id: number, @Request() req) {
    return this.feedService.isLiked(id, req.user.id);
  }

  // ── Comments ──

  @Get('posts/:id/comments')
  @ApiOperation({ summary: 'Get comments on a post (public)' })
  async getComments(
    @Param('id', ParseIntPipe) id: number,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ) {
    return this.feedService.getComments(id, +page, +limit);
  }

  @HttpPost('posts/:id/comments')
  @UseGuards(JwtAuthGuard, RegisteredUsersOnlyGuard)
  @ApiOperation({ summary: 'Add a comment to a post' })
  async addComment(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CreateCommentDto,
    @Request() req,
  ) {
    return this.feedService.addComment(id, dto, req.user.id);
  }

  @Delete('comments/:id')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Delete a comment (own, brand owner, or admin)' })
  async deleteComment(
    @Param('id', ParseIntPipe) id: number,
    @Request() req,
  ) {
    return this.feedService.deleteComment(id, req.user.id, req.user.role);
  }

  // ── Brand Follows ──

  @HttpPost('brands/:id/follow')
  @UseGuards(JwtAuthGuard, RegisteredUsersOnlyGuard)
  @ApiOperation({ summary: 'Toggle follow on a brand' })
  async toggleFollow(
    @Param('id', ParseIntPipe) id: number,
    @Request() req,
  ) {
    return this.feedService.toggleFollow(id, req.user.id);
  }

  @Get('brands/:id/following')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Check follow status and notification preference' })
  async getFollowStatus(
    @Param('id', ParseIntPipe) id: number,
    @Request() req,
  ) {
    return this.feedService.getFollowStatus(id, req.user.id);
  }

  @Patch('brands/:id/follow/notify')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Toggle notification preference for a followed brand' })
  async toggleNotify(
    @Param('id', ParseIntPipe) id: number,
    @Request() req,
  ) {
    return this.feedService.toggleNotify(id, req.user.id);
  }

  @Get('brands/following')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'List brands the user follows' })
  async getFollowedBrands(@Request() req) {
    return this.feedService.getFollowedBrands(req.user.id);
  }
}
