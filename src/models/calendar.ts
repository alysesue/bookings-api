import { Column, Entity, Generated, Index, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class Calendar {

	@PrimaryGeneratedColumn()
	public id: number;

	@Column({ type: "uuid" })
	@Index({ unique: true })
	@Generated("uuid")
	public uuid: string;


	@Column({ type: "varchar", length: 300 })
	public googleCalendarId: string;

	constructor() {
	}
}
