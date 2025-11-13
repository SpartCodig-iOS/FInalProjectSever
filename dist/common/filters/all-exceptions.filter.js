"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AllExceptionsFilter = void 0;
const common_1 = require("@nestjs/common");
const zod_1 = require("zod");
const logger_1 = require("../../utils/logger");
const formatZodIssue = (issue) => ({
    path: issue.path,
    message: issue.message,
    code: issue.code,
    expected: 'expected' in issue ? issue.expected : undefined,
    received: 'received' in issue ? issue.received : undefined,
});
let AllExceptionsFilter = class AllExceptionsFilter {
    catch(exception, host) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse();
        if (exception instanceof zod_1.ZodError) {
            const issues = exception.issues.map(formatZodIssue);
            logger_1.logger.info('Validation failed', { issues });
            return response.status(common_1.HttpStatus.BAD_REQUEST).json({
                code: common_1.HttpStatus.BAD_REQUEST,
                message: '요청 데이터 형식이 올바르지 않습니다.',
                data: { errors: issues },
            });
        }
        if (exception instanceof common_1.HttpException) {
            const status = exception.getStatus();
            const res = exception.getResponse();
            const message = typeof res === 'string'
                ? res
                : typeof res === 'object' && 'message' in res
                    ? res.message || exception.message
                    : exception.message;
            const data = typeof res === 'object' && res && 'data' in res ? res.data : [];
            if (status >= 500) {
                logger_1.logger.error('Unhandled exception', { message, stack: exception.stack });
            }
            else {
                logger_1.logger.info('Handled error response', { status, message });
            }
            return response.status(status).json({
                code: status,
                data,
                message,
            });
        }
        const status = common_1.HttpStatus.INTERNAL_SERVER_ERROR;
        const message = exception?.message || 'Internal Server Error';
        logger_1.logger.error('Unhandled exception', { message, stack: exception?.stack });
        return response.status(status).json({
            code: status,
            data: [],
            message,
        });
    }
};
exports.AllExceptionsFilter = AllExceptionsFilter;
exports.AllExceptionsFilter = AllExceptionsFilter = __decorate([
    (0, common_1.Catch)()
], AllExceptionsFilter);
