import { EventsRepository } from '../events.repository';
import { Event } from '../../../models';

export class EventsRepositoryMock implements Partial<EventsRepository> {
	public static saveMock = jest.fn();
	public static getByIdMock = jest.fn();
	public static searchMock = jest.fn();
	public static searchReturnAllMock = jest.fn();
	public static deleteMock = jest.fn();

	public async save(...param): Promise<Event> {
		return EventsRepositoryMock.saveMock(...param);
	}

	public async getById(...params): Promise<Event> {
		return EventsRepositoryMock.getByIdMock(...params);
	}

	public async searchReturnAll(...params): Promise<Event[]> {
		return EventsRepositoryMock.searchReturnAllMock(...params);
	}

	public async search(...params): Promise<any> {
		return EventsRepositoryMock.searchMock(...params);
	}

	public async delete(...params): Promise<void> {
		return EventsRepositoryMock.deleteMock(...params);
	}
}
