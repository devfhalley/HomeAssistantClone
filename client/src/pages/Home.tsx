import { useEffect, useState } from "react";
import HomeAssistant from "@/components/HomeAssistant";
import { Link } from "wouter";
import { ToggleLeft, PieChart, Activity, BarChart3, Zap, Clock, Server, Database, Wifi, RefreshCw } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import StackedPowerAreaChart from "@/components/StackedPowerAreaChart";

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

// Type for system information
interface SystemInfo {
  environment: string;
  dbHost: string;
  dbName: string;
  dbStatus: string;
  timestamp: string;
  serverVersion: string;
  dbType?: string; // Add database type field
}

const Home = () => {
  // Using a specific date of April 16, 2025 for consistency since that's when we have data
  const [selectedDate] = useState<Date>(new Date(2025, 3, 16));
  
  useEffect(() => {
    document.title = "Home Assistant - Home";
  }, []);
  
  // Fetch peak power data
  const { data: powerData, isLoading, isFetching: isFetchingPowerData } = useQuery<{ data: PeakPowerData }>({
    queryKey: ['/api/peak-power'],
    refetchInterval: 10000, // Refresh every 10 seconds
    refetchIntervalInBackground: true,
  });
  
  // Fetch system info
  const { data: systemInfo, isLoading: isSystemInfoLoading, isFetching: isFetchingSystemInfo } = useQuery<SystemInfo>({
    queryKey: ['/api/system-info'],
    refetchInterval: 10000, // Refresh every 10 seconds
    refetchIntervalInBackground: true,
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
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold mb-1">Home</h1>
          <p className="text-gray-600">Monitor and control your power usage</p>
        </div>
        {(isFetchingPowerData || isFetchingSystemInfo) && (
          <div className="flex items-center">
            <RefreshCw className="w-4 h-4 mr-2 text-blue-500 animate-spin" />
            <span className="text-sm text-blue-500">Refreshing data...</span>
          </div>
        )}
      </div>

      {/* Power Charts Section */}
      <div className="mb-6">
        <h2 className="text-xl font-bold mb-4">Power Monitoring Charts</h2>
        
        {/* 33KVA Panel Section */}
        <div className="mb-4">
          <h3 className="text-lg font-semibold mb-3 text-gray-800">
            <span className="flex items-center">
              <Activity className="w-5 h-5 mr-2 text-blue-600" />
              Panel 1 - 33KVA Power Usage
            </span>
          </h3>
          <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-4">
            <StackedPowerAreaChart
              title="33KVA Panel Power Usage"
              panelType="33kva"
              selectedDate={selectedDate}
              // Pass panel=33kva to the voltage data API to fetch from the correct table
              additionalQueryParams={{ panel: "33kva" }}
            />
          </div>
        </div>

        {/* 66KVA Panel Section */}
        <div className="mb-4">
          <h3 className="text-lg font-semibold mb-3 text-gray-800">
            <span className="flex items-center">
              <Activity className="w-5 h-5 mr-2 text-amber-600" />
              Panel 2 - 66KVA Power Usage
            </span>
          </h3>
          <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-4">
            <StackedPowerAreaChart
              title="66KVA Panel Power Usage"
              panelType="66kva"
              selectedDate={selectedDate}
              // Pass panel=66kva to the voltage data API to fetch from the correct table
              additionalQueryParams={{ panel: "66kva" }}
            />
          </div>
        </div>
      </div>

      {/* System Status */}
      <div className="bg-white border border-gray-200 rounded-lg shadow p-6 mt-4">
        <h5 className="text-xl font-bold mb-4">System Status</h5>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="flex items-center">
            <div className="w-3 h-3 rounded-full bg-green-500 mr-2"></div>
            <div className="flex items-center">
              <Wifi className="w-4 h-4 mr-2 text-gray-600" />
              <span>Network: Connected</span>
            </div>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 rounded-full bg-green-500 mr-2"></div>
            <div className="flex items-center">
              <Database className="w-4 h-4 mr-2 text-gray-600" />
              <span>
                {isSystemInfoLoading ? "Database: Loading..." : `Database: ${systemInfo?.dbStatus || "Online"}`}
              </span>
            </div>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 rounded-full bg-green-500 mr-2"></div>
            <div className="flex items-center">
              <Server className="w-4 h-4 mr-2 text-gray-600" />
              <span>
                {isSystemInfoLoading ? "Environment: Loading..." : `Environment: ${systemInfo?.environment || "Development"}`}
              </span>
            </div>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 rounded-full bg-green-500 mr-2"></div>
            <div className="flex items-center">
              <RefreshCw className="w-4 h-4 mr-2 text-gray-600" />
              <span>Last Update: {isSystemInfoLoading ? "Loading..." : formatTime(systemInfo?.timestamp || null)}</span>
            </div>
          </div>
        </div>
        
        {/* Database Information */}
        {!isSystemInfoLoading && systemInfo && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="flex flex-wrap gap-2 text-sm text-gray-600">
              <span className="px-2 py-1 bg-gray-100 rounded-md flex items-center">
                <Database className="w-3 h-3 mr-1" />
                Server: {systemInfo.dbHost}
              </span>
              <span className="px-2 py-1 bg-gray-100 rounded-md flex items-center">
                <Database className="w-3 h-3 mr-1" />
                Database: {systemInfo.dbType || "PostgreSQL"} ({systemInfo.dbName})
              </span>
              <span className="px-2 py-1 bg-gray-100 rounded-md flex items-center">
                <Server className="w-3 h-3 mr-1" />
                Version: {systemInfo.serverVersion}
              </span>
            </div>
          </div>
        )}
      </div>
    </HomeAssistant>
  );
};

export default Home;