# E-Commerce Training API

A full-stack e-commerce platform built with Node.js/Express backend and React frontend. This project demonstrates modern web development practices including authentication, payment processing, file uploads, and database management.

**Live Demo:** https://back-training-t1.vercel.app

---

## 📋 Project Overview

This is a comprehensive e-commerce training project that includes:

- **Backend API** - RESTful API built with Express.js and MongoDB
- **Frontend Application** - React-based user interface with Vite
- **Payment Integration** - Stripe payment processing
- **Authentication** - JWT-based user authentication with bcrypt encryption
- **File Management** - Image uploads with Cloudinary integration
- **Database** - MongoDB with Mongoose ORM
- **Error Handling** - Comprehensive error middleware and validation
- **Logging** - Winston-based application logging
- **Email Services** - Nodemailer integration for email notifications

---

## 🛠️ Tech Stack

### Backend
- **Framework:** Express.js 5.2.1
- **Runtime:** Node.js
- **Database:** MongoDB with Mongoose 9.7.3
- **Authentication:** JWT (jsonwebtoken), bcryptjs
- **File Upload:** Multer, Cloudinary
- **Payment:** Stripe 22.3.2
- **Validation:** Joi 18.2.3
- **Email:** Nodemailer 9.0.3
- **Logging:** Winston 3.19.0
- **HTTP Client:** Morgan (request logger)
- **Utilities:** Cookie Parser, CORS, Dotenv

### Frontend
- **Framework:** React 19.2.7
- **Build Tool:** Vite 8.1.1
- **HTTP Client:** Axios 1.18.1
- **Payment:** Stripe React SDK
- **Styling:** CSS (via Vite)

---

## 📁 Project Structure

```
Back_Training_T1/
├── backend/
│   ├── controllers/          # Request handlers and business logic
│   ├── models/              # MongoDB schema definitions
│   ├── routes/              # API route definitions
│   ├── middleware/          # Express middleware (auth, errors, etc)
│   ├── services/            # Business logic and utilities
│   ├── validation/          # Input validation schemas
│   ├── utils/               # Helper functions
│   ├── DB/                  # Database configuration
│   ├── logs/                # Application logs
│   └── server.js            # Main application entry point
├── frontend/
│   └── E-commerce_Training/
│       ├── src/
│       ├── public/
│       └── package.json
├── .config/                 # Configuration files
├── package.json             # Backend dependencies
└── vercel.json             # Vercel deployment config
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v16 or higher)
- MongoDB instance (local or cloud)
- Stripe account for payment processing
- Cloudinary account for image storage
- Git

### Backend Setup

1. **Clone the repository:**
   ```bash
   git clone https://github.com/Amr954/Back_Training_T1.git
   cd Back_Training_T1
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Create `.env` file** in the root directory:
   ```env
   # Server Configuration
   PORT=5000
   NODE_ENV=development
   
   # Database
   MONGODB_URI=your_mongodb_connection_string
   
   # Frontend URL
   FRONTEND_URL=http://localhost:5173
   
   # JWT Secrets
   JWT_SECRET=your_jwt_secret_key
   
   # Stripe
   STRIPE_SECRET_KEY=your_stripe_secret_key
   STRIPE_PUBLIC_KEY=your_stripe_public_key
   
   # Cloudinary
   CLOUDINARY_NAME=your_cloudinary_name
   CLOUDINARY_KEY=your_cloudinary_key
   CLOUDINARY_SECRET=your_cloudinary_secret
   
   # Email Service
   EMAIL_USER=your_email@gmail.com
   EMAIL_PASSWORD=your_email_app_password
   ```

4. **Run development server:**
   ```bash
   npm run dev
   ```
   The backend will start on `http://localhost:5000`

### Frontend Setup

1. **Navigate to frontend directory:**
   ```bash
   cd frontend/E-commerce_Training
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Create `.env` file:**
   ```env
   VITE_API_URL=http://localhost:5000/api
   VITE_STRIPE_PUBLIC_KEY=your_stripe_public_key
   ```

4. **Run development server:**
   ```bash
   npm run dev
   ```
   The frontend will start on `http://localhost:5173`

---

## 📚 Key Features

### 🔐 Authentication
- User registration and login
- JWT token-based authentication
- Password encryption with bcryptjs
- Secure cookie handling
- Protected routes and endpoints

### 💳 Payment Processing
- Stripe integration for payment handling
- Webhook support for payment events
- Order management with payment status
- Invoice generation

### 📸 File Management
- Image uploads via Multer
- Cloud storage integration with Cloudinary
- Multiple file format support

### ✉️ Email Notifications
- Order confirmation emails
- User welcome emails
- Password reset functionality
- Email notifications via Nodemailer

### 🗄️ Database
- MongoDB for data persistence
- Mongoose ODM for schema validation
- Efficient query management
- Data indexing for performance

### 📝 Validation
- Input validation with Joi
- Secure data handling
- Error messages and feedback

### 📊 Logging
- Request logging with Morgan
- Application logging with Winston
- Error tracking and debugging

---

## 🔌 API Endpoints

The API follows RESTful conventions. Main endpoint categories:

- `/api/auth/` - Authentication endpoints (register, login, logout)
- `/api/products/` - Product management
- `/api/orders/` - Order management
- `/api/users/` - User management
- `/api/stripe/` - Stripe webhook endpoints
- `/api/cart/` - Shopping cart operations

---

## 🚢 Deployment

This project is configured for deployment on **Vercel**. 

### Deploy to Vercel:
1. Connect your GitHub repository to Vercel
2. Set environment variables in Vercel dashboard
3. Push to main branch to trigger automatic deployment

The `vercel.json` file contains deployment configuration.

---

## 📦 Scripts

### Backend
```bash
npm run dev          # Start development server with nodemon
npm start            # Start production server
```

### Frontend
```bash
npm run dev          # Start Vite development server
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Run ESLint
```

---

## 🐛 Error Handling

The application includes comprehensive error handling:
- Custom error middleware
- Validation error messages
- Database error handling
- API error responses with appropriate status codes
- Detailed logging of errors

---

## 🔒 Security Features

- CORS configuration for cross-origin requests
- Password hashing with bcryptjs
- JWT token validation
- Input validation and sanitization
- Secure cookie handling
- Environment variable protection
- Stripe webhook verification

---

## 📖 Learning Outcomes

This project covers:
- RESTful API design and implementation
- Express.js middleware development
- MongoDB and Mongoose usage
- React component architecture
- Authentication and authorization
- Payment gateway integration
- File upload and cloud storage
- Error handling and logging
- Deployment and DevOps basics

---

## 👤 Author

**Amr954**
- GitHub: [@Amr954](https://github.com/Amr954)

---

**Last Updated:** July 2026
