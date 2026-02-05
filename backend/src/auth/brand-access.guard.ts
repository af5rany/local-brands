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
        const membership = await this.brandsService.getMembership(brandId, user.userId);
        if (!membership) {
            throw new ForbiddenException('Access denied. You do not have permissions for this brand.');
        }

        // Owners have full access to their brand
        if (membership.role === 'owner') {
            return true;
        }

        // Staff check for specific scopes
        const method = request.method;
        const url = request.url;

        // Product management scope
        if (url.includes('/products') && ['POST', 'PUT', 'DELETE'].includes(method)) {
            if (!membership.canManageProducts) {
                throw new ForbiddenException('Access denied. You do not have permission to manage products for this brand.');
            }
        }

        // Brand profile editing scope
        if (url.match(/\/brands\/\d+$/) && method === 'PUT') {
            if (!membership.canEditBrandProfile) {
                throw new ForbiddenException('Access denied. You do not have permission to edit this brand\'s profile.');
            }
        }

        return true;
    }
}
