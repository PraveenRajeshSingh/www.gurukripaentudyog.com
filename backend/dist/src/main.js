"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("reflect-metadata");
const core_1 = require("@nestjs/core");
const app_module_1 = require("./app.module");
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    app.enableCors();
    const port = process.env.PORT || 3000;
    await app.listen(port);
    console.log(`Brick Supply Multi-Tenant SaaS Backend running on http://localhost:${port}`);
}
if (require.main === module) {
    bootstrap();
}
//# sourceMappingURL=main.js.map