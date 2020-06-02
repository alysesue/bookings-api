import { Container } from "typescript-ioc";
import { ServicesValidation } from "../../services/services.validation";
import { ErrorResponse } from "../../apicontract";

const whiteLabelledRoutes = [
	"\/v1\/services",
	"\/swagger"
];

const isWhiteLabelledPath = (path) => {
	return whiteLabelledRoutes.some(route => {
		// tslint:disable-next-line: tsr-detect-non-literal-regexp
		const regex = new RegExp(`^.*${route.toString()}$`);
		return regex.test(path);
	});
};

export const useServiceValidation = async (ctx, next) => {
	try {
		if (!isWhiteLabelledPath(ctx.path)) {
			await Container.get(ServicesValidation).validate();
		}

		await next();
	} catch (e) {
		ctx.status = 400;
		ctx.body = new ErrorResponse(e.message);
	}
};
