import React from 'react';
import { motion } from 'framer-motion';
import {
  pageVariants, staggerContainer, fadeInUp, useAnimatedCounter,
  formatNumber, RefreshIndicator
} from '../components/shared';
import { recommendations } from '../data/trafficData';
import './Recommendations.css';

export default function Recommendations() {
  const daily = useAnimatedCounter(recommendations.commuterTimeLoss.daily);
  const weekly = useAnimatedCounter(recommendations.commuterTimeLoss.weekly);
  const monthly = useAnimatedCounter(recommendations.commuterTimeLoss.monthly);
  const annual = useAnimatedCounter(recommendations.commuterTimeLoss.annual);
  const cost = useAnimatedCounter(recommendations.commuterTimeLoss.monthly * 25);

  const getPriorityClass = (priority) => {
    if (priority === 'Critical') return 'critical';
    if (priority === 'High') return 'high';
    return 'medium';
  };

  const getStatusBadgeClass = (status) => {
    if (status === 'Pending') return 'badge-warning';
    if (status === 'In Review') return 'badge-info';
    if (status === 'Approved') return 'badge-success';
    return 'badge-medium';
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
        <h1>Recommendations Engine</h1>
        <p>AI-generated actionable insights for traffic optimization</p>
        <div style={{ marginTop: '12px' }}>
          <RefreshIndicator />
        </div>
      </div>

      <div className="section-header">
        <h2 className="section-title">🚦 Smart Signal Timing Suggestions</h2>
        <p className="section-subtitle">Adaptive phase configurations pending approval</p>
      </div>

      <motion.div className="rec-grid" variants={staggerContainer} initial="initial" animate="animate">
        {recommendations.signalTiming.map(rec => (
          <motion.div key={rec.id} className={`rec-card ${getPriorityClass(rec.priority)}`} variants={fadeInUp}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
              <div className="badge badge-medium">{rec.linkId}</div>
              <div className={`badge ${getStatusBadgeClass(rec.status)}`}>{rec.status}</div>
            </div>
            <div style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '8px' }}>
              {rec.action}
            </div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '12px' }}>
              🕒 Time window: {rec.timeWindow}
            </div>
            <div style={{ fontSize: '0.9rem', color: 'var(--success)', fontWeight: 500, display: 'flex', justifyContent: 'space-between' }}>
              <span>Expected Impact: {rec.impact}</span>
              <span className={`badge badge-${getPriorityClass(rec.priority)}`}>{rec.priority}</span>
            </div>
          </motion.div>
        ))}
      </motion.div>

      <div className="section-header" style={{ marginTop: '48px' }}>
        <h2 className="section-title">🛣️ Dynamic Lane Management</h2>
        <p className="section-subtitle">Real-time capacity rebalancing actions</p>
      </div>

      <motion.div className="rec-grid" variants={staggerContainer} initial="initial" animate="animate">
        {recommendations.laneManagement.map(rec => (
          <motion.div key={rec.id} className={`rec-card ${getPriorityClass(rec.priority)}`} variants={fadeInUp}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', alignItems: 'center' }}>
              <div className="badge badge-info">{rec.linkId}</div>
              <label className="toggle-switch">
                <input type="checkbox" />
                <span className="toggle-slider"></span>
              </label>
            </div>
            <div style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '8px' }}>
              {rec.action}
            </div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '12px' }}>
              🕒 Active during: {rec.timeWindow}
            </div>
            <div style={{ fontSize: '0.9rem', color: 'var(--success)', fontWeight: 500, display: 'flex', justifyContent: 'space-between' }}>
              <span>Impact: {rec.impact}</span>
              <span className={`badge badge-${getPriorityClass(rec.priority)}`}>{rec.priority}</span>
            </div>
          </motion.div>
        ))}
      </motion.div>

      <div className="section-header" style={{ marginTop: '48px' }}>
        <h2 className="section-title">⏰ Commuter Time Loss Summary</h2>
        <p className="section-subtitle">Economic impact of current congestion levels</p>
      </div>

      <motion.div className="time-loss-grid" variants={staggerContainer} initial="initial" animate="animate">
        <motion.div className="time-loss-card" variants={fadeInUp}>
          <div className="tl-icon">📅</div>
          <div className="tl-label">Daily Hours Lost</div>
          <div className="tl-value">{formatNumber(daily)}</div>
        </motion.div>
        <motion.div className="time-loss-card" variants={fadeInUp}>
          <div className="tl-icon">📆</div>
          <div className="tl-label">Weekly Hours Lost</div>
          <div className="tl-value">{formatNumber(weekly)}</div>
        </motion.div>
        <motion.div className="time-loss-card" variants={fadeInUp}>
          <div className="tl-icon">🗓️</div>
          <div className="tl-label">Monthly Hours Lost</div>
          <div className="tl-value">{formatNumber(monthly)}</div>
        </motion.div>
        <motion.div className="time-loss-card" variants={fadeInUp}>
          <div className="tl-icon">📈</div>
          <div className="tl-label">Annual Hours Lost</div>
          <div className="tl-value">{formatNumber(annual)}</div>
        </motion.div>
        <motion.div className="time-loss-card" variants={fadeInUp}>
          <div className="tl-icon">🚗</div>
          <div className="tl-label">Avg Per Commuter</div>
          <div className="tl-value">{recommendations.commuterTimeLoss.avgPerCommuter} <span style={{fontSize:'1rem'}}>min/day</span></div>
        </motion.div>
        <motion.div className="time-loss-card highlight" variants={fadeInUp}>
          <div className="tl-icon">💵</div>
          <div className="tl-label">Est. Monthly Economic Cost</div>
          <div className="tl-value">${formatNumber(cost)}</div>
        </motion.div>
      </motion.div>

      <div className="section-header" style={{ marginTop: '48px' }}>
        <h2 className="section-title">📅 Weekly Optimization Calendar</h2>
        <p className="section-subtitle">Scheduled AI-driven infrastructure adjustments</p>
      </div>

      <div className="calendar-week-grid">
        <div className="day-col">
          <div className="day-header">Monday</div>
          <div className="time-block block-red">07:00 - 09:00<br/>Signal Sync LNK-012</div>
          <div className="time-block block-amber">12:00 - 14:00<br/>Lane Rebalance</div>
          <div className="time-block block-red">17:00 - 19:00<br/>Coordination Phase 2</div>
        </div>
        <div className="day-col">
          <div className="day-header">Tuesday</div>
          <div className="time-block block-amber">08:00 - 10:00<br/>HOV Activation LNK-004</div>
          <div className="time-block block-red">16:00 - 19:00<br/>Contraflow LNK-001</div>
        </div>
        <div className="day-col">
          <div className="day-header">Wednesday</div>
          <div className="time-block block-indigo">06:00 - 10:00<br/>Transit Priority LNK-002</div>
          <div className="time-block block-amber">16:30 - 18:30<br/>Ramp Metering Active</div>
        </div>
        <div className="day-col">
          <div className="day-header">Thursday</div>
          <div className="time-block block-red">07:30 - 09:30<br/>Signal Sync LNK-012</div>
          <div className="time-block block-amber">13:00 - 15:00<br/>Maintenance Diversion</div>
        </div>
        <div className="day-col">
          <div className="day-header">Friday</div>
          <div className="time-block block-indigo">07:00 - 11:00<br/>Weekend Prep Phasing</div>
          <div className="time-block block-red">14:00 - 20:00<br/>Early Peak Management</div>
        </div>
        <div className="day-col weekend">
          <div className="day-header">Saturday</div>
          <div className="time-block block-green">10:00 - 14:00<br/>Retail Zone Optimization</div>
        </div>
        <div className="day-col weekend">
          <div className="day-header">Sunday</div>
          <div className="time-block block-green">12:00 - 18:00<br/>Event Traffic Routing</div>
        </div>
      </div>

      <div className="export-section">
        <button className="btn btn-primary">📄 Export PDF</button>
        <button className="btn btn-secondary">📊 Export CSV</button>
        <button className="btn btn-outline">🔗 Share Report</button>
        <button className="btn btn-outline">⏰ Schedule Auto-Report</button>
      </div>

    </motion.div>
  );
}
