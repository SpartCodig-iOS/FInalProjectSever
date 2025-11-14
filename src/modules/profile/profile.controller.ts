import { Body, Controller, Get, HttpCode, HttpStatus, Patch, Req, UnauthorizedException, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '../../common/guards/auth.guard';
import { success } from '../../types/api';
import { RequestWithUser } from '../../types/request';
import { toProfileResponse } from '../../utils/mappers';
import { ProfileResponseDto } from './dto/profile-response.dto';
import { updateProfileSchema } from '../../validators/profileSchemas';
import { ProfileService } from './profile.service';

@ApiTags('Profile')
@Controller('api/v1/profile')
export class ProfileController {
  constructor(private readonly profileService: ProfileService) {}

  @UseGuards(AuthGuard)
  @Get('me')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: '현재 사용자 프로필 조회' })
  @ApiOkResponse({ type: ProfileResponseDto })
  getProfile(@Req() req: RequestWithUser) {
    if (!req.currentUser) {
      throw new UnauthorizedException('Unauthorized');
    }

    const profileData = {
      ...toProfileResponse(req.currentUser),
      loginType: req.loginType ?? 'email',
    };

    return success(profileData);
  }

  @UseGuards(AuthGuard)
  @Patch('me')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: '현재 사용자 프로필 수정' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        name: { type: 'string', example: '김코드', nullable: true },
        avatarURL: { type: 'string', example: 'https://...' , nullable: true },
      },
    },
  })
  @ApiOkResponse({ type: ProfileResponseDto })
  async updateProfile(@Body() body: unknown, @Req() req: RequestWithUser) {
    if (!req.currentUser) {
      throw new UnauthorizedException('Unauthorized');
    }
    const payload = updateProfileSchema.parse(body);
    const updated = await this.profileService.updateProfile(req.currentUser.id, payload);
    return success(toProfileResponse(updated), 'Profile updated');
  }
}
