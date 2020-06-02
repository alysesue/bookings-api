import { Container } from "typescript-ioc";

export const useService = async (ctx, next) => {
	Container.bindName('config').to({
		serviceName: ctx.params.service || 'default'
	});
	await next();
};
