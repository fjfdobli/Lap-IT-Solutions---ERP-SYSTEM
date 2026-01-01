"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.posPool = exports.erpPool = void 0;
exports.testConnections = testConnections;
exports.closePools = closePools;
const promise_1 = __importDefault(require("mysql2/promise"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
exports.erpPool = promise_1.default.createPool({
    host: process.env.ERP_DB_HOST || 'localhost',
    port: Number(process.env.ERP_DB_PORT || 3306),
    user: process.env.ERP_DB_USER || 'root',
    password: process.env.ERP_DB_PASSWORD || 'worldwide',
    database: process.env.ERP_DB_NAME || 'erp_database',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
});
exports.posPool = promise_1.default.createPool({
    host: process.env.POS_DB_HOST || 'localhost',
    port: Number(process.env.POS_DB_PORT || 3306),
    user: process.env.POS_DB_USER || 'root',
    password: process.env.POS_DB_PASSWORD || 'worldwide',
    database: process.env.POS_DB_NAME || 'ibs_pos_new',
    waitForConnections: true,
    connectionLimit: 5,
    queueLimit: 0,
});
async function testConnections() {
    const results = [];
    try {
        const [row] = await exports.erpPool.query('SELECT 1 as ok');
        results.push({ which: 'erp_database', ok: true });
    }
    catch (err) {
        results.push({ which: 'erp_database', ok: false, info: String(err?.message || err) });
    }
    try {
        const [row] = await exports.posPool.query('SELECT 1 as ok');
        results.push({ which: 'ibs_pos_new', ok: true });
    }
    catch (err) {
        results.push({ which: 'ibs_pos_new', ok: false, info: String(err?.message || err) });
    }
    return results;
}
async function closePools() {
    await Promise.all([exports.erpPool.end(), exports.posPool.end()]);
}
//# sourceMappingURL=database.js.map