import mysql from 'mysql2/promise';
export declare const erpPool: mysql.Pool;
export declare const posPool: mysql.Pool;
export declare function testConnections(): Promise<{
    which: string;
    ok: boolean;
    info?: string;
}[]>;
export declare function closePools(): Promise<void>;
//# sourceMappingURL=db.d.ts.map