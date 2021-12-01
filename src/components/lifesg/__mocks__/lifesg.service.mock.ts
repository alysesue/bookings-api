import { LifeSGMQService } from '../lifesg.service';

export class LifeSGServiceMock extends LifeSGMQService {
	public static sendToMQ = jest.fn();
	public async send(...params): Promise<void> {
		return LifeSGServiceMock.sendToMQ(...params);
	}
}
