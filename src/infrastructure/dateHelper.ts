export class DateHelper {
	private static MsPerSecond = 1000;
	private static MsPerMinute = 60000;
	private static MsPerHour = 3600000;
	private static MsPerDay = 86400000;
	private static tz = new Date(1970, 1, 1).getTime();

	private static monthNames = [
		'January',
		'February',
		'March',
		'April',
		'May',
		'June',
		'July',
		'August',
		'September',
		'October',
		'November',
		'December',
	];

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

	public static DiffInSeconds(dateA: Date, dateB: Date): number {
		return (dateA.getTime() - dateB.getTime()) / DateHelper.MsPerSecond;
	}

	public static DiffInMinutes(dateA: Date, dateB: Date): number {
		return (dateA.getTime() - dateB.getTime()) / DateHelper.MsPerMinute;
	}

	public static DiffInDays(dateA: Date, dateB: Date): number {
		return (dateA.getTime() - dateB.getTime()) / DateHelper.MsPerDay;
	}

	public static getWeekDaysInRange(start: Date, end: Date): number[] {
		const startDateOnly = DateHelper.getDateOnly(start);
		const endDateOnly = DateHelper.getDateOnly(end);
		const diffInDays = 1 + DateHelper.DiffInDays(endDateOnly, startDateOnly);

		const weekDays: number[] = [];
		let dayOfWeek = startDateOnly.getDay();
		for (let day = 0; day < diffInDays && day < 7; day++) {
			weekDays.push(dayOfWeek);
			dayOfWeek = (dayOfWeek + 1) % 7;
		}
		return weekDays;
	}

	public static equals(dateA: Date, dateB: Date): boolean {
		return dateA.getTime() === dateB.getTime();
	}

	public static equalsDateOnly(dateA: Date, dateB: Date): boolean {
		return (
			dateA.getFullYear() === dateB.getFullYear() &&
			dateA.getMonth() === dateB.getMonth() &&
			dateA.getDate() === dateB.getDate()
		);
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

	public static getTime12hFormatString(date: Date): string {
		const hours = parseInt(date.getHours().toString().padStart(2, '0'), 10);
		const minutes = date.getMinutes().toString().padStart(2, '0');
		const isAvro = hours < 12 || hours === 24 ? 'am' : 'pm';
		return `${hours % 12 || 12}:${minutes}${isAvro}`;
	}

	public static getDateFormat(date: Date): string {
		const month = this.monthNames[date.getMonth()];
		const day = String(date.getDate()).padStart(2, '0');
		const year = date.getFullYear();
		return day + ' ' + month + ' ' + year;
	}

	public static UTCAsLocal(date: Date): Date {
		return new Date(
			date.getUTCFullYear(),
			date.getUTCMonth(),
			date.getUTCDate(),
			date.getUTCHours(),
			date.getUTCMinutes(),
			date.getUTCSeconds(),
			date.getUTCMilliseconds(),
		);
	}

	// KIV
	public static getStartOfDayNative(dateNative: number): number {
		const startOfDayNative =
			DateHelper.tz + Math.floor((dateNative - DateHelper.tz) / DateHelper.MsPerDay) * DateHelper.MsPerDay;
		return startOfDayNative;
	}

	public static getEndOfDayNative(dateNative: number): number {
		const startOfDayNative =
			DateHelper.tz +
			(Math.floor((dateNative - DateHelper.tz) / DateHelper.MsPerDay) + 1) * DateHelper.MsPerDay -
			1;
		return startOfDayNative;
	}
}
