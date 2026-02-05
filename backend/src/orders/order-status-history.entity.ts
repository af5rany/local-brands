import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    CreateDateColumn,
    Index,
} from 'typeorm';
import { Order } from './order.entity';
import { OrderStatus } from 'src/common/enums/order.enum';

@Entity()
export class OrderStatusHistory {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({
        type: 'enum',
        enum: OrderStatus,
    })
    status: OrderStatus;

    @Column({ nullable: true })
    notes: string;

    @ManyToOne(() => Order, (order) => order.statusHistory, { onDelete: 'CASCADE' })
    @Index()
    order: Order;

    @Column()
    orderId: number;

    @CreateDateColumn()
    createdAt: Date;
}
