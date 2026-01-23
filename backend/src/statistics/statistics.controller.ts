import { Controller, Get, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { StatisticsService } from './statistics.service';
import { UserRole } from '../common/enums/user.enum';

@Controller('statistics')
@UseGuards(JwtAuthGuard)
export class StatisticsController {
    constructor(private readonly statisticsService: StatisticsService) { }

    @Get()
    async getStats(@Request() req) {
        const user = req.user;
        const userId = user.userId;
        const role = user.role;

        if (role === UserRole.ADMIN) {
            const adminStats = await this.statisticsService.getAdminStats();
            console.log('[DEBUG] Admin Stats:', adminStats);
            return adminStats;
        } else if (role === UserRole.BRAND_OWNER) {
            const ownerStats = await this.statisticsService.getBrandOwnerStats(userId);
            console.log('[DEBUG] Brand Owner Stats:', ownerStats);
            return ownerStats;
        } else {
            const customerStats = await this.statisticsService.getCustomerStats(userId);
            console.log('[DEBUG] Customer Stats:', customerStats);
            return customerStats;
        }
    }
}
