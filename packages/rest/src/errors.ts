import { ResultError } from '@flstk/result';

type ApiErrorData = {
    payload?: any;
    internal?: any;
    error?: any;
};

export class ApiError extends Error {
    public payload: any;
    public cause: any;
    public internal: any;

    public constructor(message: string, data?: ApiErrorData) {
        super(message);
        this.payload = data?.payload;
        this.cause = data?.error;
        this.internal = data?.internal;
    }

    public get code() {
        return 'UNKNOWN';
    }

    public get statusCode() {
        return 400;
    }

    public toResultError = (includeInternal: boolean): ResultError => {
        const result: ResultError = {
            __error: true,
            code: this.code,
            message: this.message,
            payload: this.payload,
        };

        if (includeInternal) {
            result.error = this;
            // result.internal = this.internal;
        }

        return result;
    };
}

export class InternalError extends ApiError {
    public get code() {
        return 'INTERNAL_ERROR';
    }

    public get statusCode() {
        return 500;
    }
}

export class BadRequest extends ApiError {
    public get code() {
        return 'BAD_REQUEST';
    }

    public get statusCode() {
        return 400;
    }

    public static with = (message: string) => {
        return (payload: any) => {
            throw new BadRequest(message, { internal: { payload } });
        };
    };
}

export class Forbidden extends BadRequest {
    public get code() {
        return 'FORBIDDEN';
    }
}

export class TooManyRequests extends BadRequest {
    public get code() {
        return 'TOO_MANY_REQUESTS';
    }
}

export class Unauthorized extends ApiError {
    public get code() {
        return 'UNAUTHORIZED';
    }

    public get statusCode() {
        return 401;
    }
}

export class InvalidOperation extends BadRequest {
    public get code() {
        return 'INVALID_OPERATION';
    }
}

export class NotFound extends ApiError {
    public get code() {
        return 'NOT_FOUND';
    }
}

export class MissingRequiredFields extends BadRequest {}
