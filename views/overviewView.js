/**
 * OverviewView Module (Page 1)
 * Controls the Overview KPIs, Heatmap grids, Trend lines, and Radial clocks.
 */

const OverviewView = {
  charts: {
    heatmap: null,
    trend: null,
    radialClock: null,
    topLinks: null
  },
  isInitialized: false,
  selectedDate: '',
  selectedTrendMetric: 'volume', // 'volume', 'speed', or 'delay'
  
  init() {
    if (this.isInitialized) return;

    this.selectedDate = DataAdapter.allDates[0];

    // Populate date select dropdown
    const dateSelect = document.getElementById('hotspot-date-select');
    dateSelect.innerHTML = '';
    DataAdapter.allDates.forEach(date => {
      const option = document.createElement('option');
      option.value = date;
      option.textContent = date;
      dateSelect.appendChild(option);
    });
    dateSelect.value = this.selectedDate;

    // Attach listeners
    dateSelect.addEventListener('change', (e) => {
      this.selectedDate = e.target.value;
      this.renderHotspots();
    });

    const hourStart = document.getElementById('hotspot-hour-start');
    const hourEnd = document.getElementById('hotspot-hour-end');
    const hourStartLabel = document.getElementById('hotspot-hour-start-label');
    const hourEndLabel = document.getElementById('hotspot-hour-end-label');

    hourStart.addEventListener('input', (e) => {
      let val = parseInt(e.target.value, 10);
      let endVal = parseInt(hourEnd.value, 10);
      if (val > endVal) {
        hourEnd.value = val;
        hourEndLabel.textContent = `${String(val).padStart(2, '0')}:00`;
      }
      hourStartLabel.textContent = `${String(val).padStart(2, '0')}:00`;
      this.renderHotspots();
    });

    hourEnd.addEventListener('input', (e) => {
      let val = parseInt(e.target.value, 10);
      let startVal = parseInt(hourStart.value, 10);
      if (val < startVal) {
        hourStart.value = val;
        hourStartLabel.textContent = `${String(val).padStart(2, '0')}:00`;
      }
      hourEndLabel.textContent = `${String(val).padStart(2, '0')}:00`;
      this.renderHotspots();
    });

    document.getElementById('hotspot-filter-reset').addEventListener('click', () => {
      hourStart.value = 0;
      hourEnd.value = 23;
      hourStartLabel.textContent = '00:00';
      hourEndLabel.textContent = '23:00';
      this.selectedDate = DataAdapter.allDates[0];
      dateSelect.value = this.selectedDate;
      this.renderHotspots();
    });

    // Trend toggles
    document.getElementById('btn-trend-vol').addEventListener('click', () => {
      this.selectedTrendMetric = 'volume';
      toggleActiveButton('btn-trend-vol', ['btn-trend-vol', 'btn-trend-spd', 'btn-trend-dly']);
      this.renderTrend();
    });
    document.getElementById('btn-trend-spd').addEventListener('click', () => {
      this.selectedTrendMetric = 'speed';
      toggleActiveButton('btn-trend-spd', ['btn-trend-vol', 'btn-trend-spd', 'btn-trend-dly']);
      this.renderTrend();
    });
    document.getElementById('btn-trend-dly').addEventListener('click', () => {
      this.selectedTrendMetric = 'delay';
      toggleActiveButton('btn-trend-dly', ['btn-trend-vol', 'btn-trend-spd', 'btn-trend-dly']);
      this.renderTrend();
    });

    // Initialize ECharts instances
    this.charts.heatmap = echarts.init(document.getElementById('chart-congestion-heatmap'));
    this.charts.trend = echarts.init(document.getElementById('chart-traffic-trend'));
    this.charts.radialClock = echarts.init(document.getElementById('chart-radial-clock'));
    this.charts.topLinks = echarts.init(document.getElementById('chart-top-links'));

    // Heatmap cell click handler -> redirects to Congestion View
    this.charts.heatmap.on('click', (params) => {
      if (params.seriesType === 'heatmap') {
        const clickedLink = params.value[1];
        App.navigateToLink(clickedLink, this.selectedDate);
      }
    });

    // Resize hooks
    window.addEventListener('resize', () => {
      for (const key in this.charts) {
        if (this.charts[key]) this.charts[key].resize();
      }
    });

    this.isInitialized = true;
  },

  /**
   * Renders overview KPI cards (count-up effect).
   */
  async renderKPIs() {
    await DataAdapter.updateGlobalStats();
    const stats = DataAdapter.stats;
    animateCount(document.getElementById('kpi-vehicles'), stats.totalVehicles, 1500);
    animateCount(document.getElementById('kpi-speed'), Math.round(stats.freeFlowSpeedAvg), 1000);
    animateCount(document.getElementById('kpi-delay'), Math.round(stats.peakHourMaxDelay), 1000);
    animateCount(document.getElementById('kpi-links'), DataAdapter.allLinks.length, 800);

    document.getElementById('kpi-worst-link').textContent = `Link ${stats.mostCongestedLink}`;
    document.getElementById('kpi-worst-day').textContent = stats.worstDay;
  },

  /**
   * Renders the ECharts heatmap grid.
   */
  async renderHeatmap() {
    if (!this.charts.heatmap) return;

    const data = await DataAdapter.getCongestionHeatmap();
    const categoriesX = Array(24).fill(null).map((_, i) => `${String(i).padStart(2, '0')}:00`);
    const categoriesY = DataAdapter.allLinks.map(l => String(l));

    // Map heatmap grid
    const cellValues = data.map(h => [
      h[0],
      DataAdapter.allLinks.indexOf(h[1]),
      h[2]
    ]);

    const option = {
      tooltip: {
        position: 'top',
        formatter: (params) => {
          const hr = params.value[0];
          const linkId = DataAdapter.allLinks[params.value[1]];
          const score = params.value[2];
          return `Link ${linkId}, ${hr}:00<br/>Congestion Index: <strong>${score.toFixed(2)}</strong>/10`;
        },
        backgroundColor: '#111827',
        borderColor: '#1e2d45',
        textStyle: { color: '#f1f5f9' }
      },
      grid: { top: '5%', bottom: '5%', left: '5%', right: '3%', containLabel: true },
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
        max: 6.0,
        calculable: true,
        orient: 'horizontal',
        left: 'center',
        bottom: 0,
        show: false, // hide visualMap on screen but keep color mapping
        inRange: {
          color: ['#10b981', '#f59e0b', '#ef4444']
        }
      },
      series: [
        {
          type: 'heatmap',
          data: cellValues,
          label: { show: false }
        }
      ]
    };

    this.charts.heatmap.setOption(option, true);
  },

  /**
   * Draws the 14-Day Traffic Trend line chart.
   */
  async renderTrend() {
    if (!this.charts.trend) return;

    const trend = await DataAdapter.getTrafficTrend14Day(this.selectedTrendMetric);
    const dates = trend.map(t => t.date);
    const values = trend.map(t => t.value);

    let name = 'Total Vehicles';
    if (this.selectedTrendMetric === 'speed') name = 'Avg Speed (km/h)';
    else if (this.selectedTrendMetric === 'delay') name = 'Avg Queue Delay (s)';

    // Mark weekend indexes (July 6-7 [indices 5,6] and July 13-14 [indices 12,13])
    const option = {
      grid: { top: '12%', left: '4%', right: '4%', bottom: '15%', containLabel: true },
      xAxis: {
        type: 'category',
        data: dates,
        axisLine: { lineStyle: { color: '#1e2d45' } },
        axisLabel: { color: '#94a3b8', fontSize: 10, rotate: 20 }
      },
      yAxis: {
        type: 'value',
        name: name,
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
          name: name,
          type: 'line',
          data: values,
          smooth: true,
          symbol: 'circle',
          itemStyle: { color: '#6366f1' },
          lineStyle: { width: 3 },
          areaStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: 'rgba(99, 102, 241, 0.3)' },
              { offset: 1, color: 'rgba(99, 102, 241, 0.0)' }
            ])
          },
          // Highlight weekends
          markArea: {
            silent: true,
            itemStyle: { color: 'rgba(148, 163, 184, 0.08)' },
            data: [
              [{ xAxis: '2024-07-06' }, { xAxis: '2024-07-07' }],
              [{ xAxis: '2024-07-13' }, { xAxis: '2024-07-14' }]
            ]
          }
        }
      ]
    };

    this.charts.trend.setOption(option, true);
  },

  /**
   * Draws ECharts polar clock of average congestion score by hour.
   */
  async renderRadialClock() {
    if (!this.charts.radialClock) return;

    const data = await DataAdapter.getRadialClockData();
    const categories = data.map(item => `${item.hour}:00`);
    const values = data.map(item => item.score);

    const option = {
      polar: {
        radius: ['20%', '85%']
      },
      radiusAxis: {
        max: 6.0,
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
        formatter: '{b}<br/>Avg Congestion: {c}',
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
              if (val >= 4) return '#ef4444'; // Red rush
              if (val >= 2) return '#f59e0b'; // Amber daytime
              return '#10b981'; // Green night
            }
          }
        }
      ]
    };

    this.charts.radialClock.setOption(option);
  },

  /**
   * Renders hotspots table and horizontal ranking plot.
   */
  async renderHotspots() {
    const startHour = parseInt(document.getElementById('hotspot-hour-start').value, 10);
    const endHour = parseInt(document.getElementById('hotspot-hour-end').value, 10);
    
    document.getElementById('hotspots-date-label').textContent = `Date: ${this.selectedDate} (${startHour}:00 - ${endHour}:00)`;

    // Table loading state
    const tableBody = document.querySelector('#hotspot-table tbody');
    tableBody.innerHTML = '<tr><td colspan="7" style="text-align:center;"><div class="spinner" style="vertical-align: middle; margin-right: 8px;"></div> Loading road hotspots...</td></tr>';

    // Chart loading state
    if (this.charts.topLinks) {
      this.charts.topLinks.showLoading({
        text: 'Fetching from API...',
        color: '#6366f1',
        textColor: '#f1f5f9',
        maskColor: 'rgba(17, 24, 39, 0.6)'
      });
    }

    const hotspots = await DataAdapter.getHotspots(this.selectedDate, { startHour, endHour });

    // Table Populate
    tableBody.innerHTML = '';

    hotspots.forEach((spot, idx) => {
      const row = document.createElement('tr');
      row.dataset.linkId = spot.linkId;
      
      let badgeClass = 'free-flow';
      if (spot.congestionScore >= 7) badgeClass = 'critical';
      else if (spot.congestionScore >= 5) badgeClass = 'congested';
      else if (spot.congestionScore >= 3) badgeClass = 'moderate';

      row.innerHTML = `
        <td><strong>${idx + 1}</strong></td>
        <td><span style="color:var(--accent); font-weight:600;">Link ${spot.linkId}</span></td>
        <td><span class="score-badge ${badgeClass}">${spot.congestionScore.toFixed(2)}</span></td>
        <td>${spot.avgSpeed.toFixed(1)} km/h</td>
        <td>${spot.avgDelay.toFixed(0)}s</td>
        <td>${spot.avgOccupancy.toFixed(2)}</td>
        <td>${spot.volume.toLocaleString()}</td>
      `;

      row.addEventListener('click', () => {
        App.navigateToLink(spot.linkId, this.selectedDate);
      });

      tableBody.appendChild(row);
    });

    this.renderTopLinksChart(hotspots.slice(0, 10));
    
    // Hide chart loader
    if (this.charts.topLinks) {
      this.charts.topLinks.hideLoading();
    }
  },

  renderTopLinksChart(topSpots) {
    if (!this.charts.topLinks) return;

    const data = [...topSpots].reverse();
    const categories = data.map(item => `Link ${item.linkId}`);
    const values = data.map(item => item.congestionScore);

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
              const score = params.data;
              if (score >= 7) return '#ef4444';
              if (score >= 5) return '#f97316';
              if (score >= 3) return '#f59e0b';
              return '#10b981';
            },
            borderRadius: [0, 4, 4, 0]
          },
          barWidth: '60%'
        }
      ]
    };

    this.charts.topLinks.setOption(option);
  },

  async render() {
    this.init();
    await this.renderKPIs();
    this.renderHeatmap();
    this.renderTrend();
    this.renderRadialClock();
    await this.renderHotspots();
  }
};
