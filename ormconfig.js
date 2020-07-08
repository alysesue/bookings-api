const {
	Schedule,
	Service,
	WeekDaySchedule,
	WeekDayBreak,
	ServiceProvider,
	Calendar,
	Booking,
	TimeslotsSchedule,
	TimeslotItem
} = require('./src/models/entities')

module.exports = {
	'database': process.env.BOOKINGSG_DB_INSTANCE,
	entities: [
		Schedule, Service, ServiceProvider, Calendar, Booking, WeekDayBreak, WeekDaySchedule, TimeslotsSchedule, TimeslotItem
	],
	'migrations': [
		'migrations/**/*{.js,.ts}'
	],
	'cli': {
		'migrationsDir': 'migrations'
	},
	'host': process.env.BOOKINGSG_DB_HOST,
	'logging': [
		'schema',
		'migration'
	],
	'port': 5432,
	'synchronize': false,
	'migrationsRun': true,
	'type': 'postgres',
	'username': process.env.BOOKINGSG_DB_USERNAME,
	'password': process.env.DB_PASSWORD_BOOKINGSG_APP
}
