import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { Brand } from '../brands/brand.entity';
import {
  ProductType,
  ProductVariantData,
  Season,
} from 'src/common/enums/product.enum';
import { Gender } from 'src/common/enums/user.enum';
import { Wishlist } from 'src/wishlist/wishlist.entity';
import { CartItem } from 'src/cart/cart-item.entity';
import { OrderItem } from 'src/orders/order-item.entity';

@Entity()
export class Product {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({ nullable: true })
  description: string;

  @Column('decimal', { precision: 10, scale: 2 })
  price: number;

  @Column('decimal', { precision: 10, scale: 2, nullable: true })
  salePrice: number;

  @Column({
    type: 'enum',
    enum: ProductType,
    nullable: true,
  })
  productType: ProductType;

  @Column({ nullable: true })
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

  @Column({ default: 0 })
  stock: number;

  @Column('simple-array', { nullable: true })
  images: string[];

  @Column('boolean', { default: true })
  isActive: boolean;

  @Column('boolean', { default: false })
  isFeatured: boolean;

  // Store brand ID as foreign key
  @Column({ name: 'brandId' })
  brandId: number;

  // Relation to Brand entity
  @ManyToOne(() => Brand, { eager: true })
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

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Helper methods for working with variants
  addVariant(color: string, variantImages: string[]): void {
    if (!this.variants) {
      this.variants = [];
    }

    const newVariant: ProductVariantData = {
      color,
      variantImages,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.variants.push(newVariant);
  }

  removeVariant(color: string): void {
    if (this.variants) {
      this.variants = this.variants.filter(
        (variant) => variant.color !== color,
      );
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

  // Method to process variants from payload (adds timestamps)
  setVariantsFromPayload(
    variants: Omit<ProductVariantData, 'createdAt' | 'updatedAt'>[],
  ): void {
    this.variants = variants.map((variant) => ({
      ...variant,
      createdAt: new Date(),
      updatedAt: new Date(),
    }));
  }
}
