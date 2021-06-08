import { ErrorCodeV2 } from "./ErrorCodeV2";
/**
 * Error object that will be caught and handled by the KoaErrorHandler in mol-lib-common
 */
export declare class MOLErrorV2 extends Error {
    private readonly errorCode;
    private _httpStatusCode;
    private _message;
    private _responseData?;
    private _contextData?;
    constructor(errorCode: ErrorCodeV2);
    get code(): string;
    get httpStatusCode(): number;
    get responseData(): any;
    get contextData(): any;
    /**
     * Used by serializers (e.g. pino logging)
     */
    toJSON(): {
        stack: string;
        contextData: any;
        responseData: any;
        code: string;
        httpStatusCode: number;
        message: string;
    };
    /**
     * Overwrites the HTTP status code that will be sent to the client
     * 400 level code implies that the client is at fault
     * 500 level code implies that the server is at fault
     */
    setHttpStatusCode(code: number): this;
    /**
     * Overwrites the message that will be sent to the client
     */
    setMessage(message: string): this;
    /**
     * Sets the response data that will be sent from the server to the client
     */
    setResponseData(data: any): this;
    /**
     * Sets the context data that will not be sent from the server to the client (for the catcher's use)
     */
    setContextData(data: any): this;
    /**
     * Updates the name and message fields of type Error
     * This is used when printing the stack
     */
    private updateParentErrorFields;
}
//# sourceMappingURL=MOLErrorV2.d.ts.map