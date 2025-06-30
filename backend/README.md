
# Casual Hangout Planner - Backend

This directory contains the Node.js, Express, and MongoDB backend for the Casual Hangout Planner application.

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v16 or higher recommended)
- [MongoDB](https://www.mongodb.com/try/download/community). You can install it locally or use a cloud service like MongoDB Atlas.

### 1. Installation

Navigate into the backend directory and install the required dependencies.

```bash
cd backend
npm install
```

### 2. Environment Configuration

Create a `.env` file in the `backend` directory by copying the example file:

```bash
cp .env.example .env
```

Now, open the `.env` file and fill in your details:

```
# Your MongoDB connection string
MONGODB_URI=mongodb://localhost:27017/hangout_planner

# A strong, secret string for signing JWT tokens
JWT_SECRET=YOUR_SUPER_SECRET_KEY_HERE
```

### 3. Seed the Database (Optional, but Recommended)

To populate your database with the initial mock users from the frontend, run the seed script. This will allow you to log in with the users defined in the original `constants.ts` file.

**Important**: This will wipe the existing `users`, `hangouts`, and `connectionrequests` collections in your database.

```bash
npm run seed
```

You can now log in with users like `Alice Smith` (Phone: `555-000-0001`, Password: `password123`).

### 4. Running the Development Server

To start the backend server, run:

```bash
npm run dev
```

The server will start, typically on `http://localhost:5000`, and will automatically restart when you make changes to the code. Your frontend application, when running, will now be able to communicate with this server.
