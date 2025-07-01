import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from './product.entity';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private productsRepository: Repository<Product>,
  ) {}

  findAll(): Promise<Product[]> {
    return this.productsRepository.find();
  }

  async findOne(id: number): Promise<Product> {
    const product = await this.productsRepository.findOneBy({ id });
    if (!product) {
      throw new Error(`Product with id ${id} not found`);
    }
    return product;
  }
  async create(productData: Partial<Product>): Promise<Product> {
    // if (!this.productsRepository.manager.connection.isInitialized) {
    //   await this.productsRepository.manager.connection.initialize();
    // }
    const startTime = Date.now();

    const product = this.productsRepository.create(productData);

    const savedProduct = await this.productsRepository.save(product);
    const endTime = Date.now();

    console.log('Saving product took:', endTime - startTime, 'ms');
    return savedProduct;
  }

  async update(id: number, updateData: Partial<Product>): Promise<Product> {
    await this.productsRepository.update(id, updateData);
    return this.findOne(id);
  }

  async remove(id: number): Promise<void> {
    await this.productsRepository.delete(id);
  }
}

// import { Injectable, NotFoundException } from '@nestjs/common';
// import { InjectRepository } from '@nestjs/typeorm';
// import { Repository } from 'typeorm';
// import { Product } from './product.entity';
// import { Brand } from '../brands/brand.entity';
// import { CreateProductDto } from './dto/create-product.dto';

// @Injectable()
// export class ProductService {
//   constructor(
//     @InjectRepository(Product)
//     private productRepository: Repository<Product>,
//     @InjectRepository(Brand)
//     private brandRepository: Repository<Brand>,
//   ) {}

//   async create(createProductDto: CreateProductDto): Promise<Product> {
//     // Verify brand exists
//     const brand = await this.brandRepository.findOne({
//       where: { id: createProductDto.brand },
//     });

//     if (!brand) {
//       throw new NotFoundException(
//         `Brand with ID ${createProductDto.brand} not found`,
//       );
//     }

//     // Create product instance
//     const product = new Product();

//     // Map all fields
//     Object.assign(product, {
//       ...createProductDto,
//       brandId: createProductDto.brand, // Map brand ID
//       tags: createProductDto.tags || [], // Handle null tags
//     });

//     // Process variants with timestamps
//     if (createProductDto.variants && createProductDto.variants.length > 0) {
//       product.setVariantsFromPayload(createProductDto.variants);
//     }

//     // Save and return
//     return await this.productRepository.save(product);
//   }

//   async findAll(): Promise<Product[]> {
//     return await this.productRepository.find({
//       relations: ['brand'], // This will load the brand object
//     });
//   }

//   async findOne(id: number): Promise<Product> {
//     const product = await this.productRepository.findOne({
//       where: { id },
//       relations: ['brand'],
//     });

//     if (!product) {
//       throw new NotFoundException(`Product with ID ${id} not found`);
//     }

//     return product;
//   }
// }
