import mysql from "mysql2";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create connection pool for better performance
const pool = mysql.createPool({
    host: process.env.DB_HOST || "localhost",
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME || "railway",
    port: process.env.DB_PORT || 3306,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
});

// Get promise-based pool for async/await support
const promisePool = pool.promise();

// Test connection and initialize database
export const initDatabase = async () => {
    try {
        const connection = await promisePool.getConnection();
        console.log("✅ MySQL Connected Successfully");

        // Read and execute initialization SQL
        const sqlPath = path.join(__dirname, "..", "db-init.sql");
        if (fs.existsSync(sqlPath)) {
            const sql = fs.readFileSync(sqlPath, "utf8");
            const statements = sql
                .split(";")
                .map((s) => s.trim())
                .filter((s) => s.length > 0);

            for (const statement of statements) {
                await connection.query(statement);
            }
            console.log("✅ Database tables initialized");
        }

        connection.release();
    } catch (err) {
        console.error("❌ Database Error:", err.message);
        console.error("Make sure your .env file has the correct Railway MySQL credentials");
        process.exit(1);
    }
};

// Export pool for use in routes
export default pool;
