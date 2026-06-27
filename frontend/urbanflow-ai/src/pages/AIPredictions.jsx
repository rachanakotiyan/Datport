import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AreaChart, Area, ComposedChart, Line, BarChart, Bar, ScatterChart, Scatter, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine
} from 'recharts';
import {
  pageVariants, staggerContainer, fadeInUp, scaleIn, useAnimatedCounter,
  CustomTooltip, getCongestionColor, getCongestionLevel
} from '../components/shared';
import {
  aiModelMetrics, generatePredictionVsActual, generateForecast,
  featureImportance, generateResidualData, roadLinks
} from '../data/trafficData';
import './AIPredictions.css';

export default function AIPredictions() {
  const [isPredicting, setIsPredicting] = useState(false);
  const [predictionResult, setPredictionResult] = useState(null);

  // Memoized data
  const predVsActualData = useMemo(() => generatePredictionVsActual(), []);
  const forecastData = useMemo(() => generateForecast(), []);
  const residualData = useMemo(() => generateResidualData(), []);

  // Counters
  const acc = useAnimatedCounter(aiModelMetrics.accuracy, 2000);
  const mae = useAnimatedCounter(aiModelMetrics.mae * 10, 2000) / 10; // decimal trick
  const rmse = useAnimatedCounter(aiModelMetrics.rmse * 10, 2000) / 10;
  const samples = useAnimatedCounter(aiModelMetrics.trainingSamples, 2000);

  const handlePredict = (e) => {
    e.preventDefault();
    setIsPredicting(true);
    setPredictionResult(null);

    // Simulate AI inference delay
    setTimeout(() => {
      const congestion = Math.floor(20 + Math.random() * 60);
      setPredictionResult({
        congestion,
        speed: Math.round(80 - (congestion * 0.5) + Math.random() * 10),
        delay: Math.round((congestion / 10) * 2 + Math.random() * 5),
        confidence: Math.round(85 + Math.random() * 14)
      });
      setIsPredicting(false);
    }, 1500);
  };

  const getFeatureColor = (category) => {
    switch(category) {
      case 'Temporal': return '#6366f1';
      case 'Traffic': return '#06b6d4';
      case 'Historical': return '#8b5cf6';
      case 'External': return '#f59e0b';
      default: return '#10b981';
    }
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
        <h1 className="neon-text" style={{ textShadow: '0 0 15px rgba(6, 182, 212, 0.6)' }}>AI Predictions Engine</h1>
        <p>Deep Learning traffic forecasting & simulation powered by Transformer + GBM Ensemble</p>
        <div style={{ marginTop: '12px', display: 'flex', gap: '16px' }}>
          <div className="badge badge-info">Model: {aiModelMetrics.modelVersion}</div>
          <div className="badge badge-success">Status: Online & Calibrated</div>
        </div>
      </div>

      <motion.div className="kpi-grid" variants={staggerContainer} initial="initial" animate="animate">
        <motion.div className="ai-scorecard" variants={fadeInUp}>
          <div className="ai-ring-container">
            <svg viewBox="0 0 100 100" className="ai-ring">
              <circle cx="50" cy="50" r="45" className="ai-ring-bg" />
              <circle cx="50" cy="50" r="45" className="ai-ring-fill" 
                stroke="#10b981" strokeDasharray={`${acc * 2.82} 282`} />
            </svg>
            <div className="ai-score-value">{acc}%</div>
          </div>
          <div className="ai-score-label">Global Accuracy</div>
        </motion.div>

        <motion.div className="ai-scorecard" variants={fadeInUp}>
          <div className="ai-ring-container">
            <svg viewBox="0 0 100 100" className="ai-ring">
              <circle cx="50" cy="50" r="45" className="ai-ring-bg" />
              <circle cx="50" cy="50" r="45" className="ai-ring-fill" 
                stroke="#06b6d4" strokeDasharray={`${Math.max(0, 100 - mae * 10) * 2.82} 282`} />
            </svg>
            <div className="ai-score-value">{mae}</div>
          </div>
          <div className="ai-score-label">Mean Abs Error (MAE)</div>
        </motion.div>

        <motion.div className="ai-scorecard" variants={fadeInUp}>
          <div className="ai-ring-container">
            <svg viewBox="0 0 100 100" className="ai-ring">
              <circle cx="50" cy="50" r="45" className="ai-ring-bg" />
              <circle cx="50" cy="50" r="45" className="ai-ring-fill" 
                stroke="#8b5cf6" strokeDasharray={`${Math.max(0, 100 - rmse * 10) * 2.82} 282`} />
            </svg>
            <div className="ai-score-value">{rmse}</div>
          </div>
          <div className="ai-score-label">Root Mean Sq Error</div>
        </motion.div>

        <motion.div className="ai-scorecard" variants={fadeInUp}>
          <div className="ai-ring-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#f1f5f9' }}>
              {samples.toLocaleString()}
            </div>
          </div>
          <div className="ai-score-label">Training Samples</div>
        </motion.div>
      </motion.div>

      <div className="chart-grid">
        <div className="chart-card chart-full holograph-card">
          <div className="ai-scanline"></div>
          <div className="chart-title">24-Hour Predictive Congestion Forecast</div>
          <div className="chart-subtitle">Ensemble projection with 95% confidence bounds</div>
          <div style={{ width: '100%', height: 350 }}>
            <ResponsiveContainer>
              <ComposedChart data={forecastData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(99,102,241,0.15)" vertical={false} />
                <XAxis dataKey="hour" stroke="#a5b4fc" fontSize={12} tickLine={false} />
                <YAxis stroke="#a5b4fc" fontSize={12} tickLine={false} axisLine={false} domain={[0, 100]} />
                <Tooltip content={<CustomTooltip />} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', color: '#a5b4fc' }} />
                <Area type="monotone" dataKey="upperBound" fill="none" stroke="none" />
                <Area type="monotone" dataKey="lowerBound" name="Confidence Band" fill="#6366f1" fillOpacity={0.1} stroke="none" />
                <Line type="monotone" dataKey="predicted" name="Predicted Congestion" stroke="#06b6d4" strokeWidth={3} dot={false} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="chart-card">
          <div className="chart-title">Predicted vs Actual (Last 24h)</div>
          <div className="chart-subtitle">Real-time model tracking</div>
          <div style={{ width: '100%', height: 300 }}>
            <ResponsiveContainer>
              <AreaChart data={predVsActualData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(99,102,241,0.1)" vertical={false} />
                <XAxis dataKey="time" stroke="#64748b" fontSize={12} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
                <Area type="monotone" dataKey="actual" name="Actual" fill="#06b6d4" fillOpacity={0.3} stroke="#06b6d4" />
                <Area type="monotone" dataKey="predicted" name="Predicted" fill="#6366f1" fillOpacity={0.3} stroke="#6366f1" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="chart-card">
          <div className="chart-title">Feature Importance matrix</div>
          <div className="chart-subtitle">SHAP values for current prediction state</div>
          <div style={{ width: '100%', height: 300 }}>
            <ResponsiveContainer>
              <BarChart data={featureImportance} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(99,102,241,0.1)" horizontal={false} />
                <XAxis type="number" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis dataKey="feature" type="category" stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} width={120} />
                <Tooltip content={<CustomTooltip />} cursor={{fill: 'rgba(99,102,241,0.1)'}} />
                <Bar dataKey="importance" name="Importance Score" radius={[0, 4, 4, 0]} barSize={16}>
                  {featureImportance.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={getFeatureColor(entry.category)} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="section-header">
        <h2 className="section-title">🔮 Interactive Prediction Widget</h2>
        <p className="section-subtitle">Run simulated traffic conditions through the AI model</p>
      </div>

      <div className="prediction-widget-container">
        <div className="prediction-form-card glass-card holograph-card">
          <form onSubmit={handlePredict}>
            <div className="form-grid">
              <div className="filter-group">
                <label className="filter-label">Target Road Link</label>
                <select className="filter-select" required>
                  {roadLinks.map(link => (
                    <option key={link.id} value={link.id}>{link.name}</option>
                  ))}
                </select>
              </div>
              
              <div className="filter-group">
                <label className="filter-label">Simulation Time</label>
                <select className="filter-select" required>
                  {Array.from({length:24}).map((_, i) => (
                    <option key={i} value={i}>{`${i.toString().padStart(2, '0')}:00`}</option>
                  ))}
                </select>
              </div>

              <div className="filter-group">
                <label className="filter-label">Day of Week</label>
                <select className="filter-select" required>
                  <option value="monday">Monday</option>
                  <option value="tuesday">Tuesday</option>
                  <option value="wednesday">Wednesday</option>
                  <option value="thursday">Thursday</option>
                  <option value="friday">Friday</option>
                  <option value="saturday">Saturday</option>
                  <option value="sunday">Sunday</option>
                </select>
              </div>

              <div className="filter-group">
                <label className="filter-label">Est. Vehicle Volume</label>
                <input type="number" className="filter-input" placeholder="e.g. 4500" required defaultValue="4500" />
              </div>
            </div>
            
            <button type="submit" className="btn btn-primary" style={{ marginTop: '24px', width: '100%', justifyContent: 'center' }} disabled={isPredicting}>
              {isPredicting ? (
                <>
                  <span className="ai-pulse-dot" /> Processing via Neural Net...
                </>
              ) : (
                '🚀 Run AI Prediction'
              )}
            </button>
          </form>
        </div>

        <div className="prediction-results-container">
          <AnimatePresence mode="wait">
            {!predictionResult && !isPredicting && (
              <motion.div 
                className="glass-card" 
                style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              >
                Awaiting parameters for simulation run...
              </motion.div>
            )}

            {isPredicting && (
              <motion.div 
                className="glass-card"
                style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '16px' }}
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              >
                <div className="cyber-spinner" />
                <div className="neon-text" style={{ fontSize: '0.9rem', letterSpacing: '2px' }}>ANALYZING TENSORS...</div>
              </motion.div>
            )}

            {predictionResult && !isPredicting && (
              <motion.div 
                className="prediction-results-grid"
                variants={staggerContainer} initial="initial" animate="animate" exit="exit"
              >
                <motion.div className="result-card" variants={scaleIn}>
                  <div className="result-label">Congestion Level</div>
                  <div className="result-value" style={{ color: getCongestionColor(predictionResult.congestion) }}>
                    {getCongestionLevel(predictionResult.congestion)}
                  </div>
                  <div className="result-sub">{predictionResult.congestion}% Capacity</div>
                </motion.div>

                <motion.div className="result-card" variants={scaleIn}>
                  <div className="result-label">Predicted Speed</div>
                  <div className="result-value text-gradient">{predictionResult.speed}</div>
                  <div className="result-sub">km/h</div>
                </motion.div>

                <motion.div className="result-card" variants={scaleIn}>
                  <div className="result-label">Expected Delay</div>
                  <div className="result-value text-gradient">{predictionResult.delay}</div>
                  <div className="result-sub">minutes added</div>
                </motion.div>

                <motion.div className="result-card" variants={scaleIn}>
                  <div className="result-label">Model Confidence</div>
                  <div className="result-value" style={{ color: '#10b981' }}>{predictionResult.confidence}%</div>
                  <div className="result-sub">High certainty</div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}
