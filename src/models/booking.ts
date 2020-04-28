import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class Booking {

	@PrimaryGeneratedColumn()
	protected id: number;

	@Column()
	protected name: string;

	constructor(name: string) {
		this.name = name;
	}
}
