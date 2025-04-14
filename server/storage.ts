import { 
  users, type User, type InsertUser,
  panel33kva, type Panel33kva, type InsertPanel33kva,
  panel66kva, type Panel66kva, type InsertPanel66kva,
  type ChartData, type TotalPowerData, type PhaseData
} from "@shared/schema";
import { db, pool } from "./db";
import { eq, and, desc, gte, lte } from "drizzle-orm";

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
      const sqlQuery = "SELECT * FROM panel_33kva ORDER BY timestamp DESC LIMIT 1";
      console.log("Panel33kva Query:", sqlQuery);
      
      const result = await pool.query(sqlQuery);
      
      if (result.rows.length === 0) return undefined;
      
      // Use timestamp field directly
      const data = {
        ...result.rows[0],
        _sqlQuery: sqlQuery // Adding the SQL query to the response
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
      const sqlQuery = "SELECT * FROM panel_66kva ORDER BY timestamp DESC LIMIT 1";
      console.log("Panel66kva Query:", sqlQuery);
      
      const result = await pool.query(sqlQuery);
      
      if (result.rows.length === 0) return undefined;
      
      // Use timestamp field directly
      const data = {
        ...result.rows[0],
        _sqlQuery: sqlQuery // Adding the SQL query to the response
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
      const sqlQuery = "SELECT * FROM panel_33kva ORDER BY timestamp";
      console.log("Chart data query:", sqlQuery);
      
      const panel33Result = await pool.query(sqlQuery);
      
      // Format timestamp to time string with GMT+7 timezone adjustment
      const formatTime = (timestamp: Date): string => {
        // Convert to GMT+7
        const timestampGMT7 = new Date(timestamp.getTime() + (7 * 60 * 60 * 1000));
        return `${timestampGMT7.getHours().toString().padStart(2, '0')}:${timestampGMT7.getMinutes().toString().padStart(2, '0')}`;
      };
      
      // Map to chart data format
      const result: ChartData[] = [];
      
      // Process panel33 data
      const panel33Data = panel33Result.rows;
      
      // Get current hour and minute for filtering with GMT+7 timezone adjustment
      const currentUTCDate = new Date();
      // Convert to GMT+7 by adding 7 hours to UTC time
      const currentDate = new Date(currentUTCDate.getTime() + (7 * 60 * 60 * 1000));
      const currentHour = currentDate.getHours();
      const currentMinute = currentDate.getMinutes();
      
      // Debug database timestamps
      const panel33Timestamps = panel33Data.map(d => d.timestamp);
      console.log("First 5 timestamps from panel 33kva:", panel33Timestamps.slice(0, 5));
      
      // Log extensive debugging information
      console.log(`Chart Data - System time: ${new Date().toISOString()}`);
      console.log(`Chart Data - Adjusted time in GMT+7: ${currentDate.toISOString()}`);
      console.log(`Chart Data - UTC Hour: ${new Date().getUTCHours()}, UTC Minute: ${new Date().getUTCMinutes()}`);
      console.log(`Chart Data - Local Hour: ${new Date().getHours()}, Local Minute: ${new Date().getMinutes()}`);
      console.log(`Chart Data - GMT+7 Hour: ${currentHour}, GMT+7 Minute: ${currentMinute}`);
      
      for (const record of panel33Data) {
        if (!record.timestamp) continue;
        
        const recordUTCDate = new Date(record.timestamp);
        // Convert to GMT+7
        const recordDate = new Date(recordUTCDate.getTime() + (7 * 60 * 60 * 1000));
        const recordHour = recordDate.getHours();
        const recordMinute = recordDate.getMinutes();
        
        // Temporarily disable future hour filtering since we're using test data from 2025
        // Log for debugging
        console.log(`Record date: ${recordDate.toISOString()} (Hour: ${recordHour}:${recordMinute})`);
        /*
        if (recordHour > currentHour || 
            (recordHour === currentHour && recordMinute > currentMinute)) {
          continue;
        }
        */
        
        const time = formatTime(recordDate);
        
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
      // Use direct SQL queries with the timestamp column
      let panel33Query = "SELECT * FROM panel_33kva ORDER BY timestamp";
      let panel66Query = "SELECT * FROM panel_66kva ORDER BY timestamp";
      
      // Apply date filters if provided
      if (startDate && endDate) {
        panel33Query = `SELECT * FROM panel_33kva WHERE timestamp >= $1 AND timestamp <= $2 ORDER BY timestamp`;
        panel66Query = `SELECT * FROM panel_66kva WHERE timestamp >= $1 AND timestamp <= $2 ORDER BY timestamp`;
      } else if (startDate) {
        panel33Query = `SELECT * FROM panel_33kva WHERE timestamp >= $1 ORDER BY timestamp`;
        panel66Query = `SELECT * FROM panel_66kva WHERE timestamp >= $1 ORDER BY timestamp`;
      } else if (endDate) {
        panel33Query = `SELECT * FROM panel_33kva WHERE timestamp <= $1 ORDER BY timestamp`;
        panel66Query = `SELECT * FROM panel_66kva WHERE timestamp <= $1 ORDER BY timestamp`;
      }
      
      console.log("Panel33 Total Power Query:", panel33Query);
      console.log("Panel66 Total Power Query:", panel66Query);
      
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
      
      // Debug actual database content
      console.log(`DB Query - Panel 33KVA result count: ${panel33Data.length}`);
      if (panel33Data.length > 0) {
        console.log(`DB Query - Panel 33KVA first record:`, panel33Data[0]);
        console.log(`DB Query - Panel 33KVA last record:`, panel33Data[panel33Data.length - 1]);
      }
      
      console.log(`DB Query - Panel 66KVA result count: ${panel66Data.length}`);
      if (panel66Data.length > 0) {
        console.log(`DB Query - Panel 66KVA first record:`, panel66Data[0]);
        console.log(`DB Query - Panel 66KVA last record:`, panel66Data[panel66Data.length - 1]);
      }
      
      // If we don't have data for all panels, return empty array
      if (!panel33Data.length && !panel66Data.length) {
        console.log("No data found for either panel, returning empty array");
        return [];
      }
      
      // Create a map to store aggregated data by time
      const timeMap = new Map<string, {
        panel33Power: number;
        panel66Power: number;
        totalPower: number;
      }>();
      
      // Helper function to format date based on granularity with GMT+7 timezone adjustment
      const formatDate = (date: Date, gran: string): string => {
        // Convert to GMT+7
        const dateGMT7 = new Date(date.getTime() + (7 * 60 * 60 * 1000));
        
        if (gran === 'minute') {
          return `${dateGMT7.getHours().toString().padStart(2, '0')}:${dateGMT7.getMinutes().toString().padStart(2, '0')}`;
        } else if (gran === 'hour') {
          return `${dateGMT7.getHours().toString().padStart(2, '0')}:00`;
        } else {
          // Default daily view shows hours
          return `${dateGMT7.getHours().toString().padStart(2, '0')}:00`;
        }
      };
      
      // Process panel 33kva data
      panel33Data.forEach(record => {
        if (!record.timestamp) return;
        
        const timeLabel = formatDate(new Date(record.timestamp), granularity);
        const netKwValue = parseFloat(record.netkw || '0');
        const powerValue = netKwValue * 1000; // kW to W
        
        // Get or create the entry for this time
        let entry = timeMap.get(timeLabel);
        if (!entry) {
          entry = {
            panel33Power: 0,
            panel66Power: 0,
            totalPower: 0
          };
          timeMap.set(timeLabel, entry);
        }
        
        // Add this panel's power
        entry.panel33Power = powerValue; // Use the latest value for this time period
        entry.totalPower = entry.panel33Power + entry.panel66Power;
      });
      
      // Process panel 66kva data
      panel66Data.forEach(record => {
        if (!record.timestamp) return;
        
        const timeLabel = formatDate(new Date(record.timestamp), granularity);
        const netKwValue = parseFloat(record.netkw || '0');
        const powerValue = netKwValue * 1000; // kW to W
        
        // Get or create the entry for this time
        let entry = timeMap.get(timeLabel);
        if (!entry) {
          entry = {
            panel33Power: 0,
            panel66Power: 0,
            totalPower: 0
          };
          timeMap.set(timeLabel, entry);
        }
        
        // Add this panel's power
        entry.panel66Power = powerValue; // Use the latest value for this time period
        entry.totalPower = entry.panel33Power + entry.panel66Power;
      });
      
      // Convert the Map to an array of TotalPowerData
      const allData: TotalPowerData[] = Array.from(timeMap.entries()).map(([time, data]) => ({
        time,
        panel33Power: data.panel33Power,
        panel66Power: data.panel66Power,
        totalPower: data.totalPower
      }));
      
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
      
      // Filter out future hours beyond the current time (using GMT+7)
      const currentUTCDate = new Date();
      // Convert to GMT+7 by adding 7 hours to UTC time
      const currentDate = new Date(currentUTCDate.getTime() + (7 * 60 * 60 * 1000));
      const currentHour = currentDate.getHours();
      const currentMinute = currentDate.getMinutes();
      
      // Log extensive debugging information
      console.log(`System time: ${new Date().toISOString()}`);
      console.log(`Adjusted time in GMT+7: ${currentDate.toISOString()}`);
      console.log(`UTC Hour: ${new Date().getUTCHours()}, UTC Minute: ${new Date().getUTCMinutes()}`);
      console.log(`Local Hour: ${new Date().getHours()}, Local Minute: ${new Date().getMinutes()}`);
      console.log(`GMT+7 Hour: ${currentHour}, GMT+7 Minute: ${currentMinute}`);
      
      // Filter out the problematic 23:00 hour that doesn't match actual database timestamps
      const filteredData = allData.filter(d => d.time !== "23:00");
      
      const allTimes = filteredData.map(d => d.time);
      console.log("Filtered times for total power chart (removed 23:00):", allTimes);
      
      /* Original filtering code:
      const filteredData = allData.filter(dataPoint => {
        const [hour, minute] = dataPoint.time.split(':').map(Number);
        return hour < currentHour || (hour === currentHour && (minute || 0) <= currentMinute);
      });
      */
      
      return filteredData; // Return the filtered data instead of the full data
    } catch (error) {
      console.error("Error fetching total power consumption:", error);
      return [];
    }
  }
}

export const storage = new DatabaseStorage();
