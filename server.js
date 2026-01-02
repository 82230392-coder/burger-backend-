import express from "express";
import cors from "cors";
import bcrypt from "bcryptjs";
import nodemailer from "nodemailer";
import session from "express-session";
import multer from "multer";
import path from "path";
import dotenv from "dotenv";
import db, { initDatabase } from "./config/database.js";

// Load environment variables
dotenv.config();

const app = express();

/* ================= MIDDLEWARE ================= */
app.use(express.json());

app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    credentials: true,
  })
);

app.use(
  session({
    name: "burger-session",
    secret: process.env.SESSION_SECRET || "burger_secret_key_123",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: false,
      httpOnly: true,
      maxAge: 1000 * 60 * 60 * 24,
    },
  })
);

/* ================= STATIC ================= */
app.use("/uploads", express.static("uploads"));

/* ================= DB INITIALIZATION ================= */
// Initialize database (creates tables if they don't exist)
await initDatabase();

/* ================= MULTER ================= */
const storage = multer.diskStorage({
  destination: "uploads/",
  filename: (req, file, cb) =>
    cb(null, Date.now() + path.extname(file.originalname)),
});

const upload = multer({ storage });

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER || "82230392@students.liu.edu.lb",
    pass: process.env.EMAIL_PASS || "nznaygvokpeqtmzo",
  },
});

// Verify transporter on startup without crashing
transporter.verify((error) => {
  if (error) {
    console.error("📧 Email Error:", error.message);
  } else {
    console.log("📧 Email Transporter Ready");
  }
});

/* ================= REGISTER ================= */
app.post("/register", async (req, res) => {
  const { fullName, email, password } = req.body;

  try {
    // Check if user exists
    const [existing] = await db.promise().query("SELECT id FROM users WHERE email=?", [email]);
    if (existing.length) return res.status(409).json({ message: "Email already registered" });

    const verifyCode = Math.floor(100000 + Math.random() * 900000);
    const hash = await bcrypt.hash(password, 10);

    // Insert user
    await db.promise().query(
      "INSERT INTO users (name, email, role, verify_code, password) VALUES (?, ?, 'user', ?, ?)",
      [fullName, email, verifyCode, hash]
    );

    console.log(`🔑 Verification code for ${email}: ${verifyCode}`);

    // Attempt to send email but don't crash if it fails
    try {
      await transporter.sendMail({
        to: email,
        subject: "Verify Account - Burger App",
        html: `<h2>Welcome to Burger App!</h2><p>Your verification code is:</p><h1 style="color: #ff4757;">${verifyCode}</h1>`,
      });
    } catch (emailErr) {
      console.error("📧 Email delivery failed:", emailErr.message);
    }

    res.json({ message: "Registration successful. Please verify your email." });
  } catch (err) {
    console.error("❌ Registration Error:", err.message);
    res.status(500).json({ message: "Internal server error during registration" });
  }
});

/* ================= VERIFY ================= */
app.post("/verify", async (req, res) => {
  const { email, code } = req.body;

  try {
    const [result] = await db.promise().query(
      "UPDATE users SET is_verified=1 WHERE email=? AND verify_code=?",
      [email, code]
    );

    if (result.affectedRows === 0) {
      return res.status(400).json({ message: "Invalid verification code or email" });
    }

    res.json({ message: "Account verified successfully!" });
  } catch (err) {
    console.error("❌ Verification Error:", err.message);
    res.status(500).json({ message: "Verification failed" });
  }
});

/* ================= LOGIN ================= */
app.post("/login", (req, res) => {
  const { email, password } = req.body;

  db.query("SELECT * FROM users WHERE email=?", [email], async (err, r) => {
    if (!r.length)
      return res.status(401).json({ message: "Invalid credentials" });

    const user = r[0];
    const match = await bcrypt.compare(password, user.password);

    if (!match) return res.status(401).json({ message: "Invalid credentials" });
    if (!user.is_verified)
      return res.status(403).json({ message: "Verify email first" });

    req.session.userId = user.id;
    req.session.role = user.role;

    res.json({
      message: "Login successful",
      user: {
        id: user.id,
        name: user.name,
        role: user.role,
      },
    });
  });
});

/* ================= LOGOUT ================= */
app.post("/logout", (req, res) => {
  req.session.destroy(() => {
    res.clearCookie("burger-session");
    res.json({ message: "Logged out" });
  });
});

/* ================= SESSION CHECK ================= */
app.get("/me", (req, res) => {
  if (!req.session.userId)
    return res.status(401).json({ message: "Not logged in" });

  res.json({
    userId: req.session.userId,
    role: req.session.role,
  });
});

/* ================= MENU ================= */
app.get("/menu", (req, res) => {
  db.query("SELECT * FROM menu", (err, rows) => {
    const formatted = rows.map((m) => ({
      id: m.id,
      title: m.name,
      paragraph: "Delicious burger",
      price: Number(m.price),
      category: m.category,
      rating: 4.5,
      image: `${process.env.BACKEND_URL || "http://localhost:5000"}/uploads/${m.image}`,
    }));
    res.json(formatted);
  });
});

/* ================= ADD MENU ================= */
app.post("/menu", upload.single("image"), (req, res) => {
  const { name, price, category } = req.body;
  const image = req.file.filename;

  db.query(
    "INSERT INTO menu (name,price,category,image) VALUES (?,?,?,?)",
    [name, price, category, image],
    () => res.json({ message: "Menu added" })
  );
});

/* ================= CART ================= */
app.post("/cart/add", (req, res) => {
  if (!req.session.userId)
    return res.status(401).json({ message: "Login required" });

  const { menuId } = req.body;

  db.query(
    `INSERT INTO cart (user_id,menu_id,quantity)
     VALUES (?,?,1)
     ON DUPLICATE KEY UPDATE quantity = quantity + 1`,
    [req.session.userId, menuId],
    () => res.json({ message: "Added to cart" })
  );
});

app.get("/cart", (req, res) => {
  if (!req.session.userId)
    return res.status(401).json({ message: "Login required" });

  const q = `
    SELECT c.id, c.quantity, m.name, m.price, m.image
    FROM cart c
    JOIN menu m ON c.menu_id = m.id
    WHERE c.user_id = ?
  `;

  db.query(q, [req.session.userId], (err, result) => res.json(result));
});

app.post("/cart/update", (req, res) => {
  const { cartId, change } = req.body;
  db.query(
    "UPDATE cart SET quantity = GREATEST(1, quantity + ?) WHERE id = ?",
    [change, cartId],
    () => res.json({ message: "Updated" })
  );
});

app.post("/cart/remove", (req, res) => {
  const { cartId } = req.body;
  db.query("DELETE FROM cart WHERE id=?", [cartId], () =>
    res.json({ message: "Removed" })
  );
});

/* ================= CHECKOUT ================= */
app.post("/checkout", (req, res) => {
  if (!req.session.userId)
    return res.status(401).json({ message: "Login required" });

  const userId = req.session.userId;

  const getCart = `
    SELECT c.menu_id, c.quantity, m.price
    FROM cart c JOIN menu m ON c.menu_id = m.id
    WHERE c.user_id = ?
  `;

  db.query(getCart, [userId], (err, cart) => {
    if (!cart.length) return res.status(400).json({ message: "Cart empty" });

    const total = cart.reduce((s, i) => s + i.price * i.quantity, 0);

    db.query(
      "INSERT INTO orders (user_id,total) VALUES (?,?)",
      [userId, total],
      (err, r) => {
        const orderId = r.insertId;

        const items = cart.map((i) => [
          orderId,
          i.menu_id,
          i.quantity,
          i.price,
        ]);

        db.query(
          "INSERT INTO order_items (order_id,menu_id,quantity,price) VALUES ?",
          [items],
          () => {
            db.query("DELETE FROM cart WHERE user_id=?", [userId], () =>
              res.json({ message: "Order placed", orderId })
            );
          }
        );
      }
    );
  });
});
/* ================= UPDATE MENU ================= */
app.put("/menu/:id", upload.single("image"), (req, res) => {
  const { id } = req.params;
  const { name, price, category, oldImage } = req.body;

  let imageQuery = "";
  let params = [name, price, category];

  if (req.file) {
    imageQuery = ", image=?";
    params.push(req.file.filename);
  }

  params.push(id);

  const sql = `
    UPDATE menu 
    SET name=?, price=?, category=? ${imageQuery}
    WHERE id=?
  `;

  db.query(sql, params, (err) => {
    if (err) {
      console.error("UPDATE ERROR:", err);
      return res.status(500).json({ message: "Update failed" });
    }
    res.json({ message: "Menu updated" });
  });
});
/* ================= DELETE MENU ================= */
app.delete("/menu/:id", (req, res) => {
  const { id } = req.params;

  db.query("DELETE FROM menu WHERE id=?", [id], (err) => {
    if (err) {
      console.error("DELETE ERROR:", err);
      return res.status(500).json({ message: "Delete failed" });
    }
    res.json({ message: "Menu deleted" });
  });
});

/* ================= ADMIN DASHBOARD ================= */
app.get("/admin/stats", (req, res) => {
  if (req.session.role !== "admin")
    return res.status(403).json({ message: "Admin only" });

  db.query(
    `
    SELECT
      (SELECT COUNT(*) FROM users) AS users,
      (SELECT COUNT(*) FROM orders WHERE DATE(created_at)=CURDATE()) AS ordersToday,
      (SELECT IFNULL(SUM(total),0) FROM orders) AS revenue
    `,
    (err, r) => res.json(r[0])
  );
});

app.get("/admin/orders", (req, res) => {
  if (req.session.role !== "admin")
    return res.status(403).json({ message: "Admin only" });

  const q = `
    SELECT o.id, u.name, o.total, o.status
    FROM orders o
    JOIN users u ON o.user_id = u.id
    ORDER BY o.created_at DESC
    LIMIT 10
  `;

  db.query(q, (err, rows) => res.json(rows));
});

/* ================= USER ORDERS ================= */
app.get("/orders", (req, res) => {
  const userId = req.session.userId;

  if (!userId) {
    return res.status(401).json({ message: "Login required" });
  }

  const sql = `
    SELECT 
      o.id AS order_id,
      o.total,
      o.created_at,
      oi.quantity,
      oi.price,
      m.name,
      m.image
    FROM orders o
    JOIN order_items oi ON o.id = oi.order_id
    JOIN menu m ON oi.menu_id = m.id
    WHERE o.user_id = ?
    ORDER BY o.id DESC
  `;

  db.query(sql, [userId], (err, rows) => {
    if (err) return res.status(500).json({ message: "DB error" });

    // group items by order
    const orders = {};
    rows.forEach((r) => {
      if (!orders[r.order_id]) {
        orders[r.order_id] = {
          id: r.order_id,
          total: r.total,
          date: r.created_at,
          items: [],
        };
      }

      orders[r.order_id].items.push({
        name: r.name,
        price: r.price,
        quantity: r.quantity,
        image: `${process.env.BACKEND_URL || "http://localhost:5000"}/uploads/${r.image}`,
      });
    });

    res.json(Object.values(orders));
  });
});

// Orders count + income grouped by date (last 7 days)
app.get("/admin/chart", (req, res) => {
  if (req.session.role !== "admin")
    return res.status(403).json({ message: "Admin only" });

  const sql = `
    SELECT 
      DATE(created_at) AS day,
      COUNT(*) AS orders,
      IFNULL(SUM(total),0) AS income
    FROM orders
    WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
    GROUP BY DATE(created_at)
    ORDER BY day ASC
  `;

  db.query(sql, (err, rows) => {
    if (err) {
      console.error("CHART ERROR:", err);
      return res
        .status(500)
        .json({ message: "DB error", error: err.sqlMessage });
    }
    res.json(rows);
  });
});

/* ================= SERVER ================= */
const PORT = process.env.PORT || 5000;
app.listen(PORT, () =>
  console.log(`🚀 Backend running on http://localhost:${PORT}`)
);
