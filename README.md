# Capstone Backend – MSPixelPulse API

This repository contains the **backend API** for the Capstone project **MSPixelPulse**. It provides all authentication, user management, and project management features used by the frontend.

---

## Overview
The backend is built using **Node.js with Express** and connected to **MongoDB Atlas**. It is deployed on **Render** and provides secure, role-based APIs for clients, developers, and admins.

- **Authentication**
  - Register (default status: pending until approved by admin)
  - Login and logout
  - JWT-based sessions

- **Admin Tools**
  - Approve or reject new user registrations
  - Manage users (update, delete, change role/status)

- **Projects**
  - Create, read, update, and delete projects
  - Assign clients and developers
  - Track project status (draft, active, completed)

- **Email Support**
  - Configured with Gmail SMTP (via App Passwords) to send messages

---

## Tech Stack
- **Node.js + Express**
- **MongoDB Atlas with Mongoose**
- **JWT authentication**
- **Nodemailer (SMTP via Gmail)**
- **Render** for deployment

---

## Getting Started

### 1. Clone the repository
```bash
git clone https://github.com/Oyemahak/Capstone-Backend.git
cd Capstone-Backend
```
### 2. Install dependencies
```bash
npm install
```
### 3. Configure environment variables
Create a .env file in the root with:
```bash
PORT=4000
NODE_ENV=development

# MongoDB Atlas connection
MONGO_URI=**************

# CORS – allow frontend URLs
CORS_ORIGIN=http://localhost:5173,https://mspixelplus.vercel.app

# JWT
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=7d
COOKIE_SECURE=false

# Seed Admin account
SEED_ADMIN_NAME=Admin User
SEED_ADMIN_EMAIL=admin@mspixel.plus
SEED_ADMIN_PASSWORD=Admin@12345

# Gmail SMTP for emails
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=mahakpateluiux@gmail.com
SMTP_PASS=*********
SMTP_FROM="MSPixelPulse <mahakpateluiux@gmail.com>"

# File uploads
UPLOAD_DIR=uploads
```
### 4. Run locally
```bash
npm run dev
```
Runs the backend at http://localhost:4000.

---

## Deployment
The backend is deployed on Render:
- https://capstone-backend-o3o2.onrender.com/api

---

## Author
Developed & Designed by Mahak Patel (@Oyemahak)