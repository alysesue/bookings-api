import { BaseEntity, Column, Entity, Index, PrimaryGeneratedColumn } from "typeorm";

@Entity()
export class Agency extends BaseEntity {

	@PrimaryGeneratedColumn()
	private _id: number;

	@Column()
	@Index({unique: true})
	private _name: string;

	public set name(name: string) {
		this._name = name;
	}
}
