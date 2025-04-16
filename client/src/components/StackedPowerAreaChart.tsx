import { useState, useEffect } from 'react';
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
  TooltipProps
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChevronDown, ChevronUp, Info } from "lucide-react";
import SqlQueryDisplay from './SqlQueryDisplay';

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

interface StackedPowerAreaChartProps {
  title: string;
  panelType?: "33kva" | "66kva";  // Optional panel type parameter
  selectedDate?: Date;
}

// Custom tooltip component
const CustomTooltip = ({ active, payload, label }: TooltipProps<number, string>) => {
  if (active && payload && payload.length) {
    return (
      <div className="custom-tooltip bg-white p-3 border border-gray-200 shadow-lg rounded-md">
        <p className="label font-semibold">{`Time: ${label}`}</p>
        {payload.map((entry, index) => (
          <p key={`item-${index}`} style={{ color: entry.color }}>
            {`${entry.name}: ${Number(entry.value).toFixed(2)} kW`}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

const StackedPowerAreaChart = ({ title, panelType, selectedDate }: StackedPowerAreaChartProps) => {
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

  // Fetch power data with selected date
  const { data: powerData, isLoading } = useQuery<PowerDataResponse>({
    queryKey: ['/api/total-power', selectedDate ? format(selectedDate, 'yyyy-MM-dd') : 'current'],
    queryFn: async () => {
      const url = getTotalPowerUrl(selectedDate);
      console.log("Fetching power data from URL:", url);
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Failed to fetch power data');
      }
      const data = await response.json();
      console.log("Data received:", data.data?.length || 0, "points");
      return data;
    },
    refetchInterval: 10000, // Refresh every 10 seconds
    refetchIntervalInBackground: true,
    staleTime: 0, // Consider data immediately stale to force refresh
  });

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

  // Prepare data for specific panel type if requested
  const chartData = powerData?.data || [];

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
                <AreaChart
                  data={chartData}
                  margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis 
                    dataKey="time" 
                    tickFormatter={formatXAxis}
                    tick={{ fontSize: 12 }}
                  />
                  <YAxis 
                    tickFormatter={formatYAxis}
                    tick={{ fontSize: 12 }}
                    width={60}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  {panelType !== "66kva" && (
                    <Area 
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
                      type="monotone" 
                      dataKey="panel66Power" 
                      name="66KVA Panel"
                      stackId="1"
                      stroke="#f59e0b" 
                      fill="#f59e0b" 
                      fillOpacity={0.6}
                    />
                  )}
                </AreaChart>
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