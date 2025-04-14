import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useQuery } from '@tanstack/react-query';
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { CalendarIcon } from "lucide-react";
import { format, isSameDay } from "date-fns";
import SqlQueryDisplay from '@/components/SqlQueryDisplay';
import { useLocation } from 'wouter';

interface TotalPowerData {
  time: string;
  panel33Power?: number;
  panel66Power?: number;
  totalPower: number;
}

interface SqlQuery {
  name: string;
  sql: string;
}

interface TotalPowerResponse {
  data: TotalPowerData[];
  sqlQueries: SqlQuery[];
}

const TotalPowerChart = () => {
  const [granularity, setGranularity] = useState<string>('hour');
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date()); // Initialize with today's date
  
  // State to store SQL queries
  const [sqlQueries, setSqlQueries] = useState<SqlQuery[]>([]);
  
  // Get current route to determine which panel data to show
  const [location] = useLocation();
  const showPanel33 = location === "/" || location === "/wo-08";
  const showPanel66 = location === "/" || location === "/panel-66kva";
  
  // Fetch the data using TanStack Query with automatic refetching
  const { data: chartResponse, isLoading, error, refetch } = useQuery({
    queryKey: ['/api/total-power', granularity, selectedDate],
    refetchInterval: 10000, // Refetch every 10 seconds
    refetchIntervalInBackground: true, // Continue refetching even when tab is not active
    queryFn: async () => {
      // Build the query string with parameters
      let queryParams = `granularity=${granularity}`;
      if (selectedDate) {
        const startOfDay = new Date(selectedDate);
        startOfDay.setHours(0, 0, 0, 0);
        
        const endOfDay = new Date(selectedDate);
        endOfDay.setHours(23, 59, 59, 999);
        
        queryParams += `&startDate=${startOfDay.toISOString()}&endDate=${endOfDay.toISOString()}`;
      }
      
      const response = await fetch(`/api/total-power?${queryParams}`);
      if (!response.ok) {
        throw new Error('Failed to fetch total power data');
      }
      
      // Try to parse as a TotalPowerResponse with SQL queries
      try {
        const fullResponse = await response.json();
        if (fullResponse.data && fullResponse.sqlQueries) {
          // It's the new format with SQL queries
          return fullResponse as TotalPowerResponse;
        } else {
          // It's the old format - just the array
          return {
            data: fullResponse as TotalPowerData[],
            sqlQueries: [
              {
                name: "Total Power Query",
                sql: "SELECT * FROM panel_33kva, panel_66kva ORDER BY timestamp"
              }
            ]
          };
        }
      } catch (e) {
        // Fallback to original format
        return {
          data: await response.json() as TotalPowerData[],
          sqlQueries: []
        };
      }
    }
  });
  
  // Extract the chart data and SQL queries from response
  // Show all data points from 00:00 to 23:59 as requested by user
  const chartData = chartResponse?.data || [];
  
  // Debug data received from the API
  useEffect(() => {
    if (chartData.length > 0) {
      console.log("CHART DEBUG - Total power chart data points received:", chartData.length);
      console.log("CHART DEBUG - First data point:", chartData[0]);
      console.log("CHART DEBUG - Last data point:", chartData[chartData.length - 1]);
    }
  }, [chartData]);
  
  // Update SQL queries when response changes
  useEffect(() => {
    if (chartResponse?.sqlQueries?.length) {
      setSqlQueries(chartResponse.sqlQueries);
    }
  }, [chartResponse]);
  
  // Reset the date filter to today
  const resetDateToToday = () => {
    setSelectedDate(new Date());
    refetch();
  };

  const formatPower = (value: number) => {
    if (value >= 1000) {
      return `${(value / 1000).toFixed(2)} kW`;
    }
    return `${value.toFixed(2)} W`;
  };

  // Debug function to print all data
  const printFullData = () => {
    console.log("FULL DATA POINTS:", chartData);
    console.log("Data length:", chartData.length);
    
    // Print each hour explicitly to see if any hours are missing
    const hourMap: {[hour: string]: boolean} = {};
    chartData.forEach(item => {
      hourMap[item.time] = true;
    });
    
    console.log("Hours present in data:", Object.keys(hourMap));
  };

  return (
    <Card className="col-span-3">
      <CardHeader className="flex flex-col space-y-2 pb-2">
        <div className="flex flex-row items-center justify-between">
          <CardTitle className="text-md font-medium">
            {showPanel33 && showPanel66 
              ? "Daily Total Power Consumption" 
              : showPanel33 
                ? "Panel 1 33KVA Daily Consumption" 
                : "Panel 2 66KVA Daily Consumption"}
          </CardTitle>
          <div className="flex items-center space-x-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={printFullData}
              className="mr-2"
            >
              Debug Data
            </Button>
            <Label htmlFor="granularity">Granularity:</Label>
            <Select
              value={granularity}
              onValueChange={(value) => setGranularity(value)}
            >
              <SelectTrigger className="w-[120px]">
                <SelectValue placeholder="Select" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="minute">Minute</SelectItem>
                <SelectItem value="hour">Hour</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        {/* Date Filter */}
        <div className="flex flex-row items-center justify-between">
          <div className="flex items-center space-x-2">
            <Label>Select Date:</Label>
            
            {/* Date Picker */}
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-[180px] pl-3 text-left font-normal"
                >
                  {selectedDate ? (
                    isSameDay(selectedDate, new Date()) ? 
                    "Today" : 
                    format(selectedDate, "PPP")
                  ) : (
                    <span>Today</span>
                  )}
                  <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
            
            {/* Reset to Today Button */}
            {selectedDate && !isSameDay(selectedDate, new Date()) && (
              <Button 
                variant="ghost" 
                size="sm"
                onClick={resetDateToToday}
              >
                Reset to Today
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-2">
        <div className="h-[300px]">
          {isLoading ? (
            <div className="flex h-full items-center justify-center">
              <p>Loading chart data...</p>
            </div>
          ) : error ? (
            <div className="flex h-full items-center justify-center">
              <p className="text-red-500">Error loading chart data</p>
            </div>
          ) : chartData.length === 0 ? (
            <div className="flex h-full items-center justify-center">
              <p>No data available</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={chartData}
                margin={{
                  top: 5,
                  right: 20,
                  left: 20,
                  bottom: 5,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="time" 
                  // Force XAxis to show all hours from 00-23
                  domain={['00:00', '23:00']}
                  type="category"
                  allowDataOverflow={true}
                />
                <YAxis 
                  tickFormatter={(value) => formatPower(value)} 
                  // Set explicit domain for better visualization
                  domain={[0, 'dataMax + 5000']}
                />
                <Tooltip formatter={(value: any) => formatPower(value as number)} />
                {showPanel33 && (
                  <Area 
                    type="monotone" 
                    dataKey="panel33Power" 
                    name="Panel 1 33KVA"
                    stroke="#4caf50" 
                    fill="#4caf50" 
                    fillOpacity={0.3} 
                    stackId="1"
                  />
                )}
                {showPanel66 && (
                  <Area 
                    type="monotone" 
                    dataKey="panel66Power" 
                    name="Panel 2 66KVA"
                    stroke="#ff9800" 
                    fill="#ff9800" 
                    fillOpacity={0.3}
                    stackId="1" 
                  />
                )}
                <Area 
                  type="monotone" 
                  dataKey="totalPower" 
                  name="Total Power"
                  stroke="#03a9f4" 
                  fill="#03a9f4" 
                  fillOpacity={0.3}
                  hide={!showPanel33 || !showPanel66} 
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
        
        {/* SQL Queries Display */}
        {sqlQueries.length > 0 && (
          <div className="mt-4">
            <SqlQueryDisplay queries={sqlQueries} />
          </div>
        )}
        
      </CardContent>
    </Card>
  );
};

export default TotalPowerChart;