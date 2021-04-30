import { LifeSGMQSerice } from '../lifesg.service';

export class LifeSGServiceMock extends LifeSGMQSerice {
	public static sendToMQ = jest.fn();
	public async send(...params): Promise<void> {
		return LifeSGServiceMock.sendToMQ(...params);
	}
}
