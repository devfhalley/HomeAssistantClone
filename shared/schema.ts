import { pgTable, text, serial, integer, numeric, timestamp, doublePrecision } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// User table - Use production database structure with password field (not password_hash)
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password"), // Production uses 'password' column
});

// For inserting users
export const insertUserSchema = createInsertSchema(users, {
  password: z.string().min(6),
});

export type InsertUser = z.infer<typeof insertUserSchema>;

// Define the User interface properly
export interface User {
  id: number;
  username: string;
  password: string | null;
}

// Panel 33KVA table
export const panel33kva = pgTable("panel_33kva", {
  id: serial("id").primaryKey(),
  volt_r: text("volt_r"),
  volt_s: text("volt_s"),
  volt_t: text("volt_t"),
  arus_r: text("arus_r"),
  arus_s: text("arus_s"),
  arus_t: text("arus_t"),
  kvah: text("kvah"),
  kva_r: text("kva_r"),
  kva_s: text("kva_s"),
  kva_t: text("kva_t"),
  netkw: text("netkw"),
  netkva: text("netkva"),
  timestamp: timestamp("timestamp"),
});

export const insertPanel33kvaSchema = createInsertSchema(panel33kva).pick({
  volt_r: true,
  volt_s: true,
  volt_t: true,
  arus_r: true,
  arus_s: true,
  arus_t: true,
  kvah: true,
  kva_r: true,
  kva_s: true,
  kva_t: true,
  netkw: true,
  netkva: true,
  timestamp: true,
});

export type InsertPanel33kva = z.infer<typeof insertPanel33kvaSchema>;
export type Panel33kva = typeof panel33kva.$inferSelect;

// Panel 66KVA table
export const panel66kva = pgTable("panel_66kva", {
  id: serial("id").primaryKey(),
  volt_r: text("volt_r"),
  volt_s: text("volt_s"),
  volt_t: text("volt_t"),
  arus_r: text("arus_r"),
  arus_s: text("arus_s"),
  arus_t: text("arus_t"),
  kvah: text("kvah"),
  kva_r: text("kva_r"),
  kva_s: text("kva_s"),
  kva_t: text("kva_t"),
  netkw: text("netkw"),
  netkva: text("netkva"),
  timestamp: timestamp("timestamp"),
});

export const insertPanel66kvaSchema = createInsertSchema(panel66kva).pick({
  volt_r: true,
  volt_s: true,
  volt_t: true,
  arus_r: true,
  arus_s: true,
  arus_t: true,
  kvah: true,
  kva_r: true,
  kva_s: true,
  kva_t: true,
  netkw: true,
  netkva: true,
  timestamp: true,
});

export type InsertPanel66kva = z.infer<typeof insertPanel66kvaSchema>;
export type Panel66kva = typeof panel66kva.$inferSelect;

// Common interface for panel data (for compatibility with existing code)
export interface PhaseData {
  phase: string;
  voltage: number;
  current: number;
  power: number;
  energy: number;
  frequency: number;
  pf: number;
  time: Date;
}

// ChartData type definition for frontend (now derived from panel data)
export interface ChartData {
  id?: number;
  phase: string;
  dataType: string;
  time: string;
  value: number;
}

// TotalPowerData type definition for the power consumption chart
export interface TotalPowerData {
  time: string;
  panel33Power?: number;
  panel66Power?: number;
  totalPower: number;
}
