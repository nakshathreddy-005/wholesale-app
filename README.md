# 🏪 WholeSale Pro — Inventory & Billing Management System

A full-stack MERN application for wholesale shop owners to manage inventory, customers, suppliers, billing, and sales — with an integrated AI chatbot.

---

## 🚀 Tech Stack

| Layer       | Technology                        |
|-------------|-----------------------------------|
| Frontend    | React 18 + Vite + Tailwind CSS    |
| State Mgmt  | Zustand                           |
| HTTP Client | Axios                             |
| Backend     | Node.js + Express.js              |
| Database    | MongoDB + Mongoose ODM            |
| Auth        | JWT + bcryptjs                    |
| PDF         | PDFKit                            |
| Charts      | Chart.js + react-chartjs-2        |

---

## 📁 Project Structure

```
wholesale-inventory-billing-bot/
├── client/                    # React frontend (Vite)
│   └── src/
│       ├── components/        # Reusable UI components
│       ├── pages/             # Route-level page components
│       ├── store/             # Zustand state stores
│       ├── services/          # Axios API service layer
│       └── routes/            # Protected route wrappers
└── server/                    # Express backend
    ├── controllers/           # Route handler logic
    ├── models/                # Mongoose schemas
    ├── routes/                # Express route definitions
    ├── middleware/            # Auth, error, validation
    ├── utils/                 # PDF generator, seed script
    └── config/                # DB and JWT config
```

---

## ⚙️ Setup & Installation

### Prerequisites
- Node.js v18+
- MongoDB (local or Atlas)
- npm

### 1. Clone & Install

```bash
git clone <your-repo-url>
cd wholesale-inventory-billing-bot
npm run install:all
```

### 2. Configure Environment

```bash
cp .env.example .env
# Edit .env with your MongoDB URI and JWT secret
```

**Server `.env`:**
```env
PORT=5000
NODE_ENV=development
MONGO_URI=mongodb://localhost:27017/wholesale_db
JWT_SECRET=your_super_secret_key_here
JWT_EXPIRES_IN=7d
CLIENT_URL=http://localhost:5173
```

### 3. Seed Database (Optional but Recommended)

```bash
cd server
node utils/seed.js
```

This creates:
- **Admin:** admin@wholesale.com / admin123
- **Staff:** staff@wholesale.com / staff123
- 8 sample products, 4 customers, 2 suppliers

### 4. Run Development Servers

```bash
# From root — runs both frontend and backend simultaneously
npm run dev

# Or run separately:
npm run server   # Backend on http://localhost:5000
npm run client   # Frontend on http://localhost:5173
```

---

## 🔐 Default Login

| Role  | Email                  | Password  |
|-------|------------------------|-----------|
| Admin | admin@wholesale.com    | admin123  |
| Staff | staff@wholesale.com    | staff123  |

---

## 📡 API Endpoints

### Auth
| Method | Endpoint             | Description        | Auth |
|--------|---------------------|--------------------|------|
| POST   | /api/auth/register  | Register user      | ❌   |
| POST   | /api/auth/login     | Login & get token  | ❌   |
| GET    | /api/auth/me        | Get current user   | ✅   |
| PUT    | /api/auth/profile   | Update profile     | ✅   |

### Products
| Method | Endpoint                    | Description       |
|--------|-----------------------------|-------------------|
| GET    | /api/products               | List all products |
| GET    | /api/products/:id           | Get one product   |
| POST   | /api/products               | Create product    |
| PUT    | /api/products/:id           | Update product    |
| DELETE | /api/products/:id           | Delete product    |
| GET    | /api/products/categories    | List categories   |
| GET    | /api/products/low-stock     | Low stock alert   |

### Inventory
| Method | Endpoint                  | Description        |
|--------|--------------------------|---------------------|
| GET    | /api/inventory/logs      | Movement history   |
| POST   | /api/inventory/stock-in  | Add stock          |
| POST   | /api/inventory/stock-out | Remove stock       |
| POST   | /api/inventory/adjust    | Adjust to quantity |

### Billing
| Method | Endpoint                    | Description          |
|--------|-----------------------------|----------------------|
| GET    | /api/billing                | List invoices        |
| POST   | /api/billing                | Create invoice       |
| GET    | /api/billing/:id            | Get one invoice      |
| PUT    | /api/billing/:id/payment    | Update payment       |
| GET    | /api/billing/:id/pdf        | Download PDF         |
| GET    | /api/billing/dashboard-stats| Dashboard stats      |

### Reports
| Method | Endpoint                   | Description      |
|--------|---------------------------|------------------|
| GET    | /api/reports/sales        | Sales report     |
| GET    | /api/reports/inventory    | Inventory report |
| GET    | /api/reports/customers    | Customer report  |
| GET    | /api/reports/suppliers    | Supplier report  |
| GET    | /api/reports/export/:type | Export CSV       |

### AI Bot
| Method | Endpoint       | Description     |
|--------|---------------|-----------------|
| POST   | /api/bot/chat | Chat with AI bot|

---

## 🤖 AI Bot Commands

The bot understands natural language queries:

| Example Prompt                    | Action                    |
|-----------------------------------|---------------------------|
| "Show low stock products"         | Lists items below threshold|
| "What are today's sales?"         | Today's revenue summary   |
| "Show top selling products"       | Top 5 by units sold       |
| "Show pending payments"           | Unpaid invoices list      |
| "What is total revenue?"          | All-time revenue           |
| "Show recent invoices"            | Last 5 invoices           |

---

## 📋 Features

- ✅ JWT Auth with role-based access (Admin / Staff)
- ✅ Full Product CRUD with categories, SKU, barcode
- ✅ Inventory tracking — stock in, out, adjust with history
- ✅ Low stock alerts on dashboard and header
- ✅ Customer & Supplier management with purchase history
- ✅ Invoice creation with multi-item, GST, discount
- ✅ PDF invoice download via PDFKit
- ✅ Dashboard with Chart.js revenue + top product charts
- ✅ Sales, Inventory, Customer, Supplier reports
- ✅ CSV export for reports
- ✅ AI Chatbot with natural language query support
- ✅ Responsive design with Tailwind CSS

---

## 🛡️ Security

- Passwords hashed with bcryptjs (salt rounds: 12)
- JWT tokens expire in 7 days
- Protected routes require Bearer token
- Admin-only routes checked via role middleware
- Mongoose validation on all schemas
- Global error handler with descriptive messages

---

## 🐳 Docker (Optional)

```yaml
# docker-compose.yml included
docker-compose up --build
```

---

## 📄 License

MIT © 2024 WholeSale Pro
