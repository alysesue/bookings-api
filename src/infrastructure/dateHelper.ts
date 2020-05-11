export class DateHelper {
	private static MsPerMinute = 60000;
	private static MsPerHour = 1440000;

	public static keepHoursAndMinutes(date: Date): Date {
		return new Date(2020, 1, 1, date.getHours(), date.getMinutes());
	}

	public static addMinutes(date, minutes) {
		return new Date(date.getTime() + minutes * DateHelper.MsPerMinute);
	}

	public static addDays(date, days) {
		return new Date(date.getTime() + days * DateHelper.MsPerHour);
	}

	public static getDateOnly(date: Date): Date {
		return new Date(date.getFullYear(), date.getMonth(), date.getDate());
	}

	public static getStartOfDay(date: Date): Date {
		return DateHelper.getDateOnly(date);
	}

	public static getEndOfDay(date: Date): Date {
		const newDate = DateHelper.getDateOnly(date);
		newDate.setHours(23, 59, 59, 999);

		return newDate;
	}

	public static DiffInMinutes(dateA: Date, dateB: Date): number {
		return (dateA.getTime() - dateB.getTime()) / DateHelper.MsPerMinute;
	}

	public static setHours(date: Date, hours: number, min: number): Date {
		const newDate = DateHelper.getDateOnly(date);
		newDate.setHours(hours, min);

		return newDate;
	}
}
