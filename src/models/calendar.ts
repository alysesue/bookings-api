import { Column, Entity, Generated, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class Calendar {

	@PrimaryGeneratedColumn()
	protected id: number;

	@Column({ type: "uuid" })
	@Generated("uuid")
	protected uuid: string;

	constructor(uuid: string) {
		this.uuid = uuid;
	}
}
