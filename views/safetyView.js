/**
 * SafetyView Module (Page 5)
 * Analyzes accident risk scores, signal contributions, and proactive dynamic mitigations.
 */

const SafetyView = {
  charts: {
    heatmap: null,
    trend: null,
    radialClock: null,
    topRisky: null,
    breakdown: null
  },
  isInitialized: false,
  selectedLinkId: 1,
  selectedDate: '',

  init() {
    if (this.isInitialized) return;

    this.selectedLinkId = DataAdapter.allLinks[0] || 1;
    this.selectedDate = DataAdapter.allDates[0];

    // Populate selectors
    const linkSelect = document.getElementById('filter-link-safety');
    linkSelect.innerHTML = '';
    DataAdapter.allLinks.forEach(link => {
      const option = document.createElement('option');
      option.value = link;
      option.textContent = `Link ${link}`;
      linkSelect.appendChild(option);
    });
    linkSelect.value = this.selectedLinkId;

    const dateSelect = document.getElementById('filter-date-safety');
    dateSelect.innerHTML = '';
    DataAdapter.allDates.forEach(date => {
      const option = document.createElement('option');
      option.value = date;
      option.textContent = date;
      dateSelect.appendChild(option);
    });
    dateSelect.value = this.selectedDate;

    // Attach listeners
    linkSelect.addEventListener('change', (e) => {
      this.selectedLinkId = parseInt(e.target.value, 10);
      this.renderLinkRisk();
    });

    dateSelect.addEventListener('change', (e) => {
      this.selectedDate = e.target.value;
      this.render();
    });

    // Initialize ECharts instances
    this.charts.heatmap = echarts.init(document.getElementById('chart-risk-heatmap'));
    this.charts.trend = echarts.init(document.getElementById('chart-risk-trend'));
    this.charts.radialClock = echarts.init(document.getElementById('chart-risk-radial-clock'));
    this.charts.topRisky = echarts.init(document.getElementById('chart-risky-links'));
    this.charts.breakdown = echarts.init(document.getElementById('chart-risk-breakdown'));

    // Heatmap click drill-down
    this.charts.heatmap.on('click', (params) => {
      if (params.seriesType === 'heatmap') {
        const clickedLink = params.value[1];
        this.selectedLinkId = clickedLink;
        document.getElementById('filter-link-safety').value = clickedLink;
        this.renderLinkRisk();
      }
    });

    window.addEventListener('resize', () => {
      for (const key in this.charts) {
        if (this.charts[key]) this.charts[key].resize();
      }
    });

    this.isInitialized = true;
  },

  /**
   * Draws the ECharts Risk Heatmap (Link ID × Hour of Day, values = ARS).
   */
  async renderHeatmap() {
    if (!this.charts.heatmap) return;

    // Retrieve full dataset processed rows for this date
    const dateRows = DataAdapter.dataByDate[this.selectedDate] || [];
    
    // Aggregate by Link and Hour
    const heatData = {};
    dateRows.forEach(r => {
      const key = `${r.linkId}_${r.hour}`;
      if (!heatData[key]) {
        heatData[key] = { linkId: r.linkId, hour: r.hour, scoreSum: 0, count: 0 };
      }
      heatData[key].scoreSum += r.accidentRiskScore;
      heatData[key].count++;
    });

    const categoriesX = Array(24).fill(null).map((_, i) => `${String(i).padStart(2, '0')}:00`);
    const categoriesY = DataAdapter.allLinks.map(l => String(l));
    
    const data = Object.values(heatData).map(h => [
      h.hour,
      DataAdapter.allLinks.indexOf(h.linkId),
      h.scoreSum / h.count
    ]);

    const option = {
      tooltip: {
        position: 'top',
        formatter: (params) => {
          const hr = params.value[0];
          const linkId = DataAdapter.allLinks[params.value[1]];
          const score = params.value[2];
          return `Link ${linkId}, ${hr}:00<br/>Accident Risk Score: <strong>${score.toFixed(2)}</strong>/10`;
        },
        backgroundColor: '#111827',
        borderColor: '#1e2d45',
        textStyle: { color: '#f1f5f9' }
      },
      grid: { top: '5%', bottom: '15%', left: '5%', right: '3%', containLabel: true },
      xAxis: {
        type: 'category',
        data: categoriesX,
        splitArea: { show: true },
        axisLabel: { color: '#94a3b8' }
      },
      yAxis: {
        type: 'category',
        data: categoriesY,
        splitArea: { show: true },
        axisLabel: { color: '#94a3b8' }
      },
      visualMap: {
        min: 0,
        max: 8.0,
        calculable: true,
        orient: 'horizontal',
        left: 'center',
        bottom: 0,
        inRange: {
          color: ['#10b981', '#f59e0b', '#f97316', '#ef4444'] // green -> amber -> orange -> red
        },
        textStyle: { color: '#94a3b8' }
      },
      series: [
        {
          type: 'heatmap',
          data: data,
          label: { show: false }
        }
      ]
    };

    this.charts.heatmap.setOption(option, true);
  },

  /**
   * Renders the charts specific to the selected road link.
   */
  async renderLinkRisk() {
    const series = await DataAdapter.getLinkTimeSeries(this.selectedLinkId, this.selectedDate);
    
    // 1. Trend Line
    if (this.charts.trend) {
      const times = series.map(item => item.time);
      const scores = series.map(item => item.laneMetrics ? item.laneMetrics[0].volume : item.congestionScore); // fallback volume if needed, but we use computed ARS values
      // Wait, let's use the actual computed Accident Risk Score!
      const arsScores = series.map(item => {
        // Find processedRow for exact link, date, time
        const rawRow = DataAdapter.dataByLinkAndDate[this.selectedLinkId]?.[this.selectedDate]?.find(r => r.timeOnly === item.time);
        return rawRow ? rawRow.accidentRiskScore : 0;
      });

      const option = {
        grid: { top: '10%', left: '4%', right: '4%', bottom: '10%', containLabel: true },
        xAxis: {
          type: 'category',
          data: times,
          axisLine: { lineStyle: { color: '#1e2d45' } },
          axisLabel: { color: '#94a3b8' }
        },
        yAxis: {
          type: 'value',
          name: 'ARS Score',
          min: 0,
          max: 10,
          splitLine: { lineStyle: { color: '#1e2d45' } },
          axisLabel: { color: '#94a3b8' }
        },
        tooltip: {
          trigger: 'axis',
          backgroundColor: '#111827',
          borderColor: '#1e2d45',
          textStyle: { color: '#f1f5f9' }
        },
        series: [
          {
            name: 'Accident Risk Score',
            type: 'line',
            data: arsScores,
            smooth: true,
            symbol: 'none',
            lineStyle: { color: '#ef4444', width: 2.5 },
            areaStyle: {
              color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                { offset: 0, color: 'rgba(239, 68, 68, 0.4)' },
                { offset: 1, color: 'rgba(239, 68, 68, 0.0)' }
              ])
            },
            // Threshold areas
            markLine: {
              silent: true,
              lineStyle: { type: 'dashed' },
              data: [
                { yAxis: 3, label: { formatter: 'Moderate Risk', color: '#f59e0b', position: 'end' } },
                { yAxis: 6, label: { formatter: 'High Risk', color: '#f97316', position: 'end' } },
                { yAxis: 8, label: { formatter: 'Critical Risk', color: '#ef4444', position: 'end' } }
              ]
            }
          }
        ]
      };
      this.charts.trend.setOption(option, true);
    }

    // 2. Risk breakdown stacked bar
    if (this.charts.breakdown) {
      const breakdown = await DataAdapter.getRiskBreakdown(this.selectedLinkId, this.selectedDate);
      const categories = breakdown.map(item => item.name);
      const values = breakdown.map(item => item.value);

      const option = {
        grid: { top: '8%', bottom: '15%', left: '5%', right: '5%', containLabel: true },
        xAxis: {
          type: 'category',
          data: categories,
          axisLabel: { color: '#94a3b8', rotate: 20, fontSize: 9 }
        },
        yAxis: {
          type: 'value',
          splitLine: { lineStyle: { color: '#1e2d45' } },
          axisLabel: { color: '#94a3b8' }
        },
        tooltip: {
          trigger: 'axis',
          backgroundColor: '#111827',
          borderColor: '#1e2d45',
          textStyle: { color: '#f1f5f9' }
        },
        series: [
          {
            type: 'bar',
            data: values,
            itemStyle: {
              color: (params) => {
                const colors = ['#ef4444', '#f97316', '#f59e0b', '#dc2626', '#7f1d1d', '#8b5cf6', '#1e40af', '#d97706'];
                return colors[params.dataIndex % colors.length];
              },
              borderRadius: [4, 4, 0, 0]
            }
          }
        ]
      };
      this.charts.breakdown.setOption(option, true);
    }
  },

  /**
   * Draws average ARS risk clock by hour.
   */
  async renderRadialClock() {
    if (!this.charts.radialClock) return;

    const data = await DataAdapter.getRiskRadialClock();
    const categories = data.map(item => `${item.hour}:00`);
    const values = data.map(item => item.ars);

    const option = {
      polar: {
        radius: ['20%', '80%']
      },
      radiusAxis: {
        max: 8.0,
        axisLabel: { color: '#94a3b8', fontSize: 9 }
      },
      angleAxis: {
        type: 'category',
        data: categories,
        startAngle: 90,
        axisLabel: { color: '#94a3b8', fontSize: 10 }
      },
      tooltip: {
        trigger: 'item',
        formatter: '{b}<br/>Risk: {c}',
        backgroundColor: '#111827',
        borderColor: '#1e2d45',
        textStyle: { color: '#f1f5f9' }
      },
      series: [
        {
          type: 'bar',
          data: values,
          coordinateSystem: 'polar',
          itemStyle: {
            color: (params) => {
              const val = params.data;
              if (val >= 6) return '#ef4444';
              if (val >= 3) return '#f59e0b';
              return '#10b981';
            }
          }
        }
      ]
    };

    this.charts.radialClock.setOption(option);
  },

  /**
   * Draws Top 10 Dangerous Links horizontal bar chart.
   */
  async renderTopRiskyLinks() {
    if (!this.charts.topRisky) return;

    const topSpots = await DataAdapter.getRiskHotspots(this.selectedDate);
    const data = [...topSpots].slice(0, 10).reverse();
    const categories = data.map(item => `Link ${item.linkId}`);
    const values = data.map(item => item.peakRiskScore);

    const option = {
      grid: { top: '5%', left: '3%', right: '10%', bottom: '5%', containLabel: true },
      xAxis: {
        type: 'value',
        splitLine: { lineStyle: { color: '#1e2d45' } },
        axisLabel: { color: '#94a3b8' }
      },
      yAxis: {
        type: 'category',
        data: categories,
        axisLine: { lineStyle: { color: '#1e2d45' } },
        axisLabel: { color: '#94a3b8' }
      },
      tooltip: {
        trigger: 'axis',
        formatter: (params) => {
          const idx = params[0].dataIndex;
          const spot = data[idx];
          return `
            <strong>Link ${spot.linkId}</strong><br/>
            Peak ARS: <span style="color:var(--congested); font-weight:700;">${spot.peakRiskScore.toFixed(2)}</span><br/>
            Dominant Risk: ${spot.dominantRisk}
          `;
        },
        backgroundColor: '#111827',
        borderColor: '#1e2d45',
        textStyle: { color: '#f1f5f9' }
      },
      series: [
        {
          type: 'bar',
          data: values,
          itemStyle: {
            color: '#f97316',
            borderRadius: [0, 4, 4, 0]
          },
          barWidth: '60%'
        }
      ]
    };

    this.charts.topRisky.setOption(option);
  },

  /**
   * Populates high risk event logs.
   */
  async renderHighRiskEvents() {
    const tableBody = document.querySelector('#safety-events-table tbody');
    if (!tableBody) return;
    
    tableBody.innerHTML = '';

    const events = await DataAdapter.getHighRiskEvents(this.selectedDate);

    events.forEach(ev => {
      const row = document.createElement('tr');
      row.dataset.linkId = ev.linkId;

      let badgeClass = 'score-badge congested';
      if (ev.severity.includes('Critical')) badgeClass = 'score-badge critical';

      row.innerHTML = `
        <td>${ev.time}</td>
        <td><span style="color:var(--accent); font-weight:600;">Link ${ev.linkId}</span></td>
        <td><strong>${ev.ars.toFixed(2)}</strong></td>
        <td>${ev.trigger}</td>
        <td><span class="${badgeClass}">${ev.severity}</span></td>
      `;

      row.addEventListener('click', () => {
        App.navigateToLink(ev.linkId, this.selectedDate);
      });

      tableBody.appendChild(row);
    });

    if (events.length === 0) {
      tableBody.innerHTML = `<tr><td colspan="5" style="text-align:center; color:var(--text-muted);">No safety events detected today.</td></tr>`;
    }
  },

  /**
   * Generates dynamic dynamic mitigation prevention advisory cards.
   */
  async renderPreventionAdvisories() {
    const panel = document.getElementById('prevention-panel');
    if (!panel) return;

    panel.innerHTML = '';

    // Retrieve high-risk logs on selected date
    const events = await DataAdapter.getHighRiskEvents(this.selectedDate);
    // Take top 3 risk events and generate recommendation cards
    const topEvents = events.slice(0, 3);

    topEvents.forEach(ev => {
      const card = document.createElement('div');
      card.className = 'card kpi-card glow-red';
      card.style.background = 'rgba(127, 29, 29, 0.1)';
      card.style.borderColor = 'rgba(239, 68, 68, 0.3)';

      // Trigger recommendation mapping
      let recs = 'Recommend speed reduction warnings on Approach Segment.';
      if (ev.trigger === 'Queue Tail') {
        recs = '🚦 Flash queue warnings on digital gantries 500m upstream.';
      } else if (ev.trigger === 'Speed Drop') {
        recs = '⚠️ Implement approach variable speed limit (reduce limit to 60 km/h).';
      } else if (ev.trigger === 'Over Capacity') {
        recs = '🛣️ Activate dynamic lane reserve assignment (Lane 6 Flex open).';
      } else if (ev.trigger === 'Night Speeding') {
        recs = '🌙 Lower speed advisory limits between 10 PM and 5 AM.';
      } else if (ev.trigger === 'Occupancy Spike') {
        recs = '📻 Push real-time congestion hazard alerts to T-map/Kakao Nav app.';
      } else if (ev.trigger === 'Lane Imbalance') {
        recs = '🛣️ Activate dynamic overhead arrow signs to balance traffic density.';
      }

      card.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
          <span style="font-size:0.75rem; background:rgba(239, 68, 68, 0.2); color:#ef4444; border:1px solid rgba(239,68,68,0.4); padding:2px 6px; border-radius:4px; font-weight:700;">
            CRITICAL RISK
          </span>
          <span style="font-size:0.75rem; color:var(--text-secondary);">${ev.time} · Link ${ev.linkId}</span>
        </div>
        <div style="font-size:0.85rem; font-weight:600; color:var(--text-primary); margin-bottom:8px;">
          Trigger: ${ev.trigger} (ARS ${ev.ars.toFixed(2)})
        </div>
        <div style="font-size:0.8rem; color:#fca5a5; line-height:1.4;">
          <strong>Action:</strong> ${recs}
        </div>
      `;

      panel.appendChild(card);
    });

    if (topEvents.length === 0) {
      panel.innerHTML = `<div style="grid-column: span 3; text-align:center; color:var(--text-muted); padding:24px;">No mitigation advisories triggered. Road conditions nominal.</div>`;
    }
  },

  async render() {
    this.init();
    this.renderHeatmap();
    this.renderLinkRisk();
    this.renderRadialClock();
    this.renderTopRiskyLinks();
    this.renderHighRiskEvents();
    this.renderPreventionAdvisories();
  }
};
