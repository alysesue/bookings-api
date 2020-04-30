import {
  Column,
  Entity,
  PrimaryGeneratedColumn,
  OneToOne,
  JoinColumn,
  BaseEntity,
} from "typeorm";
import { TimeSlot } from "./index";
enum BookingStatus {
  PendingApproval = 0,
}

@Entity()
export class Booking extends BaseEntity {
  @PrimaryGeneratedColumn()
  protected id: number;

  @Column()
  protected status: BookingStatus = BookingStatus.PendingApproval;

  @OneToOne((type) => TimeSlot, {
    cascade: true,
  })
  @JoinColumn()
  timeSlot: TimeSlot;
}
