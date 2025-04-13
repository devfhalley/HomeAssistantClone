import { useEffect, useState } from "react";
import HomeAssistant from "@/components/HomeAssistant";
import PowerMonitorCard from "@/components/PowerMonitorCard";
import ChartCard from "@/components/ChartCard";
import TotalPowerChart from "@/components/TotalPowerChart";
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

const Panel66KVA = () => {
  // Fetch phase data
  const { data: phaseDataArray, isLoading: isLoadingPhaseData } = useQuery({
    queryKey: ['/api/phase-data'],
    queryFn: () => apiRequest<PhaseData[]>('/api/phase-data')
  });

  // Fetch chart data for each type and phase
  const { data: voltageDataR } = useQuery({
    queryKey: ['/api/chart-data', 'voltage', 'R'],
    queryFn: () => apiRequest<ChartData[]>('/api/chart-data/voltage/R')
  });

  const { data: voltageDataS } = useQuery({
    queryKey: ['/api/chart-data', 'voltage', 'S'],
    queryFn: () => apiRequest<ChartData[]>('/api/chart-data/voltage/S')
  });

  const { data: voltageDataT } = useQuery({
    queryKey: ['/api/chart-data', 'voltage', 'T'],
    queryFn: () => apiRequest<ChartData[]>('/api/chart-data/voltage/T')
  });

  const { data: currentDataR } = useQuery({
    queryKey: ['/api/chart-data', 'current', 'R'],
    queryFn: () => apiRequest<ChartData[]>('/api/chart-data/current/R')
  });

  const { data: currentDataS } = useQuery({
    queryKey: ['/api/chart-data', 'current', 'S'],
    queryFn: () => apiRequest<ChartData[]>('/api/chart-data/current/S')
  });

  const { data: currentDataT } = useQuery({
    queryKey: ['/api/chart-data', 'current', 'T'],
    queryFn: () => apiRequest<ChartData[]>('/api/chart-data/current/T')
  });

  const { data: powerDataR } = useQuery({
    queryKey: ['/api/chart-data', 'power', 'R'],
    queryFn: () => apiRequest<ChartData[]>('/api/chart-data/power/R')
  });

  const { data: powerDataS } = useQuery({
    queryKey: ['/api/chart-data', 'power', 'S'],
    queryFn: () => apiRequest<ChartData[]>('/api/chart-data/power/S')
  });

  const { data: powerDataT } = useQuery({
    queryKey: ['/api/chart-data', 'power', 'T'],
    queryFn: () => apiRequest<ChartData[]>('/api/chart-data/power/T')
  });
  
  const { data: frequencyDataR } = useQuery({
    queryKey: ['/api/chart-data', 'frequency', 'R'],
    queryFn: () => apiRequest<ChartData[]>('/api/chart-data/frequency/R')
  });

  const { data: frequencyDataS } = useQuery({
    queryKey: ['/api/chart-data', 'frequency', 'S'],
    queryFn: () => apiRequest<ChartData[]>('/api/chart-data/frequency/S')
  });

  const { data: frequencyDataT } = useQuery({
    queryKey: ['/api/chart-data', 'frequency', 'T'],
    queryFn: () => apiRequest<ChartData[]>('/api/chart-data/frequency/T')
  });
  
  const { data: pfDataR } = useQuery({
    queryKey: ['/api/chart-data', 'pf', 'R'],
    queryFn: () => apiRequest<ChartData[]>('/api/chart-data/pf/R')
  });

  const { data: pfDataS } = useQuery({
    queryKey: ['/api/chart-data', 'pf', 'S'],
    queryFn: () => apiRequest<ChartData[]>('/api/chart-data/pf/S')
  });

  const { data: pfDataT } = useQuery({
    queryKey: ['/api/chart-data', 'pf', 'T'],
    queryFn: () => apiRequest<ChartData[]>('/api/chart-data/pf/T')
  });
  
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Panel Name Header */}
        <div className="col-span-3 bg-blue-600 text-white p-3 rounded-md mb-2">
          <h1 className="text-xl font-bold">Panel 2 66KVA Monitoring</h1>
        </div>
        
        {/* Power Monitor Cards */}
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

        {/* Chart Cards - First Row */}
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
        
        <ChartCard 
          title="Panel 2 66KVA - Power" 
          phaseRData={processChartData(powerDataR)}
          phaseSData={processChartData(powerDataS)}
          phaseTData={processChartData(powerDataT)}
          yAxisDomain={[0, 20000]}
          unit="W"
        />
        
        {/* Chart Cards - Second Row */}
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

        {/* Total Power Consumption Chart - Third Row */}
        <TotalPowerChart />
      </div>
    </HomeAssistant>
  );
};

export default Panel66KVA;