"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ErrorCodeV2Name = exports.ErrorCodeV2 = void 0;
class ErrorCodeV2 {
    constructor(params) {
        this.code = params.code;
        this.httpStatusCode = params.httpStatusCode;
        this.message = params.message;
        ErrorCodeV2.registerErrorCode(this);
    }
    static registerErrorCode(errorCode) {
        ErrorCodeV2.errorCodeMap.set(errorCode.code, errorCode);
    }
    static fromCode(code) {
        return ErrorCodeV2.errorCodeMap.get(code);
    }
}
exports.ErrorCodeV2 = ErrorCodeV2;
// =============================================================================
// Error Code mapper
// =============================================================================
ErrorCodeV2.errorCodeMap = new Map();
// =============================================================================
// List of generic error codes
// NOTE: Domain specific error codes should be defined in the domain directories under a different namespace (e.g. ContentBookingErrorCodes)
// =============================================================================
// NOTE: This enum list is useful for typing TSOA error code responses
var ErrorCodeV2Name;
(function (ErrorCodeV2Name) {
    ErrorCodeV2Name["SYS_GENERIC"] = "SYS_GENERIC";
    ErrorCodeV2Name["SYS_INVALID_PARAM"] = "SYS_INVALID_PARAM";
    ErrorCodeV2Name["SYS_INVALID_AUTHENTICATION"] = "SYS_INVALID_AUTHENTICATION";
    ErrorCodeV2Name["SYS_INVALID_AUTHORIZATION"] = "SYS_INVALID_AUTHORIZATION";
    ErrorCodeV2Name["SYS_NOT_FOUND"] = "SYS_NOT_FOUND";
    ErrorCodeV2Name["SYS_NETWORK_ERROR"] = "SYS_NETWORK_ERROR";
})(ErrorCodeV2Name = exports.ErrorCodeV2Name || (exports.ErrorCodeV2Name = {}));
(function (ErrorCodeV2) {
    const genericErrorMessage = "An unexpected error has occurred.";
    ErrorCodeV2.SYS_GENERIC = Object.freeze(new ErrorCodeV2({ code: ErrorCodeV2Name.SYS_GENERIC, httpStatusCode: 500, message: genericErrorMessage }));
    ErrorCodeV2.SYS_INVALID_PARAM = Object.freeze(new ErrorCodeV2({ code: ErrorCodeV2Name.SYS_INVALID_PARAM, httpStatusCode: 400, message: "Invalid request parameters." }));
    ErrorCodeV2.SYS_INVALID_AUTHENTICATION = Object.freeze(new ErrorCodeV2({ code: ErrorCodeV2Name.SYS_INVALID_AUTHENTICATION, httpStatusCode: 401, message: "Invalid authentication." }));
    ErrorCodeV2.SYS_INVALID_AUTHORIZATION = Object.freeze(new ErrorCodeV2({ code: ErrorCodeV2Name.SYS_INVALID_AUTHORIZATION, httpStatusCode: 403, message: "Invalid authorization." }));
    ErrorCodeV2.SYS_NOT_FOUND = Object.freeze(new ErrorCodeV2({ code: ErrorCodeV2Name.SYS_NOT_FOUND, httpStatusCode: 404, message: "Failed to find resource." }));
    ErrorCodeV2.SYS_NETWORK_ERROR = Object.freeze(new ErrorCodeV2({ code: ErrorCodeV2Name.SYS_NETWORK_ERROR, httpStatusCode: 500, message: genericErrorMessage }));
})(ErrorCodeV2 = exports.ErrorCodeV2 || (exports.ErrorCodeV2 = {}));
//# sourceMappingURL=ErrorCodeV2.js.map