-- Initial database migration for Power Monitoring application
-- This file creates the necessary tables and constraints

-- Create users table
CREATE TABLE IF NOT EXISTS "users" (
  "id" SERIAL PRIMARY KEY,
  "username" TEXT NOT NULL UNIQUE,
  "password" TEXT NOT NULL,
  "name" TEXT,
  "email" TEXT,
  "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create Phase R table
CREATE TABLE IF NOT EXISTS "phasa_R" (
  "No" SERIAL PRIMARY KEY,
  "voltage" DOUBLE PRECISION NOT NULL,
  "current" DOUBLE PRECISION NOT NULL,
  "power" DOUBLE PRECISION NOT NULL,
  "energy" DOUBLE PRECISION NOT NULL,
  "frequency" INTEGER NOT NULL,
  "pf" DOUBLE PRECISION NOT NULL,
  "time" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create Phase S table
CREATE TABLE IF NOT EXISTS "phasa_S" (
  "No" SERIAL PRIMARY KEY,
  "voltage" DOUBLE PRECISION NOT NULL,
  "current" DOUBLE PRECISION NOT NULL,
  "power" DOUBLE PRECISION NOT NULL,
  "energy" DOUBLE PRECISION NOT NULL,
  "frequency" INTEGER NOT NULL,
  "pf" DOUBLE PRECISION NOT NULL,
  "time" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create Phase T table
CREATE TABLE IF NOT EXISTS "phasa_T" (
  "No" SERIAL PRIMARY KEY,
  "voltage" DOUBLE PRECISION NOT NULL,
  "current" DOUBLE PRECISION NOT NULL,
  "power" DOUBLE PRECISION NOT NULL,
  "energy" DOUBLE PRECISION NOT NULL,
  "frequency" INTEGER NOT NULL,
  "pf" DOUBLE PRECISION NOT NULL,
  "time" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create chart data table
CREATE TABLE IF NOT EXISTS "chart_data" (
  "id" SERIAL PRIMARY KEY,
  "phase" TEXT NOT NULL,
  "data_type" TEXT NOT NULL,
  "time" TEXT NOT NULL,
  "value" DOUBLE PRECISION NOT NULL,
  "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS "phasa_R_time_idx" ON "phasa_R" ("time");
CREATE INDEX IF NOT EXISTS "phasa_S_time_idx" ON "phasa_S" ("time");
CREATE INDEX IF NOT EXISTS "phasa_T_time_idx" ON "phasa_T" ("time");
CREATE INDEX IF NOT EXISTS "chart_data_phase_data_type_idx" ON "chart_data" ("phase", "data_type");