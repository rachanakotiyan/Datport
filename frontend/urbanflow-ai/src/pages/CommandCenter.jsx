import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  ComposedChart, Line, Area, Bar, BarChart, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, Cell, RadialBarChart, RadialBar, Legend
} from 'recharts';
import {
  pageVariants, staggerContainer, fadeInUp, useAnimatedCounter,
  formatNumber, Sparkline, getCongestionColor, getCongestionLevel,
  CustomTooltip, RefreshIndicator
} from '../components/shared';
import {
  kpiData, roadLinks, generateHeatmapData, generateDailyTrend,
  generateRadialClockData, getTopCongestedLinks, accidentZones
} from '../data/trafficData';
import './CommandCenter.css';

export default function CommandCenter() {
  const heatmapData = useMemo(() => generateHeatmapData(), []);
  const dailyTrend = useMemo(() => generateDailyTrend(), []);
  const radialData = useMemo(() => generateRadialClockData(), []);
  const topLinks = useMemo(() => getTopCongestedLinks(), []);

  // Counters
  const totalVehicles = useAnimatedCounter(kpiData.totalVehicles);
  const freeFlowSpeed = useAnimatedCounter(kpiData.avgFreeFlowSpeed);
  const maxDelay = useAnimatedCounter(kpiData.peakHourMaxDelay);

  // Group heatmap data by linkId
  const heatmapGrid = useMemo(() => {
    const grid = {};
    roadLinks.forEach(link => {
      grid[link.id] = { name: link.name.split(' - ')[0], hours: new Array(24).fill(0) };
    });
    heatmapData.forEach(d => {
      if (grid[d.linkId]) {
        grid[d.linkId].hours[d.hour] = d.congestion;
      }
    });
    return grid;
  }, [heatmapData]);

  return (
    <motion.div
      className="page-container"
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
    >
      <div className="page-hero">
        <h1>UrbanFlow AI</h1>
        <p>AI-Powered Smart Traffic Intelligence & City Planning Platform</p>
        <div className="live-badge">
          <span className="live-dot" />
          System Online
        </div>
        <div style={{ marginTop: '12px' }}>
          <RefreshIndicator />
        </div>
      </div>

      <motion.div className="kpi-grid" variants={staggerContainer} initial="initial" animate="animate">
        <motion.div className="kpi-card" variants={fadeInUp}>
          <div className="kpi-header">
            <div className="kpi-icon">🚗</div>
            <div className="kpi-trend up">+{kpiData.totalVehiclesTrend}%</div>
          </div>
          <div className="kpi-label">Total Vehicles</div>
          <div className="kpi-value">{formatNumber(totalVehicles)}</div>
          <div className="kpi-sparkline">
            <Sparkline data={Array.from({ length: 14 }, () => 1000 + Math.random() * 500)} color="#6366f1" />
          </div>
        </motion.div>

        <motion.div className="kpi-card" variants={fadeInUp}>
          <div className="kpi-header">
            <div className="kpi-icon">💨</div>
            <div className="kpi-trend down">{kpiData.speedTrend}%</div>
          </div>
          <div className="kpi-label">Avg Free Flow Speed</div>
          <div className="kpi-value">{freeFlowSpeed} <span style={{ fontSize: '1rem' }}>km/h</span></div>
          <div className="kpi-sparkline">
            <Sparkline data={Array.from({ length: 14 }, () => 60 + Math.random() * 20)} color="#06b6d4" />
          </div>
        </motion.div>

        <motion.div className="kpi-card" variants={fadeInUp}>
          <div className="kpi-header">
            <div className="kpi-icon">⏱️</div>
            <div className="kpi-trend up">+{kpiData.delayTrend}%</div>
          </div>
          <div className="kpi-label">Peak Hour Max Delay</div>
          <div className="kpi-value">{maxDelay} <span style={{ fontSize: '1rem' }}>min</span></div>
          <div className="kpi-sparkline">
            <Sparkline data={Array.from({ length: 14 }, () => 10 + Math.random() * 15)} color="#f59e0b" />
          </div>
        </motion.div>

        <motion.div className="kpi-card" variants={fadeInUp}>
          <div className="kpi-header">
            <div className="kpi-icon">🛣️</div>
          </div>
          <div className="kpi-label">Road Links Monitored</div>
          <div className="kpi-value">{kpiData.roadLinksMonitored}</div>
          <div className="kpi-sparkline">
            <Sparkline data={Array.from({ length: 14 }, () => 12)} color="#10b981" />
          </div>
        </motion.div>

        <motion.div className="kpi-card" variants={fadeInUp}>
          <div className="kpi-header">
            <div className="kpi-icon" style={{ background: 'rgba(239, 68, 68, 0.1)' }}>🚨</div>
          </div>
          <div className="kpi-label">Most Congested Link</div>
          <div className="kpi-value" style={{ fontSize: '1.2rem', lineHeight: '1.5' }}>{kpiData.mostCongestedLink}</div>
          <div className="kpi-sparkline">
             <Sparkline data={Array.from({ length: 14 }, () => 70 + Math.random() * 30)} color="#ef4444" />
          </div>
        </motion.div>

        <motion.div className="kpi-card" variants={fadeInUp}>
          <div className="kpi-header">
            <div className="kpi-icon">📅</div>
          </div>
          <div className="kpi-label">Worst Day</div>
          <div className="kpi-value" style={{ fontSize: '1.5rem' }}>{kpiData.worstDay}</div>
          <div className="kpi-sparkline">
            <Sparkline data={Array.from({ length: 7 }, () => Math.random() * 100)} color="#8b5cf6" />
          </div>
        </motion.div>
      </motion.div>

      <div className="chart-grid">
        <div className="chart-card chart-full">
          <div className="chart-title">Real-Time Congestion Heatmap</div>
          <div className="chart-subtitle">Road Link vs Hour of Day (0-23)</div>
          <div className="heatmap-wrapper">
            <div className="heatmap-grid-custom">
              {/* Header Row */}
              <div className="heatmap-label">Road Link</div>
              {Array.from({ length: 24 }).map((_, i) => (
                <div key={`h-${i}`} className="heatmap-label text-center">{i}</div>
              ))}
              
              {/* Data Rows */}
              {Object.entries(heatmapGrid).map(([id, data]) => (
                <React.Fragment key={id}>
                  <div className="heatmap-label truncate" title={data.name}>{data.name}</div>
                  {data.hours.map((val, i) => (
                    <div 
                      key={`${id}-${i}`} 
                      className="heatmap-cell-custom" 
                      style={{ background: getCongestionColor(val) }}
                      title={`${data.name} @ ${i}:00 - Congestion: ${val}%`}
                    />
                  ))}
                </React.Fragment>
              ))}
            </div>
          </div>
        </div>

        <div className="chart-card">
          <div className="chart-title">14-Day Traffic Trend</div>
          <div className="chart-subtitle">Speed vs Congestion Index vs Incidents</div>
          <div style={{ width: '100%', height: 300 }}>
            <ResponsiveContainer>
              <ComposedChart data={dailyTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(99,102,241,0.1)" vertical={false} />
                <XAxis dataKey="date" stroke="#64748b" fontSize={12} tickLine={false} />
                <YAxis yAxisId="left" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis yAxisId="right" orientation="right" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
                <Area yAxisId="left" type="monotone" dataKey="congestionIndex" name="Congestion Index" fill="url(#colorCongestion)" stroke="#6366f1" fillOpacity={1} />
                <Bar yAxisId="right" dataKey="incidents" name="Incidents" barSize={10} fill="#ef4444" radius={[4, 4, 0, 0]} />
                <Line yAxisId="left" type="monotone" dataKey="avgSpeed" name="Avg Speed (km/h)" stroke="#06b6d4" strokeWidth={3} dot={false} />
                <defs>
                  <linearGradient id="colorCongestion" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                </defs>
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="chart-card">
          <div className="chart-title">Top 10 Congested Links</div>
          <div className="chart-subtitle">Current highest congestion index scores</div>
          <div style={{ width: '100%', height: 300 }}>
            <ResponsiveContainer>
              <BarChart data={topLinks} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(99,102,241,0.1)" horizontal={false} />
                <XAxis type="number" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} domain={[0, 100]} />
                <YAxis dataKey="name" type="category" stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} width={120} />
                <Tooltip content={<CustomTooltip />} cursor={{fill: 'rgba(99,102,241,0.1)'}} />
                <Bar dataKey="congestion" name="Congestion Index" radius={[0, 4, 4, 0]} barSize={16}>
                  {topLinks.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={getCongestionColor(entry.congestion)} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="section-header">
        <div>
          <h2 className="section-title">🚨 High Risk Accident Zones</h2>
          <p className="section-subtitle">Real-time identification of dangerous intersections and segments</p>
        </div>
      </div>
      
      <motion.div className="risk-grid" variants={staggerContainer} initial="initial" animate="animate">
        {accidentZones.map((zone) => (
          <motion.div key={zone.id} className="risk-card" variants={fadeInUp}>
            <div className="risk-card-header">
              <div style={{ fontSize: '0.9rem', fontWeight: 600 }}>{zone.location}</div>
              <div className={`badge badge-${zone.severity.toLowerCase()}`}>{zone.severity}</div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
              <div>
                <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Risk Score</div>
                <div className="risk-score" style={{ color: getCongestionColor(zone.riskScore) }}>{zone.riskScore}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Incidents</div>
                <div style={{ fontSize: '1.2rem', fontWeight: 700 }}>{zone.incidents}</div>
              </div>
            </div>
            <div className="risk-details">
              <div className="risk-detail">
                <span>⚠️</span> {zone.type}
              </div>
              <div className="risk-detail">
                <span>🕒</span> Last incident: {zone.lastIncident}
              </div>
            </div>
          </motion.div>
        ))}
      </motion.div>
    </motion.div>
  );
}
