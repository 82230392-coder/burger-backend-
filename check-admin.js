import db from "./config/database.js";
import dotenv from "dotenv";

dotenv.config();

const checkAdmin = async () => {
    try {
        const [rows] = await db.promise().query("SELECT id, name, email, role, is_verified, password FROM users WHERE email = 'admin@burger.com'");
        if (rows.length === 0) {
            console.log("❌ Admin user not found.");
        } else {
            console.log("✅ Admin user found:");
            console.log(JSON.stringify(rows[0], null, 2));
        }
        process.exit(0);
    } catch (err) {
        console.error("❌ Error:", err.message);
        process.exit(1);
    }
};

checkAdmin();
