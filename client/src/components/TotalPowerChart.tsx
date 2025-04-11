import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useQuery } from '@tanstack/react-query';

interface TotalPowerData {
  time: string;
  totalPower: number;
}

const TotalPowerChart = () => {
  const [granularity, setGranularity] = useState<string>('hour');
  
  // Fetch the data using TanStack Query
  const { data: chartData = [], isLoading, error } = useQuery({
    queryKey: ['/api/total-power', granularity],
    queryFn: async () => {
      const response = await fetch(`/api/total-power?granularity=${granularity}`);
      if (!response.ok) {
        throw new Error('Failed to fetch total power data');
      }
      return response.json() as Promise<TotalPowerData[]>;
    }
  });

  const formatPower = (value: number) => {
    if (value >= 1000) {
      return `${(value / 1000).toFixed(2)} kW`;
    }
    return `${value.toFixed(2)} W`;
  };

  return (
    <Card className="col-span-3">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
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
      </CardContent>
    </Card>
  );
};

export default TotalPowerChart;