import { Activity, Waves, Droplet, Bolt, Zap, Gauge } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface PowerMonitorCardProps {
  title: string;
  phase: string;
  voltage: number;
  current: number;
  power: number;
  energy: number;
  frequency: number;
  pf: number;
}

const PowerMonitorCard = ({
  title,
  phase,
  voltage,
  current,
  power,
  energy,
  frequency,
  pf,
}: PowerMonitorCardProps) => {
  return (
    <Card>
      <CardContent className="pt-6 pb-4">
        <h2 className="text-lg font-medium mb-6">{title}</h2>
        
        <div className="space-y-5">
          {/* Voltage */}
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="text-blue-500 mr-3">
                <Waves className="h-5 w-5" />
              </div>
              <span className="text-sm sm:text-base">voltage {phase}</span>
            </div>
            <span className="font-medium text-sm sm:text-base">{voltage.toFixed(1)} V</span>
          </div>
          
          {/* Current */}
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="text-blue-500 mr-3">
                <Droplet className="h-5 w-5" />
              </div>
              <span className="text-sm sm:text-base">current {phase}</span>
            </div>
            <span className="font-medium text-sm sm:text-base">{current.toFixed(3)} A</span>
          </div>
          
          {/* Power */}
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="text-blue-500 mr-3">
                <Activity className="h-5 w-5" />
              </div>
              <span className="text-sm sm:text-base">power {phase}</span>
            </div>
            <span className="font-medium text-sm sm:text-base">{power.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })} W</span>
          </div>
          
          {/* Energy */}
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="text-blue-500 mr-3">
                <Bolt className="h-5 w-5" />
              </div>
              <span className="text-sm sm:text-base">energy {phase}</span>
            </div>
            <span className="font-medium text-sm sm:text-base">{energy.toLocaleString()} Wh</span>
          </div>

          {/* Frequency */}
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="text-blue-500 mr-3">
                <Gauge className="h-5 w-5" />
              </div>
              <span className="text-sm sm:text-base">frequency {phase}</span>
            </div>
            <span className="font-medium text-sm sm:text-base">{frequency.toFixed(2)} Hz</span>
          </div>

          {/* Power Factor */}
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="text-blue-500 mr-3">
                <Zap className="h-5 w-5" />
              </div>
              <span className="text-sm sm:text-base">power factor {phase}</span>
            </div>
            <span className="font-medium text-sm sm:text-base">{pf.toFixed(2)}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default PowerMonitorCard;
