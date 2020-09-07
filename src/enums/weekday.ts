export enum Weekday {
	Sunday = 0,
	Monday = 1,
	Tuesday = 2,
	Wednesday = 3,
	Thursday = 4,
	Friday = 5,
	Saturday = 6,
}

export const WeekdayList: Weekday[] = [
	Weekday.Sunday,
	Weekday.Monday,
	Weekday.Tuesday,
	Weekday.Wednesday,
	Weekday.Thursday,
	Weekday.Friday,
	Weekday.Saturday,
];
export const WeekdayNameList: string[] = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export function getWeekdayName(weekday: Weekday): string {
	return WeekdayNameList[weekday];
}
