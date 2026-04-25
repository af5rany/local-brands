import {
  IsNumber,
  IsOptional,
  IsString,
  IsEnum,
  IsPositive,
} from 'class-validator';
import { PaymentMethod } from 'src/common/enums/order.enum';

export class CheckoutDto {
  @IsNumber()
  @IsPositive()
  shippingAddressId: number;

  @IsOptional()
  @IsNumber()
  @IsPositive()
  billingAddressId?: number;

  @IsOptional()
  @IsEnum(PaymentMethod)
  paymentMethod?: PaymentMethod;

  @IsOptional()
  @IsString()
  idempotencyKey?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsString()
  promoCode?: string;
}
