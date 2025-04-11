import { 
  users, type User, type InsertUser,
  panels, type Panel, type InsertPanel,
  phaseR, type PhaseR, type InsertPhaseR,
  phaseS, type PhaseS, type InsertPhaseS,
  phaseT, type PhaseT, type InsertPhaseT,
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
  
  // Panel methods
  getAllPanels(): Promise<Panel[]>;
  getPanelById(id: number): Promise<Panel | undefined>;
  createPanel(panel: InsertPanel): Promise<Panel>;
  updatePanel(id: number, panel: Partial<InsertPanel>): Promise<Panel | undefined>;
  deletePanel(id: number): Promise<boolean>;
  
  // Phase data methods 
  getPhaseR(): Promise<PhaseR | undefined>;
  getPhaseS(): Promise<PhaseS | undefined>;
  getPhaseT(): Promise<PhaseT | undefined>;
  getAllPhaseData(): Promise<PhaseData[]>;
  getPhaseDataByPanelId(panelId: number): Promise<PhaseData[]>;
  createPhaseR(data: InsertPhaseR): Promise<PhaseR>;
  createPhaseS(data: InsertPhaseS): Promise<PhaseS>;
  createPhaseT(data: InsertPhaseT): Promise<PhaseT>;
  
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
  
  // Panel methods
  async getAllPanels(): Promise<Panel[]> {
    return await db.select().from(panels);
  }

  async getPanelById(id: number): Promise<Panel | undefined> {
    const [panel] = await db.select().from(panels).where(eq(panels.id, id));
    return panel || undefined;
  }

  async createPanel(panel: InsertPanel): Promise<Panel> {
    const [newPanel] = await db
      .insert(panels)
      .values(panel)
      .returning();
    return newPanel;
  }

  async updatePanel(id: number, panelData: Partial<InsertPanel>): Promise<Panel | undefined> {
    const [updatedPanel] = await db
      .update(panels)
      .set({
        ...panelData,
        updatedAt: new Date()
      })
      .where(eq(panels.id, id))
      .returning();
    return updatedPanel || undefined;
  }

  async deletePanel(id: number): Promise<boolean> {
    try {
      await db.delete(panels).where(eq(panels.id, id));
      return true;
    } catch (error) {
      console.error("Error deleting panel:", error);
      return false;
    }
  }
  
  // Phase data methods
  async getPhaseR(): Promise<PhaseR | undefined> {
    // Get the latest reading for phase R
    const [data] = await db
      .select()
      .from(phaseR)
      .orderBy(desc(phaseR.time))
      .limit(1);
    return data || undefined;
  }
  
  async getPhaseS(): Promise<PhaseS | undefined> {
    // Get the latest reading for phase S
    const [data] = await db
      .select()
      .from(phaseS)
      .orderBy(desc(phaseS.time))
      .limit(1);
    return data || undefined;
  }
  
  async getPhaseT(): Promise<PhaseT | undefined> {
    // Get the latest reading for phase T
    const [data] = await db
      .select()
      .from(phaseT)
      .orderBy(desc(phaseT.time))
      .limit(1);
    return data || undefined;
  }
  
  async getAllPhaseData(): Promise<PhaseData[]> {
    // Get the latest data for all phases
    const phaseRData = await this.getPhaseR();
    const phaseSData = await this.getPhaseS();
    const phaseTData = await this.getPhaseT();
    
    console.log("Phase R data:", phaseRData);
    console.log("Phase S data:", phaseSData);
    console.log("Phase T data:", phaseTData);
    
    const result: PhaseData[] = [];
    
    if (phaseRData) {
      result.push({
        phase: 'R',
        voltage: phaseRData.voltage,
        current: phaseRData.current,
        power: phaseRData.power,
        energy: phaseRData.energy,
        frequency: phaseRData.frequency,
        pf: phaseRData.pf,
        time: phaseRData.time
      });
    }
    
    if (phaseSData) {
      result.push({
        phase: 'S',
        voltage: phaseSData.voltage,
        current: phaseSData.current,
        power: phaseSData.power,
        energy: phaseSData.energy,
        frequency: phaseSData.frequency,
        pf: phaseSData.pf,
        time: phaseSData.time
      });
    }
    
    if (phaseTData) {
      result.push({
        phase: 'T',
        voltage: phaseTData.voltage,
        current: phaseTData.current,
        power: phaseTData.power,
        energy: phaseTData.energy,
        frequency: phaseTData.frequency,
        pf: phaseTData.pf,
        time: phaseTData.time
      });
    }
    
    console.log("Returning phase data:", result);
    return result;
  }
  
  async getPhaseDataByPanelId(panelId: number): Promise<PhaseData[]> {
    // Get the latest data for all phases filtered by panel
    const phaseRData = await db
      .select()
      .from(phaseR)
      .where(eq(phaseR.panelId, panelId))
      .orderBy(desc(phaseR.time))
      .limit(1);
      
    const phaseSData = await db
      .select()
      .from(phaseS)
      .where(eq(phaseS.panelId, panelId))
      .orderBy(desc(phaseS.time))
      .limit(1);
      
    const phaseTData = await db
      .select()
      .from(phaseT)
      .where(eq(phaseT.panelId, panelId))
      .orderBy(desc(phaseT.time))
      .limit(1);
    
    const result: PhaseData[] = [];
    
    if (phaseRData.length > 0) {
      result.push({
        phase: 'R',
        voltage: phaseRData[0].voltage,
        current: phaseRData[0].current,
        power: phaseRData[0].power,
        energy: phaseRData[0].energy,
        frequency: phaseRData[0].frequency,
        pf: phaseRData[0].pf,
        time: phaseRData[0].time
      });
    }
    
    if (phaseSData.length > 0) {
      result.push({
        phase: 'S',
        voltage: phaseSData[0].voltage,
        current: phaseSData[0].current,
        power: phaseSData[0].power,
        energy: phaseSData[0].energy,
        frequency: phaseSData[0].frequency,
        pf: phaseSData[0].pf,
        time: phaseSData[0].time
      });
    }
    
    if (phaseTData.length > 0) {
      result.push({
        phase: 'T',
        voltage: phaseTData[0].voltage,
        current: phaseTData[0].current,
        power: phaseTData[0].power,
        energy: phaseTData[0].energy,
        frequency: phaseTData[0].frequency,
        pf: phaseTData[0].pf,
        time: phaseTData[0].time
      });
    }
    
    return result;
  }
  
  async createPhaseR(data: InsertPhaseR): Promise<PhaseR> {
    const [newData] = await db
      .insert(phaseR)
      .values(data)
      .returning();
    return newData;
  }
  
  async createPhaseS(data: InsertPhaseS): Promise<PhaseS> {
    const [newData] = await db
      .insert(phaseS)
      .values(data)
      .returning();
    return newData;
  }
  
  async createPhaseT(data: InsertPhaseT): Promise<PhaseT> {
    const [newData] = await db
      .insert(phaseT)
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
    // Fetch all phase data first
    let rData = await db.select().from(phaseR).orderBy(phaseR.time);
    let sData = await db.select().from(phaseS).orderBy(phaseS.time);
    let tData = await db.select().from(phaseT).orderBy(phaseT.time);
    
    // Apply date filters in memory if provided
    if (startDate && endDate) {
      rData = rData.filter(d => new Date(d.time) >= startDate && new Date(d.time) <= endDate);
      sData = sData.filter(d => new Date(d.time) >= startDate && new Date(d.time) <= endDate);
      tData = tData.filter(d => new Date(d.time) >= startDate && new Date(d.time) <= endDate);
    } else if (startDate) {
      rData = rData.filter(d => new Date(d.time) >= startDate);
      sData = sData.filter(d => new Date(d.time) >= startDate);
      tData = tData.filter(d => new Date(d.time) >= startDate);
    } else if (endDate) {
      rData = rData.filter(d => new Date(d.time) <= endDate);
      sData = sData.filter(d => new Date(d.time) <= endDate);
      tData = tData.filter(d => new Date(d.time) <= endDate);
    }
    
    // If we don't have data for all phases, return empty array
    if (!rData.length && !sData.length && !tData.length) {
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
    
    // Process data for each phase and combine
    const processPhaseData = (data: any[], phase: string) => {
      data.forEach(record => {
        const timeLabel = formatDate(new Date(record.time), granularity);
        
        // Look for existing entry with this time label
        const existingEntry = allData.find(entry => entry.time === timeLabel);
        
        if (existingEntry) {
          // Add this phase's power to the total
          existingEntry.totalPower += record.power;
        } else {
          // Create new entry with this phase's power
          allData.push({
            time: timeLabel,
            totalPower: record.power
          });
        }
      });
    };
    
    // Process data for each phase
    processPhaseData(rData, 'R');
    processPhaseData(sData, 'S');
    processPhaseData(tData, 'T');
    
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
