import mysql from "mysql2/promise";
import dotenv from "dotenv";

dotenv.config();

async function checkTables() {
    console.log("Checking tables in database:", process.env.DB_NAME);
    try {
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST,
            port: process.env.DB_PORT,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME,
        });

        const [rows] = await connection.query("SHOW TABLES");
        console.log("Tables found:", rows.length);
        rows.forEach(row => {
            console.log("-", Object.values(row)[0]);
        });

        await connection.end();
    } catch (err) {
        console.error("❌ Error checking tables:", err.message);
    }
}

checkTables();
