"use strict";
exports.__esModule = true;
var service_node12_webpack_config_1 = require("./configs/shared-config/service.node12.webpack.config");
var config = {
    name: "bookingsg-api",
    dir: "./"
};
var webPackConfig = service_node12_webpack_config_1.createBaseServiceConfig(config);
exports["default"] = webPackConfig;
