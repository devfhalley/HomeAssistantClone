import { useState, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format, parseISO } from 'date-fns';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  TooltipProps,
  Line,
  ComposedChart
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChevronDown, ChevronUp, Info } from "lucide-react";
import SqlQueryDisplay from './SqlQueryDisplay';

interface PowerData {
  time: string;
  panel33Power?: number;
  panel66Power?: number;
  totalPower: number;
  voltR?: number;  // R phase voltage
  voltS?: number;  // S phase voltage
  voltT?: number;  // T phase voltage
}

interface SqlQuery {
  name: string;
  sql: string;
}

interface PowerDataResponse {
  data: PowerData[];
  sqlQueries: SqlQuery[];
}

// Interface for voltage data that we'll fetch separately
interface VoltageData {
  time: string;
  phase: string;
  dataType: string;
  value: number;
}

interface VoltageDataResponse {
  data: VoltageData[];
  sqlQueries: SqlQuery[];
}

interface StackedPowerAreaChartProps {
  title: string;
  panelType?: "33kva" | "66kva";  // Optional panel type parameter
  selectedDate?: Date;
  additionalQueryParams?: Record<string, string>; // Optional query parameters for API calls
}

// Custom tooltip component
const CustomTooltip = ({ active, payload, label }: TooltipProps<number, string>) => {
  if (active && payload && payload.length) {
    return (
      <div className="custom-tooltip bg-white p-3 border border-gray-200 shadow-lg rounded-md max-w-xs">
        <p className="label font-semibold">{`Time: ${label}`}</p>
        <div className="mt-1 border-t pt-1">
          <p className="font-medium text-sm">Power</p>
          {payload.filter(entry => entry.name && ['33KVA Panel', '66KVA Panel'].includes(entry.name)).map((entry, index) => (
            <p key={`power-${index}`} style={{ color: entry.color }} className="ml-2">
              {`${entry.name}: ${Number(entry.value).toFixed(2)} kW`}
            </p>
          ))}
        </div>
        <div className="mt-1 border-t pt-1">
          <p className="font-medium text-sm">Voltage</p>
          {payload.filter(entry => entry.name && ['R Phase', 'S Phase', 'T Phase'].includes(entry.name)).map((entry, index) => (
            <p key={`voltage-${index}`} style={{ color: entry.color }} className="ml-2">
              {`${entry.name}: ${Number(entry.value).toFixed(2)} V`}
            </p>
          ))}
        </div>
      </div>
    );
  }
  return null;
};

const StackedPowerAreaChart = ({ title, panelType, selectedDate, additionalQueryParams = {} }: StackedPowerAreaChartProps) => {
  const [showQueries, setShowQueries] = useState(false);

  // Create URL for power data with date parameter
  const getTotalPowerUrl = (specificDate?: Date): string => {
    const baseUrl = '/api/total-power';
    if (specificDate) {
      const dateParam = format(specificDate, 'yyyy-MM-dd');
      console.log("Requesting data for date:", dateParam);
      return `${baseUrl}?date=${dateParam}`;
    }
    return baseUrl;
  };
  
  // Create URL for voltage data with panel type and date parameters
  const createVoltageDataUrl = (phase: string, specificDate?: Date): string => {
    const baseUrl = `/api/chart-data/voltage/${phase}`;
    
    // Start building query params
    const queryParams: string[] = [];
    
    // Add date param if provided
    if (specificDate) {
      const dateParam = format(specificDate, 'yyyy-MM-dd');
      queryParams.push(`date=${dateParam}`);
    }
    
    // Add additional query params (like panel=33kva)
    Object.entries(additionalQueryParams).forEach(([key, value]) => {
      queryParams.push(`${key}=${value}`);
    });
    
    // Create final URL with query params
    if (queryParams.length > 0) {
      return `${baseUrl}?${queryParams.join('&')}`;
    }
    
    return baseUrl;
  };

  // Fetch power data with selected date
  const { data: powerData, isLoading: isPowerLoading } = useQuery<PowerDataResponse>({
    queryKey: ['/api/total-power', selectedDate ? format(selectedDate, 'yyyy-MM-dd') : 'current'],
    queryFn: async () => {
      const url = getTotalPowerUrl(selectedDate);
      console.log("Fetching power data from URL:", url);
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Failed to fetch power data');
      }
      const data = await response.json();
      console.log("Power data received:", data.data?.length || 0, "points");
      return data;
    },
    refetchInterval: 10000, // Refresh every 10 seconds
    refetchIntervalInBackground: true,
    staleTime: 0, // Consider data immediately stale to force refresh
  });
  
  // Fetch voltage data for R phase
  const { data: voltageRData, isLoading: isVoltageRLoading } = useQuery<VoltageDataResponse>({
    queryKey: [
      '/api/chart-data/voltage/R', 
      selectedDate ? format(selectedDate, 'yyyy-MM-dd') : 'current',
      Object.keys(additionalQueryParams).length > 0 ? JSON.stringify(additionalQueryParams) : 'default'
    ],
    queryFn: async () => {
      const url = createVoltageDataUrl('R', selectedDate);
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Failed to fetch R phase voltage data');
      }
      const data = await response.json();
      console.log("Voltage R data received:", data.data?.length || 0, "points");
      return data;
    },
    refetchInterval: 10000,
    refetchIntervalInBackground: true,
  });
  
  // Fetch voltage data for S phase
  const { data: voltageSData, isLoading: isVoltageSLoading } = useQuery<VoltageDataResponse>({
    queryKey: [
      '/api/chart-data/voltage/S', 
      selectedDate ? format(selectedDate, 'yyyy-MM-dd') : 'current',
      Object.keys(additionalQueryParams).length > 0 ? JSON.stringify(additionalQueryParams) : 'default'
    ],
    queryFn: async () => {
      const url = createVoltageDataUrl('S', selectedDate);
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Failed to fetch S phase voltage data');
      }
      const data = await response.json();
      console.log("Voltage S data received:", data.data?.length || 0, "points");
      return data;
    },
    refetchInterval: 10000,
    refetchIntervalInBackground: true,
  });
  
  // Fetch voltage data for T phase
  const { data: voltageTData, isLoading: isVoltageTLoading } = useQuery<VoltageDataResponse>({
    queryKey: [
      '/api/chart-data/voltage/T', 
      selectedDate ? format(selectedDate, 'yyyy-MM-dd') : 'current',
      Object.keys(additionalQueryParams).length > 0 ? JSON.stringify(additionalQueryParams) : 'default'
    ],
    queryFn: async () => {
      const url = createVoltageDataUrl('T', selectedDate);
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Failed to fetch T phase voltage data');
      }
      const data = await response.json();
      console.log("Voltage T data received:", data.data?.length || 0, "points");
      return data;
    },
    refetchInterval: 10000,
    refetchIntervalInBackground: true,
  });
  
  // Combine loading states
  const isLoading = isPowerLoading || isVoltageRLoading || isVoltageSLoading || isVoltageTLoading;

  // Log data for debugging
  useEffect(() => {
    if (powerData?.data) {
      console.log(`Using selected date: ${selectedDate ? format(selectedDate, 'yyyy-MM-dd') : 'current'} for power chart`);
      
      if (powerData.data.length > 0) {
        console.log("CHART DEBUG - Total power chart data points received:", powerData.data.length);
        
        const timePoints = powerData.data.map(d => d.time).join(", ");
        console.log("CHART DEBUG - All time points:", timePoints);
        
        console.log("CHART DEBUG - First data point:", powerData.data[0]);
        console.log("CHART DEBUG - Last data point:", powerData.data[powerData.data.length - 1]);
      }
    }
  }, [powerData, selectedDate]);

  // Combine power and voltage data
  const combinedData = useMemo(() => {
    if (!powerData?.data) return [];
    
    return powerData.data.map(point => {
      // Find matching voltage data points by time
      const timeStr = point.time;
      
      // Create a combined data point with voltage information
      let voltR = 0;
      let voltS = 0;
      let voltT = 0;
      
      // Find matching R phase voltage
      if (voltageRData?.data) {
        const rPoint = voltageRData.data.find(v => v.time === timeStr);
        if (rPoint) voltR = rPoint.value;
      }
      
      // Find matching S phase voltage
      if (voltageSData?.data) {
        const sPoint = voltageSData.data.find(v => v.time === timeStr);
        if (sPoint) voltS = sPoint.value;
      }
      
      // Find matching T phase voltage
      if (voltageTData?.data) {
        const tPoint = voltageTData.data.find(v => v.time === timeStr);
        if (tPoint) voltT = tPoint.value;
      }
      
      return {
        ...point,
        voltR,
        voltS,
        voltT
      };
    });
  }, [powerData?.data, voltageRData?.data, voltageSData?.data, voltageTData?.data]);

  // Prepare data for chart
  const chartData = combinedData;

  const formatYAxis = (value: number) => {
    return `${value} kW`;
  };

  const formatXAxis = (value: string) => {
    return value;  // Already formatted as HH:MM
  };

  return (
    <Card className="w-full shadow-md">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <CardTitle className="text-xl">{title}</CardTitle>
          <div className="flex gap-2">
            <button 
              onClick={() => setShowQueries(!showQueries)}
              className="text-xs px-2 py-1 rounded text-gray-600 hover:bg-gray-100 flex items-center">
              <Info className="w-4 h-4 mr-1" />
              SQL
              {showQueries ? <ChevronUp className="w-3 h-3 ml-1" /> : <ChevronDown className="w-3 h-3 ml-1" />}
            </button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center items-center h-80">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          <>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart
                  data={chartData}
                  margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis 
                    dataKey="time" 
                    tickFormatter={formatXAxis}
                    tick={{ fontSize: 12 }}
                  />
                  {/* Primary Y axis for power data (kW) */}
                  <YAxis 
                    yAxisId="left"
                    tickFormatter={formatYAxis}
                    tick={{ fontSize: 12 }}
                    width={60}
                    domain={[0, 'auto']}
                  />
                  
                  {/* Secondary Y axis for voltage data (V) */}
                  <YAxis 
                    yAxisId="right" 
                    orientation="right"
                    domain={[215, 223]} 
                    tick={{ fontSize: 12 }}
                    width={60}
                    tickFormatter={(value) => `${value}V`}
                  />
                  
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  
                  {/* Power data as stacked areas */}
                  {panelType !== "66kva" && (
                    <Area 
                      yAxisId="left"
                      type="monotone" 
                      dataKey="panel33Power" 
                      name="33KVA Panel"
                      stackId="1"
                      stroke="#3b82f6" 
                      fill="#3b82f6" 
                      fillOpacity={0.6}
                    />
                  )}
                  {panelType !== "33kva" && (
                    <Area 
                      yAxisId="left"
                      type="monotone" 
                      dataKey="panel66Power" 
                      name="66KVA Panel"
                      stackId="1"
                      stroke="#f59e0b" 
                      fill="#f59e0b" 
                      fillOpacity={0.6}
                    />
                  )}
                  
                  {/* Voltage data as lines */}
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="voltR"
                    name="R Phase"
                    stroke="#ef4444"
                    dot={false}
                    strokeWidth={2}
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="voltS"
                    name="S Phase"
                    stroke="#10b981"
                    dot={false}
                    strokeWidth={2}
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="voltT"
                    name="T Phase"
                    stroke="#8b5cf6"
                    dot={false}
                    strokeWidth={2}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
            {/* SQL Queries Display */}
            {showQueries && powerData?.sqlQueries && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <SqlQueryDisplay queries={powerData.sqlQueries} />
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default StackedPowerAreaChart;