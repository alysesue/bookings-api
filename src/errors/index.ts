export type OkResult<T> = {
	result: T
};

export type ErrorResult<T> = {
	errorResult: T
};

export type OptionalResult<TOk, TError> = OkResult<TOk> | ErrorResult<TError>;

export function isErrorResult<TOk, TError>(optionalResult: OptionalResult<TOk, TError>): optionalResult is ErrorResult<TError> {
	return !!(optionalResult as ErrorResult<TError>).errorResult;
}

export function getErrorResult<TOk, TError>(optionalResult: OptionalResult<TOk, TError>): TError {
	return (optionalResult as ErrorResult<TError>).errorResult;
}

export function getOkResult<TOk, TError>(optionalResult: OptionalResult<TOk, TError>): TOk {
	return (optionalResult as OkResult<TOk>).result;
}
