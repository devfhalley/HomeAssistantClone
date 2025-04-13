import { useEffect, useState } from "react";
import HomeAssistant from "@/components/HomeAssistant";
import { Link } from "wouter";
import { ToggleLeft, PieChart, Activity, BarChart3, Zap } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";

// Type for peak power data
interface PeakPowerData {
  panel33Peak: number;
  panel66Peak: number;
  totalPeak: number;
}

const Home = () => {
  useEffect(() => {
    document.title = "Home Assistant - Home";
  }, []);
  
  // Fetch peak power data
  const { data: peakPowerData, isLoading } = useQuery({
    queryKey: ['/api/peak-power'],
    refetchInterval: 60000, // Refresh every minute
  });

  return (
    <HomeAssistant>
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-1">Home</h1>
        <p className="text-gray-600">Monitor and control your power usage</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Dashboard Panels Row */}
        <Card className="bg-blue-50 hover:bg-blue-100 transition-colors cursor-pointer">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center">
              <PieChart className="w-5 h-5 mr-2 text-blue-600" />
              Today's Highest Peak
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">
              {isLoading ? (
                <span className="text-gray-400">Loading...</span>
              ) : (
                <span>{(peakPowerData?.totalPeak || 0).toFixed(2)} kW</span>
              )}
            </p>
            <p className="text-sm text-gray-600 mt-1">Combined from all panels</p>
          </CardContent>
        </Card>

        <Card className="bg-green-50 hover:bg-green-100 transition-colors cursor-pointer">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center">
              <Activity className="w-5 h-5 mr-2 text-green-600" />
              Panel 1 Peak
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">
              {isLoading ? (
                <span className="text-gray-400">Loading...</span>
              ) : (
                <span>{(peakPowerData?.panel33Peak || 0).toFixed(2)} kW</span>
              )}
            </p>
            <p className="text-sm text-gray-600 mt-1">33KVA Panel</p>
          </CardContent>
        </Card>

        <Card className="bg-amber-50 hover:bg-amber-100 transition-colors cursor-pointer">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center">
              <BarChart3 className="w-5 h-5 mr-2 text-amber-600" />
              Panel 2 Peak
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">
              {isLoading ? (
                <span className="text-gray-400">Loading...</span>
              ) : (
                <span>{(peakPowerData?.panel66Peak || 0).toFixed(2)} kW</span>
              )}
            </p>
            <p className="text-sm text-gray-600 mt-1">66KVA Panel</p>
          </CardContent>
        </Card>

        {/* Navigation Cards Row */}
        <Link href="/wo-08">
          <div className="block p-6 bg-white border border-gray-200 rounded-lg shadow hover:bg-gray-50 cursor-pointer">
            <div className="flex items-center mb-3">
              <ToggleLeft className="w-6 h-6 text-primary mr-2" />
              <h5 className="text-xl font-bold tracking-tight text-gray-900">Panel 1 33KVA</h5>
            </div>
            <p className="font-normal text-gray-700 mb-2">
              Monitor power consumption and performance metrics for Panel 1 33KVA control panel.
            </p>
            
            {/* Today's Highest Peak kWh */}
            <div className="flex items-center mb-4 bg-blue-50 p-2 rounded">
              <Zap className="w-4 h-4 text-blue-600 mr-2" />
              <div>
                <p className="text-sm font-medium">Today's Highest Peak:</p>
                <p className="text-lg font-bold">
                  {isLoading ? (
                    <span className="text-gray-400">Loading...</span>
                  ) : (
                    <span>{peakPowerData?.panel33Peak.toFixed(2) || "0.00"} kW</span>
                  )}
                </p>
              </div>
            </div>
            
            <div className="flex justify-between items-center">
              <div className="flex items-center">
                <div className="w-3 h-3 rounded-full bg-green-500 mr-2"></div>
                <span className="text-sm text-gray-600">Online</span>
              </div>
              <span className="text-sm text-blue-600 hover:underline">View details →</span>
            </div>
          </div>
        </Link>

        <Link href="/panel-66kva">
          <div className="block p-6 bg-white border border-gray-200 rounded-lg shadow hover:bg-gray-50 cursor-pointer">
            <div className="flex items-center mb-3">
              <ToggleLeft className="w-6 h-6 text-primary mr-2" />
              <h5 className="text-xl font-bold tracking-tight text-gray-900">Panel 2 66KVA</h5>
            </div>
            <p className="font-normal text-gray-700 mb-2">
              Check real-time data, phase analysis, and voltage variance for Panel 2 66KVA.
            </p>
            
            {/* Today's Highest Peak kWh */}
            <div className="flex items-center mb-4 bg-blue-50 p-2 rounded">
              <Zap className="w-4 h-4 text-blue-600 mr-2" />
              <div>
                <p className="text-sm font-medium">Today's Highest Peak:</p>
                <p className="text-lg font-bold">
                  {isLoading ? (
                    <span className="text-gray-400">Loading...</span>
                  ) : (
                    <span>{peakPowerData?.panel66Peak.toFixed(2) || "0.00"} kW</span>
                  )}
                </p>
              </div>
            </div>
            
            <div className="flex justify-between items-center">
              <div className="flex items-center">
                <div className="w-3 h-3 rounded-full bg-green-500 mr-2"></div>
                <span className="text-sm text-gray-600">Online</span>
              </div>
              <span className="text-sm text-blue-600 hover:underline">View details →</span>
            </div>
          </div>
        </Link>

        <div className="block p-6 bg-white border border-gray-200 rounded-lg shadow hover:bg-gray-50 opacity-60 cursor-not-allowed">
          <div className="flex items-center mb-3">
            <Zap className="w-6 h-6 text-gray-400 mr-2" />
            <h5 className="text-xl font-bold tracking-tight text-gray-900">Energy Management</h5>
          </div>
          <p className="font-normal text-gray-700 mb-4">
            Advanced energy management controls and automation tools (coming soon).
          </p>
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <div className="w-3 h-3 rounded-full bg-gray-400 mr-2"></div>
              <span className="text-sm text-gray-600">Coming soon</span>
            </div>
            <span className="text-sm text-gray-400">Unavailable</span>
          </div>
        </div>

        {/* System Status */}
        <div className="col-span-1 md:col-span-3 bg-white border border-gray-200 rounded-lg shadow p-6 mt-4">
          <h5 className="text-xl font-bold mb-4">System Status</h5>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="flex items-center">
              <div className="w-3 h-3 rounded-full bg-green-500 mr-2"></div>
              <span>Network: Connected</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 rounded-full bg-green-500 mr-2"></div>
              <span>Database: Online</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 rounded-full bg-green-500 mr-2"></div>
              <span>Sensors: All Operating</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 rounded-full bg-green-500 mr-2"></div>
              <span>Last Update: Just now</span>
            </div>
          </div>
        </div>
      </div>
    </HomeAssistant>
  );
};

export default Home;