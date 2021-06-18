jest.mock('../src/config/app-config', () => {
	return {
		basePath: '/bookingsg',
		getConfig: jest.fn(),
	};
});

jest.mock('../src/infrastructure/idHasher', () => {
	class IdHasher {}
	return { IdHasher };
});

jest.mock('../src/infrastructure/auth/userContext', () => {
	class UserContext {}
	return { UserContext };
});

jest.mock('../src/core/transactionManager', () => {
	class TransactionManager {}
	return { TransactionManager };
});

jest.mock('mol-lib-api-contract', () => {
	return jest.requireActual('./mol-lib-api-contract-light/error');
});

jest.mock('typeorm', () => {
	const decoratorMock = () => {
		return (target: any, key: string | symbol, descriptor: any) => descriptor;
	};
	return {
		PrimaryGeneratedColumn: decoratorMock,
		PrimaryColumn: decoratorMock,
		Column: decoratorMock,
		Entity: decoratorMock,
		Index: decoratorMock,
		JoinColumn: decoratorMock,
		OneToOne: decoratorMock,
		OneToMany: decoratorMock,
		ManyToOne: decoratorMock,
		ManyToMany: decoratorMock,
		JoinTable: decoratorMock,
		TableInheritance: decoratorMock,
		ChildEntity: decoratorMock,
		Generated: decoratorMock,
		DeleteDateColumn: decoratorMock,
		SelectQueryBuilder: jest.fn(),
		In: jest.fn(),
	};
});

jest.mock('mol-lib-common', () => {
	const decoratorMock = () => {
		return (target: any, key: string | symbol, descriptor: any) => descriptor;
	};

	const logger = {
		create: () => logger,
		setLoggerParams: jest.fn(),
		warn: jest.fn(),
		info: jest.fn(),
		debug: jest.fn(),
		error: jest.fn(),
		log: jest.fn(),
		fatal: jest.fn(),
	};
	return {
		MOLAuth: decoratorMock,
		logger,
		LoggerV2: logger,
	};
});

jest.mock('pg', () => {
	return {};
});

jest.mock('tsoa', () => {
	const decoratorMock = () => {
		return (target: any, key: string | symbol, descriptor: any) => descriptor;
	};

	class Controller {
		setStatus(): void {}
	}

	return {
		Controller,
		Body: decoratorMock,
		Header: decoratorMock,
		Delete: decoratorMock,
		Get: decoratorMock,
		Path: decoratorMock,
		Post: decoratorMock,
		Put: decoratorMock,
		Query: decoratorMock,
		Response: decoratorMock,
		Route: decoratorMock,
		SuccessResponse: decoratorMock,
		Tags: decoratorMock,
		Security: decoratorMock,
		Deprecated: decoratorMock,
	};
});

jest.mock('../src/config/app-config', () => {
	return {
		getConfig: () => ({
			name: 'test',
			version: '0.1',
			port: 3000,
			env: 'production',
			database: {
				host: 'host',
				port: '1111',
				instance: 'database',
				username: 'user',
			},
			molNotification: {
				url: '',
			},
		}),
	};
});
