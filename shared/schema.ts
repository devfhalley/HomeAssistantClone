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

// Phase data table
export const phaseData = pgTable("phase_data", {
  id: serial("id").primaryKey(),
  phase: text("phase").notNull(), // "R", "S", or "T"
  voltage: doublePrecision("voltage").notNull(),
  current: doublePrecision("current").notNull(),
  power: doublePrecision("power").notNull(),
  energy: doublePrecision("energy").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertPhaseDataSchema = createInsertSchema(phaseData).pick({
  phase: true,
  voltage: true,
  current: true,
  power: true,
  energy: true,
});

export type InsertPhaseData = z.infer<typeof insertPhaseDataSchema>;
export type PhaseData = typeof phaseData.$inferSelect;

// Chart data for historical readings
export const chartData = pgTable("chart_data", {
  id: serial("id").primaryKey(),
  phase: text("phase").notNull(), // "R", "S", or "T"
  dataType: text("data_type").notNull(), // "voltage", "current", "power"
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

// Relations definition
export const phaseDataRelations = relations(phaseData, ({ many }) => ({
  chartData: many(chartData),
}));

export const chartDataRelations = relations(chartData, ({ one }) => ({
  phaseData: one(phaseData, {
    fields: [chartData.phase],
    references: [phaseData.phase],
  }),
}));
