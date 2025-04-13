import { useEffect, useState } from "react";
import HomeAssistant from "@/components/HomeAssistant";
import { Link } from "wouter";
import { ToggleLeft, PieChart, Activity, BarChart3, Zap, Clock } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";

// Type for panel data
interface PanelData {
  peak: number;
  peakTime: string;
  totalUsage: number;
}

// Type for peak power data
interface PeakPowerData {
  panel33: PanelData;
  panel66: PanelData;
  totalPeak: number;
  totalUsage: number;
}

const Home = () => {
  useEffect(() => {
    document.title = "Home Assistant - Home";
  }, []);
  
  // Fetch peak power data
  const { data: powerData, isLoading } = useQuery<PeakPowerData>({
    queryKey: ['/api/peak-power'],
    refetchInterval: 60000, // Refresh every minute
  });

  // Format the timestamp
  const formatTime = (timestamp: string | null) => {
    if (!timestamp) return "N/A";
    try {
      return format(new Date(timestamp), 'h:mm a');
    } catch (e) {
      return "N/A";
    }
  };

  return (
    <HomeAssistant>
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-1">Home</h1>
        <p className="text-gray-600">Monitor and control your power usage</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Panel 1 - 33KVA Card */}
        <Link href="/wo-08">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
            <CardHeader className="bg-blue-50 pb-2">
              <CardTitle className="flex items-center text-xl">
                <ToggleLeft className="w-6 h-6 text-primary mr-2" />
                Panel 1 - 33KVA
              </CardTitle>
              <CardDescription>
                Power monitoring system for 33KVA panel
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Usage Card */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-center mb-2">
                    <Activity className="w-5 h-5 text-blue-600 mr-2" />
                    <h3 className="font-semibold text-gray-800">Today's Usage</h3>
                  </div>
                  <p className="text-2xl font-bold text-blue-700">
                    {isLoading ? (
                      <span className="text-gray-400">Loading...</span>
                    ) : (
                      <span>{((powerData?.panel33?.totalUsage) || 0).toFixed(2)} kWh</span>
                    )}
                  </p>
                  <p className="text-sm text-gray-600 mt-1">Total power consumption</p>
                </div>

                {/* Highest Peak Card */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-center mb-2">
                    <Zap className="w-5 h-5 text-blue-600 mr-2" />
                    <h3 className="font-semibold text-gray-800">Highest Peak</h3>
                  </div>
                  <p className="text-2xl font-bold text-blue-700">
                    {isLoading ? (
                      <span className="text-gray-400">Loading...</span>
                    ) : (
                      <span>{(powerData?.panel33?.peak || 0).toFixed(2)} kW</span>
                    )}
                  </p>
                  <div className="flex items-center text-sm text-gray-600 mt-1">
                    <Clock className="w-3 h-3 mr-1" />
                    {isLoading ? "Loading..." : formatTime(powerData?.panel33?.peakTime || null)}
                  </div>
                </div>
              </div>

              <div className="flex justify-between items-center mt-4">
                <div className="flex items-center">
                  <div className="w-3 h-3 rounded-full bg-green-500 mr-2"></div>
                  <span className="text-sm text-gray-600">Online</span>
                </div>
                <span className="text-sm text-blue-600 hover:underline">View details →</span>
              </div>
            </CardContent>
          </Card>
        </Link>

        {/* Panel 2 - 66KVA Card */}
        <Link href="/panel-66kva">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
            <CardHeader className="bg-amber-50 pb-2">
              <CardTitle className="flex items-center text-xl">
                <ToggleLeft className="w-6 h-6 text-amber-600 mr-2" />
                Panel 2 - 66KVA
              </CardTitle>
              <CardDescription>
                Power monitoring system for 66KVA panel
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Usage Card */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-center mb-2">
                    <Activity className="w-5 h-5 text-amber-600 mr-2" />
                    <h3 className="font-semibold text-gray-800">Today's Usage</h3>
                  </div>
                  <p className="text-2xl font-bold text-amber-700">
                    {isLoading ? (
                      <span className="text-gray-400">Loading...</span>
                    ) : (
                      <span>{(powerData?.panel66?.totalUsage || 0).toFixed(2)} kWh</span>
                    )}
                  </p>
                  <p className="text-sm text-gray-600 mt-1">Total power consumption</p>
                </div>

                {/* Highest Peak Card */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-center mb-2">
                    <Zap className="w-5 h-5 text-amber-600 mr-2" />
                    <h3 className="font-semibold text-gray-800">Highest Peak</h3>
                  </div>
                  <p className="text-2xl font-bold text-amber-700">
                    {isLoading ? (
                      <span className="text-gray-400">Loading...</span>
                    ) : (
                      <span>{(powerData?.panel66?.peak || 0).toFixed(2)} kW</span>
                    )}
                  </p>
                  <div className="flex items-center text-sm text-gray-600 mt-1">
                    <Clock className="w-3 h-3 mr-1" />
                    {isLoading ? "Loading..." : formatTime(powerData?.panel66?.peakTime || null)}
                  </div>
                </div>
              </div>

              <div className="flex justify-between items-center mt-4">
                <div className="flex items-center">
                  <div className="w-3 h-3 rounded-full bg-green-500 mr-2"></div>
                  <span className="text-sm text-gray-600">Online</span>
                </div>
                <span className="text-sm text-blue-600 hover:underline">View details →</span>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* System Status */}
      <div className="bg-white border border-gray-200 rounded-lg shadow p-6 mt-4">
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
    </HomeAssistant>
  );
};

export default Home;