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
import { format } from "date-fns";
import SqlQueryDisplay from '@/components/SqlQueryDisplay';

interface TotalPowerData {
  time: string;
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
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  
  // State to store SQL queries
  const [sqlQueries, setSqlQueries] = useState<SqlQuery[]>([]);
  
  // Fetch the data using TanStack Query
  const { data: chartResponse, isLoading, error, refetch } = useQuery({
    queryKey: ['/api/total-power', granularity, startDate, endDate],
    queryFn: async () => {
      // Build the query string with parameters
      let queryParams = `granularity=${granularity}`;
      if (startDate) {
        queryParams += `&startDate=${startDate.toISOString()}`;
      }
      if (endDate) {
        queryParams += `&endDate=${endDate.toISOString()}`;
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
  
  // Extract the chart data and SQL queries
  const chartData = chartResponse?.data || [];
  
  // Update SQL queries when response changes
  useEffect(() => {
    if (chartResponse?.sqlQueries?.length) {
      setSqlQueries(chartResponse.sqlQueries);
    }
  }, [chartResponse]);
  
  // Clear the date filters
  const clearDateFilters = () => {
    setStartDate(undefined);
    setEndDate(undefined);
    refetch();
  };

  const formatPower = (value: number) => {
    if (value >= 1000) {
      return `${(value / 1000).toFixed(2)} kW`;
    }
    return `${value.toFixed(2)} W`;
  };

  return (
    <Card className="col-span-3">
      <CardHeader className="flex flex-col space-y-2 pb-2">
        <div className="flex flex-row items-center justify-between">
          <CardTitle className="text-md font-medium">
            Daily Total Power Consumption
          </CardTitle>
          <div className="flex items-center space-x-2">
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
        
        {/* Date Filters */}
        <div className="flex flex-row items-center justify-between">
          <div className="flex items-center space-x-2">
            <Label>Date Range:</Label>
            
            {/* Start Date Picker */}
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-[140px] pl-3 text-left font-normal"
                >
                  {startDate ? (
                    format(startDate, "PPP")
                  ) : (
                    <span>From Date</span>
                  )}
                  <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={startDate}
                  onSelect={setStartDate}
                  disabled={(date) => 
                    endDate ? date > endDate : false
                  }
                  initialFocus
                />
              </PopoverContent>
            </Popover>
            
            {/* End Date Picker */}
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-[140px] pl-3 text-left font-normal"
                >
                  {endDate ? (
                    format(endDate, "PPP")
                  ) : (
                    <span>To Date</span>
                  )}
                  <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={endDate}
                  onSelect={setEndDate}
                  disabled={(date) => 
                    startDate ? date < startDate : false
                  }
                  initialFocus
                />
              </PopoverContent>
            </Popover>
            
            {/* Clear Filters Button */}
            {(startDate || endDate) && (
              <Button 
                variant="ghost" 
                size="sm"
                onClick={clearDateFilters}
              >
                Clear
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
                <XAxis dataKey="time" />
                <YAxis tickFormatter={(value) => formatPower(value)} />
                <Tooltip formatter={(value: any) => formatPower(value as number)} />
                <Area 
                  type="monotone" 
                  dataKey="totalPower" 
                  name="Total Power"
                  stroke="#03a9f4" 
                  fill="#03a9f4" 
                  fillOpacity={0.3} 
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