import { Column, Entity, PrimaryGeneratedColumn, BaseEntity } from "typeorm";

@Entity()
export class TimeSlot extends BaseEntity {
  @PrimaryGeneratedColumn()
  protected id: number;
  @Column()
  protected startDateTime: Date;
  @Column()
  protected sessionDuration: number;

  constructor(startDateTime: Date, sessionDuration: number) {
    super();
    this.startDateTime = startDateTime;
    this.sessionDuration = sessionDuration;
  }
}
