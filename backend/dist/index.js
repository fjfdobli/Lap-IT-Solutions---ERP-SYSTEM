"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const database_1 = require("./database/database");
const config_1 = require("./config");
const auth_1 = __importDefault(require("./routes/auth"));
const users_1 = __importDefault(require("./routes/users"));
const roles_1 = __importDefault(require("./routes/roles"));
const permissions_1 = __importDefault(require("./routes/permissions"));
const health_1 = __importDefault(require("./routes/health"));
const app = (0, express_1.default)();
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)(config_1.config.cors));
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
app.get('/', (req, res) => {
    res.json({
        message: 'Lap IT Solutions ERP API',
        version: '1.0.0',
        endpoints: {
            auth: '/api/auth',
            users: '/api/users',
            roles: '/api/roles',
            permissions: '/api/permissions',
            health: '/api/health',
        }
    });
});
app.use('/api/auth', auth_1.default);
app.use('/api/users', users_1.default);
app.use('/api/roles', roles_1.default);
app.use('/api/permissions', permissions_1.default);
app.use('/api/health', health_1.default);
app.get('/db-status', async (_req, res) => {
    const results = await (0, database_1.testConnections)();
    res.json({ databases: results });
});
const server = app.listen(config_1.config.port, () => {
    console.log(`Server running at: http://localhost:${config_1.config.port}`);
    console.log(`API endpoints available at: http://localhost:${config_1.config.port}/api\n`);
});
(async () => {
    try {
        const results = await (0, database_1.testConnections)();
        results.forEach(r => {
            if (r.ok) {
                console.log(`Database connected successfully: ${r.which}`);
            }
            else {
                console.error(`Database connection failed: ${r.which} — ${r.info ?? 'unknown error'}`);
            }
        });
    }
    catch (err) {
        console.error('Error testing DB connections on startup', err);
    }
})();
async function shutdown() {
    console.log('Shutting down server...');
    server.close(async () => {
        try {
            await (0, database_1.closePools)();
            console.log('DB pools closed');
        }
        catch (err) {
            console.warn('Error closing DB pools', err);
        }
        process.exit(0);
    });
}
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
//# sourceMappingURL=index.js.map