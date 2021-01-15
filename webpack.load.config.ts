import { Config, createBaseK6Config } from 'mol-lib-config/shared-config/k6.webpack.config';

const config: Config = {
	name: 'mol-web-lifesg-load',
	dir: './__tests__/load',
};
const webPackConfig = createBaseK6Config(config);

export default webPackConfig;
