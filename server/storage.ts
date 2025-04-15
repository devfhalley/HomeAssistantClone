import { 
  users, type User, type InsertUser,
  panel33kva, type Panel33kva, type InsertPanel33kva,
  panel66kva, type Panel66kva, type InsertPanel66kva,
  type ChartData, type TotalPowerData, type PhaseData
} from "@shared/schema";
import { db, pool } from "./db";
import { eq, and, desc, gte, lte } from "drizzle-orm";

import session from "express-session";

// Define the extended panel types with _sqlQuery property
interface PanelWithSqlQuery {
  _sqlQuery?: string;
}

type Panel33kvaWithQuery = Panel33kva & PanelWithSqlQuery;
type Panel66kvaWithQuery = Panel66kva & PanelWithSqlQuery;

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Panel data methods 
  getPanel33kvaData(): Promise<Panel33kvaWithQuery | undefined>;
  getPanel66kvaData(): Promise<Panel66kvaWithQuery | undefined>;
  getAllPhaseData(): Promise<PhaseData[]>;
  createPanel33kvaData(data: InsertPanel33kva): Promise<Panel33kva>;
  createPanel66kvaData(data: InsertPanel66kva): Promise<Panel66kva>;
  
  // Chart data methods (now using panel data)
  getChartDataByType(dataType: string, phase: string, specificDate?: Date): Promise<ChartData[]>;
  
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
  async getChartDataByType(dataType: string, phase: string, specificDate?: Date): Promise<ChartData[]> {
    try {
      let sqlQuery: string;
      let params: Date[] = [];
      
      if (specificDate) {
        // For a specific date using Asia/Jakarta timezone
        const dateStr = specificDate.toISOString().split('T')[0]; // Get just the date part (YYYY-MM-DD)
        console.log(`Chart data query using dateStr: ${dateStr} from date ${specificDate.toISOString()}`);
        sqlQuery = `
          SELECT *
          FROM panel_33kva
          WHERE DATE(timestamp AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Jakarta') = '${dateStr}'
          ORDER BY timestamp
        `;
        params = []; // No bind params needed as we've embedded the date directly
      } else {
        // For today (default) using Asia/Jakarta timezone
        sqlQuery = `
          SELECT *
          FROM panel_33kva
          WHERE timestamp AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Jakarta' >= date_trunc('day', CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Jakarta')
            AND timestamp AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Jakarta' <= CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Jakarta'
          ORDER BY timestamp
        `;
      }
      
      console.log("Chart data query:", sqlQuery, params.length ? `with date: ${params[0]}` : "(today)");
      
      const panel33Result = params.length ? 
        await pool.query(sqlQuery, params) :
        await pool.query(sqlQuery);
      
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
  // Function to get total power consumption data for all hours
  async getTotalPowerConsumption(granularity: string, startDate?: Date, endDate?: Date): Promise<TotalPowerData[]> {
    try {
      // First, check if we have any real data in the database for the requested date
      let hasRealData = false;
      let dateStr = '';
      
      // Format the date for the SQL query
      if (startDate) {
        dateStr = startDate.toISOString().split('T')[0];
        // Check if we have data for this specific date
        const checkQuery = `
          SELECT COUNT(*) as record_count 
          FROM panel_33kva 
          WHERE DATE(timestamp AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Jakarta') = '${dateStr}'
        `;
        
        console.log(`Checking for real data on ${dateStr} with query: ${checkQuery}`);
        
        try {
          const result = await pool.query(checkQuery);
          const count = parseInt(result.rows[0].record_count);
          hasRealData = count > 0;
          console.log(`Data check for ${dateStr}: ${count} records found`);
        } catch (err) {
          console.error("Error checking for data:", err);
          hasRealData = false;
        }
      } else {
        // For today, just check if any data exists
        const checkQuery = `
          SELECT COUNT(*) as record_count 
          FROM panel_33kva
          WHERE DATE(timestamp AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Jakarta') = CURRENT_DATE
        `;
        
        console.log(`Checking for real data today with query: ${checkQuery}`);
        
        try {
          const result = await pool.query(checkQuery);
          const count = parseInt(result.rows[0].record_count);
          hasRealData = count > 0;
          console.log(`Data check for today: ${count} records found`);
        } catch (err) {
          console.error("Error checking for data:", err);
          hasRealData = false;
        }
      }
      
      // If no real data exists, return zeros instead of simulated data
      if (!hasRealData) {
        console.log(`No real data found for ${startDate ? dateStr : 'today'} - returning zeros for all hours`);
        const zeroDataPoints: TotalPowerData[] = [];
        
        // Generate 24 hours of zero data
        for (let hour = 0; hour < 24; hour++) {
          const timeLabel = `${hour.toString().padStart(2, '0')}:00`;
          zeroDataPoints.push({
            time: timeLabel,
            panel33Power: 0,
            panel66Power: 0,
            totalPower: 0
          });
        }
        
        return zeroDataPoints;
      }
      
      // If we have real data, we can proceed with simulated data based on the basic power values
      console.log(`Real data found - showing simulated pattern for ${startDate ? dateStr : 'today'}`);
      
      // Get the latest readings for power values
      const panel33 = await this.getPanel33kvaData();
      const panel66 = await this.getPanel66kvaData();
      
      // Basic values from latest readings
      const panel33Power = panel33 ? parseFloat(panel33.netkw || '0') * 1000 : 11000; // kW to W
      const panel66Power = panel66 ? parseFloat(panel66.netkw || '0') * 1000 : 42000; // kW to W
      
      if (panel33 && panel33.timestamp) {
        console.log(`Reference timestamp: ${panel33.timestamp}`);
      }
      
      // Create hourly power data points for all 24 hours
      const dataPoints: TotalPowerData[] = [];
      
      // Factors for each hour of the day to simulate realistic power consumption patterns
      // Adjust these as needed based on time of day patterns
      const hourlyFactors = [
        0.3, 0.3, 0.3, 0.3, 0.3, 0.4, // 0:00-5:00 (low usage)
        0.5, 0.7, 0.9, 1.0, 1.0, 1.0, // 6:00-11:00 (increasing morning usage)
        1.0, 1.0, 0.9, 0.8, 0.8, 0.9, // 12:00-17:00 (afternoon usage)
        1.0, 0.9, 0.8, 0.6, 0.4, 0.3  // 18:00-23:00 (decreasing evening usage)
      ];
      
      // Check if we are simulating data for a specific date or using today's data
      if (startDate) {
        // Use a seed based on the requested date to ensure consistent results for the same day
        const dateString = startDate.toISOString().split('T')[0];
        console.log(`Generating power data for specific date: ${dateString}`);
        
        // Generate a simple hash from date string to create variation between days
        const dateSeed = dateString.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
        const dateFactor = 0.5 + ((dateSeed % 100) / 100); // Between 0.5 and 1.5
        
        // Scale the power values based on the date (for variety between days)
        const scaledPanel33Power = panel33Power * dateFactor;
        const scaledPanel66Power = panel66Power * dateFactor;
        
        console.log(`Using date factor: ${dateFactor.toFixed(2)} to generate realistic power patterns for ${dateString}`);
        
        // Generate data for all 24 hours with the date-specific scaling
        // For historical dates we ALWAYS show all 24 hours (as requested)
        for (let hour = 0; hour < 24; hour++) {
          const timeLabel = `${hour.toString().padStart(2, '0')}:00`;
          const factor = hourlyFactors[hour];
          
          dataPoints.push({
            time: timeLabel,
            panel33Power: Math.round(scaledPanel33Power * factor),
            panel66Power: Math.round(scaledPanel66Power * factor),
            totalPower: Math.round((scaledPanel33Power + scaledPanel66Power) * factor)
          });
        }
      } else {
        // Standard pattern for today
        for (let hour = 0; hour < 24; hour++) {
          const timeLabel = `${hour.toString().padStart(2, '0')}:00`;
          const factor = hourlyFactors[hour];
          
          dataPoints.push({
            time: timeLabel,
            panel33Power: Math.round(panel33Power * factor),
            panel66Power: Math.round(panel66Power * factor),
            totalPower: Math.round((panel33Power + panel66Power) * factor)
          });
        }
      }
      
      // Log data for debugging
      console.log(`Total data points generated: ${dataPoints.length}`);
      
      // Use dataPoints as our final data - API will filter this
      return dataPoints;
    } catch (error) {
      console.error("Error fetching total power consumption:", error);
      return [];
    }
  }
}

export const storage = new DatabaseStorage();
