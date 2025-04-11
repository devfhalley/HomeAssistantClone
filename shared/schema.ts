import { pgTable, text, serial, integer, numeric, timestamp, doublePrecision, boolean } from "drizzle-orm/pg-core";
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

// Panels table for organizing monitoring data
export const panels = pgTable("panels", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  description: text("description"),
  location: text("location"),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertPanelSchema = createInsertSchema(panels).pick({
  name: true,
  description: true,
  location: true,
  isActive: true,
});

export type InsertPanel = z.infer<typeof insertPanelSchema>;
export type Panel = typeof panels.$inferSelect;

// Phase R table (based on provided schema)
export const phaseR = pgTable("phasa_R", {
  No: serial("No").primaryKey(),
  panelId: integer("panel_id").references(() => panels.id),
  voltage: doublePrecision("voltage").notNull(),
  current: doublePrecision("current").notNull(),
  power: doublePrecision("power").notNull(),
  energy: doublePrecision("energy").notNull(),
  frequency: integer("frequency").notNull(),
  pf: doublePrecision("pf").notNull(),
  time: timestamp("time").defaultNow().notNull(),
});

export const insertPhaseRSchema = createInsertSchema(phaseR).pick({
  voltage: true,
  current: true,
  power: true,
  energy: true,
  frequency: true,
  pf: true,
});

export type InsertPhaseR = z.infer<typeof insertPhaseRSchema>;
export type PhaseR = typeof phaseR.$inferSelect;

// Phase S table
export const phaseS = pgTable("phasa_S", {
  No: serial("No").primaryKey(),
  panelId: integer("panel_id").references(() => panels.id),
  voltage: doublePrecision("voltage").notNull(),
  current: doublePrecision("current").notNull(),
  power: doublePrecision("power").notNull(),
  energy: doublePrecision("energy").notNull(),
  frequency: integer("frequency").notNull(),
  pf: doublePrecision("pf").notNull(),
  time: timestamp("time").defaultNow().notNull(),
});

export const insertPhaseSSchema = createInsertSchema(phaseS).pick({
  voltage: true,
  current: true,
  power: true,
  energy: true,
  frequency: true,
  pf: true,
});

export type InsertPhaseS = z.infer<typeof insertPhaseSSchema>;
export type PhaseS = typeof phaseS.$inferSelect;

// Phase T table
export const phaseT = pgTable("phasa_T", {
  No: serial("No").primaryKey(),
  panelId: integer("panel_id").references(() => panels.id),
  voltage: doublePrecision("voltage").notNull(),
  current: doublePrecision("current").notNull(),
  power: doublePrecision("power").notNull(),
  energy: doublePrecision("energy").notNull(),
  frequency: integer("frequency").notNull(),
  pf: doublePrecision("pf").notNull(),
  time: timestamp("time").defaultNow().notNull(),
});

export const insertPhaseTSchema = createInsertSchema(phaseT).pick({
  voltage: true,
  current: true,
  power: true,
  energy: true,
  frequency: true,
  pf: true,
});

export type InsertPhaseT = z.infer<typeof insertPhaseTSchema>;
export type PhaseT = typeof phaseT.$inferSelect;

// Common interface for all phase data
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
  panelId: integer("panel_id").references(() => panels.id),
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
