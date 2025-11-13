"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("reflect-metadata");
const node_dns_1 = __importDefault(require("node:dns"));
node_dns_1.default.setDefaultResultOrder('ipv4first');
const node_path_1 = __importDefault(require("node:path"));
const express_1 = require("express");
const helmet_1 = __importDefault(require("helmet"));
const swagger_ui_express_1 = __importDefault(require("swagger-ui-express"));
const core_1 = require("@nestjs/core");
const swagger_output_json_1 = __importDefault(require("../swagger-output.json"));
const app_module_1 = require("./app.module");
const env_1 = require("./config/env");
const logger_1 = require("./utils/logger");
const all_exceptions_filter_1 = require("./common/filters/all-exceptions.filter");
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    const helmetOptions = {
        contentSecurityPolicy: false,
    };
    app.use((0, helmet_1.default)(helmetOptions));
    app.enableCors();
    app.use((0, express_1.json)());
    app.use((0, express_1.urlencoded)({ extended: true }));
    app.useGlobalFilters(new all_exceptions_filter_1.AllExceptionsFilter());
    app.useStaticAssets(node_path_1.default.join(process.cwd(), 'public'), { prefix: '/public/' });
    const swaggerFile = {
        ...swagger_output_json_1.default,
        host: env_1.env.nodeEnv === 'production'
            ? 'sparatafinalapp.up.railway.app'
            : `localhost:${env_1.env.port}`,
        schemes: env_1.env.nodeEnv === 'production' ? ['https'] : ['http'],
    };
    const swaggerOptions = {
        explorer: true,
        swaggerOptions: {
            docExpansion: 'list',
            defaultModelsExpandDepth: 1,
            defaultModelExpandDepth: 1,
            displayRequestDuration: true,
            filter: true,
            showExtensions: true,
            showCommonExtensions: true,
            tryItOutEnabled: true,
        },
    };
    app.use('/api-docs', swagger_ui_express_1.default.serve, swagger_ui_express_1.default.setup(swaggerFile, swaggerOptions));
    await app.listen(env_1.env.port);
    logger_1.logger.info('Server listening', { port: env_1.env.port, env: env_1.env.nodeEnv });
}
bootstrap();
