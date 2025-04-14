import { useEffect, useState } from "react";
import HomeAssistant from "@/components/HomeAssistant";
import PowerMonitorCard from "@/components/PowerMonitorCard";
import ChartCard from "@/components/ChartCard";
import TotalPowerChart from "@/components/TotalPowerChart";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { type ChartData } from "@shared/schema";
import SqlQueryDisplay from "@/components/SqlQueryDisplay";

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

const Panel66KVA = () => {
  // Fetch phase data
  const { data: phaseDataArray, isLoading: isLoadingPhaseData } = useQuery({
    queryKey: ['/api/phase-data'],
    queryFn: () => apiRequest<PhaseData[]>("GET", '/api/phase-data')
  });

  // State to store SQL queries
  const [sqlQueries, setSqlQueries] = useState<{ name: string; sql: string; }[]>([]);
  
  // Create interfaces for the new response formats
  interface ChartDataResponse {
    data: ChartData[];
    sqlQueries: { name: string; sql: string; }[];
  }
  
  // Fetch chart data for each type and phase
  const { data: voltageDataRResponse } = useQuery({
    queryKey: ['/api/chart-data', 'voltage', 'R'],
    queryFn: () => apiRequest<ChartDataResponse>("GET", '/api/chart-data/voltage/R')
  });
  
  // Extract the chart data from the response
  const voltageDataR = voltageDataRResponse?.data;
  
  // Collect SQL queries
  useEffect(() => {
    if (voltageDataRResponse?.sqlQueries) {
      setSqlQueries(prev => [...prev, ...voltageDataRResponse.sqlQueries]);
    }
  }, [voltageDataRResponse]);

  const { data: voltageDataSResponse } = useQuery({
    queryKey: ['/api/chart-data', 'voltage', 'S'],
    queryFn: () => apiRequest<ChartDataResponse>("GET", '/api/chart-data/voltage/S')
  });
  
  const voltageDataS = voltageDataSResponse?.data;
  
  useEffect(() => {
    if (voltageDataSResponse?.sqlQueries) {
      setSqlQueries(prev => [...prev, ...voltageDataSResponse.sqlQueries]);
    }
  }, [voltageDataSResponse]);

  const { data: voltageDataTResponse } = useQuery({
    queryKey: ['/api/chart-data', 'voltage', 'T'],
    queryFn: () => apiRequest<ChartDataResponse>("GET", '/api/chart-data/voltage/T')
  });
  
  const voltageDataT = voltageDataTResponse?.data;
  
  useEffect(() => {
    if (voltageDataTResponse?.sqlQueries) {
      setSqlQueries(prev => [...prev, ...voltageDataTResponse.sqlQueries]);
    }
  }, [voltageDataTResponse]);

  const { data: currentDataRResponse } = useQuery({
    queryKey: ['/api/chart-data', 'current', 'R'],
    queryFn: () => apiRequest<ChartDataResponse>("GET", '/api/chart-data/current/R')
  });
  
  const currentDataR = currentDataRResponse?.data;
  
  useEffect(() => {
    if (currentDataRResponse?.sqlQueries) {
      setSqlQueries(prev => [...prev, ...currentDataRResponse.sqlQueries]);
    }
  }, [currentDataRResponse]);

  const { data: currentDataSResponse } = useQuery({
    queryKey: ['/api/chart-data', 'current', 'S'],
    queryFn: () => apiRequest<ChartDataResponse>("GET", '/api/chart-data/current/S')
  });
  
  const currentDataS = currentDataSResponse?.data;
  
  useEffect(() => {
    if (currentDataSResponse?.sqlQueries) {
      setSqlQueries(prev => [...prev, ...currentDataSResponse.sqlQueries]);
    }
  }, [currentDataSResponse]);

  const { data: currentDataTResponse } = useQuery({
    queryKey: ['/api/chart-data', 'current', 'T'],
    queryFn: () => apiRequest<ChartDataResponse>("GET", '/api/chart-data/current/T')
  });
  
  const currentDataT = currentDataTResponse?.data;
  
  useEffect(() => {
    if (currentDataTResponse?.sqlQueries) {
      setSqlQueries(prev => [...prev, ...currentDataTResponse.sqlQueries]);
    }
  }, [currentDataTResponse]);

  const { data: powerDataRResponse } = useQuery({
    queryKey: ['/api/chart-data', 'power', 'R'],
    queryFn: () => apiRequest<ChartDataResponse>("GET", '/api/chart-data/power/R')
  });
  
  const powerDataR = powerDataRResponse?.data;
  
  useEffect(() => {
    if (powerDataRResponse?.sqlQueries) {
      setSqlQueries(prev => [...prev, ...powerDataRResponse.sqlQueries]);
    }
  }, [powerDataRResponse]);

  const { data: powerDataSResponse } = useQuery({
    queryKey: ['/api/chart-data', 'power', 'S'],
    queryFn: () => apiRequest<ChartDataResponse>("GET", '/api/chart-data/power/S')
  });
  
  const powerDataS = powerDataSResponse?.data;
  
  useEffect(() => {
    if (powerDataSResponse?.sqlQueries) {
      setSqlQueries(prev => [...prev, ...powerDataSResponse.sqlQueries]);
    }
  }, [powerDataSResponse]);

  const { data: powerDataTResponse } = useQuery({
    queryKey: ['/api/chart-data', 'power', 'T'],
    queryFn: () => apiRequest<ChartDataResponse>("GET", '/api/chart-data/power/T')
  });
  
  const powerDataT = powerDataTResponse?.data;
  
  useEffect(() => {
    if (powerDataTResponse?.sqlQueries) {
      setSqlQueries(prev => [...prev, ...powerDataTResponse.sqlQueries]);
    }
  }, [powerDataTResponse]);
  
  const { data: frequencyDataRResponse } = useQuery({
    queryKey: ['/api/chart-data', 'frequency', 'R'],
    queryFn: () => apiRequest<ChartDataResponse>("GET", '/api/chart-data/frequency/R')
  });
  
  const frequencyDataR = frequencyDataRResponse?.data;
  
  useEffect(() => {
    if (frequencyDataRResponse?.sqlQueries) {
      setSqlQueries(prev => [...prev, ...frequencyDataRResponse.sqlQueries]);
    }
  }, [frequencyDataRResponse]);

  const { data: frequencyDataSResponse } = useQuery({
    queryKey: ['/api/chart-data', 'frequency', 'S'],
    queryFn: () => apiRequest<ChartDataResponse>("GET", '/api/chart-data/frequency/S')
  });
  
  const frequencyDataS = frequencyDataSResponse?.data;
  
  useEffect(() => {
    if (frequencyDataSResponse?.sqlQueries) {
      setSqlQueries(prev => [...prev, ...frequencyDataSResponse.sqlQueries]);
    }
  }, [frequencyDataSResponse]);

  const { data: frequencyDataTResponse } = useQuery({
    queryKey: ['/api/chart-data', 'frequency', 'T'],
    queryFn: () => apiRequest<ChartDataResponse>("GET", '/api/chart-data/frequency/T')
  });
  
  const frequencyDataT = frequencyDataTResponse?.data;
  
  useEffect(() => {
    if (frequencyDataTResponse?.sqlQueries) {
      setSqlQueries(prev => [...prev, ...frequencyDataTResponse.sqlQueries]);
    }
  }, [frequencyDataTResponse]);
  
  const { data: pfDataRResponse } = useQuery({
    queryKey: ['/api/chart-data', 'pf', 'R'],
    queryFn: () => apiRequest<ChartDataResponse>("GET", '/api/chart-data/pf/R')
  });
  
  const pfDataR = pfDataRResponse?.data;
  
  useEffect(() => {
    if (pfDataRResponse?.sqlQueries) {
      setSqlQueries(prev => [...prev, ...pfDataRResponse.sqlQueries]);
    }
  }, [pfDataRResponse]);

  const { data: pfDataSResponse } = useQuery({
    queryKey: ['/api/chart-data', 'pf', 'S'],
    queryFn: () => apiRequest<ChartDataResponse>("GET", '/api/chart-data/pf/S')
  });
  
  const pfDataS = pfDataSResponse?.data;
  
  useEffect(() => {
    if (pfDataSResponse?.sqlQueries) {
      setSqlQueries(prev => [...prev, ...pfDataSResponse.sqlQueries]);
    }
  }, [pfDataSResponse]);

  const { data: pfDataTResponse } = useQuery({
    queryKey: ['/api/chart-data', 'pf', 'T'],
    queryFn: () => apiRequest<ChartDataResponse>("GET", '/api/chart-data/pf/T')
  });
  
  const pfDataT = pfDataTResponse?.data;
  
  useEffect(() => {
    if (pfDataTResponse?.sqlQueries) {
      setSqlQueries(prev => [...prev, ...pfDataTResponse.sqlQueries]);
    }
  }, [pfDataTResponse]);
  
  // Process phase data into the format needed by components
  const processedPhaseData = Array.isArray(phaseDataArray) 
    ? phaseDataArray.reduce((acc: Record<string, { 
        voltage: number, 
        current: number, 
        power: number, 
        energy: number,
        frequency: number,
        pf: number
      }>, phase: PhaseData) => {
        acc[phase.phase] = {
          voltage: phase.voltage,
          current: phase.current,
          power: phase.power,
          energy: phase.energy,
          frequency: phase.frequency,
          pf: phase.pf
        };
        return acc;
      }, {} as Record<string, { 
        voltage: number, 
        current: number, 
        power: number, 
        energy: number,
        frequency: number,
        pf: number 
      }>)
    : defaultPhaseData;
  
  return (
    <HomeAssistant>
      <div className="space-y-4">
        {/* Panel Name Header */}
        <div className="bg-blue-600 text-white p-3 rounded-md">
          <h1 className="text-xl font-bold">Panel 2 66KVA Monitoring</h1>
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
                  title="Panel 2 66KVA - Phase R" 
                  phase="R"
                  voltage={processedPhaseData.R?.voltage || 0}
                  current={processedPhaseData.R?.current || 0}
                  power={processedPhaseData.R?.power || 0}
                  energy={processedPhaseData.R?.energy || 0}
                  frequency={processedPhaseData.R?.frequency || 0}
                  pf={processedPhaseData.R?.pf || 0}
                />
                
                <PowerMonitorCard 
                  title="Panel 2 66KVA - Phase S" 
                  phase="S"
                  voltage={processedPhaseData.S?.voltage || 0}
                  current={processedPhaseData.S?.current || 0}
                  power={processedPhaseData.S?.power || 0}
                  energy={processedPhaseData.S?.energy || 0}
                  frequency={processedPhaseData.S?.frequency || 0}
                  pf={processedPhaseData.S?.pf || 0}
                />
                
                <PowerMonitorCard 
                  title="Panel 2 66KVA - Phase T" 
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
              title="Panel 2 66KVA - Voltage" 
              phaseRData={processChartData(voltageDataR)}
              phaseSData={processChartData(voltageDataS)}
              phaseTData={processChartData(voltageDataT)}
              yAxisDomain={[190, 240]}
              unit="V"
            />
            
            <ChartCard 
              title="Panel 2 66KVA - Current" 
              phaseRData={processChartData(currentDataR)}
              phaseSData={processChartData(currentDataS)}
              phaseTData={processChartData(currentDataT)}
              yAxisDomain={[0, 100]}
              unit="A"
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <ChartCard 
              title="Panel 2 66KVA - Power" 
              phaseRData={processChartData(powerDataR)}
              phaseSData={processChartData(powerDataS)}
              phaseTData={processChartData(powerDataT)}
              yAxisDomain={[0, 20000]}
              unit="W"
            />
            
            <ChartCard 
              title="Panel 2 66KVA - Frequency" 
              phaseRData={processChartData(frequencyDataR)}
              phaseSData={processChartData(frequencyDataS)}
              phaseTData={processChartData(frequencyDataT)}
              yAxisDomain={[49.5, 50.5]}
              unit="Hz"
            />
            
            <ChartCard 
              title="Panel 2 66KVA - Power Factor" 
              phaseRData={processChartData(pfDataR)}
              phaseSData={processChartData(pfDataS)}
              phaseTData={processChartData(pfDataT)}
              yAxisDomain={[0.8, 1.0]}
              unit=""
            />
          </div>
        </div>
        
        {/* SQL Queries Display */}
        <div className="mt-8">
          <h2 className="text-lg font-semibold mb-3">SQL Queries</h2>
          <SqlQueryDisplay queries={sqlQueries} />
        </div>
      </div>
    </HomeAssistant>
  );
};

export default Panel66KVA;