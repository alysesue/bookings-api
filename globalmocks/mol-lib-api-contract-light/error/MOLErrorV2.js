"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MOLErrorV2 = void 0;
/**
 * Overrides how Error is to be serialized
 * Used by serializers (e.g. pino logging)
 */
Error.prototype.toJSON = function () {
    return {
        name: this.name,
        message: this.message,
        stack: this.stack,
    };
};
/**
 * Error object that will be caught and handled by the KoaErrorHandler in mol-lib-common
 */
class MOLErrorV2 extends Error {
    constructor(errorCode) {
        super();
        // =============================================================================
        // Helpers
        // =============================================================================
        /**
         * Updates the name and message fields of type Error
         * This is used when printing the stack
         */
        this.updateParentErrorFields = () => {
            var _a;
            this.name = `${this.errorCode.code} (${this.httpStatusCode})`;
            this.message = (_a = this._message) !== null && _a !== void 0 ? _a : this.errorCode.message;
            Object.setPrototypeOf(this, MOLErrorV2.prototype);
        };
        this.errorCode = errorCode;
        Error.captureStackTrace(this, MOLErrorV2);
        this.updateParentErrorFields();
    }
    // =============================================================================
    // Getters
    // =============================================================================
    // `name` and `message` are already exposed as public by the parent
    get code() {
        return this.errorCode.code;
    }
    get httpStatusCode() {
        var _a;
        return (_a = this._httpStatusCode) !== null && _a !== void 0 ? _a : this.errorCode.httpStatusCode;
    }
    get responseData() {
        return this._responseData;
    }
    get contextData() {
        return this._contextData;
    }
    /**
     * Used by serializers (e.g. pino logging)
     */
    toJSON() {
        return Object.assign(Object.assign(Object.assign({ code: this.errorCode.code, httpStatusCode: this.httpStatusCode, message: this.message }, (this._responseData != null ? { responseData: this._responseData } : null)), (this._contextData != null ? { contextData: this._contextData } : null)), { stack: this.stack });
    }
    // =============================================================================
    // Setters
    // =============================================================================
    /**
     * Overwrites the HTTP status code that will be sent to the client
     * 400 level code implies that the client is at fault
     * 500 level code implies that the server is at fault
     */
    setHttpStatusCode(code) {
        this._httpStatusCode = code;
        this.updateParentErrorFields();
        return this;
    }
    /**
     * Overwrites the message that will be sent to the client
     */
    setMessage(message) {
        this._message = message;
        this.updateParentErrorFields();
        return this;
    }
    /**
     * Sets the response data that will be sent from the server to the client
     */
    setResponseData(data) {
        this._responseData = data;
        return this;
    }
    /**
     * Sets the context data that will not be sent from the server to the client (for the catcher's use)
     */
    setContextData(data) {
        this._contextData = data;
        return this;
    }
}
exports.MOLErrorV2 = MOLErrorV2;
//# sourceMappingURL=MOLErrorV2.js.map