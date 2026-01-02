import mysql from "mysql2/promise";
import dotenv from "dotenv";

dotenv.config();

console.log("Testing Railway MySQL Connection...");
console.log("Host:", process.env.DB_HOST);
console.log("Port:", process.env.DB_PORT);
console.log("User:", process.env.DB_USER);
console.log("Database:", process.env.DB_NAME);
console.log("Password length:", process.env.DB_PASSWORD?.length || 0);

try {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
    });

    console.log("✅ Connection successful!");
    await connection.end();
} catch (err) {
    console.error("❌ Connection failed:", err.message);
    process.exit(1);
}
