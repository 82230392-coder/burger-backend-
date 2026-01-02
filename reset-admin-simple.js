import bcrypt from "bcryptjs";
import db from "./config/database.js";
import dotenv from "dotenv";

dotenv.config();

const resetAdminSimple = async () => {
    const hash = await bcrypt.hash("123456", 10);
    console.log("Resetting admin to email: admin@burger.com, password: 123456");

    try {
        const [res] = await db.promise().query(
            "UPDATE users SET password = ?, is_verified = 1 WHERE email = 'admin@burger.com'",
            [hash]
        );
        if (res.affectedRows > 0) {
            console.log("✅ Admin password reset to '123456' and verified.");
        } else {
            console.log("❌ Admin user not found in DB.");
        }
        process.exit(0);
    } catch (err) {
        console.error("❌ Error:", err.message);
        process.exit(1);
    }
};

resetAdminSimple();
