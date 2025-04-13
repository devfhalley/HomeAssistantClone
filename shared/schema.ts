import { pgTable, text, serial, integer, numeric, timestamp, doublePrecision } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// User table
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

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

// Chart data for historical readings
export const chartData = pgTable("chart_data", {
  id: serial("id").primaryKey(),
  phase: text("phase").notNull(), // "R", "S", or "T"
  dataType: text("data_type").notNull(), // "voltage", "current", "power", "energy", "frequency", "pf"
  time: text("time").notNull(),
  value: doublePrecision("value").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertChartDataSchema = createInsertSchema(chartData).pick({
  phase: true,
  dataType: true,
  time: true,
  value: true,
});

export type InsertChartData = z.infer<typeof insertChartDataSchema>;
export type ChartData = typeof chartData.$inferSelect;
