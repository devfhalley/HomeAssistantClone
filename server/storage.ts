import { 
  users, type User, type InsertUser,
  panel33kva, type Panel33kva, type InsertPanel33kva,
  panel66kva, type Panel66kva, type InsertPanel66kva, 
  chartData, type ChartData, type InsertChartData 
} from "@shared/schema";
import { db } from "./db";
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
  
  // Chart data methods
  getChartDataByType(dataType: string, phase: string): Promise<ChartData[]>;
  createChartData(data: InsertChartData): Promise<ChartData>;
  createMultipleChartData(dataArray: InsertChartData[]): Promise<void>;
  
  // Total power consumption methods
  getTotalPowerConsumption(granularity: string, startDate?: Date, endDate?: Date): Promise<TotalPowerData[]>;
}

export class DatabaseStorage implements IStorage {
  // User methods
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }
  
  // Panel data methods
  async getPanel33kvaData(): Promise<Panel33kva | undefined> {
    // Get the latest reading for Panel 33KVA
    const [data] = await db
      .select()
      .from(panel33kva)
      .orderBy(desc(panel33kva.timestamp))
      .limit(1);
    return data || undefined;
  }
  
  async getPanel66kvaData(): Promise<Panel66kva | undefined> {
    // Get the latest reading for Panel 66KVA
    const [data] = await db
      .select()
      .from(panel66kva)
      .orderBy(desc(panel66kva.timestamp))
      .limit(1);
    return data || undefined;
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
  
  // Chart data methods
  async getChartDataByType(dataType: string, phase: string): Promise<ChartData[]> {
    return await db
      .select()
      .from(chartData)
      .where(
        and(
          eq(chartData.dataType, dataType),
          eq(chartData.phase, phase)
        )
      )
      .orderBy(chartData.createdAt);
  }
  
  async createChartData(data: InsertChartData): Promise<ChartData> {
    const [newData] = await db
      .insert(chartData)
      .values(data)
      .returning();
    return newData;
  }
  
  async createMultipleChartData(dataArray: InsertChartData[]): Promise<void> {
    // Split into chunks to avoid too many parameters in a single query
    const CHUNK_SIZE = 100;
    for (let i = 0; i < dataArray.length; i += CHUNK_SIZE) {
      const chunk = dataArray.slice(i, i + CHUNK_SIZE);
      await db.insert(chartData).values(chunk);
    }
  }
  
  // Total power consumption methods
  async getTotalPowerConsumption(granularity: string, startDate?: Date, endDate?: Date): Promise<TotalPowerData[]> {
    // Fetch panel data
    let panel33Data = await db.select().from(panel33kva).orderBy(panel33kva.timestamp);
    let panel66Data = await db.select().from(panel66kva).orderBy(panel66kva.timestamp);
    
    // Apply date filters in memory if provided
    if (startDate && endDate) {
      panel33Data = panel33Data.filter(d => d.timestamp && new Date(d.timestamp) >= startDate && new Date(d.timestamp) <= endDate);
      panel66Data = panel66Data.filter(d => d.timestamp && new Date(d.timestamp) >= startDate && new Date(d.timestamp) <= endDate);
    } else if (startDate) {
      panel33Data = panel33Data.filter(d => d.timestamp && new Date(d.timestamp) >= startDate);
      panel66Data = panel66Data.filter(d => d.timestamp && new Date(d.timestamp) >= startDate);
    } else if (endDate) {
      panel33Data = panel33Data.filter(d => d.timestamp && new Date(d.timestamp) <= endDate);
      panel66Data = panel66Data.filter(d => d.timestamp && new Date(d.timestamp) <= endDate);
    }
    
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
      if (!record.timestamp) return;
      
      const timeLabel = formatDate(new Date(record.timestamp), granularity);
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
      if (!record.timestamp) return;
      
      const timeLabel = formatDate(new Date(record.timestamp), granularity);
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
  }
}

export const storage = new DatabaseStorage();
