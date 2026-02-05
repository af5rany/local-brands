import { ProductType, ProductStatus, ProductVariantData } from 'src/common/enums/product.enum';

export class PublicBrandDto {
    id: number;
    name: string;
    logo: string;
    slug?: string;
}

export class PublicProductDto {
    id: number;
    slug: string;
    name: string;
    description: string;
    price: number;
    salePrice: number | null;
    basePrice: number | null;
    currency: string;
    mainImage: string;
    images: string[];
    brand: PublicBrandDto;
    category: string; // Mapping from subcategory
    productType: ProductType;
    isAvailable: boolean;
    inStock: boolean;
    isLowStock: boolean;
    variants: ProductVariantData[];
    rating: number;
    reviewCount: number;
    isFeatured: boolean;
    isNewArrival: boolean;
}
