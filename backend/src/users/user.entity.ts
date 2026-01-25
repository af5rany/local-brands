// src/users/user.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  OneToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Brand } from '../brands/brand.entity';
import { BrandUser } from '../brands/brand-user.entity';
import { Cart } from '../cart/cart.entity';
import { Order } from '../orders/order.entity';

import { Wishlist } from 'src/wishlist/wishlist.entity';
import { UserRole, UserStatus } from 'src/common/enums/user.enum';

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({ unique: true })
  @Index()
  email: string;

  // ✅ Add username field
  @Column({ unique: true, nullable: true })
  @Index()
  username: string;

  // ✅ Add phone number with unique constraint
  @Column({ unique: true, nullable: true })
  @Index()
  phoneNumber: string;

  @Column({ nullable: true })
  password: string;

  @Column({ type: 'enum', enum: UserRole, default: UserRole.CUSTOMER })
  role: UserRole;

  @Column({ type: 'enum', enum: UserStatus, default: UserStatus.PENDING })
  status: UserStatus;

  @Column({ default: false })
  isGuest: boolean;

  // ✅ Email/Phone verification
  @Column({ default: false })
  isEmailVerified: boolean;

  @Column({ default: false })
  isPhoneVerified: boolean;

  @Column({ nullable: true })
  emailVerificationToken: string;

  @Column({ nullable: true })
  phoneVerificationToken: string;

  // ✅ Password reset
  @Column({ nullable: true })
  resetPasswordToken: string;

  @Column({ nullable: true })
  resetPasswordExpires: Date;

  // ✅ Profile fields
  @Column({ nullable: true })
  avatar: string;

  @Column({ type: 'date', nullable: true })
  dateOfBirth: Date;

  // ✅ Preferences
  @Column({ default: 'en' })
  preferredLanguage: string;

  @Column({ type: 'json', nullable: true })
  notificationPreferences: {
    email: boolean;
    push: boolean;
    sms: boolean;
    orderUpdates: boolean;
    promotions: boolean;
  };

  // ✅ Security
  @Column({ nullable: true })
  lastLoginAt: Date;

  @Column({ nullable: true })
  lastLoginIp: string;

  @Column({ default: 0 })
  failedLoginAttempts: number;

  @Column({ nullable: true })
  lockedUntil: Date;

  // ✅ Soft delete
  @Column({ nullable: true })
  deletedAt: Date;

  // Relationships
  @OneToMany(() => Order, (order) => order.user)
  orders: Order[];

  @OneToOne(() => Cart, (cart) => cart.user)
  @JoinColumn()
  cart: Cart;

  @OneToMany(() => Wishlist, (wishlist) => wishlist.user, {
    cascade: true,
  })
  wishlist: Wishlist[];

  @OneToMany(() => BrandUser, (brandUser) => brandUser.user)
  brandUsers: BrandUser[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
