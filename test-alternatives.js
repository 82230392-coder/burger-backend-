import mysql from "mysql2/promise";

const password = "FHPKFiFywdTGBBVKCeSZsxmuIBRaiIJv";
const host = "tramway.proxy.rlwy.net";
const port = 19641;
const users = ["root", "railway", "mysql"];
const dbs = ["railway", "mysql", "new-burger", ""];

console.log("Testing alternative usernames and databases...");

for (let user of users) {
    for (let database of dbs) {
        try {
            const connection = await mysql.createConnection({
                host, port, user, password, database: database || undefined
            });
            console.log(`✅ SUCCESS! User: ${user}, DB: ${database}`);
            await connection.end();
            process.exit(0);
        } catch (err) {
            console.log(`❌ Failed: User: ${user}, DB: ${database} - ${err.message}`);
        }
    }
}

console.log("All alternatives failed.");
process.exit(1);
