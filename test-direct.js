import mysql from "mysql2/promise";

const config = {
    host: "tramway.proxy.rlwy.net",
    port: 19641,
    user: "root",
    password: "FHPKFiFywdTGBBVKCeSZsxmuIBRaiIJv",
    database: "railway",
};

console.log("Testing DIRECT connection with hardcoded values...");
try {
    const connection = await mysql.createConnection(config);
    console.log("✅ DIRECT Connection successful!");
    await connection.end();
} catch (err) {
    console.error("❌ DIRECT Connection failed:", err.message);
}
