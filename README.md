# 🏨 Smart Hotel Booking System

A full-stack, comprehensive hotel management and booking platform designed for guests, hotel managers, and system administrators. 

> [!NOTE]
> This repository is rooted at the `Smart-Hotel-Booking-System` directory and contains two main subfolders: `client` (frontend React/Vite application) and `server` (backend Node/Express API).

---

## ✨ Features

- **Guest Portal:** Browse available hotels, view room details, book stays, manage upcoming/past bookings, and leave reviews.
- **Manager Dashboard:** Manage your hotel's profile, create/remove rooms, view incoming bookings, and respond to guest reviews.
- **Admin Central Command:** Global oversight of all users securely. Assign managerial roles, delete violating users/hotels, and monitor system-wide statistics.
- **Loyalty Program:** Guests earn points on bookings that can be redeemed for discounts on future stays.
- **Secure Authentication:** Role-based access control (RBAC) powered by JWT and secure HTTP-only cookies.

---

## 🛠️ Technology Stack

**Frontend:**
- React (Vite)
- Redux Toolkit (State Management)
- React Router DOM
- Bootstrap 5 & Custom CSS (Styling)

**Backend:**
- Node.js & Express.js
- MongoDB & Mongoose
- JSON Web Tokens (JWT) for authentication

---

## ⚙️ Environment Variables

To run this project locally, you will need to add the following environment variables to your `.env` files.

### Server (`server/.env`)

```env
# Server Configuration
PORT=5600
NODE_ENV=development

# Database Configuration
MONGO_URL=mongodb://localhost:27017/smart_hotel_booking

# JWT Configuration
JWT_SECRET=e994264431a1a8e4314e25df0da5e12ce12f39b750d43d2825e132d611297a7e26563548e2c23601f006b150033b89f89fe4a00f842d0eabd182908b9bb381aa
JWT_EXPIRE=2d

# Frontend Configuration
FRONTEND_URL=http://localhost:5173

# Payment Configuration
PAYMENT_GATEWAY_MODE=sandbox

# Loyalty Program Configuration
LOYALTY_POINTS_RATE=1
POINTS_VALUE=1
```

### Client (`client/.env`)

```env
# API Configuration
VITE_API_URL=http://localhost:5600
```

---

## 🚀 Installation & Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd Smart-Hotel-Booking-System
   ```

2. **Start the Backend Server**
   ```bash
   cd server
   npm install
   # Ensure your server/.env is configured as shown above
   npm run start
   ```

3. **Start the Frontend Client**
    Open a new terminal window:
   ```bash
   cd client
   npm install
   # Ensure your client/.env is configured as shown above
   npm run dev
   ```

4. **Access the Application**
   Open your browser and navigate to `http://localhost:5173`.