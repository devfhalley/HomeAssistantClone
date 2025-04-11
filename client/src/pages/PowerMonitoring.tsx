import HomeAssistant from "@/components/HomeAssistant";
import PowerMonitorCard from "@/components/PowerMonitorCard";
import ChartCard from "@/components/ChartCard";
import { phaseData, chartData } from "@/data/powerData";

const PowerMonitoring = () => {
  return (
    <HomeAssistant>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Power Monitor Cards */}
        <PowerMonitorCard 
          title="Power Monitor phase R" 
          phase="R"
          voltage={phaseData.R.voltage}
          current={phaseData.R.current}
          power={phaseData.R.power}
          energy={phaseData.R.energy}
        />
        
        <PowerMonitorCard 
          title="Power Monitor phase S" 
          phase="S"
          voltage={phaseData.S.voltage}
          current={phaseData.S.current}
          power={phaseData.S.power}
          energy={phaseData.S.energy}
        />
        
        <PowerMonitorCard 
          title="Power Monitor phase T" 
          phase="T"
          voltage={phaseData.T.voltage}
          current={phaseData.T.current}
          power={phaseData.T.power}
          energy={phaseData.T.energy}
        />

        {/* Chart Cards */}
        <ChartCard 
          title="Voltage Comparison" 
          phaseRData={chartData.voltage.R}
          phaseSData={chartData.voltage.S}
          phaseTData={chartData.voltage.T}
          yAxisDomain={[190, 240]}
          unit="V"
        />
        
        <ChartCard 
          title="Current Comparison" 
          phaseRData={chartData.current.R}
          phaseSData={chartData.current.S}
          phaseTData={chartData.current.T}
          yAxisDomain={[0, 100]}
          unit="A"
        />
        
        <ChartCard 
          title="power Comparison" 
          phaseRData={chartData.power.R}
          phaseSData={chartData.power.S}
          phaseTData={chartData.power.T}
          yAxisDomain={[0, 20000]}
          unit="W"
        />
      </div>
    </HomeAssistant>
  );
};

export default PowerMonitoring;
