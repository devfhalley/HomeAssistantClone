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
import { format } from "date-fns";
import { Button } from "@/components/ui/button";

// Helper function to create chart data URLs with date parameters
const createChartDataUrl = (dataType: string, phase: string, date?: Date): string => {
  if (date) {
    return `/api/chart-data/${dataType}/${phase}?date=${date.toISOString()}`;
  }
  return `/api/chart-data/${dataType}/${phase}`;
};

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
  // Add selectedDate state, default to today's date
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  // State to control SQL debug display
  const [showDebugInfo, setShowDebugInfo] = useState<boolean>(false);
  
  useEffect(() => {
    document.title = "Home Assistant - Panel 66KVA";
    
    // Log the selected date for monitoring
    console.log("Using selected date:", format(selectedDate, "yyyy-MM-dd"), "for 66KVA panel");
  }, [selectedDate]);
  
  // Fetch phase data with automatic refetching every 10 seconds
  const { 
    data: phaseDataArray, 
    isLoading: isLoadingPhaseData, 
    isFetching: isFetchingPhaseData 
  } = useQuery({
    queryKey: ['/api/phase-data'],
    queryFn: () => apiRequest<PhaseData[]>("GET", '/api/phase-data'),
    refetchInterval: 10000, // Refetch every 10 seconds
    refetchIntervalInBackground: true // Continue refetching even when tab is not active
  });

  // State to store SQL queries
  const [sqlQueries, setSqlQueries] = useState<{ name: string; sql: string; }[]>([]);
  
  // Create interfaces for the new response formats
  interface ChartDataResponse {
    data: ChartData[];
    sqlQueries: { name: string; sql: string; }[];
  }
  
  // Fetch chart data for each type and phase
  const { 
    data: voltageDataRResponse,
    isFetching: isFetchingVoltageR
  } = useQuery({
    queryKey: ['/api/chart-data', 'voltage', 'R', selectedDate?.toISOString()],
    queryFn: () => apiRequest<ChartDataResponse>("GET", `/api/chart-data/voltage/R?date=${selectedDate?.toISOString()}`),
    refetchInterval: 10000, // Refetch every 10 seconds
    refetchIntervalInBackground: true
  });
  
  // Extract the chart data from the response
  const voltageDataR = voltageDataRResponse?.data;
  
  // Collect SQL queries
  useEffect(() => {
    if (voltageDataRResponse?.sqlQueries) {
      setSqlQueries(prev => [...prev, ...voltageDataRResponse.sqlQueries]);
    }
  }, [voltageDataRResponse]);

  const { 
    data: voltageDataSResponse,
    isFetching: isFetchingVoltageS
  } = useQuery({
    queryKey: ['/api/chart-data', 'voltage', 'S', selectedDate?.toISOString()],
    queryFn: () => apiRequest<ChartDataResponse>("GET", createChartDataUrl('voltage', 'S', selectedDate)),
    refetchInterval: 10000, // Refetch every 10 seconds
    refetchIntervalInBackground: true
  });
  
  const voltageDataS = voltageDataSResponse?.data;
  
  useEffect(() => {
    if (voltageDataSResponse?.sqlQueries) {
      setSqlQueries(prev => [...prev, ...voltageDataSResponse.sqlQueries]);
    }
  }, [voltageDataSResponse]);

  const { 
    data: voltageDataTResponse,
    isFetching: isFetchingVoltageT
  } = useQuery({
    queryKey: ['/api/chart-data', 'voltage', 'T', selectedDate?.toISOString()],
    queryFn: () => apiRequest<ChartDataResponse>("GET", createChartDataUrl('voltage', 'T', selectedDate)),
    refetchInterval: 10000, // Refetch every 10 seconds
    refetchIntervalInBackground: true
  });
  
  const voltageDataT = voltageDataTResponse?.data;
  
  useEffect(() => {
    if (voltageDataTResponse?.sqlQueries) {
      setSqlQueries(prev => [...prev, ...voltageDataTResponse.sqlQueries]);
    }
  }, [voltageDataTResponse]);

  const { 
    data: currentDataRResponse,
    isFetching: isFetchingCurrentR
  } = useQuery({
    queryKey: ['/api/chart-data', 'current', 'R', selectedDate?.toISOString()],
    queryFn: () => apiRequest<ChartDataResponse>("GET", createChartDataUrl('current', 'R', selectedDate)),
    refetchInterval: 10000, // Refetch every 10 seconds
    refetchIntervalInBackground: true
  });
  
  const currentDataR = currentDataRResponse?.data;
  
  useEffect(() => {
    if (currentDataRResponse?.sqlQueries) {
      setSqlQueries(prev => [...prev, ...currentDataRResponse.sqlQueries]);
    }
  }, [currentDataRResponse]);

  const { 
    data: currentDataSResponse,
    isFetching: isFetchingCurrentS 
  } = useQuery({
    queryKey: ['/api/chart-data', 'current', 'S', selectedDate?.toISOString()],
    queryFn: () => apiRequest<ChartDataResponse>("GET", createChartDataUrl('current', 'S', selectedDate)),
    refetchInterval: 10000, // Refetch every 10 seconds
    refetchIntervalInBackground: true
  });
  
  const currentDataS = currentDataSResponse?.data;
  
  useEffect(() => {
    if (currentDataSResponse?.sqlQueries) {
      setSqlQueries(prev => [...prev, ...currentDataSResponse.sqlQueries]);
    }
  }, [currentDataSResponse]);

  const { 
    data: currentDataTResponse,
    isFetching: isFetchingCurrentT 
  } = useQuery({
    queryKey: ['/api/chart-data', 'current', 'T', selectedDate?.toISOString()],
    queryFn: () => apiRequest<ChartDataResponse>("GET", createChartDataUrl('current', 'T', selectedDate)),
    refetchInterval: 10000, // Refetch every 10 seconds
    refetchIntervalInBackground: true
  });
  
  const currentDataT = currentDataTResponse?.data;
  
  useEffect(() => {
    if (currentDataTResponse?.sqlQueries) {
      setSqlQueries(prev => [...prev, ...currentDataTResponse.sqlQueries]);
    }
  }, [currentDataTResponse]);

  const { 
    data: powerDataRResponse,
    isFetching: isFetchingPowerR
  } = useQuery({
    queryKey: ['/api/chart-data', 'power', 'R', selectedDate?.toISOString()],
    queryFn: () => apiRequest<ChartDataResponse>("GET", createChartDataUrl('power', 'R', selectedDate)),
    refetchInterval: 10000, // Refetch every 10 seconds
    refetchIntervalInBackground: true
  });
  
  const powerDataR = powerDataRResponse?.data;
  
  useEffect(() => {
    if (powerDataRResponse?.sqlQueries) {
      setSqlQueries(prev => [...prev, ...powerDataRResponse.sqlQueries]);
    }
  }, [powerDataRResponse]);

  const { 
    data: powerDataSResponse,
    isFetching: isFetchingPowerS 
  } = useQuery({
    queryKey: ['/api/chart-data', 'power', 'S', selectedDate?.toISOString()],
    queryFn: () => apiRequest<ChartDataResponse>("GET", createChartDataUrl('power', 'S', selectedDate)),
    refetchInterval: 10000, // Refetch every 10 seconds
    refetchIntervalInBackground: true
  });
  
  const powerDataS = powerDataSResponse?.data;
  
  useEffect(() => {
    if (powerDataSResponse?.sqlQueries) {
      setSqlQueries(prev => [...prev, ...powerDataSResponse.sqlQueries]);
    }
  }, [powerDataSResponse]);

  const { 
    data: powerDataTResponse,
    isFetching: isFetchingPowerT 
  } = useQuery({
    queryKey: ['/api/chart-data', 'power', 'T'],
    queryFn: () => apiRequest<ChartDataResponse>("GET", '/api/chart-data/power/T'),
    refetchInterval: 10000, // Refetch every 10 seconds
    refetchIntervalInBackground: true
  });
  
  const powerDataT = powerDataTResponse?.data;
  
  useEffect(() => {
    if (powerDataTResponse?.sqlQueries) {
      setSqlQueries(prev => [...prev, ...powerDataTResponse.sqlQueries]);
    }
  }, [powerDataTResponse]);
  
  const { 
    data: frequencyDataRResponse,
    isFetching: isFetchingFrequencyR 
  } = useQuery({
    queryKey: ['/api/chart-data', 'frequency', 'R'],
    queryFn: () => apiRequest<ChartDataResponse>("GET", '/api/chart-data/frequency/R'),
    refetchInterval: 10000, // Refetch every 10 seconds
    refetchIntervalInBackground: true
  });
  
  const frequencyDataR = frequencyDataRResponse?.data;
  
  useEffect(() => {
    if (frequencyDataRResponse?.sqlQueries) {
      setSqlQueries(prev => [...prev, ...frequencyDataRResponse.sqlQueries]);
    }
  }, [frequencyDataRResponse]);

  const { 
    data: frequencyDataSResponse,
    isFetching: isFetchingFrequencyS
  } = useQuery({
    queryKey: ['/api/chart-data', 'frequency', 'S'],
    queryFn: () => apiRequest<ChartDataResponse>("GET", '/api/chart-data/frequency/S'),
    refetchInterval: 10000, // Refetch every 10 seconds
    refetchIntervalInBackground: true
  });
  
  const frequencyDataS = frequencyDataSResponse?.data;
  
  useEffect(() => {
    if (frequencyDataSResponse?.sqlQueries) {
      setSqlQueries(prev => [...prev, ...frequencyDataSResponse.sqlQueries]);
    }
  }, [frequencyDataSResponse]);

  const { 
    data: frequencyDataTResponse,
    isFetching: isFetchingFrequencyT 
  } = useQuery({
    queryKey: ['/api/chart-data', 'frequency', 'T'],
    queryFn: () => apiRequest<ChartDataResponse>("GET", '/api/chart-data/frequency/T'),
    refetchInterval: 10000, // Refetch every 10 seconds
    refetchIntervalInBackground: true
  });
  
  const frequencyDataT = frequencyDataTResponse?.data;
  
  useEffect(() => {
    if (frequencyDataTResponse?.sqlQueries) {
      setSqlQueries(prev => [...prev, ...frequencyDataTResponse.sqlQueries]);
    }
  }, [frequencyDataTResponse]);
  
  const { 
    data: pfDataRResponse,
    isFetching: isFetchingPfR 
  } = useQuery({
    queryKey: ['/api/chart-data', 'pf', 'R'],
    queryFn: () => apiRequest<ChartDataResponse>("GET", '/api/chart-data/pf/R'),
    refetchInterval: 10000, // Refetch every 10 seconds
    refetchIntervalInBackground: true
  });
  
  const pfDataR = pfDataRResponse?.data;
  
  useEffect(() => {
    if (pfDataRResponse?.sqlQueries) {
      setSqlQueries(prev => [...prev, ...pfDataRResponse.sqlQueries]);
    }
  }, [pfDataRResponse]);

  const { 
    data: pfDataSResponse,
    isFetching: isFetchingPfS 
  } = useQuery({
    queryKey: ['/api/chart-data', 'pf', 'S'],
    queryFn: () => apiRequest<ChartDataResponse>("GET", '/api/chart-data/pf/S'),
    refetchInterval: 10000, // Refetch every 10 seconds
    refetchIntervalInBackground: true
  });
  
  const pfDataS = pfDataSResponse?.data;
  
  useEffect(() => {
    if (pfDataSResponse?.sqlQueries) {
      setSqlQueries(prev => [...prev, ...pfDataSResponse.sqlQueries]);
    }
  }, [pfDataSResponse]);

  const { 
    data: pfDataTResponse,
    isFetching: isFetchingPfT
  } = useQuery({
    queryKey: ['/api/chart-data', 'pf', 'T'],
    queryFn: () => apiRequest<ChartDataResponse>("GET", '/api/chart-data/pf/T'),
    refetchInterval: 10000, // Refetch every 10 seconds
    refetchIntervalInBackground: true
  });
  
  const pfDataT = pfDataTResponse?.data;
  
  useEffect(() => {
    if (pfDataTResponse?.sqlQueries) {
      setSqlQueries(prev => [...prev, ...pfDataTResponse.sqlQueries]);
    }
  }, [pfDataTResponse]);
  
  // Process and collect phase data + SQL queries
  const [processedPhaseData, setProcessedPhaseData] = useState(defaultPhaseData);

  // Compute if any data is currently being fetched
  const isFetchingData = 
    isFetchingPhaseData || 
    isFetchingVoltageR || isFetchingVoltageS || isFetchingVoltageT ||
    isFetchingCurrentR || isFetchingCurrentS || isFetchingCurrentT ||
    isFetchingPowerR || isFetchingPowerS || isFetchingPowerT ||
    isFetchingFrequencyR || isFetchingFrequencyS || isFetchingFrequencyT ||
    isFetchingPfR || isFetchingPfS || isFetchingPfT;
  
  useEffect(() => {
    // Process phase data
    const newProcessedData = { ...defaultPhaseData };
    const newSqlQueries: { name: string; sql: string; }[] = [];
    
    // Process all phases response
    if (phaseDataArray && Array.isArray(phaseDataArray)) {
      // Update phase data from all phases response
      for (const phaseData of phaseDataArray) {
        if (phaseData.phase === 'R') {
          newProcessedData.R = {
            voltage: phaseData.voltage,
            current: phaseData.current,
            power: phaseData.power,
            energy: phaseData.energy,
            frequency: phaseData.frequency,
            pf: phaseData.pf
          };
        } else if (phaseData.phase === 'S') {
          newProcessedData.S = {
            voltage: phaseData.voltage,
            current: phaseData.current,
            power: phaseData.power,
            energy: phaseData.energy,
            frequency: phaseData.frequency,
            pf: phaseData.pf
          };
        } else if (phaseData.phase === 'T') {
          newProcessedData.T = {
            voltage: phaseData.voltage,
            current: phaseData.current,
            power: phaseData.power,
            energy: phaseData.energy,
            frequency: phaseData.frequency,
            pf: phaseData.pf
          };
        }
      }
    }
    
    setProcessedPhaseData(newProcessedData);
  }, [phaseDataArray]);
  
  return (
    <HomeAssistant>
      <div className="space-y-4">
        {/* Panel Name Header */}
        <div className="bg-amber-600 text-white p-3 rounded-md flex justify-between items-center">
          <h1 className="text-xl font-bold">Panel 2 66KVA Monitoring</h1>
          {isFetchingData && (
            <div className="flex items-center">
              <RefreshCw className="w-4 h-4 mr-2 text-white animate-spin" />
              <span className="text-sm text-white">Refreshing data...</span>
            </div>
          )}
        </div>
        
        {/* Total Power Consumption Chart */}
        <div>
          <TotalPowerChart selectedDate={selectedDate} onDateChange={setSelectedDate} />
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
              selectedDate={selectedDate}
            />
            
            <ChartCard 
              title="Panel 2 66KVA - Current" 
              phaseRData={processChartData(currentDataR)}
              phaseSData={processChartData(currentDataS)}
              phaseTData={processChartData(currentDataT)}
              yAxisDomain={[0, 100]}
              unit="A"
              selectedDate={selectedDate}
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
              selectedDate={selectedDate}
            />
            
            <ChartCard 
              title="Panel 2 66KVA - Frequency" 
              phaseRData={processChartData(frequencyDataR)}
              phaseSData={processChartData(frequencyDataS)}
              phaseTData={processChartData(frequencyDataT)}
              yAxisDomain={[49.5, 50.5]}
              unit="Hz"
              selectedDate={selectedDate}
            />
            
            <ChartCard 
              title="Panel 2 66KVA - Power Factor" 
              phaseRData={processChartData(pfDataR)}
              phaseSData={processChartData(pfDataS)}
              phaseTData={processChartData(pfDataT)}
              yAxisDomain={[0.8, 1.0]}
              unit=""
              selectedDate={selectedDate}
            />
          </div>
        </div>
        
        {/* Debug Button */}
        <div className="mt-4 flex justify-end">
          <Button 
            variant={showDebugInfo ? "secondary" : "outline"}
            size="sm" 
            onClick={() => setShowDebugInfo(!showDebugInfo)}
          >
            {showDebugInfo ? "Hide Debug" : "Show Debug"}
          </Button>
        </div>

        {/* SQL Queries Display - Only shown when debug toggle is on */}
        {showDebugInfo && sqlQueries.length > 0 && (
          <div className="mt-4">
            <h2 className="text-lg font-semibold mb-3">SQL Debug Information</h2>
            <SqlQueryDisplay queries={sqlQueries} />
          </div>
        )}
      </div>
    </HomeAssistant>
  );
};

export default Panel66KVA;