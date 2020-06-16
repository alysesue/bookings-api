const { Schedule, Service, WeekDaySchedule, WeekDayBreak, ServiceProvider, Calendar, Booking } = require('./src/models/entities')

module.exports = {
  'database': process.env.BOOKINGSG_DB_INSTANCE,
  entities: [
    Schedule, Service, ServiceProvider, Calendar, Booking, WeekDayBreak, WeekDaySchedule
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
  'password': process.env.DB_PASSWORD_BOOKINGSG_API_APP
}
