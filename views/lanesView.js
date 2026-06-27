/**
 * LanesView Module (Page 4)
 * Visualizes lane level distributions, emergency lane activations, and imbalance indicators.
 */

const LanesView = {
  charts: {
    radar: null,
    stackedBar: null,
    lbiLine: null
  },
  isInitialized: false,
  selectedLinkId: 1,
  selectedDate: '',
  selectedRadarMetric: 'speed', // 'speed', 'occupancy', or 'volume'

  init() {
    if (this.isInitialized) return;

    this.selectedLinkId = DataAdapter.allLinks[0] || 1;
    this.selectedDate = DataAdapter.allDates[0];

    // Populate selectors
    const linkSelect = document.getElementById('filter-link-lanes');
    linkSelect.innerHTML = '';
    DataAdapter.allLinks.forEach(link => {
      const option = document.createElement('option');
      option.value = link;
      option.textContent = `Link ${link}`;
      linkSelect.appendChild(option);
    });
    linkSelect.value = this.selectedLinkId;

    const dateSelect = document.getElementById('filter-date-lanes');
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
      this.render();
    });

    dateSelect.addEventListener('change', (e) => {
      this.selectedDate = e.target.value;
      this.render();
    });

    // Radar metric buttons
    document.getElementById('btn-radar-spd').addEventListener('click', () => {
      this.selectedRadarMetric = 'speed';
      toggleActiveButton('btn-radar-spd', ['btn-radar-spd', 'btn-radar-occ', 'btn-radar-vol']);
      this.renderRadar();
    });
    document.getElementById('btn-radar-occ').addEventListener('click', () => {
      this.selectedRadarMetric = 'occupancy';
      toggleActiveButton('btn-radar-occ', ['btn-radar-spd', 'btn-radar-occ', 'btn-radar-vol']);
      this.renderRadar();
    });
    document.getElementById('btn-radar-vol').addEventListener('click', () => {
      this.selectedRadarMetric = 'volume';
      toggleActiveButton('btn-radar-vol', ['btn-radar-spd', 'btn-radar-occ', 'btn-radar-vol']);
      this.renderRadar();
    });

    // Time select for radar
    document.getElementById('radar-time-select').addEventListener('change', () => {
      this.renderRadar();
    });

    // Initialize ECharts instances
    this.charts.radar = echarts.init(document.getElementById('chart-lane-radar'));
    this.charts.stackedBar = echarts.init(document.getElementById('chart-lane-distribution'));
    this.charts.lbiLine = echarts.init(document.getElementById('chart-lane-balance'));

    window.addEventListener('resize', () => {
      for (const key in this.charts) {
        if (this.charts[key]) this.charts[key].resize();
      }
    });

    this.isInitialized = true;
  },

  /**
   * Populates the 288 intervals into the radar time select.
   */
  populateRadarTime(series) {
    const select = document.getElementById('radar-time-select');
    const prevVal = select.value;
    
    select.innerHTML = '';
    
    series.forEach(item => {
      const option = document.createElement('option');
      option.value = item.time;
      option.textContent = item.time;
      select.appendChild(option);
    });

    // Restore previous selection if possible, otherwise default to morning peak hour 08:30
    if (series.some(s => s.time === prevVal)) {
      select.value = prevVal;
    } else {
      select.value = series.some(s => s.time === '08:30') ? '08:30' : (series[100]?.time || '00:00');
    }
  },

  /**
   * Draws the ECharts radar spider chart.
   */
  async renderRadar() {
    if (!this.charts.radar) return;

    const timeVal = document.getElementById('radar-time-select').value;
    if (!timeVal) return;

    const metrics = await DataAdapter.getLaneRadarMetrics(this.selectedLinkId, this.selectedDate, timeVal);
    
    // Extractor
    let key = this.selectedRadarMetric; // 'speed', 'occupancy', or 'volume'
    const values = metrics.map(m => m[key]);

    // Max limits per metric
    let maxLimit = 250; // speed
    if (key === 'occupancy') maxLimit = 1.2;
    else if (key === 'volume') maxLimit = 500;

    const indicators = Array(6).fill(null).map((_, i) => ({
      name: `Lane ${i + 1}`,
      max: maxLimit
    }));

    const nameMap = {
      speed: 'Avg Speed (km/h)',
      occupancy: 'Occupancy Rate',
      volume: 'Vehicle Count'
    };

    const option = {
      radar: {
        indicator: indicators,
        axisName: {
          color: '#94a3b8',
          fontFamily: 'Inter'
        },
        splitLine: {
          lineStyle: {
            color: 'rgba(30, 45, 69, 0.6)'
          }
        },
        splitArea: {
          areaStyle: {
            color: ['rgba(17, 24, 39, 0.4)', 'rgba(10, 15, 30, 0.2)']
          }
        }
      },
      tooltip: {
        trigger: 'item',
        backgroundColor: '#111827',
        borderColor: '#1e2d45',
        textStyle: { color: '#f1f5f9' }
      },
      series: [
        {
          type: 'radar',
          data: [
            {
              value: values,
              name: nameMap[key],
              itemStyle: { color: '#6366f1' },
              areaStyle: {
                color: 'rgba(99, 102, 241, 0.3)'
              }
            }
          ]
        }
      ]
    };

    this.charts.radar.setOption(option, true);
  },

  /**
   * Draws the stacked hourly volume bar chart.
   */
  async renderStackedBar() {
    if (!this.charts.stackedBar) return;

    const matrix = await DataAdapter.getLaneDistributionStacked(this.selectedLinkId, this.selectedDate);
    const hours = Array(24).fill(null).map((_, i) => `${String(i).padStart(2, '0')}:00`);
    
    // Rearrange matrix: 6 arrays of 24 values
    const seriesData = Array(6).fill(null).map(() => []);
    for (let hr = 0; hr < 24; hr++) {
      for (let lane = 0; lane < 6; lane++) {
        seriesData[lane].push(Math.round(matrix[hr][lane]));
      }
    }

    const laneColors = ['#6366f1', '#8b5cf6', '#a78bfa', '#10b981', '#34d399', '#6ee7b7'];

    const option = {
      grid: { top: '10%', left: '4%', right: '4%', bottom: '15%', containLabel: true },
      xAxis: {
        type: 'category',
        data: hours,
        axisLine: { lineStyle: { color: '#1e2d45' } },
        axisLabel: { color: '#94a3b8' }
      },
      yAxis: {
        type: 'value',
        name: 'Vehicles / Hour',
        splitLine: { lineStyle: { color: '#1e2d45' } },
        axisLabel: { color: '#94a3b8' }
      },
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
        backgroundColor: '#111827',
        borderColor: '#1e2d45',
        textStyle: { color: '#f1f5f9' }
      },
      legend: {
        data: ['Lane 1', 'Lane 2', 'Lane 3', 'Lane 4', 'Lane 5', 'Lane 6'],
        textStyle: { color: '#f1f5f9' },
        bottom: 0
      },
      series: seriesData.map((data, idx) => ({
        name: `Lane ${idx + 1}`,
        type: 'bar',
        stack: 'lanes',
        data: data,
        itemStyle: { color: laneColors[idx] }
      }))
    };

    this.charts.stackedBar.setOption(option);
  },

  /**
   * Draws the Lane Balance Index timeline.
   */
  async renderLbiLine() {
    if (!this.charts.lbiLine) return;

    const data = await DataAdapter.getLaneBalanceTimeSeries(this.selectedLinkId, this.selectedDate);
    const times = data.map(item => item.time);
    const lbis = data.map(item => item.lbi);

    const option = {
      grid: { top: '10%', left: '4%', right: '4%', bottom: '8%', containLabel: true },
      xAxis: {
        type: 'category',
        data: times,
        axisLine: { lineStyle: { color: '#1e2d45' } },
        axisLabel: { color: '#94a3b8' }
      },
      yAxis: {
        type: 'value',
        name: 'Balance Index',
        min: 0,
        max: 1.0,
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
          name: 'LBI',
          type: 'line',
          data: lbis,
          symbol: 'none',
          smooth: true,
          lineStyle: { color: '#8b5cf6', width: 2 },
          // Highlight imbalance threshold
          markLine: {
            silent: true,
            lineStyle: { color: '#f59e0b', type: 'dashed' },
            data: [
              { yAxis: 0.45, label: { formatter: 'Imbalance Limit', position: 'end', color: '#f59e0b' } },
              { yAxis: 0.65, label: { formatter: 'Critical Limit', position: 'end', color: '#ef4444' } }
            ]
          }
        }
      ]
    };

    this.charts.lbiLine.setOption(option);
  },

  /**
   * Renders the Lane 6 activation logs table.
   */
  async renderLane6Logs() {
    const tableBody = document.querySelector('#lane-6-table tbody');
    if (!tableBody) return;
    
    tableBody.innerHTML = '';

    const logs = await DataAdapter.getLane6Activity();
    
    // Only show top 20 extreme activation events
    logs.slice(0, 20).forEach(log => {
      const row = document.createElement('tr');
      
      let badgeClass = 'score-badge moderate';
      if (log.severity.includes('Extreme')) badgeClass = 'score-badge critical';
      else if (log.severity.includes('High')) badgeClass = 'score-badge congested';

      row.innerHTML = `
        <td>${log.date} ${log.time}</td>
        <td><span style="color:var(--accent); font-weight:600;">Link ${log.linkId}</span></td>
        <td>${log.volume} vehs</td>
        <td>${log.speed.toFixed(0)} km/h</td>
        <td><span class="${badgeClass}">${log.severity}</span></td>
      `;

      row.addEventListener('click', () => {
        App.navigateToLink(log.linkId, log.date);
      });

      tableBody.appendChild(row);
    });

    if (logs.length === 0) {
      tableBody.innerHTML = `<tr><td colspan="5" style="text-align:center; color:var(--text-muted);">No activations detected on this period.</td></tr>`;
    }
  },

  /**
   * Renders the aggregate stats per lane.
   */
  async renderPerLaneStats() {
    const tableBody = document.querySelector('#per-lane-stats-table tbody');
    if (!tableBody) return;
    
    tableBody.innerHTML = '';

    const stats = await DataAdapter.getPerLaneSummary(this.selectedLinkId, this.selectedDate);

    stats.forEach(lane => {
      const row = document.createElement('tr');
      
      let badgeClass = 'score-badge free-flow';
      if (lane.status.includes('Congested')) badgeClass = 'score-badge critical';
      else if (lane.status.includes('Heavy')) badgeClass = 'score-badge congested';
      else if (lane.status.includes('Inactive')) badgeClass = 'score-badge moderate';

      row.innerHTML = `
        <td><strong>Lane ${lane.laneId}</strong></td>
        <td>${lane.avgSpeed.toFixed(1)} km/h</td>
        <td>${lane.avgDelay.toFixed(0)}s</td>
        <td>${lane.maxOccupancy.toFixed(2)}</td>
        <td>${lane.avgVehicles.toFixed(1)}</td>
        <td><span class="${badgeClass}">${lane.status}</span></td>
      `;

      tableBody.appendChild(row);
    });
  },

  async render() {
    this.init();
    
    // Collect timeseries to populate radar time dropdown
    const series = await DataAdapter.getLinkTimeSeries(this.selectedLinkId, this.selectedDate);
    this.populateRadarTime(series);

    this.renderRadar();
    this.renderStackedBar();
    this.renderLbiLine();
    this.renderLane6Logs();
    this.renderPerLaneStats();
  }
};
