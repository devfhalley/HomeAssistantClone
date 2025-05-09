import { Card, CardContent } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { format } from 'date-fns';

interface ChartCardProps {
  title: string;
  phaseRData: { time: string; value: number }[];
  phaseSData: { time: string; value: number }[];
  phaseTData: { time: string; value: number }[];
  yAxisDomain?: [number, number];
  unit: string;
  selectedDate?: Date; // Add optional selected date
}

const ChartCard = ({ 
  title, 
  phaseRData, 
  phaseSData, 
  phaseTData, 
  yAxisDomain,
  unit,
  selectedDate
}: ChartCardProps) => {
  // Handle empty data states
  if (!phaseRData.length || !phaseSData.length || !phaseTData.length) {
    return (
      <Card>
        <CardContent className="pt-6 pb-4">
          <h2 className="text-lg font-medium mb-2">{title}</h2>
          <div className="h-[200px] w-full flex items-center justify-center bg-gray-50">
            <p className="text-gray-400">Loading chart data...</p>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  // Get the smallest length to avoid out of bounds errors
  const minDataLength = Math.min(
    phaseRData.length,
    phaseSData.length,
    phaseTData.length
  );
  
  // Merge data for the chart, safely accessing indices
  const combinedData = Array.from({ length: minDataLength }, (_, i) => ({
    time: phaseRData[i]?.time || '',
    R: phaseRData[i]?.value || 0,
    S: phaseSData[i]?.value || 0,
    T: phaseTData[i]?.value || 0
  }));

  // Filter to show only select points on the x-axis for better readability
  const filteredData = combinedData.filter((_, i) => i % 4 === 0 || i === combinedData.length - 1);
  
  // Determine which label to use based on the data type
  const dataTypeName = title.toLowerCase().includes("voltage") 
    ? "voltage" 
    : title.toLowerCase().includes("current")
      ? "current"
      : "power";

  return (
    <Card>
      <CardContent className="pt-6 pb-4">
        <h2 className="text-lg font-medium mb-2">{title}</h2>
        <div className="h-[200px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={combinedData}
              margin={{ top: 10, right: 5, left: -15, bottom: 10 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis 
                dataKey="time" 
                tickFormatter={(value) => value}
                ticks={filteredData.map(d => d.time)}
                tick={{ fontSize: 9 }}
                interval="preserveEnd"
              />
              <YAxis 
                domain={yAxisDomain}
                tick={{ fontSize: 9 }}
                width={30}
              />
              <Tooltip 
                formatter={(value: number) => [`${value} ${unit}`, '']}
                labelFormatter={(label) => `${label}`}
                contentStyle={{ fontSize: '12px' }}
              />
              <Legend align="center" verticalAlign="top" iconSize={8} iconType="line" wrapperStyle={{ fontSize: '10px' }} />
              <Line
                type="monotone"
                dataKey="R"
                name={`${dataTypeName} R ${selectedDate ? `(${format(selectedDate, "dd MMM yyyy")})` : ''}`}
                stroke="#1e90ff"
                strokeWidth={1.5}
                dot={false}
                activeDot={{ r: 4 }}
              />
              <Line
                type="monotone"
                dataKey="S"
                name={`${dataTypeName} S ${selectedDate ? `(${format(selectedDate, "dd MMM yyyy")})` : ''}`}
                stroke="#ffa500"
                strokeWidth={1.5}
                dot={false}
                activeDot={{ r: 4 }}
              />
              <Line
                type="monotone"
                dataKey="T"
                name={`${dataTypeName} T ${selectedDate ? `(${format(selectedDate, "dd MMM yyyy")})` : ''}`}
                stroke="#2ecc71"
                strokeWidth={1.5}
                dot={false}
                activeDot={{ r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

export default ChartCard;
