import { EventsService } from '../events.service';
import { Event } from '../../../models';
import { IPagedEntities } from '../../../core/pagedEntities';

export class EventsServiceMock implements Partial<EventsService> {
	public static saveOneOffTimeslot = jest.fn();
	public static saveEvent = jest.fn();
	public static updateOneOffTimeslot = jest.fn();
	public static updateEvent = jest.fn();
	public static delete = jest.fn();
	public static deleteById = jest.fn();
	public static getById = jest.fn();
	public static search = jest.fn();

	public async saveOneOffTimeslot(...params): Promise<Event> {
		return EventsServiceMock.saveOneOffTimeslot(...params);
	}

	public async saveEvent(...params): Promise<Event> {
		return EventsServiceMock.saveEvent(...params);
	}

	public async updateOneOffTimeslot(...params): Promise<Event> {
		return EventsServiceMock.updateOneOffTimeslot(...params);
	}

	public async updateEvent(...params): Promise<Event> {
		return EventsServiceMock.updateEvent(...params);
	}

	public async delete(...params) {
		return EventsServiceMock.delete(...params);
	}

	public async deleteById(...params) {
		return EventsServiceMock.deleteById(...params);
	}

	public async getById(...params): Promise<Event> {
		return EventsServiceMock.getById(...params);
	}

	public async search(...params): Promise<IPagedEntities<Event>> {
		return EventsServiceMock.search(...params);
	}
}
