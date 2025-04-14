import { useEffect, useState } from "react";
import HomeAssistant from "@/components/HomeAssistant";
import PowerMonitorCard from "@/components/PowerMonitorCard";
import ChartCard from "@/components/ChartCard";
import TotalPowerChart from "@/components/TotalPowerChart";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { type ChartData } from "@shared/schema";
import SqlQueryDisplay from "@/components/SqlQueryDisplay";
import { RefreshCw } from "lucide-react";

// Interface for phase data from API
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

// Interface for SQL queries
interface SqlQuery {
  name: string;
  sql: string;
}

// Interface for API response
interface ApiResponse {
  data: PhaseData;
  sqlQueries: SqlQuery[];
}

interface ChartDataPoint {
  time: string;
  value: number;
}

// Default data fallback in case API fails
const defaultPhaseData = {
  R: { voltage: 0, current: 0, power: 0, energy: 0, frequency: 0, pf: 0 },
  S: { voltage: 0, current: 0, power: 0, energy: 0, frequency: 0, pf: 0 },
  T: { voltage: 0, current: 0, power: 0, energy: 0, frequency: 0, pf: 0 }
};

const processChartData = (data: ChartData[] | undefined): ChartDataPoint[] => {
  if (!data || !Array.isArray(data)) return [];
  
  try {
    return data.map(item => ({
      time: item.time,
      value: item.value
    }));
  } catch (error) {
    console.error('Error processing chart data:', error);
    return [];
  }
};

const PowerMonitoring = () => {
  useEffect(() => {
    document.title = "Home Assistant - Power Monitoring";
  }, []);

  // State to store SQL queries
  const [sqlQueries, setSqlQueries] = useState<SqlQuery[]>([]);
  
  // Fetch phase R data with automatic refetching every 10 seconds
  const { 
    data: phaseRData, 
    isLoading: isLoadingPhaseR, 
    isFetching: isFetchingPhaseR 
  } = useQuery<ApiResponse>({
    queryKey: ['/api/phase-data/R'],
    queryFn: () => apiRequest<ApiResponse>("GET", '/api/phase-data/R'),
    refetchInterval: 10000, // Refetch every 10 seconds
    refetchIntervalInBackground: true
  });
  
  // Fetch phase S data
  const { 
    data: phaseSData, 
    isLoading: isLoadingPhaseS, 
    isFetching: isFetchingPhaseS 
  } = useQuery<ApiResponse>({
    queryKey: ['/api/phase-data/S'],
    queryFn: () => apiRequest<ApiResponse>("GET", '/api/phase-data/S'),
    refetchInterval: 10000, // Refetch every 10 seconds
    refetchIntervalInBackground: true
  });
  
  // Fetch phase T data
  const { 
    data: phaseTData, 
    isLoading: isLoadingPhaseT, 
    isFetching: isFetchingPhaseT 
  } = useQuery<ApiResponse>({
    queryKey: ['/api/phase-data/T'],
    queryFn: () => apiRequest<ApiResponse>("GET", '/api/phase-data/T'),
    refetchInterval: 10000, // Refetch every 10 seconds
    refetchIntervalInBackground: true
  });
  
  // Create an interface for the new response format
  interface ChartDataResponse {
    data: ChartData[];
    sqlQueries: SqlQuery[];
  }
  
  // Fetch voltage chart data
  const { 
    data: voltageChartData, 
    isLoading: isLoadingVoltageChart, 
    isFetching: isFetchingVoltageChart 
  } = useQuery<ChartDataResponse>({
    queryKey: ['/api/chart-data/voltage/R'],
    queryFn: () => apiRequest<ChartDataResponse>("GET", '/api/chart-data/voltage/R'),
    refetchInterval: 10000, // Refetch every 10 seconds
    refetchIntervalInBackground: true
  });
  
  // Fetch voltage S chart data
  const { 
    data: voltageSChartData, 
    isLoading: isLoadingVoltageSChart, 
    isFetching: isFetchingVoltageSChart 
  } = useQuery<ChartDataResponse>({
    queryKey: ['/api/chart-data/voltage/S'],
    queryFn: () => apiRequest<ChartDataResponse>("GET", '/api/chart-data/voltage/S'),
    refetchInterval: 10000, // Refetch every 10 seconds
    refetchIntervalInBackground: true
  });
  
  // Fetch voltage T chart data
  const { 
    data: voltageTChartData, 
    isLoading: isLoadingVoltageTChart, 
    isFetching: isFetchingVoltageTChart 
  } = useQuery<ChartDataResponse>({
    queryKey: ['/api/chart-data/voltage/T'],
    queryFn: () => apiRequest<ChartDataResponse>("GET", '/api/chart-data/voltage/T'),
    refetchInterval: 10000, // Refetch every 10 seconds
    refetchIntervalInBackground: true
  });
  
  // Process and collect SQL queries
  useEffect(() => {
    // Collect SQL queries from all responses
    const allQueries: SqlQuery[] = [];
    
    if (phaseRData?.sqlQueries) allQueries.push(...phaseRData.sqlQueries);
    if (phaseSData?.sqlQueries) allQueries.push(...phaseSData.sqlQueries);
    if (phaseTData?.sqlQueries) allQueries.push(...phaseTData.sqlQueries);
    
    if (voltageChartData?.sqlQueries) allQueries.push(...voltageChartData.sqlQueries);
    if (voltageSChartData?.sqlQueries) allQueries.push(...voltageSChartData.sqlQueries);
    if (voltageTChartData?.sqlQueries) allQueries.push(...voltageTChartData.sqlQueries);
    
    // Remove duplicates by query string
    const uniqueQueries = Array.from(
      new Map(allQueries.map(q => [q.sql, q])).values()
    );
    
    // Update state
    setSqlQueries(uniqueQueries);
  }, [
    phaseRData, phaseSData, phaseTData, 
    voltageChartData, voltageSChartData, voltageTChartData
  ]);
  
  // Process phase data for display
  const processedPhaseData = {
    R: phaseRData?.data ? {
      voltage: phaseRData.data.voltage,
      current: phaseRData.data.current,
      power: phaseRData.data.power,
      energy: phaseRData.data.energy,
      frequency: phaseRData.data.frequency,
      pf: phaseRData.data.pf
    } : defaultPhaseData.R,
    
    S: phaseSData?.data ? {
      voltage: phaseSData.data.voltage,
      current: phaseSData.data.current,
      power: phaseSData.data.power,
      energy: phaseSData.data.energy,
      frequency: phaseSData.data.frequency,
      pf: phaseSData.data.pf
    } : defaultPhaseData.S,
    
    T: phaseTData?.data ? {
      voltage: phaseTData.data.voltage,
      current: phaseTData.data.current,
      power: phaseTData.data.power,
      energy: phaseTData.data.energy,
      frequency: phaseTData.data.frequency,
      pf: phaseTData.data.pf
    } : defaultPhaseData.T
  };
  
  // Determine if any data is currently being fetched
  const isFetchingData = 
    isFetchingPhaseR || isFetchingPhaseS || isFetchingPhaseT ||
    isFetchingVoltageChart || isFetchingVoltageSChart || isFetchingVoltageTChart;
  
  // Extract chart data
  const voltageRChartData = voltageChartData?.data || [];
  const voltageSChartData2 = voltageSChartData?.data || [];
  const voltageTChartData2 = voltageTChartData?.data || [];
  
  return (
    <HomeAssistant>
      <div className="space-y-4">
        {/* Panel Name Header */}
        <div className="bg-blue-600 text-white p-3 rounded-md flex justify-between items-center">
          <h1 className="text-xl font-bold">Panel 33KVA Monitoring</h1>
          {isFetchingData && (
            <div className="flex items-center">
              <RefreshCw className="w-4 h-4 mr-2 text-white animate-spin" />
              <span className="text-sm text-white">Refreshing data...</span>
            </div>
          )}
        </div>
        
        {/* Total Power Consumption Chart */}
        <div>
          <TotalPowerChart />
        </div>
        
        {/* Power Monitor Cards */}
        <div>
          <h2 className="text-lg font-semibold mb-3">Phase Monitoring</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {isLoadingPhaseR || isLoadingPhaseS || isLoadingPhaseT ? (
              // Skeleton loading state for power monitor cards
              <>
                <div className="h-[300px] animate-pulse bg-gray-200 rounded-md"></div>
                <div className="h-[300px] animate-pulse bg-gray-200 rounded-md"></div>
                <div className="h-[300px] animate-pulse bg-gray-200 rounded-md"></div>
              </>
            ) : (
              <>
                <PowerMonitorCard 
                  title="Panel 33KVA - Phase R" 
                  phase="R"
                  voltage={processedPhaseData.R.voltage}
                  current={processedPhaseData.R.current}
                  power={processedPhaseData.R.power}
                  energy={processedPhaseData.R.energy}
                  frequency={processedPhaseData.R.frequency}
                  pf={processedPhaseData.R.pf}
                />
                
                <PowerMonitorCard 
                  title="Panel 33KVA - Phase S" 
                  phase="S"
                  voltage={processedPhaseData.S.voltage}
                  current={processedPhaseData.S.current}
                  power={processedPhaseData.S.power}
                  energy={processedPhaseData.S.energy}
                  frequency={processedPhaseData.S.frequency}
                  pf={processedPhaseData.S.pf}
                />
                
                <PowerMonitorCard 
                  title="Panel 33KVA - Phase T" 
                  phase="T"
                  voltage={processedPhaseData.T.voltage}
                  current={processedPhaseData.T.current}
                  power={processedPhaseData.T.power}
                  energy={processedPhaseData.T.energy}
                  frequency={processedPhaseData.T.frequency}
                  pf={processedPhaseData.T.pf}
                />
              </>
            )}
          </div>
        </div>

        {/* Electrical Parameters Charts */}
        <div>
          <h2 className="text-lg font-semibold my-3">Electrical Parameters</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <ChartCard 
              title="Panel 33KVA - Voltage" 
              phaseRData={processChartData(voltageRChartData)}
              phaseSData={processChartData(voltageSChartData2)}
              phaseTData={processChartData(voltageTChartData2)}
              yAxisDomain={[190, 240]}
              unit="V"
            />
          </div>
        </div>
        
        {/* SQL Queries Display */}
        {sqlQueries.length > 0 && (
          <div className="mt-8">
            <SqlQueryDisplay queries={sqlQueries} />
          </div>
        )}
      </div>
    </HomeAssistant>
  );
};

export default PowerMonitoring;