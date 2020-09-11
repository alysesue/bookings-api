'use strict';
const CopyPlugin = require('copy-webpack-plugin');
const path = require('path');

exports.__esModule = true;
var service_node12_webpack_config_1 = require('mol-lib-config/shared-config/service.golden.node12.webpack.config');
var config = {
	name: 'bookingsg',
	dir: './',
};
var webPackConfig = service_node12_webpack_config_1.createBaseServiceConfig(config);
webPackConfig.plugins.push(
	new CopyPlugin({
		patterns: [{
			from: path.resolve(config.dir, 'swagger'),
			to: './swagger',
			toType: 'dir',
		}, ],
	}),
);
exports['default'] = webPackConfig;
