import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { db } from "./db";
import { 
  insertPanel33kvaSchema,
  insertPanel66kvaSchema,
  type InsertPanel33kva,
  type InsertPanel66kva,
  type PhaseData,
  type ChartData,
  panel33kva,
  panel66kva
} from "@shared/schema";
import { z } from "zod";
import { gte, desc } from "drizzle-orm";

export async function registerRoutes(app: Express): Promise<Server> {
  // API routes for power monitoring data
  
  // Get environment information
  app.get("/api/system-info", async (req: Request, res: Response) => {
    try {
      const isDevelopment = process.env.NODE_ENV === 'development';
      const isProduction = process.env.NODE_ENV === 'production' || process.env.FORCE_PRODUCTION === 'true';
      
      // If using database, check connection
      let dbStatus = "online";
      let dbHost = process.env.PGHOST || "localhost";
      
      if (isProduction) {
        dbHost = "165.22.50.101"; // Production database host
      }
      
      res.json({
        environment: isProduction ? "production" : "development",
        dbHost: dbHost,
        dbName: process.env.PGDATABASE || "panel_utama",
        dbStatus: dbStatus,
        timestamp: new Date().toISOString(),
        serverVersion: "1.0.0"
      });
    } catch (error) {
      console.error("Error fetching system info:", error);
      res.status(500).json({ error: "Failed to fetch system information" });
    }
  });
  
  // Get all phase data
  app.get("/api/phase-data", async (req: Request, res: Response) => {
    try {
      const data = await storage.getAllPhaseData();
      res.json(data);
    } catch (error) {
      console.error("Error fetching phase data:", error);
      res.status(500).json({ error: "Failed to fetch phase data" });
    }
  });
  
  // Get total power consumption (combined from all phases)
  app.get("/api/total-power", async (req: Request, res: Response) => {
    try {
      const { 
        granularity = 'hour', 
        startDate, 
        endDate 
      } = req.query;
      
      // Convert string dates to Date objects if provided
      const startDateObj = startDate ? new Date(startDate as string) : undefined;
      const endDateObj = endDate ? new Date(endDate as string) : undefined;
      
      const data = await storage.getTotalPowerConsumption(
        granularity as string,
        startDateObj,
        endDateObj
      );
      
      res.json(data);
    } catch (error) {
      console.error("Error fetching total power data:", error);
      res.status(500).json({ error: "Failed to fetch total power data" });
    }
  });
  
  // Get peak power data for today
  app.get("/api/peak-power", async (req: Request, res: Response) => {
    try {
      // Get the current date at midnight
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      // Get panel data
      const panel33Data = await db
        .select()
        .from(panel33kva)
        .where(gte(panel33kva.timestamp, today))
        .orderBy(panel33kva.timestamp);
      
      const panel66Data = await db
        .select()
        .from(panel66kva)
        .where(gte(panel66kva.timestamp, today))
        .orderBy(panel66kva.timestamp);
      
      // Find peak values with timestamp
      let panel33PeakValue = 0;
      let panel33PeakTime = null;
      let panel33TotalUsage = 0;
      
      let panel66PeakValue = 0;
      let panel66PeakTime = null;
      let panel66TotalUsage = 0;
      
      // Process panel 33kva data
      panel33Data.forEach((record: any) => {
        const currentValue = parseFloat(record.netkw || '0');
        panel33TotalUsage += currentValue; // Sum all values for total usage
        
        if (currentValue > panel33PeakValue) {
          panel33PeakValue = currentValue;
          panel33PeakTime = record.timestamp;
        }
      });
      
      // Process panel 66kva data
      panel66Data.forEach((record: any) => {
        const currentValue = parseFloat(record.netkw || '0');
        panel66TotalUsage += currentValue; // Sum all values for total usage
        
        if (currentValue > panel66PeakValue) {
          panel66PeakValue = currentValue;
          panel66PeakTime = record.timestamp;
        }
      });
      
      res.json({
        panel33: {
          peak: panel33PeakValue,
          peakTime: panel33PeakTime,
          totalUsage: panel33TotalUsage
        },
        panel66: {
          peak: panel66PeakValue,
          peakTime: panel66PeakTime,
          totalUsage: panel66TotalUsage
        },
        totalPeak: panel33PeakValue + panel66PeakValue,
        totalUsage: panel33TotalUsage + panel66TotalUsage
      });
    } catch (error) {
      console.error("Error fetching peak power data:", error);
      res.status(500).json({ error: "Failed to fetch peak power data" });
    }
  });
  
  // Get specific phase data
  app.get("/api/phase-data/:phase", async (req: Request, res: Response) => {
    try {
      const { phase } = req.params;
      let data: PhaseData | null = null;
      
      // Get panel 33kva data
      const panel33kvaData = await storage.getPanel33kvaData();
      
      if (panel33kvaData) {
        if (phase === 'R') {
          data = {
            phase: 'R',
            voltage: parseFloat(panel33kvaData.volt_r || '0'),
            current: parseFloat(panel33kvaData.arus_r || '0'),
            power: parseFloat(panel33kvaData.kva_r || '0') * 1000, // kVA to VA
            energy: parseFloat(panel33kvaData.kvah || '0'),
            frequency: 50, // Default frequency
            pf: 0.9, // Default power factor
            time: panel33kvaData.timestamp || new Date()
          };
        } else if (phase === 'S') {
          data = {
            phase: 'S',
            voltage: parseFloat(panel33kvaData.volt_s || '0'),
            current: parseFloat(panel33kvaData.arus_s || '0'),
            power: parseFloat(panel33kvaData.kva_s || '0') * 1000, // kVA to VA
            energy: parseFloat(panel33kvaData.kvah || '0'),
            frequency: 50, // Default frequency
            pf: 0.9, // Default power factor
            time: panel33kvaData.timestamp || new Date()
          };
        } else if (phase === 'T') {
          data = {
            phase: 'T',
            voltage: parseFloat(panel33kvaData.volt_t || '0'),
            current: parseFloat(panel33kvaData.arus_t || '0'),
            power: parseFloat(panel33kvaData.kva_t || '0') * 1000, // kVA to VA
            energy: parseFloat(panel33kvaData.kvah || '0'),
            frequency: 50, // Default frequency
            pf: 0.9, // Default power factor
            time: panel33kvaData.timestamp || new Date()
          };
        }
      }
      
      if (!data) {
        return res.status(404).json({ error: "Phase data not found" });
      }
      
      res.json(data);
    } catch (error) {
      console.error(`Error fetching phase data for ${req.params.phase}:`, error);
      res.status(500).json({ error: "Failed to fetch phase data" });
    }
  });
  
  // Create panel data
  app.post("/api/panel-data", async (req: Request, res: Response) => {
    try {
      const { panel } = req.body;
      
      if (!panel) {
        return res.status(400).json({ error: "Panel identifier is required" });
      }
      
      if (panel === '33kva') {
        const validationResult = insertPanel33kvaSchema.safeParse(req.body);
        
        if (!validationResult.success) {
          return res.status(400).json({ 
            error: "Invalid panel 33KVA data", 
            details: validationResult.error 
          });
        }
        
        const data = await storage.createPanel33kvaData(validationResult.data);
        return res.status(201).json(data);
      } 
      else if (panel === '66kva') {
        const validationResult = insertPanel66kvaSchema.safeParse(req.body);
        
        if (!validationResult.success) {
          return res.status(400).json({ 
            error: "Invalid panel 66KVA data", 
            details: validationResult.error 
          });
        }
        
        const data = await storage.createPanel66kvaData(validationResult.data);
        return res.status(201).json(data);
      }
      
      return res.status(400).json({ error: "Invalid panel identifier" });
    } catch (error) {
      console.error("Error creating panel data:", error);
      res.status(500).json({ error: "Failed to create panel data" });
    }
  });
  
  // Get chart data by type and phase
  app.get("/api/chart-data/:dataType/:phase", async (req: Request, res: Response) => {
    try {
      const { dataType, phase } = req.params;
      const data = await storage.getChartDataByType(dataType, phase);
      res.json(data);
    } catch (error) {
      console.error(`Error fetching ${req.params.dataType} data for phase ${req.params.phase}:`, error);
      res.status(500).json({ error: "Failed to fetch chart data" });
    }
  });
  
  // Chart data is now derived from panel data
  // POST endpoints for chart data have been removed since we're using panel data directly

  // Seed initial data if database is empty
  app.post("/api/seed-data", async (req: Request, res: Response) => {
    try {
      // Check if we already have phase data
      const existingData = await storage.getAllPhaseData();
      
      if (existingData.length > 0) {
        return res.status(400).json({ 
          error: "Database already contains data", 
          message: "Cannot seed data into a non-empty database"
        });
      }
      
      // Seed panel data
      const panel33kvaData: InsertPanel33kva = {
        volt_r: "218.6",
        volt_s: "228.2",
        volt_t: "220.2",
        arus_r: "18.5",
        arus_s: "19.2",
        arus_t: "27.8",
        kvah: "214.9",
        kva_r: "4.01",
        kva_s: "3.80",
        kva_t: "5.86",
        netkw: "12.25",
        netkva: "13.67",
        timestamp: new Date()
      };
      
      const panel66kvaData: InsertPanel66kva = {
        volt_r: "225.3",
        volt_s: "231.5",
        volt_t: "227.8",
        arus_r: "42.3",
        arus_s: "38.7",
        arus_t: "45.1",
        kvah: "325.6",
        kva_r: "9.53",
        kva_s: "8.96",
        kva_t: "10.27",
        netkw: "25.85",
        netkva: "28.76",
        timestamp: new Date()
      };
      
      await storage.createPanel33kvaData(panel33kvaData);
      await storage.createPanel66kvaData(panel66kvaData);
      
          // Now using direct panel data for charts
      // Additional panel data can be added for time-series if needed
      
      res.status(201).json({ success: true, message: "Data seeded successfully" });
    } catch (error) {
      console.error("Error seeding data:", error);
      res.status(500).json({ error: "Failed to seed data" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
