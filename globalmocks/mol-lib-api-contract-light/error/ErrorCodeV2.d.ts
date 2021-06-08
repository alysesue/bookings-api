export declare class ErrorCodeV2 {
    private static errorCodeMap;
    private static registerErrorCode;
    static fromCode(code: string): ErrorCodeV2;
    readonly code: string;
    readonly httpStatusCode: number;
    readonly message: string;
    constructor(params: ErrorCodeV2);
}
export declare enum ErrorCodeV2Name {
    SYS_GENERIC = "SYS_GENERIC",
    SYS_INVALID_PARAM = "SYS_INVALID_PARAM",
    SYS_INVALID_AUTHENTICATION = "SYS_INVALID_AUTHENTICATION",
    SYS_INVALID_AUTHORIZATION = "SYS_INVALID_AUTHORIZATION",
    SYS_NOT_FOUND = "SYS_NOT_FOUND",
    SYS_NETWORK_ERROR = "SYS_NETWORK_ERROR"
}
export declare namespace ErrorCodeV2 {
    const SYS_GENERIC: Readonly<ErrorCodeV2>;
    const SYS_INVALID_PARAM: Readonly<ErrorCodeV2>;
    const SYS_INVALID_AUTHENTICATION: Readonly<ErrorCodeV2>;
    const SYS_INVALID_AUTHORIZATION: Readonly<ErrorCodeV2>;
    const SYS_NOT_FOUND: Readonly<ErrorCodeV2>;
    const SYS_NETWORK_ERROR: Readonly<ErrorCodeV2>;
}
//# sourceMappingURL=ErrorCodeV2.d.ts.map