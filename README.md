# Power Monitoring - Home Assistant Clone

A Home Assistant interface clone focusing on power monitoring with data visualization capabilities.

![Home Assistant Clone Preview](attached_assets/home-assistant.png)

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Database Setup](#database-setup)
- [Running the Application](#running-the-application)
- [Adding Data](#adding-data)
- [Project Structure](#project-structure)
- [Updating and Migration](#updating-and-migration)
- [Customization](#customization)
- [Troubleshooting](#troubleshooting)

## Overview

This application provides a power monitoring dashboard similar to Home Assistant, with real-time data visualization for three-phase electrical systems. It displays metrics for voltage, current, power, energy consumption, frequency, and power factor across phases R, S, and T.

## Features

- Dashboard with power monitoring cards for phases R, S, and T
- Real-time visualization of electrical metrics
- Historical data charts for comparison across phases
- PostgreSQL database for data storage
- Mobile-responsive design
- Sidebar navigation for future expandability

## Prerequisites

- Node.js (v18.x or later)
- PostgreSQL (v14.x or later)
- npm (v9.x or later)
- Git

## Installation

### 1. Clone the repository

```bash
git clone <your-repository-url>
cd power-monitoring
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up environment variables

Create a `.env` file in the root directory with the following variables:

```
DATABASE_URL=postgresql://username:password@localhost:5432/power_monitoring
```

Replace `username`, `password`, and `power_monitoring` with your PostgreSQL credentials and desired database name.

## Database Setup

### 1. Create a PostgreSQL database

```bash
sudo -u postgres psql
```

In the PostgreSQL shell:

```sql
CREATE DATABASE power_monitoring;
CREATE USER power_user WITH ENCRYPTED PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE power_monitoring TO power_user;
\q
```

### 2. Initialize the database schema

Run the Drizzle migration to set up the database tables:

```bash
npm run db:push
```

This command will create all the necessary tables in your database based on the schema defined in `shared/schema.ts`.

### 3. Seed initial data (optional)

You can seed the database with sample data using the provided API endpoint:

```bash
curl -X POST http://localhost:5000/api/seed-data
```

Or manually insert data using the SQL commands in the `db/seed-data.sql` file (create this file separately with your SQL insert commands).

## Running the Application

```bash
npm run dev
```

The application will be available at `http://localhost:5000`

For production deployment:

```bash
npm run build
npm start
```

## Adding Data

### Option 1: Using the API

You can add new data through the API endpoints:

```bash
# Add new Phase R data
curl -X POST http://localhost:5000/api/phase-data -H "Content-Type: application/json" -d '{"phase": "R", "voltage": 220.5, "current": 10.2, "power": 2000.1, "energy": 150.5, "frequency": 50, "pf": 0.95}'

# Add new Phase S data
curl -X POST http://localhost:5000/api/phase-data -H "Content-Type: application/json" -d '{"phase": "S", "voltage": 218.7, "current": 9.8, "power": 1950.3, "energy": 148.7, "frequency": 50, "pf": 0.94}'

# Add new Phase T data
curl -X POST http://localhost:5000/api/phase-data -H "Content-Type: application/json" -d '{"phase": "T", "voltage": 221.2, "current": 10.5, "power": 2100.5, "energy": 152.3, "frequency": 50, "pf": 0.95}'
```

### Option 2: Direct Database Insert

You can insert data directly into the database tables:

```sql
INSERT INTO "phasa_R" ("voltage", "current", "power", "energy", "frequency", "pf", "time") 
VALUES (220.5, 10.2, 2000.1, 150.5, 50, 0.95, NOW());

INSERT INTO "phasa_S" ("voltage", "current", "power", "energy", "frequency", "pf", "time") 
VALUES (218.7, 9.8, 1950.3, 148.7, 50, 0.94, NOW());

INSERT INTO "phasa_T" ("voltage", "current", "power", "energy", "frequency", "pf", "time") 
VALUES (221.2, 10.5, 2100.5, 152.3, 50, 0.95, NOW());
```

## Project Structure

```
├── client/               # Frontend React application
│   ├── src/
│   │   ├── components/   # React components
│   │   ├── pages/        # Page components
│   │   ├── hooks/        # Custom React hooks
│   │   └── lib/          # Utility functions
├── server/               # Backend Express application
│   ├── storage.ts        # Database interface
│   ├── routes.ts         # API routes
│   └── db.ts             # Database connection
├── shared/               # Shared code
│   └── schema.ts         # Database schema
├── drizzle.config.ts     # Drizzle ORM configuration
└── package.json          # Project dependencies
```

## Updating and Migration

When updating the database schema:

1. Edit the schema in `shared/schema.ts`
2. Run the migration command:

```bash
npm run db:push
```

For more complex migrations, you can use Drizzle's migration tools:

```bash
# Generate a migration file
npx drizzle-kit generate:pg --schema=./shared/schema.ts

# Apply migrations
npx drizzle-kit migrate
```

## Customization

### Theme Customization

Edit the `theme.json` file in the root directory to customize the application theme:

```json
{
  "primary": "#03a9f4",
  "variant": "professional",
  "appearance": "light",
  "radius": 0.5
}
```

### Adding New Features

To add new pages or features:

1. Create new components in `client/src/components/`
2. Add new pages in `client/src/pages/`
3. Update the router in `client/src/App.tsx`
4. Add new API endpoints in `server/routes.ts` if needed

## Troubleshooting

### Database Connection Issues

- Verify that PostgreSQL is running: `sudo systemctl status postgresql`
- Check your DATABASE_URL environment variable
- Ensure your database user has the correct permissions

### Application Won't Start

- Check for port conflicts: `sudo lsof -i :5000`
- Verify all dependencies are installed: `npm install`
- Check for errors in the console output

### Data Not Showing Up

- Verify database connection is working
- Check API responses for errors
- Look for console errors in the browser developer tools