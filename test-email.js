import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.EMAIL_USER || "82230392@students.liu.edu.lb",
        pass: process.env.EMAIL_PASS || "nznaygvokpeqtmzo",
    },
});

console.log("Testing email transporter...");

transporter.verify((error, success) => {
    if (error) {
        console.error("❌ Email Verification Failed:", error.message);
        process.exit(1);
    } else {
        console.log("✅ Server is ready to take our messages");

        // Attempt to send a test email to the user's email
        transporter.sendMail({
            from: '"Burger App Test" <82230392@students.liu.edu.lb>',
            to: "82230392@students.liu.edu.lb",
            subject: "Test Email from Burger App",
            text: "This is a test email to verify the transporter is working.",
            html: "<h1>Success!</h1><p>The email API is working correctly.</p>"
        }, (err, info) => {
            if (err) {
                console.error("❌ Send Mail Failed:", err.message);
                process.exit(1);
            } else {
                console.log("✅ Email sent successfully:", info.response);
                process.exit(0);
            }
        });
    }
});
