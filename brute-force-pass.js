import mysql from "mysql2/promise";

const basePass = "FHPKFiFywdTGBBVKCeSZsxmuIBRaiIJv".split('');
const options = ['I', 'l', '1'];

const host = "tramway.proxy.rlwy.net";
const port = 19641;
const user = "root";
const database = "railway";

console.log("Starting brute-force of similar characters...");

for (let opt1 of options) {
    for (let opt2 of options) {
        const testPassArr = [...basePass];
        testPassArr[24] = opt1;
        testPassArr[29] = opt2;
        const testPass = testPassArr.join('');

        try {
            const connection = await mysql.createConnection({
                host, port, user, password: testPass, database
            });
            console.log(`✅ SUCCESS! Password: ${testPass}`);
            await connection.end();
            process.exit(0);
        } catch (err) {
            console.log(`❌ Failed: ${testPass} - ${err.message}`);
        }
    }
}

console.log("All combinations failed.");
process.exit(1);
