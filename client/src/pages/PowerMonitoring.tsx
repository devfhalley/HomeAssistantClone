import { useEffect, useState } from "react";
import HomeAssistant from "@/components/HomeAssistant";
import PowerMonitorCard from "@/components/PowerMonitorCard";
import ChartCard from "@/components/ChartCard";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { type PhaseData, type ChartData } from "@shared/schema";

interface ChartDataPoint {
  time: string;
  value: number;
}

// Default data fallback in case API fails
const defaultPhaseData = {
  R: { voltage: 0, current: 0, power: 0, energy: 0 },
  S: { voltage: 0, current: 0, power: 0, energy: 0 },
  T: { voltage: 0, current: 0, power: 0, energy: 0 }
};

const processChartData = (data: ChartData[] | undefined): ChartDataPoint[] => {
  if (!data) return [];
  return data.map(item => ({
    time: item.time,
    value: item.value
  }));
};

const PowerMonitoring = () => {
  // Fetch phase data
  const { data: phaseDataArray, isLoading: isLoadingPhaseData } = useQuery({
    queryKey: ['/api/phase-data'],
    queryFn: async () => {
      const response = await apiRequest('/api/phase-data');
      return response as PhaseData[];
    }
  });

  // Fetch chart data for each type and phase
  const { data: voltageDataR } = useQuery({
    queryKey: ['/api/chart-data', 'voltage', 'R'],
    queryFn: async () => {
      const response = await apiRequest('/api/chart-data/voltage/R');
      return response as ChartData[];
    }
  });

  const { data: voltageDataS } = useQuery({
    queryKey: ['/api/chart-data', 'voltage', 'S'],
    queryFn: async () => {
      const response = await apiRequest('/api/chart-data/voltage/S');
      return response as ChartData[];
    }
  });

  const { data: voltageDataT } = useQuery({
    queryKey: ['/api/chart-data', 'voltage', 'T'],
    queryFn: async () => {
      const response = await apiRequest('/api/chart-data/voltage/T');
      return response as ChartData[];
    }
  });

  const { data: currentDataR } = useQuery({
    queryKey: ['/api/chart-data', 'current', 'R'],
    queryFn: async () => {
      const response = await apiRequest('/api/chart-data/current/R');
      return response as ChartData[];
    }
  });

  const { data: currentDataS } = useQuery({
    queryKey: ['/api/chart-data', 'current', 'S'],
    queryFn: async () => {
      const response = await apiRequest('/api/chart-data/current/S');
      return response as ChartData[];
    }
  });

  const { data: currentDataT } = useQuery({
    queryKey: ['/api/chart-data', 'current', 'T'],
    queryFn: async () => {
      const response = await apiRequest('/api/chart-data/current/T');
      return response as ChartData[];
    }
  });

  const { data: powerDataR } = useQuery({
    queryKey: ['/api/chart-data', 'power', 'R'],
    queryFn: async () => {
      const response = await apiRequest('/api/chart-data/power/R');
      return response as ChartData[];
    }
  });

  const { data: powerDataS } = useQuery({
    queryKey: ['/api/chart-data', 'power', 'S'],
    queryFn: async () => {
      const response = await apiRequest('/api/chart-data/power/S');
      return response as ChartData[];
    }
  });

  const { data: powerDataT } = useQuery({
    queryKey: ['/api/chart-data', 'power', 'T'],
    queryFn: async () => {
      const response = await apiRequest('/api/chart-data/power/T');
      return response as ChartData[];
    }
  });
  
  // Process phase data into the format needed by components
  const processedPhaseData = phaseDataArray?.reduce((acc: Record<string, { voltage: number, current: number, power: number, energy: number }>, phase: PhaseData) => {
    acc[phase.phase] = {
      voltage: phase.voltage,
      current: phase.current,
      power: phase.power,
      energy: phase.energy
    };
    return acc;
  }, {} as Record<string, { voltage: number, current: number, power: number, energy: number }>) || defaultPhaseData;
  
  return (
    <HomeAssistant>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
              title="Power Monitor phase R" 
              phase="R"
              voltage={processedPhaseData.R?.voltage || 0}
              current={processedPhaseData.R?.current || 0}
              power={processedPhaseData.R?.power || 0}
              energy={processedPhaseData.R?.energy || 0}
            />
            
            <PowerMonitorCard 
              title="Power Monitor phase S" 
              phase="S"
              voltage={processedPhaseData.S?.voltage || 0}
              current={processedPhaseData.S?.current || 0}
              power={processedPhaseData.S?.power || 0}
              energy={processedPhaseData.S?.energy || 0}
            />
            
            <PowerMonitorCard 
              title="Power Monitor phase T" 
              phase="T"
              voltage={processedPhaseData.T?.voltage || 0}
              current={processedPhaseData.T?.current || 0}
              power={processedPhaseData.T?.power || 0}
              energy={processedPhaseData.T?.energy || 0}
            />
          </>
        )}

        {/* Chart Cards */}
        <ChartCard 
          title="Voltage Comparison" 
          phaseRData={processChartData(voltageDataR)}
          phaseSData={processChartData(voltageDataS)}
          phaseTData={processChartData(voltageDataT)}
          yAxisDomain={[190, 240]}
          unit="V"
        />
        
        <ChartCard 
          title="Current Comparison" 
          phaseRData={processChartData(currentDataR)}
          phaseSData={processChartData(currentDataS)}
          phaseTData={processChartData(currentDataT)}
          yAxisDomain={[0, 100]}
          unit="A"
        />
        
        <ChartCard 
          title="Power Comparison" 
          phaseRData={processChartData(powerDataR)}
          phaseSData={processChartData(powerDataS)}
          phaseTData={processChartData(powerDataT)}
          yAxisDomain={[0, 20000]}
          unit="W"
        />
      </div>
    </HomeAssistant>
  );
};

export default PowerMonitoring;
