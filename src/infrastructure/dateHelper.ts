export class DateHelper {
	private static MsPerMinute = 60000;
	private static MsPerHour = 3600000;
	private static MsPerDay = 86400000;

	public static keepHoursAndMinutes(date: Date): Date {
		return new Date(2020, 1, 1, date.getHours(), date.getMinutes());
	}

	public static addMinutes(date: Date, minutes: number) {
		return new Date(date.getTime() + minutes * DateHelper.MsPerMinute);
	}

	public static addHours(date: Date, hours: number): Date {
		const newDate = new Date(date.getTime() + hours * DateHelper.MsPerHour);
		return newDate;
	}

	public static addDays(date: Date, days: number) {
		return new Date(date.getTime() + days * DateHelper.MsPerDay);
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

	public static DiffInDays(dateA: Date, dateB: Date): number {
		return (dateA.getTime() - dateB.getTime()) / DateHelper.MsPerDay;
	}

	public static setHours(date: Date, hours: number, min: number): Date {
		const newDate = DateHelper.getDateOnly(date);
		newDate.setHours(hours, min);

		return newDate;
	}

	public static getTimeString(date: Date): string {
		const hours = date.getHours().toString().padStart(2, '0');
		const minutes = date.getMinutes().toString().padStart(2, '0');
		return `${hours}:${minutes}`;
	}
}
