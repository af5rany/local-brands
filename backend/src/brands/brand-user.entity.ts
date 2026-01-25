import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    JoinColumn,
    CreateDateColumn,
    UpdateDateColumn,
    Unique,
} from 'typeorm';
import { User } from '../users/user.entity';
import { Brand } from './brand.entity';
import { BrandUserRole } from 'src/common/enums/brand-user-role.enum';

@Entity('brand_users')
@Unique(['user', 'brand'])
export class BrandUser {
    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne(() => User, (user) => user.brandUsers, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'userId' })
    user: User;

    @Column()
    userId: number;

    @ManyToOne(() => Brand, (brand) => brand.brandUsers, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'brandId' })
    brand: Brand;

    @Column()
    brandId: number;

    @Column({
        type: 'enum',
        enum: BrandUserRole,
        default: BrandUserRole.STAFF,
    })
    role: BrandUserRole;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
