import axios from 'axios';
import { get, post } from '../fetch';

jest.mock('axios');

describe('Test fetch tools', () => {
	afterEach(() => {
		jest.clearAllMocks();
	});

	it('Should call axios post when use post', async () => {
		(axios.request as jest.Mock).mockReturnValue(Promise.resolve({}));

		await post('path');
		expect(axios.request as jest.Mock).toHaveBeenCalled();
	});

	it('Should call axios get when use post', async () => {
		(axios.request as jest.Mock).mockReturnValue(Promise.resolve({}));

		await get('path');
		expect(axios.request as jest.Mock).toHaveBeenCalled();
	});
});
