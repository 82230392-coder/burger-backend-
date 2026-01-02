import bcrypt from "bcryptjs";
import db from "./config/database.js";
import dotenv from "dotenv";

dotenv.config();

const resetAdmin = async () => {
    const hash = await bcrypt.hash("admin123", 10);
    console.log("New Hash:", hash);

    try {
        await db.promise().query(
            "UPDATE users SET password = ? WHERE email = 'admin@burger.com'",
            [hash]
        );
        console.log("✅ Admin password reset to 'admin123'");
        process.exit(0);
    } catch (err) {
        console.error("❌ Error:", err.message);
        process.exit(1);
    }
};

resetAdmin();
