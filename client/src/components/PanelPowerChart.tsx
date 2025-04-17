import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { RefreshCw, Calendar } from "lucide-react";
import { 
  LineChart, 
  Line, 
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

interface PhaseVoltageData {
  time: string;
  voltageR: number;
  voltageS: number;
  voltageT: number;
}

interface ChartDataPoint {
  time: string;
  value: number;
}

interface ChartDataResponse {
  data: ChartDataPoint[];
  sqlQueries: { name: string; sql: string }[];
}

interface PanelPowerChartProps {
  title: string;
  panelType: "33kva" | "66kva" | "82kva";
  color: string;
}

const PanelPowerChart = ({ title, panelType, color }: PanelPowerChartProps) => {
  const [date, setDate] = useState<Date>(new Date());
  const [showCalendar, setShowCalendar] = useState(false);

  // Create URLs for the different phase voltage data
  const createChartDataUrl = (phase: string, selectedDate?: Date): string => {
    const panelParam = (panelType === "66kva" || panelType === "82kva") ? "&panel=66kva" : "";
    if (selectedDate) {
      return `/api/chart-data/voltage/${phase}?date=${selectedDate.toISOString()}${panelParam}`;
    }
    return `/api/chart-data/voltage/${phase}${panelParam ? `?${panelParam.substring(1)}` : ''}`;
  };

  // Fetch phase R voltage data for the panel
  const { data: voltageRData, isLoading: isLoadingVoltageR } = useQuery<ChartDataResponse>({
    queryKey: [createChartDataUrl("R", date), date.toISOString()],
    refetchInterval: 10000,
  });

  // Fetch phase S voltage data for the panel
  const { data: voltageSData, isLoading: isLoadingVoltageS } = useQuery<ChartDataResponse>({
    queryKey: [createChartDataUrl("S", date), date.toISOString()],
    refetchInterval: 10000,
  });

  // Fetch phase T voltage data for the panel
  const { data: voltageTData, isLoading: isLoadingVoltageT } = useQuery<ChartDataResponse>({
    queryKey: [createChartDataUrl("T", date), date.toISOString()],
    refetchInterval: 10000,
  });

  // Combined data for the chart
  const [combinedData, setCombinedData] = useState<PhaseVoltageData[]>([]);

  // Combine all voltage data points
  useEffect(() => {
    if (voltageRData?.data && voltageSData?.data && voltageTData?.data) {
      const timePoints = new Set<string>();
      
      // Collect all unique time points
      voltageRData.data.forEach(point => timePoints.add(point.time));
      voltageSData.data.forEach(point => timePoints.add(point.time));
      voltageTData.data.forEach(point => timePoints.add(point.time));
      
      // Create a mapping of time to voltage values
      const timeToVoltage: Record<string, PhaseVoltageData> = {};
      
      // Initialize with all timePoints
      Array.from(timePoints).sort().forEach(time => {
        timeToVoltage[time] = {
          time,
          voltageR: 0,
          voltageS: 0,
          voltageT: 0
        };
      });
      
      // Fill in the R voltage values
      voltageRData.data.forEach(point => {
        if (timeToVoltage[point.time]) {
          timeToVoltage[point.time].voltageR = point.value;
        }
      });
      
      // Fill in the S voltage values
      voltageSData.data.forEach(point => {
        if (timeToVoltage[point.time]) {
          timeToVoltage[point.time].voltageS = point.value;
        }
      });
      
      // Fill in the T voltage values
      voltageTData.data.forEach(point => {
        if (timeToVoltage[point.time]) {
          timeToVoltage[point.time].voltageT = point.value;
        }
      });
      
      // Convert the map to an array and sort by time
      const combined = Object.values(timeToVoltage).sort((a, b) => {
        // Convert time strings to comparable values (assuming format is hh:mm)
        const timeA = a.time.split(':').map(Number);
        const timeB = b.time.split(':').map(Number);
        
        if (timeA[0] !== timeB[0]) {
          return timeA[0] - timeB[0]; // Compare hours
        }
        return timeA[1] - timeB[1]; // Compare minutes
      });
      
      setCombinedData(combined);
    }
  }, [voltageRData, voltageSData, voltageTData]);

  const isLoading = isLoadingVoltageR || isLoadingVoltageS || isLoadingVoltageT;
  const hasData = combinedData.length > 0;

  // Handle date change
  const handleDateChange = (newDate: Date | undefined) => {
    if (newDate) {
      setDate(newDate);
      setShowCalendar(false);
    }
  };

  // Format the date for display
  const formattedDate = format(date, 'MMM dd, yyyy');

  return (
    <Card className="w-full overflow-visible">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-lg font-medium">{title}</CardTitle>
        <div className="flex items-center space-x-2">
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
      <CardContent>
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
              <LineChart
                data={combinedData}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="time" 
                  label={{ value: 'Time (Hourly)', position: 'insideBottomRight', offset: -10 }} 
                />
                <YAxis 
                  label={{ value: 'Voltage (V)', angle: -90, position: 'insideLeft' }} 
                  domain={['auto', 'auto']}
                />
                <Tooltip 
                  formatter={(value: number) => [`${value.toFixed(2)} V`, '']}
                  labelFormatter={(label) => `Time: ${label}`}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="voltageR"
                  name="Voltage R"
                  stroke="#FFB347" 
                  strokeWidth={2}
                  dot={{ r: 1 }}
                  activeDot={{ r: 5 }}
                />
                <Line
                  type="monotone"
                  dataKey="voltageS"
                  name="Voltage S"
                  stroke={color} 
                  strokeWidth={2}
                  dot={{ r: 1 }}
                  activeDot={{ r: 5 }}
                />
                <Line
                  type="monotone"
                  dataKey="voltageT"
                  name="Voltage T"
                  stroke="#FF6B6B" 
                  strokeWidth={2}
                  dot={{ r: 1 }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default PanelPowerChart;