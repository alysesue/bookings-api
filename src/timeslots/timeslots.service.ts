import { Inject, Singleton } from "typescript-ioc";
import { AggregatedEntry, TimeslotAggregator } from "./timeslotAggregator";
import { Calendar } from '../models/calendar';
import { CalendarsRepository } from "../calendars/calendars.repository";
import { DateHelper } from "../infrastructure/dateHelper";

@Singleton
export class TimeslotsService {
	@Inject
	private calendarRepository: CalendarsRepository;

	public async getAggregatedTimeslots(startDate: Date, endDate: Date): Promise<AggregatedEntry<Calendar>[]> {
		const aggregator = new TimeslotAggregator<Calendar>();
		const startOfDay = DateHelper.getDateOnly(startDate);
		const endOfLastDay = DateHelper.getEndOfDay(endDate);

		const calendars = await this.calendarRepository.getCalendarsWithTemplates();

		for (const calendar of calendars.filter(c => c.templatesTimeslots !== null)) {
			const generator = calendar.templatesTimeslots.generateValidTimeslots({
				startDatetime: startOfDay,
				endDatetime: endOfLastDay
			});

			aggregator.aggregate(calendar, generator);
		}

		const entries = aggregator.getEntries();
		aggregator.clear();

		return entries;
	}
}
