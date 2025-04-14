import { useEffect, useState } from "react";
import HomeAssistant from "@/components/HomeAssistant";
import PowerMonitorCard from "@/components/PowerMonitorCard";
import ChartCard from "@/components/ChartCard";
import TotalPowerChart from "@/components/TotalPowerChart";
import SqlQueryDisplay from "@/components/SqlQueryDisplay";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { type ChartData } from "@shared/schema";

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

// SQL query interface
interface SqlQuery {
  name: string;
  sql: string;
}

// API response including SQL queries
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
  if (!data) return [];
  return data.map(item => ({
    time: item.time,
    value: item.value
  }));
};

const PowerMonitoring = () => {
  // State to store SQL queries
  const [sqlQueries, setSqlQueries] = useState<SqlQuery[]>([]);
  
  // Fetch phase R data with SQL query
  const { data: phaseRResponse, isLoading: isLoadingPhaseR } = useQuery({
    queryKey: ['/api/phase-data', 'R'],
    queryFn: () => apiRequest<ApiResponse>("GET", '/api/phase-data/R')
  });
  
  // Fetch phase S data with SQL query
  const { data: phaseSResponse, isLoading: isLoadingPhaseS } = useQuery({
    queryKey: ['/api/phase-data', 'S'],
    queryFn: () => apiRequest<ApiResponse>("GET", '/api/phase-data/S')
  });
  
  // Fetch phase T data with SQL query
  const { data: phaseTResponse, isLoading: isLoadingPhaseT } = useQuery({
    queryKey: ['/api/phase-data', 'T'],
    queryFn: () => apiRequest<ApiResponse>("GET", '/api/phase-data/T')
  });
  
  const isLoadingPhaseData = isLoadingPhaseR || isLoadingPhaseS || isLoadingPhaseT;

  // Fetch chart data for each type and phase
  const { data: voltageDataR } = useQuery({
    queryKey: ['/api/chart-data', 'voltage', 'R'],
    queryFn: () => apiRequest<ChartData[]>("GET", '/api/chart-data/voltage/R')
  });

  const { data: voltageDataS } = useQuery({
    queryKey: ['/api/chart-data', 'voltage', 'S'],
    queryFn: () => apiRequest<ChartData[]>("GET", '/api/chart-data/voltage/S')
  });

  const { data: voltageDataT } = useQuery({
    queryKey: ['/api/chart-data', 'voltage', 'T'],
    queryFn: () => apiRequest<ChartData[]>("GET", '/api/chart-data/voltage/T')
  });

  const { data: currentDataR } = useQuery({
    queryKey: ['/api/chart-data', 'current', 'R'],
    queryFn: () => apiRequest<ChartData[]>("GET", '/api/chart-data/current/R')
  });

  const { data: currentDataS } = useQuery({
    queryKey: ['/api/chart-data', 'current', 'S'],
    queryFn: () => apiRequest<ChartData[]>("GET", '/api/chart-data/current/S')
  });

  const { data: currentDataT } = useQuery({
    queryKey: ['/api/chart-data', 'current', 'T'],
    queryFn: () => apiRequest<ChartData[]>("GET", '/api/chart-data/current/T')
  });

  const { data: powerDataR } = useQuery({
    queryKey: ['/api/chart-data', 'power', 'R'],
    queryFn: () => apiRequest<ChartData[]>("GET", '/api/chart-data/power/R')
  });

  const { data: powerDataS } = useQuery({
    queryKey: ['/api/chart-data', 'power', 'S'],
    queryFn: () => apiRequest<ChartData[]>("GET", '/api/chart-data/power/S')
  });

  const { data: powerDataT } = useQuery({
    queryKey: ['/api/chart-data', 'power', 'T'],
    queryFn: () => apiRequest<ChartData[]>("GET", '/api/chart-data/power/T')
  });
  
  const { data: frequencyDataR } = useQuery({
    queryKey: ['/api/chart-data', 'frequency', 'R'],
    queryFn: () => apiRequest<ChartData[]>("GET", '/api/chart-data/frequency/R')
  });

  const { data: frequencyDataS } = useQuery({
    queryKey: ['/api/chart-data', 'frequency', 'S'],
    queryFn: () => apiRequest<ChartData[]>("GET", '/api/chart-data/frequency/S')
  });

  const { data: frequencyDataT } = useQuery({
    queryKey: ['/api/chart-data', 'frequency', 'T'],
    queryFn: () => apiRequest<ChartData[]>("GET", '/api/chart-data/frequency/T')
  });
  
  const { data: pfDataR } = useQuery({
    queryKey: ['/api/chart-data', 'pf', 'R'],
    queryFn: () => apiRequest<ChartData[]>("GET", '/api/chart-data/pf/R')
  });

  const { data: pfDataS } = useQuery({
    queryKey: ['/api/chart-data', 'pf', 'S'],
    queryFn: () => apiRequest<ChartData[]>("GET", '/api/chart-data/pf/S')
  });

  const { data: pfDataT } = useQuery({
    queryKey: ['/api/chart-data', 'pf', 'T'],
    queryFn: () => apiRequest<ChartData[]>("GET", '/api/chart-data/pf/T')
  });
  
  // Process and collect phase data + SQL queries
  const [processedPhaseData, setProcessedPhaseData] = useState(defaultPhaseData);
  
  useEffect(() => {
    // Process phase data
    const newProcessedData = { ...defaultPhaseData };
    const newSqlQueries: SqlQuery[] = [];
    
    // Phase R data
    if (phaseRResponse?.data) {
      newProcessedData.R = {
        voltage: phaseRResponse.data.voltage,
        current: phaseRResponse.data.current,
        power: phaseRResponse.data.power,
        energy: phaseRResponse.data.energy,
        frequency: phaseRResponse.data.frequency,
        pf: phaseRResponse.data.pf
      };
      
      // Collect SQL queries
      if (phaseRResponse.sqlQueries) {
        newSqlQueries.push(...phaseRResponse.sqlQueries);
      }
    }
    
    // Phase S data
    if (phaseSResponse?.data) {
      newProcessedData.S = {
        voltage: phaseSResponse.data.voltage,
        current: phaseSResponse.data.current,
        power: phaseSResponse.data.power,
        energy: phaseSResponse.data.energy,
        frequency: phaseSResponse.data.frequency,
        pf: phaseSResponse.data.pf
      };
      
      // Collect SQL queries
      if (phaseSResponse.sqlQueries) {
        newSqlQueries.push(...phaseSResponse.sqlQueries);
      }
    }
    
    // Phase T data
    if (phaseTResponse?.data) {
      newProcessedData.T = {
        voltage: phaseTResponse.data.voltage,
        current: phaseTResponse.data.current,
        power: phaseTResponse.data.power,
        energy: phaseTResponse.data.energy,
        frequency: phaseTResponse.data.frequency,
        pf: phaseTResponse.data.pf
      };
      
      // Collect SQL queries
      if (phaseTResponse.sqlQueries) {
        newSqlQueries.push(...phaseTResponse.sqlQueries);
      }
    }
    
    setProcessedPhaseData(newProcessedData);
    setSqlQueries(newSqlQueries);
  }, [phaseRResponse, phaseSResponse, phaseTResponse]);
  
  return (
    <HomeAssistant>
      <div className="space-y-4">
        {/* Panel Name Header */}
        <div className="bg-blue-600 text-white p-3 rounded-md">
          <h1 className="text-xl font-bold">Panel 1 33KVA Monitoring</h1>
        </div>
        
        {/* Total Power Consumption Chart */}
        <div>
          <TotalPowerChart />
        </div>
        
        {/* Power Monitor Cards */}
        <div>
          <h2 className="text-lg font-semibold mb-3">Phase Monitoring</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {isLoadingPhaseData ? (
              // Skeleton loading state for power monitor cards
              <>
                <div className="h-[300px] animate-pulse bg-gray-200 rounded-md"></div>
                <div className="h-[300px] animate-pulse bg-gray-200 rounded-md"></div>
                <div className="h-[300px] animate-pulse bg-gray-200 rounded-md"></div>
              </>
            ) : (
              <>
                <PowerMonitorCard 
                  title="Panel 1 33KVA - Phase R" 
                  phase="R"
                  voltage={processedPhaseData.R?.voltage || 0}
                  current={processedPhaseData.R?.current || 0}
                  power={processedPhaseData.R?.power || 0}
                  energy={processedPhaseData.R?.energy || 0}
                  frequency={processedPhaseData.R?.frequency || 0}
                  pf={processedPhaseData.R?.pf || 0}
                />
                
                <PowerMonitorCard 
                  title="Panel 1 33KVA - Phase S" 
                  phase="S"
                  voltage={processedPhaseData.S?.voltage || 0}
                  current={processedPhaseData.S?.current || 0}
                  power={processedPhaseData.S?.power || 0}
                  energy={processedPhaseData.S?.energy || 0}
                  frequency={processedPhaseData.S?.frequency || 0}
                  pf={processedPhaseData.S?.pf || 0}
                />
                
                <PowerMonitorCard 
                  title="Panel 1 33KVA - Phase T" 
                  phase="T"
                  voltage={processedPhaseData.T?.voltage || 0}
                  current={processedPhaseData.T?.current || 0}
                  power={processedPhaseData.T?.power || 0}
                  energy={processedPhaseData.T?.energy || 0}
                  frequency={processedPhaseData.T?.frequency || 0}
                  pf={processedPhaseData.T?.pf || 0}
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
              title="Panel 1 33KVA - Voltage" 
              phaseRData={processChartData(voltageDataR)}
              phaseSData={processChartData(voltageDataS)}
              phaseTData={processChartData(voltageDataT)}
              yAxisDomain={[190, 240]}
              unit="V"
            />
            
            <ChartCard 
              title="Panel 1 33KVA - Current" 
              phaseRData={processChartData(currentDataR)}
              phaseSData={processChartData(currentDataS)}
              phaseTData={processChartData(currentDataT)}
              yAxisDomain={[0, 100]}
              unit="A"
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <ChartCard 
              title="Panel 1 33KVA - Power" 
              phaseRData={processChartData(powerDataR)}
              phaseSData={processChartData(powerDataS)}
              phaseTData={processChartData(powerDataT)}
              yAxisDomain={[0, 20000]}
              unit="W"
            />
            
            <ChartCard 
              title="Panel 1 33KVA - Frequency" 
              phaseRData={processChartData(frequencyDataR)}
              phaseSData={processChartData(frequencyDataS)}
              phaseTData={processChartData(frequencyDataT)}
              yAxisDomain={[49.5, 50.5]}
              unit="Hz"
            />
            
            <ChartCard 
              title="Panel 1 33KVA - Power Factor" 
              phaseRData={processChartData(pfDataR)}
              phaseSData={processChartData(pfDataS)}
              phaseTData={processChartData(pfDataT)}
              yAxisDomain={[0.8, 1.0]}
              unit=""
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
