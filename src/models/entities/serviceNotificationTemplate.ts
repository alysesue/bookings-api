import { Column, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { EmailNotificationTemplateType } from '../notifications';
import { Service } from './service';

@Entity()
export class ServiceNotificationTemplate {
	constructor() {}

	@PrimaryGeneratedColumn()
	public _id: number;

	public get id(): number {
		return this._id;
	}

	public set id(id: number) {
		this._id = id;
	}

	@Column()
	private _emailTemplateType: EmailNotificationTemplateType;

	public get emailTemplateType(): EmailNotificationTemplateType {
		return this._emailTemplateType;
	}

	public set emailTemplateType(newTemplate: EmailNotificationTemplateType) {
		this._emailTemplateType = newTemplate;
	}

	@Column({ type: 'varchar' })
	private _htmlTemplate: string;

	public get htmlTemplate(): string {
		return this._htmlTemplate;
	}

	public set htmlTemplate(value: string) {
		this._htmlTemplate = value;
	}

	@Column({ nullable: false })
	@Index()
	private _serviceId: number;

	public get serviceId(): number {
		return this._serviceId;
	}

	@ManyToOne(() => Service)
	@JoinColumn({ name: '_serviceId' })
	private _service: Service;

	public set service(service: Service) {
		this._service = service;
	}

	public get service(): Service {
		return this._service;
	}

	public static create(
		htmlTemplate: string,
		serviceId: number,
		emailTemplateType: EmailNotificationTemplateType,
	): ServiceNotificationTemplate {
		const template = new ServiceNotificationTemplate();
		template._htmlTemplate = htmlTemplate;
		template._serviceId = serviceId;
		template._emailTemplateType = emailTemplateType;
		return template;
	}
}
