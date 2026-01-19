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
const devices_1 = __importDefault(require("./routes/devices"));
const audit_1 = __importDefault(require("./routes/audit"));
const notifications_1 = __importDefault(require("./routes/notifications"));
const settings_1 = __importDefault(require("./routes/settings"));
const dashboard_1 = __importDefault(require("./routes/dashboard"));
const suppliers_1 = __importDefault(require("./routes/suppliers"));
const products_1 = __importDefault(require("./routes/products"));
const inventory_1 = __importDefault(require("./routes/inventory"));
const purchase_orders_1 = __importDefault(require("./routes/purchase-orders"));
const pos_data_1 = __importDefault(require("./routes/pos-data"));
const pos_tables_1 = __importDefault(require("./routes/pos-tables"));
const db_explorer_1 = __importDefault(require("./routes/db-explorer"));
const multi_pos_1 = __importDefault(require("./routes/multi-pos"));
const r5_reports_1 = __importDefault(require("./routes/r5-reports"));
const mydiner_reports_1 = __importDefault(require("./routes/mydiner-reports"));
const pos_monitor_1 = require("./services/pos-monitor");
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
            devices: '/api/devices',
            audit: '/api/audit',
            notifications: '/api/notifications',
            settings: '/api/settings',
            dashboard: '/api/dashboard',
            suppliers: '/api/suppliers',
            products: '/api/products',
            inventory: '/api/inventory',
            purchaseOrders: '/api/purchase-orders',
            posData: '/api/pos-data',
            dbExplorer: '/api/db-explorer',
            multiPos: '/api/multi-pos',
            r5Reports: '/api/r5-reports',
            mydinerReports: '/api/mydiner-reports',
        }
    });
});
app.use('/api/auth', auth_1.default);
app.use('/api/users', users_1.default);
app.use('/api/roles', roles_1.default);
app.use('/api/permissions', permissions_1.default);
app.use('/api/health', health_1.default);
app.use('/api/devices', devices_1.default);
app.use('/api/audit', audit_1.default);
app.use('/api/notifications', notifications_1.default);
app.use('/api/settings', settings_1.default);
app.use('/api/dashboard', dashboard_1.default);
app.use('/api/suppliers', suppliers_1.default);
app.use('/api/products', products_1.default);
app.use('/api/inventory', inventory_1.default);
app.use('/api/purchase-orders', purchase_orders_1.default);
app.use('/api/pos-data', pos_data_1.default);
app.use('/api/pos-tables', pos_tables_1.default);
app.use('/api/db-explorer', db_explorer_1.default);
app.use('/api/multi-pos', multi_pos_1.default);
app.use('/api/r5-reports', r5_reports_1.default);
app.use('/api/mydiner-reports', mydiner_reports_1.default);
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
        let allConnected = true;
        results.forEach(r => {
            if (r.ok) {
                console.log(`Database connected successfully: ${r.which}`);
            }
            else {
                console.error(`Database connection failed: ${r.which} — ${r.info ?? 'unknown error'}`);
                allConnected = false;
            }
        });
        if (allConnected) {
            (0, pos_monitor_1.startPOSMonitor)(15000);
        }
    }
    catch (err) {
        console.error('Error testing DB connections on startup', err);
    }
})();
async function shutdown() {
    console.log('Shutting down server...');
    (0, pos_monitor_1.stopPOSMonitor)();
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