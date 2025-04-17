import { useState, useEffect, useMemo, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { format, isSameDay } from "date-fns";
import { RefreshCw, Calendar } from "lucide-react";
import {
  ComposedChart,
  LineChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from "recharts";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import SqlQueryDisplay from '@/components/SqlQueryDisplay';

// Types
interface ChartDataPoint {
  time: string;
  value: number;
}

interface ChartDataResponse {
  data: ChartDataPoint[];
  sqlQueries: { name: string; sql: string }[];
}

interface PowerData {
  time: string;
  panel33Power?: number;
  panel66Power?: number;
  totalPower: number;
}

interface SqlQuery {
  name: string;
  sql: string;
}

interface PowerDataResponse {
  data: PowerData[];
  sqlQueries: SqlQuery[];
}

interface CombinedDataPoint {
  time: string;
  power: number;     // Primary axis (kW)
  voltR: number;     // Secondary axis (V)
  voltS: number;     // Secondary axis (V)
  voltT: number;     // Secondary axis (V)
}

interface DualAxisPowerChartProps {
  title: string;
  panelType: "33kva" | "66kva";
}

const DualAxisPowerChart = ({ title, panelType }: DualAxisPowerChartProps) => {
  const [date, setDate] = useState<Date>(new Date());
  const [showCalendar, setShowCalendar] = useState(false);
  const [combinedData, setCombinedData] = useState<CombinedDataPoint[]>([]);
  const [showDebugInfo, setShowDebugInfo] = useState<boolean>(false);
  const [sqlQueries, setSqlQueries] = useState<SqlQuery[]>([]);
  const [chartTab, setChartTab] = useState<string>("power-voltage");
  
  // Create URLs for the different data types
  const createChartDataUrl = (dataType: string, phase: string, selectedDate?: Date): string => {
    const panelParam = panelType === "66kva" ? "&panel=66kva" : "";
    if (selectedDate) {
      return `/api/chart-data/${dataType}/${phase}?date=${selectedDate.toISOString()}${panelParam}`;
    }
    return `/api/chart-data/${dataType}/${phase}${panelParam ? `?${panelParam.substring(1)}` : ''}`;
  };

  const getPowerDataUrl = (selectedDate?: Date): string => {
    if (selectedDate) {
      return `/api/total-power?date=${selectedDate.toISOString()}`;
    }
    return '/api/total-power';
  };

  // Fetch voltage data for phase R
  const { data: voltageRData, isLoading: isLoadingVoltageR } = useQuery<ChartDataResponse>({
    queryKey: [createChartDataUrl("voltage", "R", date), date.toISOString()],
    refetchInterval: 10000,
  });

  // Fetch voltage data for phase S
  const { data: voltageSData, isLoading: isLoadingVoltageS } = useQuery<ChartDataResponse>({
    queryKey: [createChartDataUrl("voltage", "S", date), date.toISOString()],
    refetchInterval: 10000,
  });

  // Fetch voltage data for phase T
  const { data: voltageTData, isLoading: isLoadingVoltageT } = useQuery<ChartDataResponse>({
    queryKey: [createChartDataUrl("voltage", "T", date), date.toISOString()],
    refetchInterval: 10000,
  });

  // Fetch power data
  const { data: powerData, isLoading: isLoadingPower } = useQuery<PowerDataResponse>({
    queryKey: [getPowerDataUrl(date), date.toISOString()],
    refetchInterval: 10000,
  });

  // Process voltage data to ensure hourly format to match power data
  const processVoltageData = useCallback((data: ChartDataPoint[] | undefined) => {
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
  
  // Process all voltage data sets for better hourly matching
  const processedVoltageRData = useMemo(() => 
    processVoltageData(voltageRData?.data), [voltageRData?.data, processVoltageData]
  );
  
  const processedVoltageSData = useMemo(() => 
    processVoltageData(voltageSData?.data), [voltageSData?.data, processVoltageData]
  );
  
  const processedVoltageTData = useMemo(() => 
    processVoltageData(voltageTData?.data), [voltageTData?.data, processVoltageData]
  );

  // Debug processed data
  useEffect(() => {
    if (processedVoltageRData.length > 0 && processedVoltageRData[0].value > 0) {
      console.log(`[DualAxisChart] Processed voltage data - first hour R phase: ${processedVoltageRData[0].time} = ${processedVoltageRData[0].value}V`);
    }
  }, [processedVoltageRData]);

  // Combine all data for the dual-axis chart
  useEffect(() => {
    if (powerData?.data) {
      // Instead of collecting time points from all data sources, use ONLY power data
      // as our primary time reference, since it's guaranteed to have all 24 hours
      const timeToValues: Record<string, CombinedDataPoint> = {};
      
      // Initialize with time points from power data, filtering for current time
      powerData.data.forEach(point => {
        // For today's date, only include hours up to the current hour
        const isToday = isSameDay(date, new Date());
        const currentHour = new Date().getHours();
        const pointHour = parseInt(point.time.split(':')[0], 10);
        
        // If it's not today, or if it is today and the point hour is <= current hour
        if (!isToday || pointHour <= currentHour) {
          timeToValues[point.time] = {
            time: point.time,
            power: 0,
            voltR: 0,
            voltS: 0,
            voltT: 0
          };
        }
      });
      
      // Create a set of all voltage hours we have data for (to handle midnight wrapping)
      const voltageHours = new Set<string>();
      processedVoltageRData.forEach(point => voltageHours.add(point.time));
      processedVoltageSData.forEach(point => voltageHours.add(point.time));
      processedVoltageTData.forEach(point => voltageHours.add(point.time));
      
      // Find default voltage values using the average of all available data
      const defaultVoltR = processedVoltageRData.reduce((sum, point) => sum + point.value, 0) / 
                          (processedVoltageRData.length || 1);
      const defaultVoltS = processedVoltageSData.reduce((sum, point) => sum + point.value, 0) / 
                          (processedVoltageSData.length || 1);
      const defaultVoltT = processedVoltageTData.reduce((sum, point) => sum + point.value, 0) / 
                          (processedVoltageTData.length || 1);
      
      console.log(`Using default voltage values (averages) - R: ${defaultVoltR.toFixed(1)}V, S: ${defaultVoltS.toFixed(1)}V, T: ${defaultVoltT.toFixed(1)}V`);
      
      // For hours where we don't have voltage data, use the average voltage value
      Object.keys(timeToValues).forEach(time => {
        if (!voltageHours.has(time)) {
          timeToValues[time].voltR = Math.round(defaultVoltR);
          timeToValues[time].voltS = Math.round(defaultVoltS);
          timeToValues[time].voltT = Math.round(defaultVoltT);
        }
      });
      
      // Fill in the voltage R values using processed hourly data where available
      processedVoltageRData.forEach(point => {
        if (timeToValues[point.time]) {
          timeToValues[point.time].voltR = point.value;
        }
      });
      
      // Fill in the voltage S values using processed hourly data where available
      processedVoltageSData.forEach(point => {
        if (timeToValues[point.time]) {
          timeToValues[point.time].voltS = point.value;
        }
      });
      
      // Fill in the voltage T values using processed hourly data where available
      processedVoltageTData.forEach(point => {
        if (timeToValues[point.time]) {
          timeToValues[point.time].voltT = point.value;
        }
      });
      
      // Fill in the power values
      powerData.data.forEach(point => {
        if (timeToValues[point.time]) {
          if (panelType === "33kva" && point.panel33Power !== undefined) {
            timeToValues[point.time].power = point.panel33Power / 1000; // Convert from W to kW
          } else if (panelType === "66kva" && point.panel66Power !== undefined) {
            timeToValues[point.time].power = point.panel66Power / 1000; // Convert from W to kW
          }
        }
      });
      
      // Convert the map to an array and sort by time
      const combinedDataArray = Object.values(timeToValues).sort((a, b) => {
        // Convert time strings to comparable values (assuming format is hh:mm)
        const timeA = a.time.split(':').map(Number);
        const timeB = b.time.split(':').map(Number);
        
        if (timeA[0] !== timeB[0]) {
          return timeA[0] - timeB[0]; // Compare hours
        }
        return timeA[1] - timeB[1]; // Compare minutes
      });
      
      setCombinedData(combinedDataArray);
      
      // Collect all SQL queries for debugging
      const allQueries = [
        ...(voltageRData?.sqlQueries || []),
        ...(voltageSData?.sqlQueries || []),
        ...(voltageTData?.sqlQueries || []),
        ...(powerData?.sqlQueries || [])
      ];
      
      setSqlQueries(allQueries);
    }
  }, [processedVoltageRData, processedVoltageSData, processedVoltageTData, powerData, panelType]);

  // Handle date change
  const handleDateChange = (newDate: Date | undefined) => {
    if (newDate) {
      setDate(newDate);
      setShowCalendar(false);
    }
  };

  // Check if data is loading
  const isLoading = isLoadingVoltageR || isLoadingVoltageS || isLoadingVoltageT || isLoadingPower;
  const hasData = combinedData.length > 0;

  // Format the date for display
  const formattedDate = format(date, 'MMM dd, yyyy');

  // Format power for tooltip
  const formatPower = (value: number) => {
    return `${value % 1 === 0 ? value : value.toFixed(1)} kW`;
  };

  // Format voltage for tooltip
  const formatVoltage = (value: number) => {
    return `${value.toFixed(2)} V`;
  };

  return (
    <Card className="w-full overflow-visible">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-lg font-medium">
          {panelType === "33kva" 
            ? "33KVA Panel - Hourly Power Usage and Voltage per Phase (R, S, T)" 
            : "66KVA Panel - Hourly Power Usage and Voltage per Phase (R, S, T)"}
        </CardTitle>
        <div className="flex items-center space-x-2">
          <Button 
            variant={showDebugInfo ? "secondary" : "outline"}
            size="sm" 
            onClick={() => setShowDebugInfo(!showDebugInfo)}
            className="mr-2"
          >
            {showDebugInfo ? "Hide Debug" : "Show Debug"}
          </Button>
          {isLoading && <RefreshCw className="h-4 w-4 animate-spin text-muted-foreground" />}
          <Popover open={showCalendar} onOpenChange={setShowCalendar}>
            <PopoverTrigger asChild>
              <Button 
                variant="outline" 
                size="sm"
                className="h-8 gap-1"
                onClick={() => setShowCalendar(true)}
              >
                <Calendar className="h-3.5 w-3.5" />
                <span>{formattedDate}</span>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <CalendarComponent
                mode="single"
                selected={date}
                onSelect={handleDateChange}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <Tabs value={chartTab} onValueChange={setChartTab}>
          <TabsList className="mb-2">
            <TabsTrigger value="power-voltage">Power & Voltage</TabsTrigger>
            <TabsTrigger value="voltage-comparison">Voltage Comparison</TabsTrigger>
          </TabsList>
          
          <TabsContent value="power-voltage" className="mt-0">
            <div className="h-[350px] w-full">
              {isLoading ? (
                <div className="flex h-full items-center justify-center">
                  <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : !hasData ? (
                <div className="flex h-full items-center justify-center flex-col">
                  <p className="text-muted-foreground">No data available for this date</p>
                  <p className="text-xs text-muted-foreground mt-1">Try selecting a different date</p>
                </div>
              ) : (
                <div className="h-full">
                  <h3 className="text-sm font-medium mb-1">Power & Voltage Overlay Chart</h3>
                  <ResponsiveContainer width="100%" height="95%">
                    <ComposedChart
                      data={combinedData}
                      margin={{ top: 5, right: 30, left: 20, bottom: 25 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="time" 
                        tickFormatter={(value) => value}
                        tick={{ fontSize: 11 }}
                        interval="preserveStartEnd"
                        minTickGap={10}
                        label={{ 
                          value: `Hours of ${format(date, 'MMM dd, yyyy')}`,
                          position: 'insideBottomRight',
                          offset: -10 
                        }}
                      />
                      {/* Left Y-Axis for Power */}
                      <YAxis 
                        yAxisId="left"
                        label={{ value: 'Power (kW)', angle: -90, position: 'insideLeft', offset: -5 }} 
                        domain={[0, 'auto']}
                        tick={{ fontSize: 11 }}
                      />
                      
                      {/* Right Y-Axis for Voltage */}
                      <YAxis 
                        yAxisId="right"
                        orientation="right"
                        domain={[180, 310]}
                        tickCount={5}
                        tick={{ fontSize: 11 }}
                        tickFormatter={(value) => `${value}V`}
                        label={{ value: 'Voltage (V)', angle: 90, position: 'insideRight', offset: 0 }}
                      />
                      
                      <Tooltip 
                        formatter={(value: number, name: string) => {
                          if (name.includes('Voltage')) {
                            return [`${value.toFixed(1)}V`, name];
                          } else {
                            return [`${value % 1 === 0 ? value : value.toFixed(1)} kW`, name];
                          }
                        }}
                        labelFormatter={(label) => `Time: ${label}`}
                      />
                      <Legend />
                      
                      {/* Power Line - Left Axis */}
                      <Line 
                        yAxisId="left"
                        dataKey="power"
                        name={panelType === "33kva" ? "33KVA Power" : "66KVA Power"}
                        stroke={panelType === "33kva" ? "#0040ff" : "#f59e0b"}
                        strokeWidth={3}
                        dot={false}
                        activeDot={{ r: 4 }}
                      />
                      
                      {/* Voltage Lines - Right Axis */}
                      <Line
                        yAxisId="right"
                        type="monotone"
                        dataKey="voltR"
                        name="Voltage R Phase"
                        stroke="#ef4444"
                        strokeWidth={1.5}
                        strokeDasharray="4 1"
                        dot={false}
                        activeDot={{ r: 3 }}
                      />
                      <Line
                        yAxisId="right"
                        type="monotone"
                        dataKey="voltS"
                        name="Voltage S Phase"
                        stroke="#10b981"
                        strokeWidth={1.5}
                        strokeDasharray="4 1"
                        dot={false}
                        activeDot={{ r: 3 }}
                      />
                      <Line
                        yAxisId="right"
                        type="monotone"
                        dataKey="voltT"
                        name="Voltage T Phase"
                        stroke="#8b5cf6"
                        strokeWidth={1.5}
                        strokeDasharray="4 1"
                        dot={false}
                        activeDot={{ r: 3 }}
                      />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="voltage-comparison" className="mt-0">
            <div className="h-[350px] w-full">
              {isLoading ? (
                <div className="flex h-full items-center justify-center">
                  <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : !hasData ? (
                <div className="flex h-full items-center justify-center flex-col">
                  <p className="text-muted-foreground">No data available for this date</p>
                  <p className="text-xs text-muted-foreground mt-1">Try selecting a different date</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart
                    data={combinedData}
                    margin={{ top: 5, right: 30, left: 20, bottom: 25 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="time" 
                      label={{ value: `Hours of ${format(date, 'MMM dd, yyyy')}`, position: 'insideBottomRight', offset: -10 }}
                      tickFormatter={(value) => value}
                      interval="preserveStartEnd"
                      minTickGap={10}
                    />
                    <YAxis 
                      label={{ value: 'Voltage (V)', angle: -90, position: 'insideLeft', offset: -5 }} 
                      domain={[180, 310]}
                      tickCount={5}
                    />
                    <Tooltip 
                      formatter={(value: number) => [formatVoltage(value), '']}
                      labelFormatter={(label) => `Time: ${label}`}
                    />
                    <Legend 
                      verticalAlign="top"
                      align="right"
                      iconType="line"
                      wrapperStyle={{ paddingBottom: '10px' }}
                    />
                    <Line
                      type="monotone"
                      dataKey="voltR"
                      name="Voltage R"
                      stroke="#FFC107"
                      strokeWidth={1.5}
                      strokeDasharray="4 4"
                      dot={false}
                      activeDot={{ r: 4 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="voltS"
                      name="Voltage S"
                      stroke="#FF5722"
                      strokeWidth={1.5}
                      strokeDasharray="4 4"
                      dot={false}
                      activeDot={{ r: 4 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="voltT"
                      name="Voltage T"
                      stroke="#E91E63"
                      strokeWidth={1.5}
                      strokeDasharray="4 4"
                      dot={false}
                      activeDot={{ r: 4 }}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              )}
            </div>
          </TabsContent>
        </Tabs>
        
        {/* SQL Queries Display - Only shown when debug is toggled on */}
        {showDebugInfo && sqlQueries.length > 0 && (
          <div className="mt-4">
            <h3 className="text-sm font-medium mb-2">SQL Debug Information</h3>
            <SqlQueryDisplay queries={sqlQueries} />
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default DualAxisPowerChart;