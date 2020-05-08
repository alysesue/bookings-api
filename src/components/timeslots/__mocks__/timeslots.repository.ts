export const mockAddTemplateTimeslots= jest.fn();
const mock = jest.fn().mockImplementation(() => {
	return {
		TimeslotsRepository: jest.fn().mockImplementation(() => {
			return {
				addTemplateTimeslots: mockAddTemplateTimeslots,
				getAllAvailableTimeslots: jest.fn()
			};
		})
	};
});

export default mock;