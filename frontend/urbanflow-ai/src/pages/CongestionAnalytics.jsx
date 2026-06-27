import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  LineChart, Line, AreaChart, Area, BarChart, Bar, ScatterChart, Scatter,
  ComposedChart, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  ZAxis
} from 'recharts';
import {
  pageVariants, staggerContainer, fadeInUp, CustomTooltip
} from '../components/shared';
import {
  roadLinks, generateCalendarData, generateSpeedOverTime,
  generateQueueDelay, generateLaneData, generateFundamentalDiagram,
  generateVolumeByHour
} from '../data/trafficData';
import './CongestionAnalytics.css';

export default function CongestionAnalytics() {
  const calendarData = useMemo(() => generateCalendarData(), []);
  const speedData = useMemo(() => generateSpeedOverTime(), []);
  const queueData = useMemo(() => generateQueueDelay(), []);
  const laneData = useMemo(() => generateLaneData(), []);
  const fundamentalData = useMemo(() => generateFundamentalDiagram(), []);
  const volumeData = useMemo(() => generateVolumeByHour(), []);

  // Process calendar data into weeks
  const weeks = useMemo(() => {
    const grouped = {};
    calendarData.forEach(d => {
      if (!grouped[d.week]) grouped[d.week] = new Array(7).fill(null);
      grouped[d.week][d.day] = d;
    });
    return Object.values(grouped);
  }, [calendarData]);

  const getColor = (value) => {
    if (!value) return 'rgba(17, 24, 39, 0.5)';
    if (value > 80) return '#ef4444';
    if (value > 60) return '#f59e0b';
    if (value > 40) return '#eab308';
    if (value > 20) return '#10b981';
    return 'rgba(16, 185, 129, 0.2)';
  };

  return (
    <motion.div
      className="page-container"
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
    >
      <div className="page-hero">
        <h1>Congestion Analytics</h1>
        <p>Deep-dive traffic pattern analysis and historical congestion trends</p>
      </div>

      <div className="filter-bar">
        <div className="filter-group">
          <div className="filter-label">Road Link</div>
          <select className="filter-select">
            <option value="all">All Road Links</option>
            {roadLinks.map(link => (
              <option key={link.id} value={link.id}>{link.name}</option>
            ))}
          </select>
        </div>
        <div className="filter-group">
          <div className="filter-label">Day Type</div>
          <select className="filter-select">
            <option value="all">All Days</option>
            <option value="weekday">Weekdays Only</option>
            <option value="weekend">Weekends Only</option>
          </select>
        </div>
        <div className="filter-group">
          <div className="filter-label">Time Range</div>
          <select className="filter-select">
            <option value="24h">24 Hours</option>
            <option value="am">AM Peak (07:00-10:00)</option>
            <option value="pm">PM Peak (16:00-19:00)</option>
            <option value="offpeak">Off-Peak</option>
          </select>
        </div>
        <div className="filter-group">
          <div className="filter-label">Lane Selector</div>
          <select className="filter-select">
            <option value="all">All Lanes (Aggregate)</option>
            {[1,2,3,4,5,6].map(l => (
              <option key={l} value={l}>Lane {l}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="chart-grid">
        <div className="chart-card chart-full">
          <div className="chart-title">Historical Congestion Heatmap</div>
          <div className="chart-subtitle">Daily average congestion index over the past 6 months</div>
          <div className="calendar-heatmap">
            {weeks.map((week, i) => (
              <div key={i} className="calendar-week">
                {week.map((day, j) => (
                  <div
                    key={`${i}-${j}`}
                    className="calendar-day"
                    style={{ background: getColor(day?.value) }}
                    title={day ? `${day.date}: ${day.value}%` : ''}
                  />
                ))}
              </div>
            ))}
          </div>
          <div className="legend-mini">
            <span className="legend-label">Light</span>
            <div className="calendar-day" style={{ background: 'rgba(16, 185, 129, 0.2)' }} />
            <div className="calendar-day" style={{ background: '#10b981' }} />
            <div className="calendar-day" style={{ background: '#eab308' }} />
            <div className="calendar-day" style={{ background: '#f59e0b' }} />
            <div className="calendar-day" style={{ background: '#ef4444' }} />
            <span className="legend-label">Heavy</span>
          </div>
        </div>

        <div className="chart-card">
          <div className="chart-title">Speed Over Time</div>
          <div className="chart-subtitle">Actual vs Free Flow vs Predicted Speed (km/h)</div>
          <div style={{ width: '100%', height: 300 }}>
            <ResponsiveContainer>
              <LineChart data={speedData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(99,102,241,0.1)" vertical={false} />
                <XAxis dataKey="hour" stroke="#64748b" fontSize={12} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
                <Line type="monotone" dataKey="freeFlow" name="Free Flow" stroke="#10b981" strokeWidth={2} strokeDasharray="5 5" dot={false} />
                <Line type="monotone" dataKey="actual" name="Actual Speed" stroke="#06b6d4" strokeWidth={3} dot={false} />
                <Line type="monotone" dataKey="predicted" name="Predicted" stroke="#8b5cf6" strokeWidth={2} strokeDasharray="3 3" dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="chart-card">
          <div className="chart-title">Queue Delay Timeline</div>
          <div className="chart-subtitle">Average queue length (vehicles) and delay (minutes)</div>
          <div style={{ width: '100%', height: 300 }}>
            <ResponsiveContainer>
              <ComposedChart data={queueData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(99,102,241,0.1)" vertical={false} />
                <XAxis dataKey="hour" stroke="#64748b" fontSize={12} tickLine={false} />
                <YAxis yAxisId="left" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis yAxisId="right" orientation="right" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
                <Bar yAxisId="left" dataKey="queueLength" name="Queue Length" fill="#6366f1" radius={[4, 4, 0, 0]} opacity={0.7} />
                <Line yAxisId="right" type="monotone" dataKey="delay" name="Delay (min)" stroke="#ef4444" strokeWidth={3} dot={false} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="chart-card">
          <div className="chart-title">Fundamental Traffic Diagram</div>
          <div className="chart-subtitle">Speed vs Density relationship</div>
          <div style={{ width: '100%', height: 300 }}>
            <ResponsiveContainer>
              <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(99,102,241,0.1)" />
                <XAxis type="number" dataKey="density" name="Density" unit=" veh/km" stroke="#64748b" fontSize={12} tickLine={false} />
                <YAxis type="number" dataKey="speed" name="Speed" unit=" km/h" stroke="#64748b" fontSize={12} tickLine={false} />
                <ZAxis range={[20, 20]} />
                <Tooltip cursor={{ strokeDasharray: '3 3' }} content={<CustomTooltip />} />
                <Scatter name="Traffic States" data={fundamentalData} fill="#06b6d4" opacity={0.6} />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="chart-card">
          <div className="chart-title">Volume by Hour & Vehicle Type</div>
          <div className="chart-subtitle">Vehicle classification distribution</div>
          <div style={{ width: '100%', height: 300 }}>
            <ResponsiveContainer>
              <BarChart data={volumeData} stackOffset="sign">
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(99,102,241,0.1)" vertical={false} />
                <XAxis dataKey="hour" stroke="#64748b" fontSize={12} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
                <Bar dataKey="cars" name="Cars" fill="#6366f1" stackId="a" />
                <Bar dataKey="trucks" name="Trucks" fill="#f59e0b" stackId="a" />
                <Bar dataKey="buses" name="Buses" fill="#10b981" stackId="a" />
                <Bar dataKey="motorcycles" name="Motorcycles" fill="#06b6d4" stackId="a" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="chart-card chart-full">
          <div className="chart-title">Real-time Lane Occupancy Gauges</div>
          <div className="chart-subtitle">Current capacity utilization per lane</div>
          <div className="gauge-grid">
            {laneData.map((lane) => (
              <div key={lane.id} className="gauge-item">
                <svg viewBox="0 0 100 100" className="gauge-svg">
                  <circle cx="50" cy="50" r="40" className="gauge-bg" />
                  <circle 
                    cx="50" cy="50" r="40" 
                    className="gauge-fill"
                    stroke={getColor(lane.occupancy)}
                    strokeDasharray={`${lane.occupancy * 2.51} 251`}
                  />
                  <text x="50" y="55" className="gauge-text" textAnchor="middle">{lane.occupancy}%</text>
                </svg>
                <div className="gauge-label">{lane.name}</div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </motion.div>
  );
}
