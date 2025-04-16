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

interface PanelPowerUsageChartProps {
  title: string;
  panelType?: "33kva" | "66kva";  // Added panel type parameter
}

const PanelPowerUsageChart = ({ title, panelType }: PanelPowerUsageChartProps) => {
  const [date, setDate] = useState<Date>(new Date());
  const [showCalendar, setShowCalendar] = useState(false);

  // Create URL for total power data
  const getTotalPowerUrl = (selectedDate?: Date): string => {
    if (selectedDate) {
      return `/api/total-power?date=${selectedDate.toISOString()}`;
    }
    return '/api/total-power';
  };

  // Fetch total power data
  const { data: powerData, isLoading } = useQuery<PowerDataResponse>({
    queryKey: [getTotalPowerUrl(date), date.toISOString()],
    refetchInterval: 10000,
  });

  // Debug log for data
  useEffect(() => {
    if (powerData?.data) {
      console.log("CHART DEBUG - Total power chart data points received:", powerData.data.length);
      console.log("CHART DEBUG - All time points:", powerData.data.map(d => d.time).join(", "));
      console.log("CHART DEBUG - First data point:", powerData.data[0]);
      console.log("CHART DEBUG - Last data point:", powerData.data[powerData.data.length - 1]);
    }
  }, [powerData]);

  // Handle date change
  const handleDateChange = (newDate: Date | undefined) => {
    if (newDate) {
      setDate(newDate);
      setShowCalendar(false);
      console.log("Using selected date:", format(newDate, 'yyyy-MM-dd'), "for power chart");
    }
  };

  // Format the date for display
  const formattedDate = format(date, 'MMM dd, yyyy');

  return (
    <Card className="w-full overflow-visible">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-lg font-medium">
          {panelType === "33kva" 
            ? "33KVA Panel Power Usage" 
            : panelType === "66kva" 
              ? "66KVA Panel Power Usage" 
              : title}
        </CardTitle>
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
          ) : !powerData?.data?.length ? (
            <div className="flex h-full items-center justify-center flex-col">
              <p className="text-muted-foreground">No data available for this date</p>
              <p className="text-xs text-muted-foreground mt-1">Try selecting a different date</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={powerData.data}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="time" 
                  label={{ value: 'Time (Hourly)', position: 'insideBottomRight', offset: -10 }} 
                />
                <YAxis 
                  label={{ value: 'Power (W)', angle: -90, position: 'insideLeft' }} 
                  domain={[0, 'auto']}
                />
                <Tooltip 
                  formatter={(value: number) => [`${value.toLocaleString()} W`, '']}
                  labelFormatter={(label) => `Time: ${label}`}
                />
                <Legend />
                {(!panelType || panelType === "33kva") && (
                  <Line
                    type="monotone"
                    dataKey="panel33Power"
                    name="33KVA Panel"
                    stroke="#3b82f6" 
                    strokeWidth={2}
                    dot={{ r: 1 }}
                    activeDot={{ r: 5 }}
                  />
                )}
                {(!panelType || panelType === "66kva") && (
                  <Line
                    type="monotone"
                    dataKey="panel66Power"
                    name="66KVA Panel"
                    stroke="#f59e0b" 
                    strokeWidth={2}
                    dot={{ r: 1 }}
                    activeDot={{ r: 5 }}
                  />
                )}
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default PanelPowerUsageChart;