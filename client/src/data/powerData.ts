// Monitor data for each phase
export const phaseData = {
  R: {
    voltage: 218.6,
    current: 18.547,
    power: 4009.8,
    energy: 214945
  },
  S: {
    voltage: 228.2,
    current: 19.181,
    power: 3802.7,
    energy: 215652
  },
  T: {
    voltage: 220.2,
    current: 27.785,
    power: 5860.7,
    energy: 294149
  }
};

// Time labels for chart data
const timeLabels = Array.from({ length: 24 }, (_, i) => {
  const hour = i % 12 === 0 ? 12 : i % 12;
  const ampm = i < 12 ? 'AM' : 'PM';
  return `${hour}:00`;
});

// Helper function to generate chart data
const generateRandomData = (min: number, max: number, count: number) => {
  const data = [];
  
  // Generate a wavy pattern
  for (let i = 0; i < count; i++) {
    const x = i / (count - 1);
    const wave = Math.sin(x * Math.PI * 2) * ((max - min) / 10);
    const trend = min + ((max - min) / 2) + wave + Math.random() * 5;
    data.push({
      time: timeLabels[i],
      value: parseFloat(trend.toFixed(1))
    });
  }
  
  return data;
};

// Generate current data with daily pattern
const generateCurrentData = (count: number) => {
  const data = [];
  for (let i = 0; i < count; i++) {
    let hour = i;
    let baseValue;
    
    if (hour < 6) { // Night (low usage)
      baseValue = 20 + Math.random() * 10;
    } else if (hour < 12) { // Morning (rising)
      baseValue = 30 + (hour - 6) * 10 + Math.random() * 15;
    } else if (hour < 18) { // Afternoon (high)
      baseValue = 80 + Math.random() * 20;
    } else { // Evening (decreasing)
      baseValue = 60 - (hour - 18) * 8 + Math.random() * 15;
    }
    
    data.push({
      time: timeLabels[i],
      value: parseFloat(baseValue.toFixed(1))
    });
  }
  return data;
};

// Generate power data with daily pattern
const generatePowerData = (count: number) => {
  const data = [];
  for (let i = 0; i < count; i++) {
    let hour = i;
    let baseValue;
    
    if (hour < 6) { // Night (low usage)
      baseValue = 2000 + Math.random() * 1000;
    } else if (hour < 12) { // Morning (rising)
      baseValue = 3000 + (hour - 6) * 1500 + Math.random() * 1500;
    } else if (hour < 18) { // Afternoon (high)
      baseValue = 15000 + Math.random() * 5000;
    } else { // Evening (decreasing)
      baseValue = 10000 - (hour - 18) * 1500 + Math.random() * 2000;
    }
    
    data.push({
      time: timeLabels[i],
      value: parseFloat(baseValue.toFixed(1))
    });
  }
  return data;
};

// Chart data for the three comparison charts
export const chartData = {
  voltage: {
    R: generateRandomData(190, 230, 24),
    S: generateRandomData(200, 240, 24),
    T: generateRandomData(195, 235, 24)
  },
  current: {
    R: generateCurrentData(24),
    S: generateCurrentData(24),
    T: generateCurrentData(24)
  },
  power: {
    R: generatePowerData(24),
    S: generatePowerData(24),
    T: generatePowerData(24)
  }
};
