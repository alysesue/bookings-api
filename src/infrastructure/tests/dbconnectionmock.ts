export const InnerRepositoryMock = {
	findOne: jest.fn().mockImplementation(() => Promise.resolve({})),
	find: jest.fn().mockImplementation(() => Promise.resolve([])),
	save: jest.fn().mockImplementation(() => Promise.resolve({})),
	delete: jest.fn().mockImplementation(() => Promise.resolve({})),
};

export const GetRepositoryMock = jest.fn().mockImplementation(() => InnerRepositoryMock);
export const CreateQueryBuilder = jest.fn();

export const DbConnectionMock = jest.fn().mockImplementation(() => {
	const getConnection = () => {
		const connection = {
			getRepository: GetRepositoryMock,
			createQueryBuilder: CreateQueryBuilder,
		};

		return Promise.resolve(connection);
	};

	return { getConnection };
});
