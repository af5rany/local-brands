import {
    Injectable,
    CanActivate,
    ExecutionContext,
    ForbiddenException,
} from '@nestjs/common';
import { UserRole } from 'src/common/enums/user.enum';
import { BrandsService } from 'src/brands/brands.service';

@Injectable()
export class BrandAccessGuard implements CanActivate {
    constructor(private brandsService: BrandsService) { }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest();
        const { user, params } = request;
        const brandId = parseInt(params.brandId || params.id, 10);

        if (!user) {
            throw new ForbiddenException('User not authenticated');
        }

        // Admins have full access
        if (user.role === UserRole.ADMIN) {
            return true;
        }

        if (isNaN(brandId)) {
            // If there's no brandId in params, we might be creating a brand or listing brands
            // Creation/Listing should be handled by RolesGuard (Admin only for creation, etc.)
            return true;
        }

        // Check if user is associated with this brand
        const isMember = await this.brandsService.checkMembership(brandId, user.userId);

        if (!isMember) {
            throw new ForbiddenException('Access denied. You do not have permissions for this brand.');
        }

        return true;
    }
}
