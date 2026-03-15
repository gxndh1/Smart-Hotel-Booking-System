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

---

## 🔌 API Documentation (Postman Guide)

This section contains the essential REST API endpoints used across the Landing Page, Manager Dashboard, and Admin Dashboard. You can use these endpoints to demonstrate the API functionality in Postman.

> **Note on Authentication:** 
> For any endpoints labeled `[Requires Auth]`, you must first hit the Login endpoint, copy the `token` from the response, and then paste it into the **Authorization** tab in Postman. Select **Bearer Token** and paste the token there.

### 🌎 1. Landing Page & Public APIs

These are the public-facing APIs used by customers on the main website.

- **Register a New User**
  - **Method:** `POST`
  - **URL:** `http://localhost:5600/api/auth/register`
  - **Body (JSON):**
    ```json
    {
      "name": "Jane Doe",
      "email": "jane@example.com",
      "password": "password123",
      "confirmPassword": "password123",
      "contactNumber": "9876543210",
      "role": "guest" 
    }
    ```

- **Login**
  - **Method:** `POST`
  - **URL:** `http://localhost:5600/api/auth/login`
  - **Body (JSON):**
    ```json
    {
      "email": "jane@example.com",
      "password": "password123"
    }
    ```
    *(Copy the resulting `token` for authenticated requests)*

- **Get All Hotels (Listings)**
  - **Method:** `GET`
  - **URL:** `http://localhost:5600/api/hotels`

- **Get Specific Hotel Details**
  - **Method:** `GET`
  - **URL:** `http://localhost:5600/api/hotels/:id`

---

### 🏢 2. Manager Dashboard APIs

> **Authentication Required:** You must login as a manager and use their Bearer Token.

- **Get Manager Dashboard Stats**
  - **Method:** `GET`
  - **URL:** `http://localhost:5600/api/manager/stats`

- **Get Manager's Property Listings**
  - **Method:** `GET`
  - **URL:** `http://localhost:5600/api/manager/hotels`

- **Add a New Room**
  - **Method:** `POST`
  - **URL:** `http://localhost:5600/api/manager/rooms`
  - **Body (JSON):**
    ```json
    {
      "hotelId": "VALID_HOTEL_ID",
      "type": "Deluxe",
      "capacity": 2,
      "price": 2500,
      "features": ["WiFi", "AC"]
    }
    ```

- **Update Booking Status**
  - **Method:** `PUT`
  - **URL:** `http://localhost:5600/api/manager/bookings/:id/status`
  - **Body (JSON):** `{"status": "confirmed"}`

- **Respond to a Review**
  - **Method:** `PUT`
  - **URL:** `http://localhost:5600/api/reviews/:id/respond`
  - **Body (JSON):** `{"managerReply": "Your response..."}`

---

### 👑 3. Admin Dashboard APIs

> **Authentication Required:** You must login as an admin and use their Bearer Token.

- **Get Admin Dashboard Stats**
  - **Method:** `GET`
  - **URL:** `http://localhost:5600/api/admin/stats`

- **Change a User's Role**
  - **Method:** `PUT`
  - **URL:** `http://localhost:5600/api/admin/users/:id/role`
  - **Body (JSON):** `{"role": "manager"}`

- **Get All Properties Worldwide**
  - **Method:** `GET`
  - **URL:** `http://localhost:5600/api/admin/hotels`

- **Cancel any Booking (Admin Override)**
  - **Method:** `PUT`
  - **URL:** `http://localhost:5600/api/admin/bookings/:id/status`
  - **Body (JSON):** `{"status": "cancelled"}`