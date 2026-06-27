import React from 'react';
import { motion } from 'framer-motion';
import {
  AreaChart, Area, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, RadialBarChart, RadialBar, Legend
} from 'recharts';
import {
  pageVariants, staggerContainer, fadeInUp, useAnimatedCounter,
  formatNumber, CustomTooltip, RefreshIndicator
} from '../components/shared';
import { sustainabilityData } from '../data/trafficData';
import './Sustainability.css';

export default function Sustainability() {
  const co2Current = useAnimatedCounter(sustainabilityData.co2Emissions.current);
  const fuelCurrent = useAnimatedCounter(sustainabilityData.fuelWastage.current);
  const hoursCurrent = useAnimatedCounter(sustainabilityData.commuterHoursLost.current);
  const savings = useAnimatedCounter(sustainabilityData.yearlySavings.financial);

  // For the savings breakdown radial chart
  const savingsData = [
    { name: 'Time Value ($)', value: 45, fill: '#8b5cf6' },
    { name: 'Fuel Savings ($)', value: 30, fill: '#06b6d4' },
    { name: 'Carbon Credits ($)', value: 15, fill: '#10b981' },
    { name: 'Maintenance ($)', value: 10, fill: '#6366f1' },
  ];

  const greenScore = 78;
  const scoreColor = greenScore > 70 ? '#10b981' : greenScore > 50 ? '#f59e0b' : '#ef4444';

  return (
    <motion.div
      className="page-container sustainability-theme"
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
    >
      <div className="page-hero">
        <h1 style={{ color: '#10b981', textShadow: '0 0 15px rgba(16, 185, 129, 0.4)' }}>🌱 Sustainability Dashboard</h1>
        <p>Environmental Impact Analysis & Green Optimization Metrics</p>
        <div style={{ marginTop: '12px' }}>
          <RefreshIndicator />
        </div>
      </div>

      <motion.div className="kpi-grid" variants={staggerContainer} initial="initial" animate="animate">
        <motion.div className="kpi-card green-glow" variants={fadeInUp}>
          <div className="kpi-header">
            <div className="kpi-icon" style={{ background: 'rgba(16,185,129,0.1)', borderColor: 'rgba(16,185,129,0.3)' }}>☁️</div>
            <div className="kpi-trend up" style={{ color: '#10b981', background: 'rgba(16,185,129,0.1)' }}>-20%</div>
          </div>
          <div className="kpi-label">CO2 Emissions (Optimized)</div>
          <div className="kpi-value">{formatNumber(co2Current)} <span style={{ fontSize: '1rem', color: '#64748b' }}>tons/mo</span></div>
          <div style={{ fontSize: '0.8rem', color: '#10b981', marginTop: '8px' }}>
            Target: {formatNumber(sustainabilityData.co2Emissions.optimized)} tons
          </div>
        </motion.div>

        <motion.div className="kpi-card green-glow" variants={fadeInUp}>
          <div className="kpi-header">
            <div className="kpi-icon" style={{ background: 'rgba(6,182,212,0.1)', borderColor: 'rgba(6,182,212,0.3)' }}>⛽</div>
            <div className="kpi-trend up" style={{ color: '#10b981', background: 'rgba(16,185,129,0.1)' }}>-20%</div>
          </div>
          <div className="kpi-label">Fuel Wastage (Optimized)</div>
          <div className="kpi-value">{formatNumber(fuelCurrent)} <span style={{ fontSize: '1rem', color: '#64748b' }}>L/mo</span></div>
          <div style={{ fontSize: '0.8rem', color: '#10b981', marginTop: '8px' }}>
            Target: {formatNumber(sustainabilityData.fuelWastage.optimized)} L
          </div>
        </motion.div>

        <motion.div className="kpi-card green-glow" variants={fadeInUp}>
          <div className="kpi-header">
            <div className="kpi-icon" style={{ background: 'rgba(245,158,11,0.1)', borderColor: 'rgba(245,158,11,0.3)' }}>⌛</div>
            <div className="kpi-trend up" style={{ color: '#10b981', background: 'rgba(16,185,129,0.1)' }}>-25%</div>
          </div>
          <div className="kpi-label">Commuter Hours Lost</div>
          <div className="kpi-value">{formatNumber(hoursCurrent)} <span style={{ fontSize: '1rem', color: '#64748b' }}>hrs/mo</span></div>
          <div style={{ fontSize: '0.8rem', color: '#10b981', marginTop: '8px' }}>
            Target: {formatNumber(sustainabilityData.commuterHoursLost.optimized)} hrs
          </div>
        </motion.div>

        <motion.div className="kpi-card green-glow" variants={fadeInUp} style={{ borderColor: '#10b981', boxShadow: '0 0 20px rgba(16,185,129,0.1)' }}>
          <div className="kpi-header">
            <div className="kpi-icon" style={{ background: 'rgba(16,185,129,0.2)', borderColor: '#10b981' }}>💰</div>
          </div>
          <div className="kpi-label" style={{ color: '#10b981' }}>Potential Yearly Savings</div>
          <div className="kpi-value" style={{ color: '#10b981' }}>${formatNumber(savings)}</div>
          <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '8px' }}>
            Across all optimization initiatives
          </div>
        </motion.div>
      </motion.div>

      <div className="chart-grid">
        <div className="chart-card">
          <div className="chart-title">CO2 Emissions Trend</div>
          <div className="chart-subtitle">Monthly total metric tons</div>
          <div style={{ width: '100%', height: 280 }}>
            <ResponsiveContainer>
              <AreaChart data={sustainabilityData.monthlyTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(16,185,129,0.1)" vertical={false} />
                <XAxis dataKey="month" stroke="#64748b" fontSize={12} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <defs>
                  <linearGradient id="colorCo2" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <Area type="monotone" dataKey="co2" name="CO2 Emissions" stroke="#10b981" fillOpacity={1} fill="url(#colorCo2)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="chart-card">
          <div className="chart-title">Fuel Consumption Trend</div>
          <div className="chart-subtitle">Monthly wasted fuel (Liters) due to congestion</div>
          <div style={{ width: '100%', height: 280 }}>
            <ResponsiveContainer>
              <AreaChart data={sustainabilityData.monthlyTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(6,182,212,0.1)" vertical={false} />
                <XAxis dataKey="month" stroke="#64748b" fontSize={12} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <defs>
                  <linearGradient id="colorFuel" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#06b6d4" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <Area type="monotone" dataKey="fuel" name="Wasted Fuel" stroke="#06b6d4" fillOpacity={1} fill="url(#colorFuel)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="chart-grid-3">
        <div className="chart-card">
          <div className="chart-title">City Green Score</div>
          <div className="chart-subtitle">Overall sustainability index</div>
          <div className="green-score-container">
            <svg viewBox="0 0 100 100" className="score-svg">
              <circle cx="50" cy="50" r="45" className="score-bg" />
              <circle 
                cx="50" cy="50" r="45" 
                className="score-fill"
                stroke={scoreColor}
                strokeDasharray={`${greenScore * 2.82} 282`}
              />
            </svg>
            <div className="score-content">
              <div className="score-value" style={{ color: scoreColor }}>{greenScore}</div>
              <div className="score-label">/ 100</div>
            </div>
          </div>
        </div>

        <div className="chart-card">
          <div className="chart-title">Savings Breakdown</div>
          <div className="chart-subtitle">Distribution of $48M annual savings</div>
          <div style={{ width: '100%', height: 220 }}>
            <ResponsiveContainer>
              <RadialBarChart 
                cx="50%" cy="50%" 
                innerRadius="30%" outerRadius="100%" 
                barSize={15} data={savingsData}
              >
                <RadialBar
                  minAngle={15} background clockWise
                  dataKey="value" cornerRadius={10}
                />
                <Legend iconSize={10} layout="vertical" verticalAlign="middle" wrapperStyle={{ right: 0, fontSize: '11px', color: '#94a3b8' }} />
                <Tooltip contentStyle={{ background: 'rgba(17,24,39,0.9)', border: '1px solid #10b981' }} />
              </RadialBarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="chart-card">
          <div className="chart-title">Sustainability Goals 2030</div>
          <div className="chart-subtitle">Progress tracking against targets</div>
          <div className="goals-container">
            <div className="goal-item">
              <div className="goal-header">
                <span>Carbon Neutrality</span>
                <span>42%</span>
              </div>
              <div className="progress-bar">
                <div className="progress-fill" style={{ width: '42%', background: '#10b981' }} />
              </div>
            </div>
            
            <div className="goal-item">
              <div className="goal-header">
                <span>Zero Fuel Waste</span>
                <span>28%</span>
              </div>
              <div className="progress-bar">
                <div className="progress-fill" style={{ width: '28%', background: '#06b6d4' }} />
              </div>
            </div>

            <div className="goal-item">
              <div className="goal-header">
                <span>Smart Traffic Coverage</span>
                <span>67%</span>
              </div>
              <div className="progress-bar">
                <div className="progress-fill" style={{ width: '67%', background: '#6366f1' }} />
              </div>
            </div>

            <div className="goal-item">
              <div className="goal-header">
                <span>Public Transit Adoption</span>
                <span>55%</span>
              </div>
              <div className="progress-bar">
                <div className="progress-fill" style={{ width: '55%', background: '#8b5cf6' }} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
