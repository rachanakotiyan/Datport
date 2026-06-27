import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell
} from 'recharts';
import {
  pageVariants, staggerContainer, fadeInUp, scaleIn, formatNumber, CustomTooltip, RefreshIndicator
} from '../components/shared';
import { scenarioPresets, roadLinks } from '../data/trafficData';
import './ScenarioSimulator.css';

export default function ScenarioSimulator() {
  const [selectedScenario, setSelectedScenario] = useState(scenarioPresets[0]);
  const [isSimulating, setIsSimulating] = useState(false);
  const [hasResults, setHasResults] = useState(false);
  const [simulationProgress, setSimulationProgress] = useState(0);

  // Form states based on scenario type (simplified for demo)
  const [intensity, setIntensity] = useState(50);

  const handleSelect = (scenario) => {
    setSelectedScenario(scenario);
    setHasResults(false);
  };

  const handleSimulate = () => {
    setIsSimulating(true);
    setHasResults(false);
    setSimulationProgress(0);

    const interval = setInterval(() => {
      setSimulationProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsSimulating(false);
          setHasResults(true);
          return 100;
        }
        return prev + 5;
      });
    }, 100);
  };

  // Generate chart data based on selected scenario
  const getChartData = () => {
    if (!selectedScenario) return [];
    
    // Base values
    const beforeData = { peak: 85, delay: 24, co2: 120, time: 45 };
    
    // Apply reductions from scenario
    const { congestionReduction, travelTimeImprovement, co2Reduction } = selectedScenario.results;
    
    const scale = intensity / 50; // Scale results based on intensity slider
    
    return [
      { 
        name: 'Peak Congestion (%)', 
        Before: beforeData.peak, 
        After: Math.max(10, Math.round(beforeData.peak * (1 - (congestionReduction * scale / 100))))
      },
      { 
        name: 'Avg Delay (min)', 
        Before: beforeData.delay, 
        After: Math.max(2, Math.round(beforeData.delay * (1 - (travelTimeImprovement * scale / 100))))
      },
      { 
        name: 'CO2 Index', 
        Before: beforeData.co2, 
        After: Math.max(50, Math.round(beforeData.co2 * (1 - (co2Reduction * scale / 100))))
      },
      { 
        name: 'Commute (min)', 
        Before: beforeData.time, 
        After: Math.max(15, Math.round(beforeData.time * (1 - (travelTimeImprovement * scale / 100))))
      }
    ];
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
        <h1>Scenario Simulator</h1>
        <p>Interactive what-if analysis for infrastructure and policy changes</p>
        <div style={{ marginTop: '12px' }}>
          <RefreshIndicator />
        </div>
      </div>

      <div className="scenario-layout">
        {/* Left Column: Controls */}
        <div className="scenario-controls">
          <div className="section-header" style={{ marginBottom: '16px' }}>
            <h2 className="section-title" style={{ fontSize: '1.2rem' }}>1. Select Scenario</h2>
          </div>
          
          <div className="scenario-grid-vertical">
            {scenarioPresets.map(scenario => (
              <div 
                key={scenario.id} 
                className={`scenario-card-small ${selectedScenario?.id === scenario.id ? 'active' : ''}`}
                onClick={() => handleSelect(scenario)}
              >
                <div className="scenario-icon">{scenario.icon}</div>
                <div>
                  <div className="scenario-name">{scenario.name}</div>
                  <div className="scenario-desc">{scenario.description}</div>
                </div>
              </div>
            ))}
          </div>

          <div className="section-header" style={{ marginTop: '32px', marginBottom: '16px' }}>
            <h2 className="section-title" style={{ fontSize: '1.2rem' }}>2. Configure Parameters</h2>
          </div>

          <div className="glass-card config-panel">
            <div className="filter-group" style={{ width: '100%', marginBottom: '20px' }}>
              <label className="filter-label">Intensity / Scale</label>
              <div className="slider-container">
                <input 
                  type="range" 
                  min="10" 
                  max="100" 
                  value={intensity} 
                  onChange={(e) => setIntensity(Number(e.target.value))}
                  className="custom-slider"
                />
                <div className="slider-value">{intensity}%</div>
              </div>
            </div>

            <div className="filter-group" style={{ width: '100%', marginBottom: '24px' }}>
              <label className="filter-label">Target Area</label>
              <select className="filter-select" style={{ width: '100%' }}>
                <option value="citywide">City-wide Implementation</option>
                <option value="cbd">Central Business District</option>
                {roadLinks.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
              </select>
            </div>

            <button 
              className="btn btn-primary" 
              style={{ width: '100%', padding: '16px', fontSize: '1.1rem', justifyContent: 'center' }}
              onClick={handleSimulate}
              disabled={isSimulating}
            >
              {isSimulating ? 'Initializing Engine...' : '▶ Run Simulation'}
            </button>
          </div>
        </div>

        {/* Right Column: Results */}
        <div className="scenario-results">
          <div className="section-header" style={{ marginBottom: '16px' }}>
            <h2 className="section-title" style={{ fontSize: '1.2rem' }}>3. Simulation Results</h2>
          </div>

          <div className="glass-card results-panel">
            {!hasResults && !isSimulating && (
              <div className="empty-state">
                <div className="empty-icon">🎮</div>
                <h3>Ready for Simulation</h3>
                <p>Select a scenario, configure parameters, and run to see predicted impacts.</p>
              </div>
            )}

            {isSimulating && (
              <div className="sim-loading-state">
                <div className="sim-progress-circle">
                  <svg viewBox="0 0 100 100">
                    <circle className="sim-circle-bg" cx="50" cy="50" r="45" />
                    <circle className="sim-circle-fill" cx="50" cy="50" r="45" style={{ strokeDasharray: `${(simulationProgress / 100) * 283} 283` }} />
                  </svg>
                  <div className="sim-progress-text">{simulationProgress}%</div>
                </div>
                <div className="sim-status-text">Processing temporal traffic models...</div>
              </div>
            )}

            {hasResults && (
              <motion.div variants={staggerContainer} initial="initial" animate="animate">
                <motion.div className="impact-summary-card" variants={fadeInUp}>
                  <h3>Impact Summary: {selectedScenario.name}</h3>
                  <p>
                    Based on the simulation parameters, this intervention is expected to yield a 
                    <strong style={{ color: selectedScenario.results.congestionReduction > 0 ? 'var(--success)' : 'var(--danger)' }}>
                      {' '}{Math.abs(Math.round(selectedScenario.results.congestionReduction * (intensity/50)))}% 
                      {selectedScenario.results.congestionReduction > 0 ? ' reduction' : ' increase'}
                    </strong> in overall congestion, resulting in an estimated annual savings of 
                    <strong style={{ color: 'var(--success)' }}> ${formatNumber(Math.max(0, selectedScenario.results.costSaving * (intensity/50)))}</strong>.
                  </p>
                </motion.div>

                <div className="comparison-grid" style={{ marginBottom: '32px' }}>
                  <motion.div className="comparison-card" variants={scaleIn}>
                    <div className="comparison-label">Congestion</div>
                    <div className={`comparison-value ${selectedScenario.results.congestionReduction > 0 ? 'positive' : 'negative'}`}>
                      {selectedScenario.results.congestionReduction > 0 ? '↓ ' : '↑ '}
                      {Math.abs(Math.round(selectedScenario.results.congestionReduction * (intensity/50)))}%
                    </div>
                  </motion.div>
                  <motion.div className="comparison-card" variants={scaleIn}>
                    <div className="comparison-label">Travel Time</div>
                    <div className={`comparison-value ${selectedScenario.results.travelTimeImprovement > 0 ? 'positive' : 'negative'}`}>
                      {selectedScenario.results.travelTimeImprovement > 0 ? '↓ ' : '↑ '}
                      {Math.abs(Math.round(selectedScenario.results.travelTimeImprovement * (intensity/50)))}%
                    </div>
                  </motion.div>
                  <motion.div className="comparison-card" variants={scaleIn}>
                    <div className="comparison-label">CO2 Emissions 🌱</div>
                    <div className={`comparison-value ${selectedScenario.results.co2Reduction > 0 ? 'positive' : 'negative'}`}>
                      {selectedScenario.results.co2Reduction > 0 ? '↓ ' : '↑ '}
                      {Math.abs(Math.round(selectedScenario.results.co2Reduction * (intensity/50)))}%
                    </div>
                  </motion.div>
                </div>

                <div className="chart-title">Before vs After Analysis</div>
                <div style={{ width: '100%', height: 350 }}>
                  <ResponsiveContainer>
                    <BarChart data={getChartData()} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(99,102,241,0.1)" vertical={false} />
                      <XAxis dataKey="name" stroke="#64748b" fontSize={12} tickLine={false} />
                      <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                      <Tooltip cursor={{fill: 'rgba(99,102,241,0.05)'}} contentStyle={{ background: 'rgba(17,24,39,0.9)', border: '1px solid #6366f1' }} />
                      <Legend wrapperStyle={{ fontSize: '12px' }} />
                      <Bar dataKey="Before" fill="#ef4444" radius={[4, 4, 0, 0]} barSize={40} />
                      <Bar dataKey="After" fill="#10b981" radius={[4, 4, 0, 0]} barSize={40} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
