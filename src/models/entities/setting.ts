import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class Setting {
	public constructor() {}

	@PrimaryGeneratedColumn()
	private _id: number;

	public set id(id: number) {
		this._id = id;
	}

	public get id(): number {
		return this._id;
	}

	@Column({ type: 'jsonb', nullable: false, default: '{"redirectionWhitelistedUrl": []}', comment: 'Setting data' })
	private _data: SettingData;

	public set data(value: SettingData) {
		this._data = value;
	}
	public get data(): SettingData {
		return this._data;
	}

	public static create(data: SettingData) {
		const setting1 = new Setting();
		setting1._data = data;
		return setting1;
	}
}

export type SettingData = {
	redirectionWhitelistedUrl: string[];
};
