// Simple production server for Replit deployment
const express = require('express');
const path = require('path');
const { Pool } = require('pg');
const ws = require('ws');

// Database configuration
const dbConfig = {
  connectionString: "postgres://root:panel_utama@165.22.50.101:5432/panel_utama"
};

// Create PostgreSQL pool
const pool = new Pool(dbConfig);

// Initialize Express app
const app = express();
app.use(express.json());

console.log('Server starting in production mode with direct database connection to 165.22.50.101');

// API Routes
app.get('/api/system-info', async (req, res) => {
  try {
    const result = await pool.query('SELECT version() as server_version');
    res.json({
      environment: 'production',
      dbHost: '165.22.50.101',
      dbName: 'panel_utama',
      dbStatus: 'connected',
      timestamp: new Date().toISOString(),
      serverVersion: result.rows[0].server_version,
      dbType: 'PostgreSQL'
    });
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({ error: 'Database connection error', message: error.message });
  }
});

app.get('/api/user', (req, res) => {
  // Mock user since we removed authentication
  res.json({ id: 1, username: 'admin' });
});

app.get('/api/phase-data', async (req, res) => {
  try {
    // Get the latest data from 33KVA panel
    const result = await pool.query('SELECT * FROM panel_33kva ORDER BY id DESC LIMIT 1');
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'No data found' });
    }
    
    const panelData = result.rows[0];
    
    // Transform into phase data
    const phaseData = [
      {
        phase: 'R',
        voltage: parseFloat(panelData.volt_r),
        current: parseFloat(panelData.arus_r),
        power: parseFloat(panelData.kva_r) * 1000,
        energy: parseFloat(panelData.kvah),
        frequency: 50,
        pf: 0.9,
        time: panelData.created_at
      },
      {
        phase: 'S',
        voltage: parseFloat(panelData.volt_s),
        current: parseFloat(panelData.arus_s),
        power: parseFloat(panelData.kva_s) * 1000,
        energy: parseFloat(panelData.kvah),
        frequency: 50,
        pf: 0.9,
        time: panelData.created_at
      },
      {
        phase: 'T',
        voltage: parseFloat(panelData.volt_t),
        current: parseFloat(panelData.arus_t),
        power: parseFloat(panelData.kva_t) * 1000,
        energy: parseFloat(panelData.kvah),
        frequency: 50,
        pf: 0.9,
        time: panelData.created_at
      }
    ];
    
    res.json(phaseData);
  } catch (error) {
    console.error('Error fetching phase data:', error);
    res.status(500).json({ error: 'Database error', message: error.message });
  }
});

app.get('/api/peak-power', async (req, res) => {
  try {
    // Get data for both panels
    const panel33Result = await pool.query('SELECT * FROM panel_33kva ORDER BY id DESC LIMIT 1');
    const panel66Result = await pool.query('SELECT * FROM panel_66kva ORDER BY id DESC LIMIT 1');
    
    if (panel33Result.rows.length === 0 || panel66Result.rows.length === 0) {
      return res.status(404).json({ error: 'Panel data not found' });
    }
    
    const panel33 = panel33Result.rows[0];
    const panel66 = panel66Result.rows[0];
    
    // Calculate peak power
    const peakPowerData = {
      panel33: {
        peak: parseFloat(panel33.netkw),
        peakTime: panel33.created_at.toISOString(),
        totalUsage: parseFloat(panel33.kvah)
      },
      panel66: {
        peak: parseFloat(panel66.netkw),
        peakTime: panel66.created_at.toISOString(),
        totalUsage: parseFloat(panel66.kvah)
      },
      totalPeak: parseFloat(panel33.netkw) + parseFloat(panel66.netkw),
      totalUsage: parseFloat(panel33.kvah) + parseFloat(panel66.kvah)
    };
    
    res.json(peakPowerData);
  } catch (error) {
    console.error('Error fetching peak power:', error);
    res.status(500).json({ error: 'Database error', message: error.message });
  }
});

app.get('/api/total-power', async (req, res) => {
  try {
    // Get data for both panels
    const panel33Result = await pool.query('SELECT * FROM panel_33kva ORDER BY id DESC LIMIT 1');
    const panel66Result = await pool.query('SELECT * FROM panel_66kva ORDER BY id DESC LIMIT 1');
    
    if (panel33Result.rows.length === 0 || panel66Result.rows.length === 0) {
      return res.status(404).json({ error: 'Panel data not found' });
    }
    
    const panel33 = panel33Result.rows[0];
    const panel66 = panel66Result.rows[0];
    
    // Get the hour from the timestamp
    const hour = new Date(panel33.created_at).getHours();
    const minute = new Date(panel33.created_at).getMinutes();
    const formattedTime = `${hour}:${minute < 10 ? '0' + minute : minute}`;
    
    // Calculate total power
    const totalPower = Math.round((parseFloat(panel33.netkw) + parseFloat(panel66.netkw)) * 1000);
    
    res.json([{ time: formattedTime, totalPower }]);
  } catch (error) {
    console.error('Error fetching total power:', error);
    res.status(500).json({ error: 'Database error', message: error.message });
  }
});

app.get('/api/chart-data/:dataType/:phase', async (req, res) => {
  try {
    const { dataType, phase } = req.params;
    
    // Get data for panel 33KVA
    const panelResult = await pool.query('SELECT * FROM panel_33kva ORDER BY id DESC LIMIT 1');
    
    if (panelResult.rows.length === 0) {
      return res.status(404).json({ error: 'Panel data not found' });
    }
    
    const panelData = panelResult.rows[0];
    
    // Create fake time points for the chart (one hour increments for the past 24 hours)
    const currentTime = new Date(panelData.created_at);
    let chartData = [];
    
    // Get the base value according to data type and phase
    let baseValue;
    switch (dataType) {
      case 'voltage':
        baseValue = parseFloat(panelData[`volt_${phase.toLowerCase()}`]);
        break;
      case 'current':
        baseValue = parseFloat(panelData[`arus_${phase.toLowerCase()}`]);
        break;
      case 'power':
        baseValue = parseFloat(panelData[`kva_${phase.toLowerCase()}`]) * 1000;
        break;
      case 'frequency':
        baseValue = 50; // Fixed value
        break;
      case 'pf':
        baseValue = 0.9; // Fixed value
        break;
      default:
        baseValue = 0;
    }
    
    // Generate 24 data points with small variations
    for (let i = 0; i < 24; i++) {
      const timePoint = new Date(currentTime);
      timePoint.setHours(currentTime.getHours() - i);
      
      // Add random variation (±5%)
      const variation = baseValue * (0.95 + Math.random() * 0.1);
      const value = Math.round(variation * 100) / 100;
      
      chartData.push({
        phase,
        dataType,
        time: `${timePoint.getHours()}:00`,
        value
      });
    }
    
    res.json(chartData);
  } catch (error) {
    console.error(`Error fetching ${req.params.dataType} data for phase ${req.params.phase}:`, error);
    res.status(500).json({ error: 'Database error', message: error.message });
  }
});

// Serve static files from the client directory
app.use(express.static(path.join(__dirname, 'client')));

// For any other request, serve the index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'client', 'index.html'));
});

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});