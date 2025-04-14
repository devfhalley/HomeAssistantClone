import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { db, pool } from "./db";
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

import { setupAuth } from "./auth";

export async function registerRoutes(app: Express): Promise<Server> {
  // Remove authentication as requested
  // Mock a user endpoint to bypass authentication completely
  app.get("/api/user", (req: Request, res: Response) => {
    // Return a fake authenticated user so frontend doesn't redirect
    res.json({
      id: 1,
      username: "admin"
    });
  });
  
  // API routes for power monitoring data
  
  // Get environment information
  app.get("/api/system-info", async (req: Request, res: Response) => {
    try {
      const isDevelopment = process.env.NODE_ENV === 'development' && process.env.FORCE_PRODUCTION !== 'true';
      const isProduction = process.env.NODE_ENV === 'production' || process.env.FORCE_PRODUCTION === 'true';
      
      // If using database, check connection
      let dbStatus = "online";
      let dbHost = process.env.PGHOST || "localhost";
      
      // Force using production database for testing
      if (isProduction || process.env.FORCE_PRODUCTION === 'true') {
        dbHost = "165.22.50.101"; // Production database host
        console.log("Using production database at", dbHost);
      }
      
      res.json({
        environment: isProduction ? "production" : "development",
        dbHost: dbHost,
        dbName: process.env.PGDATABASE || "panel_utama",
        dbStatus: dbStatus,
        timestamp: new Date().toISOString(),
        serverVersion: "1.0.0",
        dbType: "PostgreSQL"  // Add explicit database type
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
      
      // Get the SQL query used
      const sqlQuery = "SELECT * FROM panel_33kva ORDER BY timestamp DESC LIMIT 1";
      
      // Include both data and SQL queries in the response
      res.json({
        data: data,
        sqlQueries: [
          {
            name: "All Phases Data Query",
            sql: sqlQuery
          }
        ]
      });
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
        endDate,
        date  // New date parameter for single day selection
      } = req.query;
      
      // Log the incoming date parameter to debug date-related issues
      if (date) {
        console.log(`Total power chart requested with specific date: ${date}`);
      }
      
      // Convert string dates to Date objects if provided
      let startDateObj;
      let endDateObj;
      
      if (date) {
        // If the date parameter is provided, use it to create a day range
        startDateObj = new Date(date as string);
        endDateObj = new Date(date as string);
        endDateObj.setDate(endDateObj.getDate() + 1); // Next day at midnight
        console.log(`Using date from datepicker: ${startDateObj.toISOString()} to ${endDateObj.toISOString()}`);
      } else {
        // Otherwise use the existing startDate/endDate parameters
        startDateObj = startDate ? new Date(startDate as string) : undefined;
        endDateObj = endDate ? new Date(endDate as string) : undefined;
      }
      
      // Get power consumption data
      const allData = await storage.getTotalPowerConsumption(
        granularity as string,
        startDateObj,
        endDateObj
      );
      
      // Default to showing full 24 hours if no database timestamp available
      let maxHour = 23; 
      
      // Get the latest panel data timestamp to determine how much data to show
      const panel33 = await storage.getPanel33kvaData();
      if (panel33 && panel33.timestamp) {
        const timestamp = new Date(panel33.timestamp);
        
        // Extract the UTC hour from the timestamp
        const utcHour = timestamp.getUTCHours();
        
        // Use the current hour from the database timestamp
        maxHour = utcHour;
        
        console.log(`Dynamic cutoff: Using hour ${maxHour} from latest database timestamp: ${panel33.timestamp}`);
      } else {
        console.log(`No timestamp found, defaulting to full day (${maxHour} hours)`);
      }
      
      // Filter data to show only up to the current hour
      const filteredData = allData.filter(point => {
        // Extract hour from the time string (format: "HH:00")
        const hour = parseInt(point.time.split(':')[0], 10);
        return hour <= maxHour;
      });
      
      console.log(`Total power data - requested: ${allData.length}, filtered: ${filteredData.length}`);
      if (filteredData.length > 0) {
        console.log(`First data point: ${filteredData[0].time}, Last data point: ${filteredData[filteredData.length-1].time}`);
      }
      
      // Show the SQL queries used for latest readings - simple and reliable
      const panel33Query = "SELECT * FROM panel_33kva ORDER BY timestamp DESC LIMIT 1";
      const panel66Query = "SELECT * FROM panel_66kva ORDER BY timestamp DESC LIMIT 1";
      
      // Send response with filtered data and SQL queries
      res.json({
        data: filteredData,
        sqlQueries: [
          {
            name: "Panel 33KVA Latest Reading",
            sql: panel33Query
          },
          {
            name: "Panel 66KVA Latest Reading",
            sql: panel66Query
          },
          {
            name: "Data Filtered",
            sql: `-- Data filtered to show only hours 00:00 to ${maxHour}:00`
          }
        ]
      });
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
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      console.log("Fetching peak power data for date:", today);
      
      // Get current panel data for quick monitoring display
      const panel33DataQuery = await storage.getPanel33kvaData() as any;
      const panel66DataQuery = await storage.getPanel66kvaData() as any;
      
      // Log information about the SQL queries (with type assertions)
      console.log("Panel33kva Query:", panel33DataQuery?._sqlQuery || "SELECT * FROM panel_33kva ORDER BY timestamp DESC LIMIT 1");
      console.log("Panel66kva Query:", panel66DataQuery?._sqlQuery || "SELECT * FROM panel_66kva ORDER BY timestamp DESC LIMIT 1");
      
      console.log("Panel 33KVA data:", panel33DataQuery);
      console.log("Panel 66KVA data:", panel66DataQuery);
      
      // Use the timezone-aware SQL query format requested by the user
      const panel33QueryText = `
        SELECT * 
        FROM panel_33kva 
        WHERE timestamp AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Jakarta' >= date_trunc('day', CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Jakarta')
          AND timestamp AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Jakarta' <= CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Jakarta'
        ORDER BY netkw DESC
      `;
      const panel33Result = await pool.query(panel33QueryText);
      const panel33Data = panel33Result.rows;
      console.log("Panel 33KVA data count:", panel33Data.length);
      
      const panel66QueryText = `
        SELECT * 
        FROM panel_66kva 
        WHERE timestamp AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Jakarta' >= date_trunc('day', CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Jakarta')
          AND timestamp AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Jakarta' <= CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Jakarta'
        ORDER BY netkw DESC
      `;
      const panel66Result = await pool.query(panel66QueryText);
      const panel66Data = panel66Result.rows;
      console.log("Panel 66KVA data count:", panel66Data.length);
      
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
          panel33PeakTime = record.timestamp; // Use timestamp instead of created_at
        }
      });
      
      // Process panel 66kva data
      panel66Data.forEach((record: any) => {
        const currentValue = parseFloat(record.netkw || '0');
        panel66TotalUsage += currentValue; // Sum all values for total usage
        
        if (currentValue > panel66PeakValue) {
          panel66PeakValue = currentValue;
          panel66PeakTime = record.timestamp; // Use timestamp instead of created_at
        }
      });
      
      // Response with data and SQL queries
      res.json({
        data: {
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
        },
        sqlQueries: [
          {
            name: "Panel 33KVA Peak Power Query",
            sql: panel33QueryText
          },
          {
            name: "Panel 66KVA Peak Power Query",
            sql: panel66QueryText
          }
        ]
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
      // Get panel data with timestamp
      const panel33kvaData = await storage.getPanel33kvaData() as any;
      
      // Capture the SQL query used
      const sqlQuery = panel33kvaData?._sqlQuery || "No SQL query available";
      
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
            time: panel33kvaData.timestamp || new Date() // Using timestamp field
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
            time: panel33kvaData.timestamp || new Date() // Using timestamp field
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
            time: panel33kvaData.timestamp || new Date() // Using timestamp field
          };
        }
      }
      
      if (!data) {
        return res.status(404).json({ error: "Phase data not found" });
      }
      
      // Include the SQL query in the response
      res.json({
        data,
        sqlQueries: [
          {
            name: "Panel 33KVA Query",
            sql: sqlQuery
          }
        ]
      });
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
      const { date } = req.query;
      
      // Create a specific date object if date parameter is provided
      let specificDate: Date | undefined = undefined;
      if (date) {
        specificDate = new Date(date as string);
      }
      
      // Get chart data with the specific date filter
      const data = await storage.getChartDataByType(dataType, phase, specificDate);
      
      // Log the SQL query for this request
      console.log(`Chart data query for ${dataType}/${phase} executed`);
      
      // Include the SQL query in the response with the correct timezone-aware filtering
      let sqlQuery;
      if (specificDate) {
        const dateStr = specificDate.toISOString().split('T')[0]; // Get just the date part (YYYY-MM-DD)
        sqlQuery = `
          SELECT *
          FROM panel_33kva
          WHERE timestamp AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Jakarta' >= '${dateStr} 00:00:00'
            AND timestamp AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Jakarta' < '${dateStr} 00:00:00'::timestamp + interval '1 day'
          ORDER BY timestamp
        `;
      } else {
        sqlQuery = `
          SELECT *
          FROM panel_33kva
          WHERE timestamp AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Jakarta' >= date_trunc('day', CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Jakarta')
            AND timestamp AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Jakarta' <= CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Jakarta'
          ORDER BY timestamp
        `;
      }
      
      res.json({
        data: data,
        sqlQueries: [
          {
            name: `Chart Data Query (${dataType}/${phase})`,
            sql: sqlQuery
          }
        ]
      });
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
      // Using timestamp field
      const panel33kvaData: any = {
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
        timestamp: new Date() // Using timestamp field
      };
      
      const panel66kvaData: any = {
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
        timestamp: new Date() // Using timestamp field
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
