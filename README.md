# 🛒 Vendora POS

![Next.js](https://img.shields.io/badge/Next.js-black?style=for-the-badge&logo=next.js&logoColor=white)
![NestJS](https://img.shields.io/badge/nestjs-E0234E?style=for-the-badge&logo=nestjs&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma-3982CE?style=for-the-badge&logo=Prisma&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
![Framer Motion](https://img.shields.io/badge/Framer_Motion-0055FF?style=for-the-badge&logo=framer&logoColor=white)

An end-to-end, full-stack Point of Sale (POS) system engineered for high-speed retail environments. Featuring a secure, transaction-safe backend and a dual-themed frontend, this project handles everything from role-based authentication to native A4 PDF receipt generation. 

Developed as an advanced computer science project at KLE Technological University, Belagavi, it demonstrates production-ready architectural patterns and enterprise-grade state management.

---

## 📸 System Previews

| Cashier Terminal (Light Mode) | Admin Dashboard (Dark Mode) |
| :---: | :---: |
| <img src="docs/cashier-ui.png" width="400" alt="Cashier Interface"/> | <img src="docs/admin-ui.png" width="400" alt="Admin Dashboard"/> |
| *High-contrast UI designed for speed, featuring live search, cart management, and dynamic GST calculations.* | *Glassmorphic command center for revenue drill-downs, inventory management, and staff creation.* |

| UPI Payment Integration | A4 PDF Receipt Generation |
| :---: | :---: |
| <img src="docs/upi-flow.png" width="400" alt="UPI Checkout"/> | <img src="docs/invoice-pdf.png" width="400" alt="PDF Print Preview"/> |
| *Simulated QR code scanning workflow for digital payments.* | *Custom CSS injection for pixel-perfect, browser-native invoice printing.* |

---

## ✨ Core Features

### 🔐 Security & Architecture
* **Role-Based Access Control (RBAC):** Strict JWT-based routing separates `ADMIN` command center access from `CASHIER` terminal access.
* **ACID Transactions:** Built using Prisma `$transaction` API to ensure absolute data integrity during checkout (inventory deduction and invoice creation succeed or fail together).
* **Bcrypt Encryption:** Secure password hashing for all staff accounts.

### 💳 Cashier Terminal
* **Dynamic Cart System:** Real-time quantity steppers, cart validation against database stock limits, and instant subtotal calculations.
* **Indian Tax Compliance:** Automatic 18% GST calculation (9% CGST + 9% SGST) applied to subtotals.
* **Smart Search:** Instant-filter dropdown menu for rapid product lookup.
* **Professional Print Engine:** Custom `@media print` CSS overrides the browser's default UI to generate a clean, retail-standard A4 PDF invoice.

### 📊 Admin Command Center
* **Live Revenue Analytics:** Drill-down metrics showing gross revenue split across payment methods (UPI, Cash, Card).
* **Inventory Management:** Direct-to-database product creation interface.
* **Staff Management:** Admins can securely provision and authorize new cashier accounts.
* **Dynamic Store Config:** Global store settings (GSTIN, Address) saved and applied to all generated receipts.

---

## 🛠️ Tech Stack

**Frontend Framework:** Next.js 16 (App Router)  
**Styling & UI:** Tailwind CSS, Framer Motion, Lucide React  
**HTTP Client:** Axios  
**Backend Framework:** NestJS  
**Database:** PostgreSQL  
**ORM:** Prisma  
**Authentication:** JWT (JSON Web Tokens), Passport.js, Bcrypt  

---

## 🚀 Local Development Setup

To run this project locally, you will need **Node.js** and a **PostgreSQL** instance running on your machine.

### 1. Clone the Repository

```bash
git clone [https://github.com/yourusername/nexus-pos.git](https://github.com/yourusername/nexus-pos.git)
cd nexus-pos
```

### 2. Backend Setup (NestJS)

```bash
cd backend

# Install dependencies
npm install

# Configure Environment Variables
# Create a .env file in the backend directory and add your Postgres URL:
# DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/store_billing_db?schema=public"
# JWT_SECRET="your_super_secret_key"

# Push the schema to the database and generate Prisma Client
npx prisma db push
npx prisma generate

# Start the NestJS server (Runs on port 3000)
npm run start:dev
```

### 3. Frontend Setup (Next.js)

```bash
cd frontend

# Install dependencies
npm install

# Start the Next.js development server (Configured to run on port 3001)
npm run dev
```

### 4. Access the Application

* **Application URL:** `http://localhost:3001`
* Use Postman or an initial database seed to create your first `ADMIN` user, then log in to provision your store!

---

## 📂 Project Structure

```text
📦 nexus-pos
 ┣ 📂 backend                 # NestJS Application
 ┃ ┣ 📂 prisma                # Database Schema & Migrations
 ┃ ┣ 📂 src
 ┃ ┃ ┣ 📂 auth                # JWT Authentication Logic
 ┃ ┃ ┣ 📂 invoices            # Checkout Transaction Engine
 ┃ ┃ ┗ 📂 products            # Inventory CRUD
 ┗ 📂 frontend                # Next.js Application
   ┣ 📂 src/app
   ┃ ┣ 📂 (auth)              # Login Gateway
   ┃ ┣ 📂 admin               # Dark Mode Command Center
   ┃ ┗ 📂 cashier             # Light Mode POS Terminal
```

---

## 📄 License

This project is licensed under the MIT License.
```