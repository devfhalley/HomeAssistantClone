import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  insertPanel33kvaSchema,
  insertPanel66kvaSchema,
  insertChartDataSchema,
  type InsertPanel33kva,
  type InsertPanel66kva,
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
