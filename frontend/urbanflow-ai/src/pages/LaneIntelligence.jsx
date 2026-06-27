import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  AreaChart, Area, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, ReferenceLine
} from 'recharts';
import {
  pageVariants, staggerContainer, fadeInUp, CustomTooltip, RefreshIndicator
} from '../components/shared';
import {
  laneRadarData, generateLaneBalance, generateLaneData
} from '../data/trafficData';
import './LaneIntelligence.css';

export default function LaneIntelligence() {
  const balanceData = useMemo(() => generateLaneBalance(), []);
  const laneStats = useMemo(() => generateLaneData(), []);

  return (
    <motion.div
      className="page-container"
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
    >
      <div className="page-hero">
        <h1>Lane Intelligence</h1>
        <p>Micro-level capacity utilization and dynamic lane management</p>
        <div style={{ marginTop: '12px' }}>
          <RefreshIndicator />
        </div>
      </div>

      <div className="chart-grid">
        <div className="chart-card">
          <div className="chart-title">Multidimensional Lane Comparison</div>
          <div className="chart-subtitle">Radar analysis of flow characteristics</div>
          <div style={{ width: '100%', height: 350 }}>
            <ResponsiveContainer>
              <RadarChart data={laneRadarData} margin={{ top: 20, right: 30, bottom: 20, left: 30 }}>
                <PolarGrid stroke="rgba(99,102,241,0.2)" />
                <PolarAngleAxis dataKey="metric" tick={{ fill: '#a5b4fc', fontSize: 12 }} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '11px' }} />
                <Radar name="Lane 1" dataKey="lane1" stroke="#6366f1" fill="#6366f1" fillOpacity={0.1} />
                <Radar name="Lane 6" dataKey="lane6" stroke="#ef4444" fill="#ef4444" fillOpacity={0.1} />
                <Radar name="Lane 3" dataKey="lane3" stroke="#10b981" fill="#10b981" fillOpacity={0.1} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="chart-card">
          <div className="chart-title">Lane Distribution Balance</div>
          <div className="chart-subtitle">Stacked share of total throughput</div>
          <div style={{ width: '100%', height: 350 }}>
            <ResponsiveContainer>
              <AreaChart data={balanceData} stackOffset="expand">
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(99,102,241,0.1)" vertical={false} />
                <XAxis dataKey="hour" stroke="#64748b" fontSize={12} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `${val * 100}%`} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="lane1Share" stackId="1" stroke="#6366f1" fill="#6366f1" />
                <Area type="monotone" dataKey="lane2Share" stackId="1" stroke="#06b6d4" fill="#06b6d4" />
                <Area type="monotone" dataKey="lane3Share" stackId="1" stroke="#8b5cf6" fill="#8b5cf6" />
                <Area type="monotone" dataKey="lane4Share" stackId="1" stroke="#10b981" fill="#10b981" />
                <Area type="monotone" dataKey="lane5Share" stackId="1" stroke="#f59e0b" fill="#f59e0b" />
                <Area type="monotone" dataKey="lane6Share" stackId="1" stroke="#ef4444" fill="#ef4444" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="chart-card chart-full">
          <div className="chart-title">Emergency & Dynamic Lane Monitor</div>
          <div className="chart-subtitle">Real-time status of physical road cross-section</div>
          <div className="lane-monitor">
            {[1, 2, 3, 4, 5, 6].map((laneNum) => {
              let status = 'active';
              let statusText = 'Normal Operation';
              if (laneNum === 4) { status = 'standby'; statusText = 'HOV Standby'; }
              if (laneNum === 5) { status = 'emergency'; statusText = 'Emergency Vehicle Approaching'; }
              
              return (
                <div key={laneNum} className="lane-bar">
                  <div className={`lane-status-indicator ${status}`} />
                  <div className="lane-number">L{laneNum}</div>
                  <div className="lane-info">{statusText}</div>
                  {laneNum < 6 && <div className="lane-divider" />}
                </div>
              );
            })}
          </div>
        </div>

        <div className="chart-card chart-full">
          <div className="chart-title">Per-Lane Statistics Matrix</div>
          <div className="chart-subtitle">Detailed metrics across all lanes</div>
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Lane</th>
                  <th>Avg Speed</th>
                  <th>Volume (veh/hr)</th>
                  <th>Occupancy</th>
                  <th>Density (veh/km)</th>
                  <th>Headway (s)</th>
                  <th>Utilization</th>
                </tr>
              </thead>
              <tbody>
                {laneStats.map((lane) => (
                  <tr key={lane.id}>
                    <td><strong>{lane.name}</strong></td>
                    <td>{lane.avgSpeed} km/h</td>
                    <td>{lane.volume.toLocaleString()}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span>{lane.occupancy}%</span>
                        <div className="inline-bar-bg">
                          <div className="inline-bar-fill" style={{ width: `${lane.occupancy}%`, background: lane.occupancy > 70 ? '#ef4444' : '#10b981' }} />
                        </div>
                      </div>
                    </td>
                    <td>{lane.density}</td>
                    <td>{lane.headway}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span>{lane.utilization}%</span>
                        <div className="inline-bar-bg">
                          <div className="inline-bar-fill" style={{ width: `${lane.utilization}%`, background: '#6366f1' }} />
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
