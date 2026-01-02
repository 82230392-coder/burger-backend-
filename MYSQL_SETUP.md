# 🔧 Railway MySQL Setup Guide

## Step 1: Update your .env file

Open your `.env` file and update it with these Railway MySQL credentials:

```env
# Railway MySQL Database Configuration
DB_HOST=tramway.proxy.rlwy.net
DB_USER=root
DB_PASSWORD=FHPKFiFywdTGBBVKCeSZsxmuIBRaIiJv
DB_NAME=railway
DB_PORT=19641

# Server Configuration
PORT=5000
SESSION_SECRET=burger_secret_key_change_this_in_production

# Email Configuration (update with your credentials)
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password

# Frontend URL
FRONTEND_URL=http://localhost:3000
```

## Step 2: Install dependencies (if needed)

```bash
npm install
```

## Step 3: Start the server

The database will auto-initialize when you start the server:

```bash
npm start
```

## What's New?

✅ **Connection Pooling** - Better performance with connection pooling  
✅ **Auto Schema Creation** - Database tables created automatically on startup  
✅ **Sample Data** - Default admin user and sample menu items  
✅ **Better Error Handling** - Clear error messages for connection issues

## Database Tables Created:

- `users` - User accounts with verification
- `menu` - Burger menu items
- `cart` - Shopping cart
- `orders` - Order history
- `order_items` - Individual items in each order

## Default Credentials:

- **Admin Email**: admin@burger.com
- **Admin Password**: admin123 (change after first login)
