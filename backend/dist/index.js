"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const database_1 = require("./database");
const app = (0, express_1.default)();
const PORT = Number(process.env.PORT || 3000);
app.get('/', (req, res) => {
    res.json({ message: 'Backend is running!' });
});
app.get('/db-status', async (_req, res) => {
    const results = await (0, database_1.testConnections)();
    res.json({ databases: results });
});
const server = app.listen(PORT, () => {
    console.log(`Server listening at http://localhost:${PORT}`);
});
(async () => {
    try {
        const results = await (0, database_1.testConnections)();
        results.forEach(r => {
            if (r.ok) {
                console.log(`DB OK: ${r.which}`);
            }
            else {
                console.error(`DB FAIL: ${r.which} — ${r.info ?? 'unknown error'}`);
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