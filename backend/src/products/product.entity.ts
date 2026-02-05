// src/products/product.entity.ts - Enhanced Version
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  Index,
  Check,
  DeleteDateColumn,
} from 'typeorm';
import { Brand } from '../brands/brand.entity';
import {
  ProductType,
  ProductVariantData,
  Season,
  ProductStatus,
} from 'src/common/enums/product.enum';
import { Gender } from 'src/common/enums/user.enum';
import { Wishlist } from 'src/wishlist/wishlist.entity';
import { CartItem } from 'src/cart/cart-item.entity';
import { OrderItem } from 'src/orders/order-item.entity';

@Entity()
@Index(['name', 'productType', 'gender']) // Composite index for filtering
@Index(['price']) // For price range filtering
@Index(['createdAt']) // For sorting by date
@Index(['isFeatured']) // For featured products
@Index(['isActive']) // For active products
@Check('"salePrice" IS NULL OR "salePrice" <= "price"')
export class Product {
  @PrimaryGeneratedColumn()
  id: number;

  // ✅ Add SKU for inventory management
  @Column({ unique: true, nullable: true })
  @Index()
  sku: string;

  @Column()
  @Index({ fulltext: true }) // For text search
  name: string;

  @Column({ nullable: true, type: 'text' })
  @Index({ fulltext: true }) // For text search
  description: string;

  @Column('decimal', { precision: 10, scale: 2 })
  price: number;

  @Column('decimal', { precision: 10, scale: 2, nullable: true })
  salePrice: number;

  // ✅ Add discount percentage for easy display
  @Column('decimal', { precision: 5, scale: 2, nullable: true })
  discountPercentage: number;

  @Column({
    type: 'enum',
    enum: ProductType,
    nullable: true,
  })
  productType: ProductType;

  @Column({ nullable: true })
  @Index()
  subcategory: string;

  @Column({
    type: 'enum',
    enum: Gender,
    nullable: true,
  })
  gender: Gender;

  @Column({
    type: 'enum',
    enum: Season,
    nullable: true,
  })
  season: Season;

  @Column('simple-array', { nullable: true })
  tags: string[];

  @Column({ nullable: true })
  material: string;

  @Column({ nullable: true })
  careInstructions: string;

  @Column({ nullable: true })
  origin: string;

  // Dimensions and Weight
  @Column('decimal', { precision: 8, scale: 2, nullable: true })
  weight: number;

  @Column('decimal', { precision: 8, scale: 2, nullable: true })
  length: number;

  @Column('decimal', { precision: 8, scale: 2, nullable: true })
  width: number;

  @Column('decimal', { precision: 8, scale: 2, nullable: true })
  height: number;

  @Column('boolean', { default: true })
  @Index()
  isAvailable: boolean;

  @Column({ default: 'USD' })
  currency: string;

  @Column('decimal', { precision: 10, scale: 2, nullable: true })
  basePrice: number;

  @Column({ default: 10 })
  lowStockThreshold: number;

  @Column('simple-array', { nullable: true })
  images: string[];

  @Column({
    type: 'enum',
    enum: ProductStatus,
    default: ProductStatus.DRAFT,
  })
  @Index()
  status: ProductStatus;

  @Column('boolean', { default: false })
  isFeatured: boolean;

  // ✅ Add more product flags
  @Column('boolean', { default: false })
  isNewArrival: boolean;

  @Column('boolean', { default: false })
  isBestseller: boolean;

  @Column('boolean', { default: false })
  isOnSale: boolean;

  // ✅ Add rating and review counts
  @Column('decimal', { precision: 3, scale: 2, default: 0 })
  averageRating: number;

  @Column({ default: 0 })
  reviewCount: number;

  @Column({ default: 0 })
  viewCount: number;

  @Column({ default: 0 })
  salesCount: number;

  // Store brand ID as foreign key
  @Column({ name: 'brandId', nullable: false })
  brandId: number;

  // Relation to Brand entity
  @ManyToOne(() => Brand, { eager: true, nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'brandId' })
  brand: Brand;

  @OneToMany(() => Wishlist, (wishlist) => wishlist.product)
  wishlist: Wishlist[];

  @OneToMany(() => CartItem, (cartItem) => cartItem.product)
  cartItems: CartItem[];

  @OneToMany(() => OrderItem, (orderItem) => orderItem.product)
  orderItems: OrderItem[];

  // Embedded variants as JSON column
  @Column({
    type: 'json',
    nullable: true,
    default: () => "'[]'",
  })
  variants: ProductVariantData[];

  // ✅ Add available colors and sizes for quick filtering
  @Column('simple-array', { nullable: true })
  availableColors: string[];

  @Column('simple-array', { nullable: true })
  availableSizes: string[];

  // ✅ SEO fields
  @Column({ nullable: true })
  metaTitle: string;

  @Column({ nullable: true, type: 'text' })
  metaDescription: string;

  @Column('simple-array', { nullable: true })
  metaKeywords: string[];

  @Column({ nullable: true })
  slug: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt: Date;

  // Helper methods for working with variants
  addVariant(color: string, stock: number, variantImages: string[]): void {
    if (!this.variants) {
      this.variants = [];
    }

    const newVariant: ProductVariantData = {
      color,
      stock,
      variantImages,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.variants.push(newVariant);
    this.updateAvailableColors();
  }

  removeVariant(color: string): void {
    if (this.variants) {
      this.variants = this.variants.filter(
        (variant) => variant.color !== color,
      );
      this.updateAvailableColors();
    }
  }

  updateVariant(color: string, updates: Partial<ProductVariantData>): void {
    if (this.variants) {
      const variantIndex = this.variants.findIndex(
        (variant) => variant.color === color,
      );
      if (variantIndex !== -1) {
        this.variants[variantIndex] = {
          ...this.variants[variantIndex],
          ...updates,
          updatedAt: new Date(),
        };
      }
    }
  }

  getVariantByColor(color: string): ProductVariantData | undefined {
    return this.variants?.find((variant) => variant.color === color);
  }

  setVariantsFromPayload(
    variants: Omit<ProductVariantData, 'createdAt' | 'updatedAt'>[],
  ): void {
    this.variants = variants.map((variant) => ({
      ...variant,
      createdAt: new Date(),
      updatedAt: new Date(),
    }));
    this.updateAvailableColors();
  }

  // ✅ Helper to update available colors
  private updateAvailableColors(): void {
    this.availableColors = this.variants?.map((v) => v.color) || [];
  }

  // ✅ Check if product is in stock (sum of all variant stocks)
  isInStock(): boolean {
    if (!this.variants || this.variants.length === 0) return false;
    const totalStock = this.variants.reduce((sum, v) => sum + (v.stock || 0), 0);
    return totalStock > 0;
  }

  // ✅ Check if product is low stock
  isLowStock(): boolean {
    if (!this.variants || this.variants.length === 0) return false;
    const totalStock = this.variants.reduce((sum, v) => sum + (v.stock || 0), 0);
    return totalStock > 0 && totalStock <= this.lowStockThreshold;
  }

  // ✅ Calculate final price
  getFinalPrice(): number {
    return this.salePrice || this.price;
  }
}
