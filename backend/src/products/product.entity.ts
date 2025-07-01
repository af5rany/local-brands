// import {
//   Entity,
//   PrimaryGeneratedColumn,
//   Column,
//   ManyToOne,
//   CreateDateColumn,
//   UpdateDateColumn,
// } from 'typeorm';
// import { Brand } from '../brands/brand.entity';

// export enum ProductType {
//   SHOES = 'Shoes',
//   HOODIES = 'Hoodies',
//   SHIRTS = 'Shirts',
//   ACCESSORIES = 'Accessories',
//   PANTS = 'Pants',
//   JACKETS = 'Jackets',
//   BAGS = 'Bags',
//   HATS = 'Hats',
// }

// export enum ProductStatus {
//   ACTIVE = 'Active',
//   INACTIVE = 'Inactive',
//   DISCONTINUED = 'Discontinued',
//   OUT_OF_STOCK = 'Out of Stock',
// }

// export enum Color {
//   BLACK = 'Black',
//   WHITE = 'White',
//   GRAY = 'Gray',
//   NAVY = 'Navy',
//   BLUE = 'Blue',
//   RED = 'Red',
//   GREEN = 'Green',
//   YELLOW = 'Yellow',
//   ORANGE = 'Orange',
//   PURPLE = 'Purple',
//   PINK = 'Pink',
//   BROWN = 'Brown',
//   BEIGE = 'Beige',
//   KHAKI = 'Khaki',
//   OLIVE = 'Olive',
//   MAROON = 'Maroon',
//   TEAL = 'Teal',
//   TURQUOISE = 'Turquoise',
//   GOLD = 'Gold',
//   SILVER = 'Silver',
//   MULTI_COLOR = 'Multi-Color',
// }

// export enum Size {
//   // Clothing sizes
//   XXS = 'XXS',
//   XS = 'XS',
//   S = 'S',
//   M = 'M',
//   L = 'L',
//   XL = 'XL',
//   XXL = 'XXL',
//   XXXL = 'XXXL',
//   // Shoe sizes (US)
//   SIZE_5 = '5',
//   SIZE_5_5 = '5.5',
//   SIZE_6 = '6',
//   SIZE_6_5 = '6.5',
//   SIZE_7 = '7',
//   SIZE_7_5 = '7.5',
//   SIZE_8 = '8',
//   SIZE_8_5 = '8.5',
//   SIZE_9 = '9',
//   SIZE_9_5 = '9.5',
//   SIZE_10 = '10',
//   SIZE_10_5 = '10.5',
//   SIZE_11 = '11',
//   SIZE_11_5 = '11.5',
//   SIZE_12 = '12',
//   SIZE_13 = '13',
//   SIZE_14 = '14',
//   // One size fits all
//   ONE_SIZE = 'One Size',
// }

// export enum Material {
//   COTTON = 'Cotton',
//   POLYESTER = 'Polyester',
//   WOOL = 'Wool',
//   LEATHER = 'Leather',
//   DENIM = 'Denim',
//   SILK = 'Silk',
//   LINEN = 'Linen',
//   CANVAS = 'Canvas',
//   NYLON = 'Nylon',
//   SPANDEX = 'Spandex',
//   ELASTANE = 'Elastane',
//   BAMBOO = 'Bamboo',
//   CASHMERE = 'Cashmere',
//   FLANNEL = 'Flannel',
//   FLEECE = 'Fleece',
//   MESH = 'Mesh',
//   SYNTHETIC = 'Synthetic',
//   MIXED = 'Mixed',
// }

// export enum Gender {
//   MEN = 'Men',
//   WOMEN = 'Women',
//   UNISEX = 'Unisex',
//   KIDS = 'Kids',
//   BOYS = 'Boys',
//   GIRLS = 'Girls',
// }

// export enum Season {
//   SPRING = 'Spring',
//   SUMMER = 'Summer',
//   FALL = 'Fall',
//   WINTER = 'Winter',
//   ALL_SEASON = 'All Season',
// }

// @Entity()
// export class Product {
//   @PrimaryGeneratedColumn()
//   id: number;

//   @Column()
//   name: string;

//   @Column({ nullable: true })
//   description: string;

//   @Column('decimal', { precision: 10, scale: 2 })
//   price: number;

//   @Column('decimal', { precision: 10, scale: 2, nullable: true })
//   originalPrice: number; // For displaying discounts

//   @Column({
//     type: 'enum',
//     enum: ProductType,
//     nullable: true,
//   })
//   productType: ProductType;

//   @Column({
//     type: 'enum',
//     enum: ProductStatus,
//     default: ProductStatus.ACTIVE,
//   })
//   status: ProductStatus;

//   @Column({ nullable: true })
//   subcategory: string;

//   @Column('simple-array', { nullable: true })
//   imageUrls: string[];

//   // @Column({
//   //   type: 'simple-array',
//   //   nullable: true,
//   //   transformer: {
//   //     to: (value: Size[]) => value,
//   //     from: (value: string) => (value ? (value.split(',') as Size[]) : []),
//   //   },
//   // })
//   // sizes: Size[];

//   // @Column({
//   //   type: 'simple-array',
//   //   nullable: true,
//   //   transformer: {
//   //     to: (value: Color[]) => value,
//   //     from: (value: string) => (value ? (value.split(',') as Color[]) : []),
//   //   },
//   // })
//   // colors: Color[];

//   // @Column('int', { nullable: true })
//   // stock: number;

//   // @Column({
//   //   type: 'enum',
//   //   enum: Material,
//   //   nullable: true,
//   // })
//   // material: Material;

//   // @Column({
//   //   type: 'enum',
//   //   enum: Gender,
//   //   nullable: true,
//   // })
//   // gender: Gender;

//   // @Column({
//   //   type: 'enum',
//   //   enum: Season,
//   //   nullable: true,
//   // })
//   // season: Season;

//   // @Column('varchar', { nullable: true, unique: true })
//   // sku: string;

//   // @Column('decimal', { precision: 3, scale: 2, nullable: true })
//   // rating: number;

//   // @Column('int', { default: 0 })
//   // reviewCount: number; // Number of reviews

//   // @Column('decimal', { precision: 5, scale: 2, nullable: true })
//   // weight: number; // Product weight in kg

//   // @Column('simple-array', { nullable: true })
//   // tags: string[]; // For search and categorization

//   // @Column({ nullable: true })
//   // care_instructions: string; // How to care for the product

//   // @Column('boolean', { default: false })
//   // isFeatured: boolean; // Featured products

//   // @Column('boolean', { default: false })
//   // isOnSale: boolean; // Sale items

//   // @Column({ nullable: true })
//   // saleEndDate: Date; // When sale ends

//   // @Column('int', { nullable: true })
//   // minimumOrderQuantity: number;

//   // @Column('int', { nullable: true })
//   // maximumOrderQuantity: number;

//   @ManyToOne(() => Brand, { eager: true })
//   brand: Brand;

//   @CreateDateColumn()
//   createdAt: Date;

//   @UpdateDateColumn()
//   updatedAt: Date;
// }

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Brand } from '../brands/brand.entity';

// ProductType Enum (Product Types)
export enum ProductType {
  SHOES = 'Shoes',
  HOODIES = 'Hoodies',
  SHIRTS = 'Shirts',
  ACCESSORIES = 'Accessories',
  PANTS = 'Pants',
  JACKETS = 'Jackets',
  BAGS = 'Bags',
  HATS = 'Hats',
}

// Gender Enum
export enum Gender {
  MEN = 'men',
  WOMEN = 'women',
  UNISEX = 'unisex',
  KIDS = 'kids',
  BOYS = 'boys',
  GIRLS = 'girls',
}

// Season Enum
export enum Season {
  SPRING = 'Spring',
  SUMMER = 'Summer',
  FALL = 'Fall',
  WINTER = 'Winter',
  ALL_SEASON = 'All Season',
}

// Interface for variant data (timestamps optional for input)
export interface ProductVariantData {
  color: string;
  variantImages: string[];
  createdAt?: Date;
  updatedAt?: Date;
}

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

  @Column('int', { default: 0 })
  totalStock: number;

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
