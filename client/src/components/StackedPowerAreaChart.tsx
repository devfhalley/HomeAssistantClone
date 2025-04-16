import { useState, useEffect, useMemo, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format, parseISO } from 'date-fns';
import { queryClient } from '@/lib/queryClient';
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
  LineChart,
  ComposedChart
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { ChevronDown, ChevronUp, Info, CalendarIcon } from "lucide-react";
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
    // Separate power and voltage entries
    const powerEntries = payload.filter(entry => 
      entry.name && ['33KVA Panel', '66KVA Panel'].includes(entry.name)
    );
    
    const voltageEntries = payload.filter(entry => 
      entry.name && entry.name.includes('Phase')
    );
    
    return (
      <div className="custom-tooltip bg-white p-3 border border-gray-200 shadow-lg rounded-md max-w-xs">
        <p className="label font-semibold">{`Time: ${label}`}</p>
        
        {powerEntries.length > 0 && (
          <div className="mt-1 border-t pt-1">
            <p className="font-medium text-sm">Power</p>
            {powerEntries.map((entry, index) => (
              <p key={`power-${index}`} style={{ color: entry.color }} className="ml-2">
                {`${entry.name}: ${Number(entry.value).toFixed(2)} kW`}
              </p>
            ))}
          </div>
        )}
        
        {voltageEntries.length > 0 && (
          <div className="mt-1 border-t pt-1">
            <p className="font-medium text-sm">Voltage</p>
            {voltageEntries.map((entry, index) => (
              <p key={`voltage-${index}`} style={{ color: entry.color }} className="ml-2">
                {`${entry.name}: ${Number(entry.value).toFixed(1)} V`}
              </p>
            ))}
          </div>
        )}
      </div>
    );
  }
  return null;
};

const StackedPowerAreaChart = ({ title, panelType, selectedDate: propSelectedDate, additionalQueryParams = {} }: StackedPowerAreaChartProps) => {
  const [showQueries, setShowQueries] = useState(false);
  const [localSelectedDate, setLocalSelectedDate] = useState<Date | undefined>(propSelectedDate || new Date());
  
  // Use either the prop date or local state
  const selectedDate = propSelectedDate || localSelectedDate;
  
  // Handle date change and propagate it upwards if an onDateChange prop is provided
  const handleDateChange = (date: Date | undefined) => {
    if (date) {
      console.log("Date selected:", format(date, 'yyyy-MM-dd'));
      setLocalSelectedDate(date);
      // We don't close the popover here, so user can verify selection and click Apply
    }
  };
  
  // Function to apply the selected date
  const applySelectedDate = () => {
    if (selectedDate) {
      console.log("Applying date:", format(selectedDate, 'yyyy-MM-dd'));
      
      // Force a state update to trigger refetch
      const dateQuery = format(selectedDate, 'yyyy-MM-dd');
      
      // Directly fetch data with the current date
      fetch(`/api/total-power?date=${dateQuery}`)
        .then(res => res.json())
        .then(data => {
          console.log("Refreshed power data:", data.data?.length || 0, "points");
          // After successful fetch, invalidate the queries to trigger UI refresh
          queryClient.invalidateQueries({ queryKey: ['/api/total-power'] });
          queryClient.invalidateQueries({ queryKey: ['/api/chart-data/voltage/R'] });
          queryClient.invalidateQueries({ queryKey: ['/api/chart-data/voltage/S'] });
          queryClient.invalidateQueries({ queryKey: ['/api/chart-data/voltage/T'] });
        });
    }
  };

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

  // Process voltage data to ensure hourly format that matches power data
  const processVoltageData = useCallback((data: { phase: string, dataType: string, time: string, value: number }[] | undefined) => {
    if (!data) return [];
    
    // Group by hour and compute average
    const hourlyData: { [hour: string]: { sum: number, count: number } } = {};
    
    // First, group all values by hour
    data.forEach(point => {
      // Normalize time format to ensure it's always "HH:00" format
      const hour = point.time.split(':')[0].padStart(2, '0') + ":00";
      
      if (!hourlyData[hour]) {
        hourlyData[hour] = { sum: 0, count: 0 };
      }
      
      hourlyData[hour].sum += point.value;
      hourlyData[hour].count += 1;
    });
    
    // Then create averaged points for each hour
    return Object.entries(hourlyData).map(([hour, { sum, count }]) => ({
      time: hour,
      value: count > 0 ? sum / count : 0 // Calculate average or default to 0
    }));
  }, []);
  
  // Process all voltage data sets
  const processedVoltageRData = useMemo(() => processVoltageData(voltageRData?.data), [voltageRData?.data, processVoltageData]);
  const processedVoltageSData = useMemo(() => processVoltageData(voltageSData?.data), [voltageSData?.data, processVoltageData]);
  const processedVoltageTData = useMemo(() => processVoltageData(voltageTData?.data), [voltageTData?.data, processVoltageData]);
  
  // Debug the processed data
  useEffect(() => {
    if (processedVoltageRData.length > 0) {
      console.log("Processed Voltage R data:", processedVoltageRData.slice(0, 5), "...", processedVoltageRData.length, "points");
    }
    if (powerData?.data && powerData.data.length > 0) {
      console.log("Power data format:", powerData.data.slice(0, 5), "...", powerData.data.length, "points");
    }
  }, [processedVoltageRData, powerData?.data]);
  
  // Combine power and voltage data
  const combinedData = useMemo(() => {
    if (!powerData?.data) return [];
    
    // Create a set of all voltage hours we have data for
    const voltageHours = new Set<string>();
    processedVoltageRData.forEach(point => voltageHours.add(point.time));
    processedVoltageSData.forEach(point => voltageHours.add(point.time));
    processedVoltageTData.forEach(point => voltageHours.add(point.time));
    
    // Calculate default voltage values (averages) for hours without data
    const defaultVoltR = processedVoltageRData.reduce((sum, point) => sum + point.value, 0) / 
                         (processedVoltageRData.length || 1);
    const defaultVoltS = processedVoltageSData.reduce((sum, point) => sum + point.value, 0) / 
                         (processedVoltageSData.length || 1);
    const defaultVoltT = processedVoltageTData.reduce((sum, point) => sum + point.value, 0) / 
                         (processedVoltageTData.length || 1);
    
    console.log(`Using default voltage values (averages) - R: ${defaultVoltR.toFixed(1)}V, S: ${defaultVoltS.toFixed(1)}V, T: ${defaultVoltT.toFixed(1)}V`);
    
    // Create lookup maps for faster access
    const voltageRMap = new Map<string, number>();
    const voltageSMap = new Map<string, number>();
    const voltageTMap = new Map<string, number>();
    
    processedVoltageRData.forEach(point => voltageRMap.set(point.time, point.value));
    processedVoltageSData.forEach(point => voltageSMap.set(point.time, point.value));
    processedVoltageTData.forEach(point => voltageTMap.set(point.time, point.value));
    
    return powerData.data.map(point => {
      const timeStr = point.time;
      
      // Get voltage values from maps, or use default values if not found
      const voltR = voltageRMap.has(timeStr) ? voltageRMap.get(timeStr)! : Math.round(defaultVoltR);
      const voltS = voltageSMap.has(timeStr) ? voltageSMap.get(timeStr)! : Math.round(defaultVoltS);
      const voltT = voltageTMap.has(timeStr) ? voltageTMap.get(timeStr)! : Math.round(defaultVoltT);
      
      return {
        ...point,
        voltR,
        voltS,
        voltT
      };
    });
  }, [powerData?.data, processedVoltageRData, processedVoltageSData, processedVoltageTData]);

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
          <div className="flex gap-2 items-center">
            {/* Ultra Simple Date Picker */}
            <div className="flex flex-col items-center space-y-2 bg-white p-2 rounded-md shadow-sm">
              <div className="text-sm font-semibold mb-1">
                {selectedDate ? format(selectedDate, "MMMM d, yyyy") : "Today"}
              </div>
              <div className="flex space-x-2">
                <a 
                  href="#" 
                  className="px-4 py-1 bg-blue-100 text-blue-700 rounded-md text-sm font-medium hover:bg-blue-200"
                  onClick={(e) => {
                    e.preventDefault();
                    const yesterday = new Date();
                    yesterday.setDate(yesterday.getDate() - 1);
                    setLocalSelectedDate(yesterday);
                    
                    // Force data refresh
                    const dateStr = format(yesterday, 'yyyy-MM-dd');
                    fetch(`/api/total-power?date=${dateStr}`)
                      .then(res => res.json())
                      .then(() => {
                        // Force refetch all the queries
                        window.location.reload();
                      });
                  }}
                >
                  Yesterday
                </a>
                
                <a 
                  href="#" 
                  className="px-4 py-1 bg-blue-100 text-blue-700 rounded-md text-sm font-medium hover:bg-blue-200"
                  onClick={(e) => {
                    e.preventDefault();
                    const today = new Date();
                    setLocalSelectedDate(today);
                    
                    // Force data refresh
                    const dateStr = format(today, 'yyyy-MM-dd');
                    fetch(`/api/total-power?date=${dateStr}`)
                      .then(res => res.json())
                      .then(() => {
                        // Force refetch all the queries
                        window.location.reload();
                      });
                  }}
                >
                  Today
                </a>
              </div>
            </div>
            
            {/* SQL Query Toggle */}
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
            <div className="h-[400px] w-full">
              <h3 className="text-sm font-medium mb-1">Combined Power & Voltage Chart</h3>
              <ResponsiveContainer width="100%" height="95%">
                <ComposedChart
                  data={chartData}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis 
                    dataKey="time" 
                    tickFormatter={formatXAxis}
                    tick={{ fontSize: 11 }}
                  />
                  
                  {/* Left Y-Axis for Power */}
                  <YAxis 
                    yAxisId="left"
                    tickFormatter={formatYAxis}
                    tick={{ fontSize: 11 }}
                    width={60}
                    domain={[0, 'auto']}
                    label={{ value: 'Power (kW)', angle: -90, position: 'insideLeft', offset: -5 }}
                  />
                  
                  {/* Right Y-Axis for Voltage */}
                  <YAxis 
                    yAxisId="right"
                    orientation="right"
                    domain={[180, 310]} 
                    tick={{ fontSize: 11 }}
                    width={60}
                    tickFormatter={(value) => `${value}V`}
                    label={{ value: 'Voltage (V)', angle: 90, position: 'insideRight', offset: 0 }}
                  />
                  
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  
                  {/* Power data as stacked areas - Left Axis */}
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
                  
                  {/* Voltage data as lines - Right Axis */}
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="voltR"
                    name="R Phase Voltage"
                    stroke="#ef4444"
                    dot={false}
                    strokeWidth={1.5}
                    strokeDasharray="4 1"
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="voltS"
                    name="S Phase Voltage"
                    stroke="#10b981"
                    dot={false}
                    strokeWidth={1.5}
                    strokeDasharray="4 1"
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="voltT"
                    name="T Phase Voltage"
                    stroke="#8b5cf6"
                    dot={false}
                    strokeWidth={1.5}
                    strokeDasharray="4 1"
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