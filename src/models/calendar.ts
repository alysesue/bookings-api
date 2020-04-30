import { Column, Entity, Generated, PrimaryGeneratedColumn, Index } from 'typeorm';

@Entity()
export class Calendar {

	@PrimaryGeneratedColumn()
	public id: number;

	@Column({ type: "uuid" })
	@Index({ unique: true })
	@Generated("uuid")
	public uuid: string;

	constructor() {
	}
}
