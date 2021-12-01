import { LifeSGMQSerivce } from '../lifesg.service';

export class LifeSGServiceMock extends LifeSGMQSerivce {
	public static sendToMQ = jest.fn();
	public async send(...params): Promise<void> {
		return LifeSGServiceMock.sendToMQ(...params);
	}
}
