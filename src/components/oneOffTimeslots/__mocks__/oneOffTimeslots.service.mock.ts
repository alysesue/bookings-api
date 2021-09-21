import { OneOffTimeslotsService } from '../oneOffTimeslots.service';

export class OneOffTimeslotsServiceMock implements Partial<OneOffTimeslotsService> {
	public static save = jest.fn();
	public static update = jest.fn();
	public static delete = jest.fn();

	public async save(...params): Promise<any> {
		return OneOffTimeslotsServiceMock.save(...params);
	}

	public async update(...params): Promise<any> {
		return OneOffTimeslotsServiceMock.update(...params);
	}

	public async delete(...params): Promise<any> {
		return OneOffTimeslotsServiceMock.delete(...params);
	}
}
