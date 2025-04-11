import { 
  users, type User, type InsertUser,
  phaseData, type PhaseData, type InsertPhaseData,
  chartData, type ChartData, type InsertChartData 
} from "@shared/schema";
import { db } from "./db";
import { eq, and } from "drizzle-orm";

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Phase data methods
  getPhaseData(phase: string): Promise<PhaseData | undefined>;
  getAllPhaseData(): Promise<PhaseData[]>;
  createOrUpdatePhaseData(data: InsertPhaseData): Promise<PhaseData>;
  
  // Chart data methods
  getChartDataByType(dataType: string, phase: string): Promise<ChartData[]>;
  createChartData(data: InsertChartData): Promise<ChartData>;
  createMultipleChartData(dataArray: InsertChartData[]): Promise<void>;
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
  
  // Phase data methods
  async getPhaseData(phase: string): Promise<PhaseData | undefined> {
    const [data] = await db.select().from(phaseData).where(eq(phaseData.phase, phase));
    return data || undefined;
  }
  
  async getAllPhaseData(): Promise<PhaseData[]> {
    return await db.select().from(phaseData);
  }
  
  async createOrUpdatePhaseData(data: InsertPhaseData): Promise<PhaseData> {
    // Check if phase data already exists
    const existingData = await this.getPhaseData(data.phase);
    
    if (existingData) {
      // Update existing data
      const [updated] = await db
        .update(phaseData)
        .set({
          ...data,
          updatedAt: new Date(),
        })
        .where(eq(phaseData.phase, data.phase))
        .returning();
      return updated;
    } else {
      // Insert new data
      const [newData] = await db
        .insert(phaseData)
        .values(data)
        .returning();
      return newData;
    }
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
}

export const storage = new DatabaseStorage();
