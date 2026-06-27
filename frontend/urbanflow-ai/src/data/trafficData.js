// UrbanFlow AI - Comprehensive Traffic Intelligence Data Layer

// Road link definitions
export const roadLinks = [
  { id: 'LNK-001', name: 'Highway A1 - North Corridor', type: 'Highway', lanes: 6, length: 12.4, speedLimit: 100 },
  { id: 'LNK-002', name: 'Metro Ring Road - East', type: 'Arterial', lanes: 4, length: 8.7, speedLimit: 80 },
  { id: 'LNK-003', name: 'Central Business District', type: 'Urban', lanes: 4, length: 3.2, speedLimit: 50 },
  { id: 'LNK-004', name: 'Airport Express Corridor', type: 'Expressway', lanes: 6, length: 15.8, speedLimit: 120 },
  { id: 'LNK-005', name: 'Industrial Zone Access Rd', type: 'Collector', lanes: 2, length: 5.1, speedLimit: 60 },
  { id: 'LNK-006', name: 'University Boulevard', type: 'Urban', lanes: 4, length: 4.3, speedLimit: 50 },
  { id: 'LNK-007', name: 'South Bridge Connector', type: 'Bridge', lanes: 4, length: 2.8, speedLimit: 60 },
  { id: 'LNK-008', name: 'Tech Park Expressway', type: 'Expressway', lanes: 6, length: 10.2, speedLimit: 100 },
  { id: 'LNK-009', name: 'Old Town Heritage Road', type: 'Urban', lanes: 2, length: 2.1, speedLimit: 30 },
  { id: 'LNK-010', name: 'Waterfront Drive', type: 'Scenic', lanes: 4, length: 6.5, speedLimit: 60 },
  { id: 'LNK-011', name: 'Northern Bypass', type: 'Highway', lanes: 6, length: 18.3, speedLimit: 110 },
  { id: 'LNK-012', name: 'Market Street Junction', type: 'Urban', lanes: 3, length: 1.8, speedLimit: 40 },
];

// Generate congestion heatmap data (road link vs hour)
export const generateHeatmapData = () => {
  const data = [];
  roadLinks.forEach((link) => {
    for (let hour = 0; hour < 24; hour++) {
      let congestion;
      if (hour >= 7 && hour <= 9) congestion = 60 + Math.random() * 40;
      else if (hour >= 17 && hour <= 19) congestion = 55 + Math.random() * 45;
      else if (hour >= 12 && hour <= 14) congestion = 30 + Math.random() * 30;
      else if (hour >= 0 && hour <= 5) congestion = 5 + Math.random() * 15;
      else congestion = 20 + Math.random() * 30;

      if (link.type === 'Urban') congestion *= 1.2;
      if (link.type === 'Highway') congestion *= 0.8;
      congestion = Math.min(100, Math.max(0, congestion));

      data.push({
        linkId: link.id,
        linkName: link.name.split(' - ')[0].substring(0, 15),
        hour,
        congestion: Math.round(congestion),
      });
    }
  });
  return data;
};

// 14-day traffic trend
export const generateDailyTrend = () => {
  const days = [];
  const baseDate = new Date('2026-06-14');
  for (let i = 0; i < 14; i++) {
    const date = new Date(baseDate);
    date.setDate(date.getDate() + i);
    const isWeekend = date.getDay() === 0 || date.getDay() === 6;
    days.push({
      date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      fullDate: date.toISOString().split('T')[0],
      avgSpeed: isWeekend ? 55 + Math.random() * 15 : 35 + Math.random() * 20,
      totalVolume: isWeekend ? 45000 + Math.floor(Math.random() * 15000) : 85000 + Math.floor(Math.random() * 25000),
      avgDelay: isWeekend ? 2 + Math.random() * 4 : 8 + Math.random() * 12,
      congestionIndex: isWeekend ? 25 + Math.random() * 20 : 55 + Math.random() * 30,
      incidents: Math.floor(Math.random() * (isWeekend ? 3 : 8)),
    });
  }
  return days;
};

// 24-hour radial clock data
export const generateRadialClockData = () => {
  const data = [];
  for (let hour = 0; hour < 24; hour++) {
    let congestion;
    if (hour >= 7 && hour <= 9) congestion = 75 + Math.random() * 25;
    else if (hour >= 17 && hour <= 19) congestion = 70 + Math.random() * 30;
    else if (hour >= 12 && hour <= 14) congestion = 40 + Math.random() * 20;
    else if (hour >= 0 && hour <= 5) congestion = 5 + Math.random() * 10;
    else congestion = 25 + Math.random() * 25;

    data.push({
      hour: `${hour.toString().padStart(2, '0')}:00`,
      congestion: Math.round(congestion),
      vehicles: Math.floor(congestion * 120 + Math.random() * 2000),
      speed: Math.round(80 - congestion * 0.6 + Math.random() * 10),
    });
  }
  return data;
};

// Top congested links
export const getTopCongestedLinks = () => {
  return [
    { name: 'Market St Junction', congestion: 94, delay: 18.2, trend: 'up' },
    { name: 'Central Business Dist', congestion: 89, delay: 15.7, trend: 'up' },
    { name: 'Old Town Heritage', congestion: 85, delay: 14.1, trend: 'stable' },
    { name: 'South Bridge Connector', congestion: 78, delay: 11.3, trend: 'down' },
    { name: 'University Boulevard', congestion: 74, delay: 9.8, trend: 'up' },
    { name: 'Metro Ring Road E', congestion: 68, delay: 8.4, trend: 'stable' },
    { name: 'Waterfront Drive', congestion: 62, delay: 7.1, trend: 'down' },
    { name: 'Tech Park Expwy', congestion: 55, delay: 5.9, trend: 'down' },
    { name: 'Industrial Zone', congestion: 48, delay: 4.2, trend: 'stable' },
    { name: 'Airport Express', congestion: 42, delay: 3.5, trend: 'down' },
  ];
};

// High risk accident zones
export const accidentZones = [
  { id: 1, location: 'Market St & 5th Ave Intersection', severity: 'Critical', incidents: 23, riskScore: 94, type: 'Collision Hotspot', lastIncident: '2h ago' },
  { id: 2, location: 'South Bridge On-Ramp', severity: 'High', incidents: 18, riskScore: 82, type: 'Merge Conflict', lastIncident: '6h ago' },
  { id: 3, location: 'CBD Roundabout Junction', severity: 'High', incidents: 15, riskScore: 76, type: 'Pedestrian Risk', lastIncident: '1d ago' },
  { id: 4, location: 'Highway A1 KM 8.2 Curve', severity: 'Medium', incidents: 11, riskScore: 61, type: 'Speed Zone', lastIncident: '2d ago' },
  { id: 5, location: 'University Blvd Crosswalk', severity: 'Medium', incidents: 9, riskScore: 55, type: 'Pedestrian Risk', lastIncident: '3d ago' },
  { id: 6, location: 'Industrial Zone T-Junction', severity: 'Low', incidents: 5, riskScore: 38, type: 'Heavy Vehicle', lastIncident: '5d ago' },
];

// KPI data
export const kpiData = {
  totalVehicles: 1247893,
  avgFreeFlowSpeed: 72.4,
  peakHourMaxDelay: 18.7,
  roadLinksMonitored: 12,
  mostCongestedLink: 'Market St Junction',
  worstDay: 'Monday',
  totalVehiclesTrend: 3.2,
  speedTrend: -1.8,
  delayTrend: 5.4,
};

// Calendar heatmap data (GitHub style)
export const generateCalendarData = () => {
  const data = [];
  const startDate = new Date('2026-01-01');
  const endDate = new Date('2026-06-27');
  const current = new Date(startDate);
  while (current <= endDate) {
    const isWeekend = current.getDay() === 0 || current.getDay() === 6;
    data.push({
      date: current.toISOString().split('T')[0],
      value: isWeekend ? Math.floor(Math.random() * 40) : 30 + Math.floor(Math.random() * 70),
      month: current.getMonth(),
      day: current.getDay(),
      week: Math.floor((current - startDate) / (7 * 24 * 60 * 60 * 1000)),
    });
    current.setDate(current.getDate() + 1);
  }
  return data;
};

// Speed over time data
export const generateSpeedOverTime = () => {
  const data = [];
  for (let hour = 0; hour < 24; hour++) {
    const baseSpeed = hour >= 7 && hour <= 9 ? 25 : hour >= 17 && hour <= 19 ? 28 : hour >= 0 && hour <= 5 ? 75 : 50;
    data.push({
      hour: `${hour.toString().padStart(2, '0')}:00`,
      freeFlow: 72 + Math.random() * 5,
      actual: baseSpeed + Math.random() * 10,
      predicted: baseSpeed + Math.random() * 8 + 2,
    });
  }
  return data;
};

// Queue delay timeline
export const generateQueueDelay = () => {
  const data = [];
  for (let hour = 0; hour < 24; hour++) {
    const peakFactor = (hour >= 7 && hour <= 9) || (hour >= 17 && hour <= 19) ? 3 : 1;
    data.push({
      hour: `${hour.toString().padStart(2, '0')}:00`,
      queueLength: Math.floor(Math.random() * 200 * peakFactor + 50),
      delay: Math.round((Math.random() * 10 * peakFactor + 1) * 10) / 10,
      stopTime: Math.round((Math.random() * 5 * peakFactor) * 10) / 10,
    });
  }
  return data;
};

// Lane data for 6 lanes
export const generateLaneData = () => {
  const lanes = [];
  const laneNames = ['Lane 1 (Slow)', 'Lane 2', 'Lane 3', 'Lane 4', 'Lane 5', 'Lane 6 (Fast)'];
  laneNames.forEach((name, i) => {
    const baseOccupancy = 30 + i * 8 + Math.random() * 15;
    lanes.push({
      id: i + 1,
      name,
      occupancy: Math.round(baseOccupancy),
      avgSpeed: Math.round(40 + i * 8 + Math.random() * 10),
      volume: Math.floor(3000 + Math.random() * 5000),
      density: Math.round(20 + Math.random() * 40),
      headway: Math.round((1.5 + Math.random() * 3) * 10) / 10,
      utilization: Math.round(50 + i * 5 + Math.random() * 20),
    });
  });
  return lanes;
};

// Volume by hour grouped
export const generateVolumeByHour = () => {
  const data = [];
  for (let hour = 0; hour < 24; hour++) {
    const peakFactor = (hour >= 7 && hour <= 9) || (hour >= 17 && hour <= 19) ? 2.5 : hour >= 0 && hour <= 5 ? 0.3 : 1;
    data.push({
      hour: `${hour.toString().padStart(2, '0')}:00`,
      cars: Math.floor(2000 * peakFactor + Math.random() * 1000),
      trucks: Math.floor(400 * peakFactor + Math.random() * 200),
      buses: Math.floor(150 * peakFactor + Math.random() * 80),
      motorcycles: Math.floor(600 * peakFactor + Math.random() * 300),
    });
  }
  return data;
};

// AI Prediction data
export const aiModelMetrics = {
  accuracy: 94.7,
  mae: 2.3,
  rmse: 3.8,
  r2Score: 0.947,
  trainingSamples: 1247000,
  lastTrained: '2026-06-26 23:00',
  modelVersion: 'v3.2.1',
  architecture: 'Transformer + GBM Ensemble',
};

export const generatePredictionVsActual = () => {
  const data = [];
  for (let i = 0; i < 48; i++) {
    const hour = (i * 0.5);
    const timeStr = `${Math.floor(hour).toString().padStart(2, '0')}:${hour % 1 === 0 ? '00' : '30'}`;
    const actual = 20 + Math.sin(hour / 3.8) * 30 + Math.random() * 10 + (hour > 7 && hour < 10 ? 25 : 0) + (hour > 16 && hour < 20 ? 20 : 0);
    data.push({
      time: timeStr,
      actual: Math.round(Math.max(0, actual)),
      predicted: Math.round(Math.max(0, actual + (Math.random() - 0.5) * 8)),
    });
  }
  return data;
};

export const featureImportance = [
  { feature: 'Hour of Day', importance: 0.28, category: 'Temporal' },
  { feature: 'Day of Week', importance: 0.19, category: 'Temporal' },
  { feature: 'Vehicle Count', importance: 0.16, category: 'Traffic' },
  { feature: 'Avg Speed (t-1)', importance: 0.12, category: 'Historical' },
  { feature: 'Lane Occupancy', importance: 0.08, category: 'Traffic' },
  { feature: 'Weather Index', importance: 0.06, category: 'External' },
  { feature: 'Event Proximity', importance: 0.04, category: 'External' },
  { feature: 'Road Type', importance: 0.04, category: 'Infrastructure' },
  { feature: 'Season', importance: 0.02, category: 'Temporal' },
  { feature: 'Holiday Flag', importance: 0.01, category: 'Temporal' },
];

export const generateResidualData = () => {
  const data = [];
  for (let i = 0; i < 200; i++) {
    const error = (Math.random() - 0.5) * 2 + (Math.random() - 0.5) * 2 + (Math.random() - 0.5) * 2;
    data.push({
      predicted: 20 + Math.random() * 60,
      residual: Math.round(error * 100) / 100,
    });
  }
  return data;
};

// Lane intelligence radar data
export const laneRadarData = [
  { metric: 'Speed', lane1: 42, lane2: 48, lane3: 55, lane4: 62, lane5: 70, lane6: 78 },
  { metric: 'Volume', lane1: 85, lane2: 78, lane3: 72, lane4: 65, lane5: 55, lane6: 45 },
  { metric: 'Occupancy', lane1: 78, lane2: 70, lane3: 65, lane4: 58, lane5: 50, lane6: 42 },
  { metric: 'Density', lane1: 72, lane2: 65, lane3: 58, lane4: 52, lane5: 45, lane6: 38 },
  { metric: 'Headway', lane1: 35, lane2: 42, lane3: 50, lane4: 58, lane5: 65, lane6: 75 },
  { metric: 'Utilization', lane1: 80, lane2: 75, lane3: 68, lane4: 60, lane5: 52, lane6: 45 },
];

// Lane balance timeline
export const generateLaneBalance = () => {
  const data = [];
  for (let hour = 0; hour < 24; hour++) {
    data.push({
      hour: `${hour.toString().padStart(2, '0')}:00`,
      balanceIndex: Math.round((0.6 + Math.random() * 0.35) * 100) / 100,
      lane1Share: Math.round(12 + Math.random() * 8),
      lane2Share: Math.round(15 + Math.random() * 5),
      lane3Share: Math.round(18 + Math.random() * 5),
      lane4Share: Math.round(18 + Math.random() * 5),
      lane5Share: Math.round(16 + Math.random() * 5),
      lane6Share: Math.round(14 + Math.random() * 5),
    });
  }
  return data;
};

// Recommendations
export const recommendations = {
  signalTiming: [
    { id: 1, linkId: 'LNK-012', action: 'Increase green signal duration by 20 seconds', timeWindow: '8:00 - 9:00 AM', impact: 'Reduce delay by 35%', priority: 'Critical', status: 'Pending' },
    { id: 2, linkId: 'LNK-003', action: 'Implement adaptive signal phasing', timeWindow: '5:00 - 7:00 PM', impact: 'Reduce congestion by 22%', priority: 'High', status: 'In Review' },
    { id: 3, linkId: 'LNK-007', action: 'Synchronize traffic lights for green wave', timeWindow: '7:00 - 10:00 AM', impact: 'Improve travel time by 18%', priority: 'High', status: 'Approved' },
    { id: 4, linkId: 'LNK-006', action: 'Add pedestrian signal phase separation', timeWindow: '12:00 - 2:00 PM', impact: 'Reduce conflicts by 45%', priority: 'Medium', status: 'Pending' },
  ],
  laneManagement: [
    { id: 1, linkId: 'LNK-001', action: 'Activate contraflow lane (Lane 6→inbound)', timeWindow: '7:00 - 9:30 AM', impact: '15% capacity increase', priority: 'High' },
    { id: 2, linkId: 'LNK-004', action: 'Open emergency shoulder as travel lane', timeWindow: '5:00 - 8:00 PM', impact: '20% throughput gain', priority: 'Critical' },
    { id: 3, linkId: 'LNK-008', action: 'HOV lane activation during peak hours', timeWindow: '6:30 - 9:00 AM', impact: '12% speed improvement', priority: 'Medium' },
  ],
  commuterTimeLoss: {
    daily: 45200,
    weekly: 316400,
    monthly: 1354000,
    annual: 16520000,
    avgPerCommuter: 47,
    costPerHour: 25,
  },
};

// Scenario simulator presets
export const scenarioPresets = [
  {
    id: 'bus-frequency',
    name: 'Increase Bus Frequency',
    description: 'Double bus frequency on major corridors',
    icon: '🚌',
    parameters: { busFrequencyIncrease: 100, affectedRoutes: 8 },
    results: { congestionReduction: 12, travelTimeImprovement: 8, co2Reduction: 15, costSaving: 2400000 },
  },
  {
    id: 'signal-optimize',
    name: 'AI Signal Optimization',
    description: 'Deploy adaptive AI traffic signals citywide',
    icon: '🚦',
    parameters: { signalsUpgraded: 48, aiModelDeployed: true },
    results: { congestionReduction: 25, travelTimeImprovement: 18, co2Reduction: 20, costSaving: 5800000 },
  },
  {
    id: 'road-closure',
    name: 'Road Closure Simulation',
    description: 'Simulate closing Market St for maintenance',
    icon: '🚧',
    parameters: { closedLink: 'LNK-012', duration: '2 weeks' },
    results: { congestionReduction: -15, travelTimeImprovement: -12, co2Reduction: -8, costSaving: -1200000 },
  },
  {
    id: 'emergency-lane',
    name: 'Emergency Lane Activation',
    description: 'Open emergency lanes during peak hours',
    icon: '🚨',
    parameters: { lanesActivated: 4, timeWindow: 'Peak hours only' },
    results: { congestionReduction: 18, travelTimeImprovement: 14, co2Reduction: 10, costSaving: 3200000 },
  },
];

// Sustainability data
export const sustainabilityData = {
  co2Emissions: { current: 12450, optimized: 9960, unit: 'tons/month' },
  fuelWastage: { current: 845000, optimized: 676000, unit: 'liters/month' },
  commuterHoursLost: { current: 1354000, optimized: 1015500, unit: 'hours/month' },
  yearlySavings: { financial: 48000000, co2: 29880, fuel: 2028000, hours: 4062000 },
  monthlyTrend: [],
};

// Generate monthly sustainability trend
for (let i = 0; i < 12; i++) {
  const month = new Date(2026, i, 1).toLocaleString('en-US', { month: 'short' });
  sustainabilityData.monthlyTrend.push({
    month,
    co2: 14000 - i * 200 + Math.random() * 500,
    fuel: 900000 - i * 15000 + Math.random() * 30000,
    hoursLost: 1500000 - i * 20000 + Math.random() * 50000,
    efficiency: 60 + i * 2.5 + Math.random() * 3,
  });
}

// AI City Planner conversation starters
export const plannerQuestions = [
  "Why is Link 12 (Market St Junction) consistently congested?",
  "How can we reduce peak hour congestion on the CBD corridor?",
  "What's the best public transport improvement for our city?",
  "Recommend infrastructure changes for the next 5 years.",
  "How can we improve emergency vehicle response times?",
  "What impact would a new metro line have on traffic?",
];

export const plannerResponses = {
  "Why is Link 12 (Market St Junction) consistently congested?": {
    rootCause: [
      "Market St Junction (LNK-012) experiences severe congestion due to a convergence of 3 major arterials with inadequate signal phasing.",
      "Current signal cycle of 90 seconds is insufficient for the 8,400+ vehicles/hour throughput demand.",
      "Pedestrian crossing phases consume 28% of total green time, creating vehicle queue spillback.",
      "Adjacent parking facilities generate 340+ turning movements per hour during peak periods.",
    ],
    recommendations: [
      "Implement adaptive signal control with AI-driven phase optimization (Expected: -35% delay)",
      "Deploy split-phase pedestrian signals with countdown timers",
      "Convert parking facility exits to right-turn-only during AM peak",
      "Install queue detection sensors at upstream intersections for proactive signal coordination",
    ],
    publicTransport: [
      "Introduce express bus service bypassing the junction via Ring Road East",
      "Deploy bus signal priority (TSP) to reduce bus dwell time at junction by 40%",
    ],
    infrastructure: [
      "Grade-separated pedestrian crossing (cost: $2.4M, ROI: 3.2 years)",
      "Dedicated bus lane on approach corridors (cost: $800K, ROI: 1.8 years)",
    ],
  },
  "default": {
    rootCause: [
      "Analysis indicates multiple contributing factors including temporal demand patterns, infrastructure limitations, and signal timing inefficiencies.",
      "Historical data shows a 23% year-over-year increase in vehicle volumes on affected corridors.",
      "Current road geometry and lane configurations were designed for 60% of current traffic demand.",
    ],
    recommendations: [
      "Deploy city-wide adaptive traffic management system (ATMS)",
      "Implement congestion pricing during peak hours on critical corridors",
      "Expand real-time traffic information dissemination via VMS and mobile apps",
      "Develop park-and-ride facilities at city periphery with express transit connections",
    ],
    publicTransport: [
      "Increase metro frequency during peak hours from 8 to 4-minute headways",
      "Launch Bus Rapid Transit (BRT) on top 3 congested corridors",
      "Implement multi-modal journey planning with integrated ticketing",
    ],
    infrastructure: [
      "Smart intersection upgrades across 48 critical junctions ($12M, 5-year ROI)",
      "Connected vehicle infrastructure for V2I communication ($8M)",
      "Dedicated cycling infrastructure network to shift 5% of short trips ($3M)",
    ],
  },
};

// Forecast data for 24-hour prediction
export const generateForecast = () => {
  const data = [];
  for (let hour = 0; hour < 24; hour++) {
    const base = hour >= 7 && hour <= 9 ? 80 : hour >= 17 && hour <= 19 ? 75 : hour >= 0 && hour <= 5 ? 10 : 40;
    data.push({
      hour: `${hour.toString().padStart(2, '0')}:00`,
      predicted: Math.round(base + Math.random() * 15),
      upperBound: Math.round(base + 15 + Math.random() * 10),
      lowerBound: Math.round(Math.max(0, base - 10 + Math.random() * 5)),
      confidence: Math.round(88 + Math.random() * 10),
    });
  }
  return data;
};

// Fundamental traffic diagram data (speed vs density)
export const generateFundamentalDiagram = () => {
  const data = [];
  for (let i = 0; i < 150; i++) {
    const density = Math.random() * 120;
    const freeFlowSpeed = 75;
    const jamDensity = 120;
    const speed = freeFlowSpeed * (1 - density / jamDensity) + (Math.random() - 0.5) * 10;
    data.push({
      density: Math.round(density * 10) / 10,
      speed: Math.round(Math.max(0, speed) * 10) / 10,
      flow: Math.round(density * Math.max(0, speed)),
    });
  }
  return data;
};
