# Sequelize MySQL Project

This project sets up a Sequelize ORM with MySQL database for managing user data.

## Prerequisites

- Node.js installed
- MySQL server running on localhost
- Database named "pprince" created in MySQL

## Setup Instructions

1. **Clone or navigate to the project directory**

2. **Install dependencies**

   ```
   npm install
   ```

3. **Configure environment variables**

   - Update the `.env` file with your MySQL credentials if different from defaults

4. **Run database migrations**

   ```
   npm run migrate
   ```

5. **Start the server**

   ```
   npm start
   ```

   The server will run on http://localhost:3000

   API documentation available at http://localhost:3000/api-docs

## Available Commands

- **Install dependencies**: `npm install`
- **Run migrations**: `npm run migrate`
- **Undo last migration**: `npm run migrate:undo`
- **Start the application**: `npm start`
- **Start development server (with auto-restart)**: `npm run dev`

## Database Configuration

The database configuration is set in `config/config.json` and uses environment variables from `.env`.

Default settings:

- Host: 127.0.0.1
- User: root
- Password: (empty)
- Database: pprince
- Dialect: mysql

## User Model Schema

The User model includes the following fields:

- `firstName` (STRING, required)
- `lastName` (STRING, required)
- `email` (STRING, required, unique)
- `password` (STRING, required)
- `emailVerify` (TINYINT, default 0)
- `twoFaSecret` (STRING, default null)
- `twoFaStatus` (TINYINT, default 0)
- `isDelete` (TINYINT, default 0)
- `otp` (STRING, default null)
- `createdAt` (DATE, auto-generated)
- `updatedAt` (DATE, auto-generated)

## API Endpoints

The following endpoints are available for user management:

- `GET /users` - Get all users
- `POST /users/login` - Login user with email and password (handles 2FA if enabled)
- `POST /users/register` - Register a new user (with password hashing)
- `POST /users` - Create a new user (without password hashing)
- `GET /users/:id` - Get user by ID
- `PUT /users/:id` - Update user by ID
- `DELETE /users/:id` - Delete user by ID
- `POST /users/twofa/enable` - Enable 2FA for a user (returns QR code)
- `POST /users/twofa/verify` - Verify 2FA code and enable 2FA

## Project Structure

- `config/config.json` - Database configuration
- `controllers/userController.js` - Business logic for user operations
- `db.js` - Sequelize database instance
- `models/user.js` - User model definition
- `routes/userRoutes.js` - User API routes
- `migrations/` - Database migration files
- `index.js` - Main application entry point
- `.env` - Environment variables
- `.gitignore` - Git ignore rules
