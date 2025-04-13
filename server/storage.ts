import { 
  users, type User, type InsertUser,
  panel33kva, type Panel33kva, type InsertPanel33kva,
  panel66kva, type Panel66kva, type InsertPanel66kva,
  type ChartData
} from "@shared/schema";
import { db, pool } from "./db";
import { eq, and, desc, gte, lte } from "drizzle-orm";

// Combined type for phase data response
interface PhaseData {
  phase: string;
  voltage: number;
  current: number;
  power: number;
  energy: number;
  frequency: number;
  pf: number;
  time: Date;
}

// Interface for total power consumption data point
interface TotalPowerData {
  time: string;
  totalPower: number;
}

import session from "express-session";

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Panel data methods 
  getPanel33kvaData(): Promise<Panel33kva | undefined>;
  getPanel66kvaData(): Promise<Panel66kva | undefined>;
  getAllPhaseData(): Promise<PhaseData[]>;
  createPanel33kvaData(data: InsertPanel33kva): Promise<Panel33kva>;
  createPanel66kvaData(data: InsertPanel66kva): Promise<Panel66kva>;
  
  // Chart data methods (now using panel data)
  getChartDataByType(dataType: string, phase: string): Promise<ChartData[]>;
  
  // Total power consumption methods
  getTotalPowerConsumption(granularity: string, startDate?: Date, endDate?: Date): Promise<TotalPowerData[]>;
}

export class DatabaseStorage implements IStorage {
  // User methods
  async getUser(id: number): Promise<User | undefined> {
    try {
      const result = await pool.query(
        "SELECT * FROM users WHERE id = $1",
        [id]
      );
      
      if (result.rows.length === 0) return undefined;
      
      // For debugging purposes
      console.log("User data structure:", Object.keys(result.rows[0]));
      
      return {
        id: result.rows[0].id,
        username: result.rows[0].username,
        password: result.rows[0].password_hash // The actual column is password_hash in the DB
      };
    } catch (error) {
      console.error("Error in getUser:", error);
      return undefined;
    }
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    try {
      // Try an approach without explicitly naming the columns
      const result = await pool.query(
        "SELECT * FROM users WHERE username = $1",
        [username]
      );
      
      if (result.rows.length === 0) return undefined;
      
      // Log the structure of the returned row to debug
      console.log("User row structure:", Object.keys(result.rows[0]));
      
      return {
        id: result.rows[0].id,
        username: result.rows[0].username,
        password: result.rows[0].password_hash // The actual column is password_hash in the DB
      };
    } catch (error) {
      console.error("Error in getUserByUsername:", error);
      return undefined;
    }
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    try {
      // Try a different approach - first check if the table structure matches our expectations
      const tableResult = await pool.query(
        "SELECT column_name FROM information_schema.columns WHERE table_name = 'users'"
      );
      
      const columnNames = tableResult.rows.map(row => row.column_name);
      console.log("Users table columns:", columnNames);
      
      // Now try to insert with the columns we know exist
      if (columnNames.includes('password')) {
        const result = await pool.query(
          "INSERT INTO users (username, password) VALUES ($1, $2) RETURNING *",
          [insertUser.username, insertUser.password]
        );
        
        return {
          id: result.rows[0].id,
          username: result.rows[0].username,
          password: result.rows[0].password
        };
      } else {
        throw new Error("Cannot insert user - password column not found in users table");
      }
    } catch (error) {
      console.error("Error in createUser:", error);
      throw error;
    }
  }
  
  // Panel data methods - using direct SQL with correct column names
  async getPanel33kvaData(): Promise<Panel33kva | undefined> {
    try {
      // Use direct SQL query for consistency with production DB column names
      const result = await pool.query(
        "SELECT * FROM panel_33kva ORDER BY created_at DESC LIMIT 1"
      );
      
      if (result.rows.length === 0) return undefined;
      
      // Map created_at to timestamp for compatibility
      const data = {
        ...result.rows[0],
        timestamp: result.rows[0].created_at  // Map to expected property name
      };
      
      return data;
    } catch (error) {
      console.error("Error in getPanel33kvaData:", error);
      return undefined;
    }
  }
  
  async getPanel66kvaData(): Promise<Panel66kva | undefined> {
    try {
      // Use direct SQL query for consistency with production DB column names
      const result = await pool.query(
        "SELECT * FROM panel_66kva ORDER BY created_at DESC LIMIT 1"
      );
      
      if (result.rows.length === 0) return undefined;
      
      // Map created_at to timestamp for compatibility
      const data = {
        ...result.rows[0],
        timestamp: result.rows[0].created_at  // Map to expected property name
      };
      
      return data;
    } catch (error) {
      console.error("Error in getPanel66kvaData:", error);
      return undefined;
    }
  }
  
  async getAllPhaseData(): Promise<PhaseData[]> {
    // Get the latest data for both panels
    const panel33kvaData = await this.getPanel33kvaData();
    const panel66kvaData = await this.getPanel66kvaData();
    
    console.log("Panel 33KVA data:", panel33kvaData);
    console.log("Panel 66KVA data:", panel66kvaData);
    
    const result: PhaseData[] = [];
    
    if (panel33kvaData) {
      // Convert panel 33KVA data to R, S, T phase data format for compatibility
      result.push({
        phase: 'R',
        voltage: parseFloat(panel33kvaData.volt_r || '0'),
        current: parseFloat(panel33kvaData.arus_r || '0'),
        power: parseFloat(panel33kvaData.kva_r || '0') * 1000, // kVA to VA
        energy: parseFloat(panel33kvaData.kvah || '0'),
        frequency: 50, // Default frequency
        pf: 0.9, // Default power factor
        time: panel33kvaData.timestamp || new Date()
      });
      
      result.push({
        phase: 'S',
        voltage: parseFloat(panel33kvaData.volt_s || '0'),
        current: parseFloat(panel33kvaData.arus_s || '0'),
        power: parseFloat(panel33kvaData.kva_s || '0') * 1000, // kVA to VA
        energy: parseFloat(panel33kvaData.kvah || '0'),
        frequency: 50, // Default frequency
        pf: 0.9, // Default power factor
        time: panel33kvaData.timestamp || new Date()
      });
      
      result.push({
        phase: 'T',
        voltage: parseFloat(panel33kvaData.volt_t || '0'),
        current: parseFloat(panel33kvaData.arus_t || '0'),
        power: parseFloat(panel33kvaData.kva_t || '0') * 1000, // kVA to VA
        energy: parseFloat(panel33kvaData.kvah || '0'),
        frequency: 50, // Default frequency
        pf: 0.9, // Default power factor
        time: panel33kvaData.timestamp || new Date()
      });
    }
    
    console.log("Returning phase data:", result);
    return result;
  }
  
  async createPanel33kvaData(data: InsertPanel33kva): Promise<Panel33kva> {
    const [newData] = await db
      .insert(panel33kva)
      .values(data)
      .returning();
    return newData;
  }
  
  async createPanel66kvaData(data: InsertPanel66kva): Promise<Panel66kva> {
    const [newData] = await db
      .insert(panel66kva)
      .values(data)
      .returning();
    return newData;
  }
  
  // Chart data methods now use panel data
  async getChartDataByType(dataType: string, phase: string): Promise<ChartData[]> {
    try {
      // Use direct SQL query for consistency with production DB column names
      const panel33Result = await pool.query(
        "SELECT * FROM panel_33kva ORDER BY created_at"
      );
      
      // Format timestamp to time string
      const formatTime = (timestamp: Date): string => {
        return `${timestamp.getHours().toString().padStart(2, '0')}:${timestamp.getMinutes().toString().padStart(2, '0')}`;
      };
      
      // Map to chart data format
      const result: ChartData[] = [];
      
      // Process panel33 data
      const panel33Data = panel33Result.rows;
      for (const record of panel33Data) {
        if (!record.created_at) continue;
        
        const time = formatTime(new Date(record.created_at));
        
        if (phase === 'R') {
          if (dataType === 'voltage') {
            result.push({
              phase,
              dataType,
              time,
              value: parseFloat(record.volt_r || '0')
            });
          } else if (dataType === 'current') {
            result.push({
              phase,
              dataType,
              time,
              value: parseFloat(record.arus_r || '0')
            });
          } else if (dataType === 'power') {
            result.push({
              phase,
              dataType,
              time,
              value: parseFloat(record.kva_r || '0') * 1000 // kVA to VA
            });
          } else if (dataType === 'frequency') {
            result.push({
              phase,
              dataType,
              time,
              value: 50 // Default frequency
            });
          } else if (dataType === 'pf') {
            result.push({
              phase,
              dataType,
              time,
              value: 0.9 // Default power factor
            });
          }
        } else if (phase === 'S') {
          if (dataType === 'voltage') {
            result.push({
              phase,
              dataType,
              time,
              value: parseFloat(record.volt_s || '0')
            });
          } else if (dataType === 'current') {
            result.push({
              phase,
              dataType,
              time,
              value: parseFloat(record.arus_s || '0')
            });
          } else if (dataType === 'power') {
            result.push({
              phase,
              dataType,
              time,
              value: parseFloat(record.kva_s || '0') * 1000 // kVA to VA
            });
          } else if (dataType === 'frequency') {
            result.push({
              phase,
              dataType,
              time,
              value: 50 // Default frequency
            });
          } else if (dataType === 'pf') {
            result.push({
              phase,
              dataType,
              time,
              value: 0.9 // Default power factor
            });
          }
        } else if (phase === 'T') {
          if (dataType === 'voltage') {
            result.push({
              phase,
              dataType,
              time,
              value: parseFloat(record.volt_t || '0')
            });
          } else if (dataType === 'current') {
            result.push({
              phase,
              dataType,
              time,
              value: parseFloat(record.arus_t || '0')
            });
          } else if (dataType === 'power') {
            result.push({
              phase,
              dataType,
              time,
              value: parseFloat(record.kva_t || '0') * 1000 // kVA to VA
            });
          } else if (dataType === 'frequency') {
            result.push({
              phase,
              dataType,
              time,
              value: 50 // Default frequency
            });
          } else if (dataType === 'pf') {
            result.push({
              phase,
              dataType,
              time,
              value: 0.9 // Default power factor
            });
          }
        }
      }
      
      return result;
    } catch (error) {
      console.error(`Error fetching ${dataType} data for phase ${phase}:`, error);
      return [];
    }
  }
  
  // Total power consumption methods
  async getTotalPowerConsumption(granularity: string, startDate?: Date, endDate?: Date): Promise<TotalPowerData[]> {
    try {
      // Use direct SQL queries with the created_at column instead of timestamp
      let panel33Query = "SELECT * FROM panel_33kva ORDER BY created_at";
      let panel66Query = "SELECT * FROM panel_66kva ORDER BY created_at";
      
      // Apply date filters if provided
      if (startDate && endDate) {
        panel33Query = `SELECT * FROM panel_33kva WHERE created_at >= $1 AND created_at <= $2 ORDER BY created_at`;
        panel66Query = `SELECT * FROM panel_66kva WHERE created_at >= $1 AND created_at <= $2 ORDER BY created_at`;
      } else if (startDate) {
        panel33Query = `SELECT * FROM panel_33kva WHERE created_at >= $1 ORDER BY created_at`;
        panel66Query = `SELECT * FROM panel_66kva WHERE created_at >= $1 ORDER BY created_at`;
      } else if (endDate) {
        panel33Query = `SELECT * FROM panel_33kva WHERE created_at <= $1 ORDER BY created_at`;
        panel66Query = `SELECT * FROM panel_66kva WHERE created_at <= $1 ORDER BY created_at`;
      }
      
      // Execute queries with parameters if needed
      let panel33Result, panel66Result;
      if (startDate && endDate) {
        panel33Result = await pool.query(panel33Query, [startDate, endDate]);
        panel66Result = await pool.query(panel66Query, [startDate, endDate]);
      } else if (startDate) {
        panel33Result = await pool.query(panel33Query, [startDate]);
        panel66Result = await pool.query(panel66Query, [startDate]);
      } else if (endDate) {
        panel33Result = await pool.query(panel33Query, [endDate]);
        panel66Result = await pool.query(panel66Query, [endDate]);
      } else {
        panel33Result = await pool.query(panel33Query);
        panel66Result = await pool.query(panel66Query);
      }
      
      const panel33Data = panel33Result.rows;
      const panel66Data = panel66Result.rows;
      
      // If we don't have data for all panels, return empty array
      if (!panel33Data.length && !panel66Data.length) {
        return [];
      }
      
      // Combine and process data based on granularity
      const allData: TotalPowerData[] = [];
      
      // Helper function to format date based on granularity
      const formatDate = (date: Date, gran: string): string => {
        if (gran === 'minute') {
          return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
        } else if (gran === 'hour') {
          return `${date.getHours().toString().padStart(2, '0')}:00`;
        } else {
          // Default daily view shows hours
          return `${date.getHours().toString().padStart(2, '0')}:00`;
        }
      };
      
      // Process panel 33kva data
      panel33Data.forEach(record => {
        if (!record.created_at) return;
        
        const timeLabel = formatDate(new Date(record.created_at), granularity);
        const netKwValue = parseFloat(record.netkw || '0');
        
        // Look for existing entry with this time label
        const existingEntry = allData.find(entry => entry.time === timeLabel);
        
        if (existingEntry) {
          // Add this panel's power to the total
          existingEntry.totalPower += netKwValue * 1000; // kW to W
        } else {
          // Create new entry with this panel's power
          allData.push({
            time: timeLabel,
            totalPower: netKwValue * 1000 // kW to W
          });
        }
      });
      
      // Process panel 66kva data
      panel66Data.forEach(record => {
        if (!record.created_at) return;
        
        const timeLabel = formatDate(new Date(record.created_at), granularity);
        const netKwValue = parseFloat(record.netkw || '0');
        
        // Look for existing entry with this time label
        const existingEntry = allData.find(entry => entry.time === timeLabel);
        
        if (existingEntry) {
          // Add this panel's power to the total
          existingEntry.totalPower += netKwValue * 1000; // kW to W
        } else {
          // Create new entry with this panel's power
          allData.push({
            time: timeLabel,
            totalPower: netKwValue * 1000 // kW to W
          });
        }
      });
      
      // Sort by time
      allData.sort((a, b) => {
        // Parse hour and minute for comparison
        const [aHour, aMinute] = a.time.split(':').map(Number);
        const [bHour, bMinute] = b.time.split(':').map(Number);
        
        if (aHour !== bHour) {
          return aHour - bHour;
        }
        return (aMinute || 0) - (bMinute || 0);
      });
      
      return allData;
    } catch (error) {
      console.error("Error fetching total power consumption:", error);
      return [];
    }
  }
}

export const storage = new DatabaseStorage();
