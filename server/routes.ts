import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  insertPhaseRSchema,
  insertPhaseSSchema,
  insertPhaseTSchema, 
  insertChartDataSchema,
  type InsertPhaseR,
  type InsertPhaseS,
  type InsertPhaseT,
  type InsertChartData,
  type PhaseData
} from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // API routes for power monitoring data
  
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
  
  // Get specific phase data
  app.get("/api/phase-data/:phase", async (req: Request, res: Response) => {
    try {
      const { phase } = req.params;
      let data: PhaseData | null = null;
      
      if (phase === 'R') {
        const phaseData = await storage.getPhaseR();
        if (phaseData) {
          data = {
            phase: 'R',
            voltage: phaseData.voltage,
            current: phaseData.current,
            power: phaseData.power,
            energy: phaseData.energy,
            frequency: phaseData.frequency,
            pf: phaseData.pf,
            time: phaseData.time
          };
        }
      } else if (phase === 'S') {
        const phaseData = await storage.getPhaseS();
        if (phaseData) {
          data = {
            phase: 'S',
            voltage: phaseData.voltage,
            current: phaseData.current,
            power: phaseData.power,
            energy: phaseData.energy,
            frequency: phaseData.frequency,
            pf: phaseData.pf,
            time: phaseData.time
          };
        }
      } else if (phase === 'T') {
        const phaseData = await storage.getPhaseT();
        if (phaseData) {
          data = {
            phase: 'T',
            voltage: phaseData.voltage,
            current: phaseData.current,
            power: phaseData.power,
            energy: phaseData.energy,
            frequency: phaseData.frequency,
            pf: phaseData.pf,
            time: phaseData.time
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
  
  // Create phase data (with different schemas for each phase)
  app.post("/api/phase-data", async (req: Request, res: Response) => {
    try {
      const { phase } = req.body;
      
      if (!phase) {
        return res.status(400).json({ error: "Phase identifier is required" });
      }
      
      if (phase === 'R') {
        const validationResult = insertPhaseRSchema.safeParse(req.body);
        
        if (!validationResult.success) {
          return res.status(400).json({ 
            error: "Invalid phase R data", 
            details: validationResult.error 
          });
        }
        
        const data = await storage.createPhaseR(validationResult.data);
        return res.status(201).json(data);
      } 
      else if (phase === 'S') {
        const validationResult = insertPhaseSSchema.safeParse(req.body);
        
        if (!validationResult.success) {
          return res.status(400).json({ 
            error: "Invalid phase S data", 
            details: validationResult.error 
          });
        }
        
        const data = await storage.createPhaseS(validationResult.data);
        return res.status(201).json(data);
      }
      else if (phase === 'T') {
        const validationResult = insertPhaseTSchema.safeParse(req.body);
        
        if (!validationResult.success) {
          return res.status(400).json({ 
            error: "Invalid phase T data", 
            details: validationResult.error 
          });
        }
        
        const data = await storage.createPhaseT(validationResult.data);
        return res.status(201).json(data);
      }
      
      return res.status(400).json({ error: "Invalid phase identifier" });
    } catch (error) {
      console.error("Error creating phase data:", error);
      res.status(500).json({ error: "Failed to create phase data" });
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
  
  // Create chart data
  app.post("/api/chart-data", async (req: Request, res: Response) => {
    try {
      const validationResult = insertChartDataSchema.safeParse(req.body);
      
      if (!validationResult.success) {
        return res.status(400).json({ 
          error: "Invalid chart data", 
          details: validationResult.error 
        });
      }
      
      const data = await storage.createChartData(validationResult.data);
      res.status(201).json(data);
    } catch (error) {
      console.error("Error creating chart data:", error);
      res.status(500).json({ error: "Failed to create chart data" });
    }
  });
  
  // Create multiple chart data entries (bulk insert)
  app.post("/api/chart-data/bulk", async (req: Request, res: Response) => {
    try {
      // Validate array of chart data
      const arraySchema = z.array(insertChartDataSchema);
      const validationResult = arraySchema.safeParse(req.body);
      
      if (!validationResult.success) {
        return res.status(400).json({ 
          error: "Invalid chart data array", 
          details: validationResult.error 
        });
      }
      
      await storage.createMultipleChartData(validationResult.data);
      res.status(201).json({ success: true, message: "Chart data created successfully" });
    } catch (error) {
      console.error("Error creating bulk chart data:", error);
      res.status(500).json({ error: "Failed to create bulk chart data" });
    }
  });

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
      
      // Seed phase data for R, S, and T
      const phaseDataR: InsertPhaseR = {
        voltage: 218.6,
        current: 18.547,
        power: 4009.8,
        energy: 214945,
        frequency: 50,
        pf: 0.95
      };
      
      const phaseDataS: InsertPhaseS = {
        voltage: 228.2,
        current: 19.181,
        power: 3802.7,
        energy: 215652,
        frequency: 50,
        pf: 0.92
      };
      
      const phaseDataT: InsertPhaseT = {
        voltage: 220.2,
        current: 27.785,
        power: 5860.7,
        energy: 294149,
        frequency: 50,
        pf: 0.97
      };
      
      await storage.createPhaseR(phaseDataR);
      await storage.createPhaseS(phaseDataS);
      await storage.createPhaseT(phaseDataT);
      
      // Generate time labels for chart data
      const timeLabels = Array.from({ length: 24 }, (_, i) => {
        const hour = i % 12 === 0 ? 12 : i % 12;
        const ampm = i < 12 ? 'AM' : 'PM';
        return `${hour}:00`;
      });
      
      // Generate and seed chart data
      // Voltage data
      const voltageDataR: InsertChartData[] = timeLabels.map((time, i) => {
        const x = i / (timeLabels.length - 1);
        const wave = Math.sin(x * Math.PI * 2) * 5;
        const trend = 190 + 20 + wave + Math.random() * 5;
        return {
          phase: "R",
          dataType: "voltage",
          time,
          value: parseFloat(trend.toFixed(1))
        };
      });
      
      const voltageDataS: InsertChartData[] = timeLabels.map((time, i) => {
        const x = i / (timeLabels.length - 1);
        const wave = Math.sin(x * Math.PI * 2) * 5;
        const trend = 200 + 20 + wave + Math.random() * 5;
        return {
          phase: "S",
          dataType: "voltage",
          time,
          value: parseFloat(trend.toFixed(1))
        };
      });
      
      const voltageDataT: InsertChartData[] = timeLabels.map((time, i) => {
        const x = i / (timeLabels.length - 1);
        const wave = Math.sin(x * Math.PI * 2) * 5;
        const trend = 195 + 20 + wave + Math.random() * 5;
        return {
          phase: "T",
          dataType: "voltage",
          time,
          value: parseFloat(trend.toFixed(1))
        };
      });
      
      // Current data with daily pattern
      const generateCurrentData = (phase: string): InsertChartData[] => {
        return timeLabels.map((time, i) => {
          let hour = i;
          let baseValue;
          
          if (hour < 6) { // Night (low usage)
            baseValue = 20 + Math.random() * 10;
          } else if (hour < 12) { // Morning (rising)
            baseValue = 30 + (hour - 6) * 10 + Math.random() * 15;
          } else if (hour < 18) { // Afternoon (high)
            baseValue = 80 + Math.random() * 20;
          } else { // Evening (decreasing)
            baseValue = 60 - (hour - 18) * 8 + Math.random() * 15;
          }
          
          return {
            phase,
            dataType: "current",
            time,
            value: parseFloat(baseValue.toFixed(1))
          };
        });
      };
      
      // Power data with daily pattern
      const generatePowerData = (phase: string): InsertChartData[] => {
        return timeLabels.map((time, i) => {
          let hour = i;
          let baseValue;
          
          if (hour < 6) { // Night (low usage)
            baseValue = 2000 + Math.random() * 1000;
          } else if (hour < 12) { // Morning (rising)
            baseValue = 3000 + (hour - 6) * 1500 + Math.random() * 1500;
          } else if (hour < 18) { // Afternoon (high)
            baseValue = 15000 + Math.random() * 5000;
          } else { // Evening (decreasing)
            baseValue = 10000 - (hour - 18) * 1500 + Math.random() * 2000;
          }
          
          return {
            phase,
            dataType: "power",
            time,
            value: parseFloat(baseValue.toFixed(1))
          };
        });
      };
      
      // Generate frequency data
      const generateFrequencyData = (phase: string): InsertChartData[] => {
        return timeLabels.map((time, i) => {
          // Small variations around 50Hz
          const value = 50 + (Math.random() * 0.5 - 0.25);
          return {
            phase,
            dataType: "frequency",
            time,
            value: parseFloat(value.toFixed(2))
          };
        });
      };
      
      // Generate power factor data
      const generatePFData = (phase: string): InsertChartData[] => {
        return timeLabels.map((time, i) => {
          // Values between 0.85 and 0.98
          const value = 0.85 + (Math.random() * 0.13);
          return {
            phase,
            dataType: "pf",
            time,
            value: parseFloat(value.toFixed(2))
          };
        });
      };
      
      const currentDataR = generateCurrentData("R");
      const currentDataS = generateCurrentData("S");
      const currentDataT = generateCurrentData("T");
      
      const powerDataR = generatePowerData("R");
      const powerDataS = generatePowerData("S");
      const powerDataT = generatePowerData("T");
      
      const frequencyDataR = generateFrequencyData("R");
      const frequencyDataS = generateFrequencyData("S");
      const frequencyDataT = generateFrequencyData("T");
      
      const pfDataR = generatePFData("R");
      const pfDataS = generatePFData("S");
      const pfDataT = generatePFData("T");
      
      // Save all chart data to database
      await storage.createMultipleChartData([
        ...voltageDataR, ...voltageDataS, ...voltageDataT,
        ...currentDataR, ...currentDataS, ...currentDataT,
        ...powerDataR, ...powerDataS, ...powerDataT,
        ...frequencyDataR, ...frequencyDataS, ...frequencyDataT,
        ...pfDataR, ...pfDataS, ...pfDataT
      ]);
      
      res.status(201).json({ success: true, message: "Data seeded successfully" });
    } catch (error) {
      console.error("Error seeding data:", error);
      res.status(500).json({ error: "Failed to seed data" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
