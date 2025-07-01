// import {
//   Entity,
//   PrimaryGeneratedColumn,
//   Column,
//   ManyToOne,
//   OneToMany,
//   CreateDateColumn,
//   UpdateDateColumn,
//   Index,
// } from 'typeorm';
// import { Brand } from '../brands/brand.entity';

// export enum ProductType {
//   SHOES = 'Shoes',
//   HOODIES = 'Hoodies',
//   SHIRTS = 'Shirts',
//   ACCESSORIES = 'Accessories',
// }

// export enum ProductStatus {
//   ACTIVE = 'active',
//   INACTIVE = 'inactive',
//   DRAFT = 'draft',
//   DISCONTINUED = 'discontinued',
// }

// export enum Gender {
//   MEN = 'men',
//   WOMEN = 'women',
//   UNISEX = 'unisex',
//   KIDS = 'kids',
// }

// @Entity()
// @Index(['name', 'brand']) // For better search performance
// export class Product {
//   @PrimaryGeneratedColumn()
//   id: number;

//   @Column()
//   name: string;

//   @Column('text', { nullable: true })
//   description: string;

//   @Column('text', { nullable: true })
//   shortDescription: string; // For product cards/listings

//   @Column('decimal', { precision: 10, scale: 2 })
//   price: number;

//   @Column('decimal', { precision: 10, scale: 2, nullable: true })
//   salePrice: number; // Discounted price

//   @Column({
//     type: 'enum',
//     enum: ProductType,
//     nullable: true,
//   })
//   productType: ProductType;

//   @Column({ nullable: true })
//   subcategory: string;

//   @Column({
//     type: 'enum',
//     enum: Gender,
//     nullable: true,
//   })
//   gender: Gender;

//   @Column('simple-array', { nullable: true })
//   imageUrls: string[]; // Main product images

//   @Column('simple-array', { nullable: true })
//   tags: string[]; // For search and filtering

//   @Column('varchar', { nullable: true })
//   material: string;

//   @Column('varchar', { nullable: true })
//   careInstructions: string;

//   @Column('varchar', { nullable: true })
//   origin: string; // Country of manufacture

//   @Column('varchar', { nullable: true })
//   season: string; // Spring, Summer, Fall, Winter

//   // Dimensions and weight for shipping
//   @Column('decimal', { precision: 8, scale: 2, nullable: true })
//   weight: number; // in kg

//   @Column('decimal', { precision: 8, scale: 2, nullable: true })
//   length: number; // in cm

//   @Column('decimal', { precision: 8, scale: 2, nullable: true })
//   width: number; // in cm

//   @Column('decimal', { precision: 8, scale: 2, nullable: true })
//   height: number; // in cm

//   // SEO fields
//   @Column({ nullable: true })
//   metaTitle: string;

//   @Column('text', { nullable: true })
//   metaDescription: string;

//   @Column({ nullable: true })
//   slug: string; // URL-friendly version of name

//   // Review and rating
//   @Column('decimal', { precision: 3, scale: 2, nullable: true })
//   averageRating: number;

//   @Column('int', { default: 0 })
//   reviewCount: number;

//   // Status and availability
//   @Column({
//     type: 'enum',
//     enum: ProductStatus,
//     default: ProductStatus.ACTIVE,
//   })
//   status: ProductStatus;

//   @Column('boolean', { default: true })
//   isActive: boolean;

//   @Column('boolean', { default: false })
//   isFeatured: boolean;

//   // Total stock (sum of all variants)
//   @Column('int', { default: 0 })
//   totalStock: number;

//   // Relationships
//   @ManyToOne(() => Brand, { eager: true })
//   brand: Brand;

//   @OneToMany(() => ProductVariant, (variant) => variant.product, {
//     cascade: true,
//     eager: false,
//   })
//   variants: ProductVariant[];

//   @CreateDateColumn()
//   createdAt: Date;

//   @UpdateDateColumn()
//   updatedAt: Date;

//   // Virtual fields (computed properties)
//   get isOnSale(): boolean {
//     return this.salePrice !== null && this.salePrice < this.price;
//   }

//   get finalPrice(): number {
//     return this.isOnSale ? this.salePrice : this.price;
//   }

//   get isInStock(): boolean {
//     return this.totalStock > 0;
//   }

//   // Get unique colors from variants
//   get availableColors(): string[] {
//     if (!this.variants) return [];
//     return [
//       ...new Set(
//         this.variants
//           .filter((v) => v.isActive && v.stock > 0)
//           .map((v) => v.color)
//           .filter(Boolean),
//       ),
//     ];
//   }

//   // Get unique sizes from variants
//   get availableSizes(): string[] {
//     if (!this.variants) return [];
//     return [
//       ...new Set(
//         this.variants
//           .filter((v) => v.isActive && v.stock > 0)
//           .map((v) => v.size)
//           .filter(Boolean),
//       ),
//     ];
//   }
// }

// // Separate entity for product variants (recommended approach)
// @Entity()
// export class ProductVariant {
//   @PrimaryGeneratedColumn()
//   id: number;

//   @Column()
//   productId: number;

//   @Column({ nullable: true })
//   size: string;

//   @Column({ nullable: true })
//   color: string;

//   @Column({ nullable: true })
//   colorHex: string; // Hex code for color display

//   @Column('int', { default: 0 })
//   stock: number;

//   @Column({ unique: true })
//   sku: string; // Each variant has its own SKU

//   @Column('decimal', { precision: 10, scale: 2, nullable: true })
//   priceAdjustment: number; // Price difference from base product

//   @Column('simple-array', { nullable: true })
//   imageUrls: string[]; // Variant-specific images

//   @Column('boolean', { default: true })
//   isActive: boolean;

//   @ManyToOne(() => Product, (product) => product.variants)
//   product: Product;

//   @CreateDateColumn()
//   createdAt: Date;

//   @UpdateDateColumn()
//   updatedAt: Date;
// }
