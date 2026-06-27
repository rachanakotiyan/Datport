/**
 * PredictionsView Module (Page 3)
 * Handles model analytics, feature weights, and user forecast simulators.
 */

const PredictionsView = {
  charts: {
    predVsActual: null,
    forecast: null,
    importance: null,
    residual: null
  },
  isInitialized: false,
  selectedLinkId: 1,
  selectedDate: '',
  selectedTarget: 'speed', // 'speed' or 'delay'

  init() {
    if (this.isInitialized) return;

    this.selectedLinkId = DataAdapter.allLinks[0] || 1;
    this.selectedDate = DataAdapter.allDates[10] || DataAdapter.allDates[0]; // test date default

    // Populate selectors
    const linkSelect = document.getElementById('filter-link-pred');
    linkSelect.innerHTML = '';
    DataAdapter.allLinks.forEach(link => {
      const option = document.createElement('option');
      option.value = link;
      option.textContent = `Link ${link}`;
      linkSelect.appendChild(option);
    });
    linkSelect.value = this.selectedLinkId;

    const dateSelect = document.getElementById('filter-date-pred');
    dateSelect.innerHTML = '';
    DataAdapter.allDates.forEach(date => {
      const option = document.createElement('option');
      option.value = date;
      option.textContent = date;
      dateSelect.appendChild(option);
    });
    dateSelect.value = this.selectedDate;

    // Widget selectors
    const widgetLink = document.getElementById('widget-link');
    widgetLink.innerHTML = '';
    DataAdapter.allLinks.forEach(link => {
      const option = document.createElement('option');
      option.value = link;
      option.textContent = `Link ${link}`;
      widgetLink.appendChild(option);
    });

    // Event listeners
    linkSelect.addEventListener('change', (e) => {
      this.selectedLinkId = parseInt(e.target.value, 10);
      this.renderForecasts();
    });

    dateSelect.addEventListener('change', (e) => {
      this.selectedDate = e.target.value;
      this.renderForecasts();
    });

    // Target switches
    document.getElementById('btn-pred-spd').addEventListener('click', (e) => {
      this.selectedTarget = 'speed';
      toggleActiveButton('btn-pred-spd', ['btn-pred-spd', 'btn-pred-dly']);
      this.renderPredVsActual();
    });
    document.getElementById('btn-pred-dly').addEventListener('click', (e) => {
      this.selectedTarget = 'delay';
      toggleActiveButton('btn-pred-dly', ['btn-pred-spd', 'btn-pred-dly']);
      this.renderPredVsActual();
    });

    // Widget binds
    widgetLink.addEventListener('change', () => this.simulateWidget());
    document.getElementById('widget-day').addEventListener('change', () => this.simulateWidget());
    const widgetHour = document.getElementById('widget-hour');
    const widgetHourLabel = document.getElementById('widget-hour-label');
    widgetHour.addEventListener('input', (e) => {
      const hr = parseInt(e.target.value, 10);
      const isPm = hr >= 12;
      const hStr = hr % 12 === 0 ? 12 : hr % 12;
      widgetHourLabel.textContent = `${String(hStr).padStart(2, '0')}:00 ${isPm ? 'PM' : 'AM'}`;
      this.simulateWidget();
    });

    // Initialize ECharts canvases
    this.charts.predVsActual = echarts.init(document.getElementById('chart-pred-vs-actual'));
    this.charts.forecast = echarts.init(document.getElementById('chart-congestion-forecast'));
    this.charts.importance = echarts.init(document.getElementById('chart-feature-importance'));
    this.charts.residual = echarts.init(document.getElementById('chart-residual-error'));

    window.addEventListener('resize', () => {
      for (const key in this.charts) {
        if (this.charts[key]) this.charts[key].resize();
      }
    });

    this.isInitialized = true;
  },

  /**
   * Renders the static MAE and RMSE performance metrics from the scorecard.
   */
  async renderScorecard() {
    const m = await DataAdapter.getModelMetrics();
    document.getElementById('scorecard-mae').innerHTML = `${m.speed_mae.toFixed(2)} <span style="font-size:0.8rem; font-weight:400; color:var(--text-secondary);">km/h</span>`;
    document.getElementById('scorecard-r2').textContent = m.speed_r2.toFixed(3);
    document.getElementById('scorecard-rmse').innerHTML = `${m.delay_rmse.toFixed(1)} <span style="font-size:0.8rem; font-weight:400; color:var(--text-secondary);">sec</span>`;
    document.getElementById('scorecard-acc').textContent = `${m.congestion_accuracy.toFixed(1)}%`;
    document.getElementById('scorecard-auc').textContent = m.congestion_auc.toFixed(3);
    document.getElementById('scorecard-improvement').textContent = `+${m.improvement_vs_baseline.toFixed(1)}%`;
  },

  /**
   * Compares the actual and historical average simulated predictions on a line plot.
   */
  async renderPredVsActual() {
    if (!this.charts.predVsActual) return;

    const data = await DataAdapter.getPredictedVsActual(this.selectedLinkId, this.selectedDate, this.selectedTarget);
    const times = data.map(item => item.time);
    const actuals = data.map(item => item.actual);
    const predictions = data.map(item => item.predicted);

    const name = this.selectedTarget === 'speed' ? 'Speed (km/h)' : 'Delay (sec)';
    
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
      legend: {
        data: ['Actual', 'Predicted (AI)'],
        textStyle: { color: '#f1f5f9' },
        bottom: 0
      },
      series: [
        {
          name: 'Actual',
          type: 'line',
          data: actuals,
          symbol: 'none',
          smooth: true,
          lineStyle: { color: '#94a3b8', width: 2 }
        },
        {
          name: 'Predicted (AI)',
          type: 'line',
          data: predictions,
          symbol: 'none',
          smooth: true,
          lineStyle: { color: '#6366f1', width: 2, type: 'dashed' }
        }
      ]
    };

    this.charts.predVsActual.setOption(option, true);
  },

  /**
   * Forecasts the hourly risk probability in a simple area chart.
   */
  async render24hForecast() {
    if (!this.charts.forecast) return;

    const fc = await DataAdapter.getForecast24h(this.selectedLinkId, this.selectedDate);
    const categories = fc.map(item => `${String(item.hour).padStart(2, '0')}:00`);
    const values = fc.map(item => item.probability * 100);

    const option = {
      grid: { top: '10%', left: '4%', right: '4%', bottom: '5%', containLabel: true },
      xAxis: {
        type: 'category',
        data: categories,
        axisLine: { lineStyle: { color: '#1e2d45' } },
        axisLabel: { color: '#94a3b8' }
      },
      yAxis: {
        type: 'value',
        name: 'Congestion Prob (%)',
        min: 0,
        max: 100,
        splitLine: { lineStyle: { color: '#1e2d45' } },
        axisLabel: { color: '#94a3b8' }
      },
      tooltip: {
        trigger: 'axis',
        formatter: '{b}: {c}% Probability',
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
              const val = params.data;
              if (val > 80) return '#ef4444';
              if (val > 50) return '#f59e0b';
              return '#10b981';
            },
            borderRadius: [3, 3, 0, 0]
          }
        }
      ]
    };

    this.charts.forecast.setOption(option);
  },

  /**
   * Renders the LightGBM feature weights.
   */
  async renderFeatureImportance() {
    if (!this.charts.importance) return;

    const feats = await DataAdapter.getFeatureImportance();
    // Sort ascending for horizontal drawing
    const data = [...feats].reverse();
    const categories = data.map(item => item.name);
    const values = data.map(item => item.importance);

    const option = {
      grid: { top: '5%', left: '3%', right: '8%', bottom: '5%', containLabel: true },
      xAxis: {
        type: 'value',
        splitLine: { lineStyle: { color: '#1e2d45' } },
        axisLabel: { color: '#94a3b8' }
      },
      yAxis: {
        type: 'category',
        data: categories,
        axisLine: { lineStyle: { color: '#1e2d45' } },
        axisLabel: { color: '#94a3b8', fontSize: 10 }
      },
      tooltip: {
        trigger: 'axis',
        formatter: '{b}<br/>Weight: {c}',
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
              const cat = data[params.dataIndex].category;
              if (cat === 'time') return '#6366f1';
              if (cat === 'lag') return '#f59e0b';
              if (cat === 'physics') return '#ef4444';
              return '#10b981';
            },
            borderRadius: [0, 4, 4, 0]
          }
        }
      ]
    };

    this.charts.importance.setOption(option);
  },

  /**
   * Simulated interactive predictor widget execution.
   */
  async simulateWidget() {
    const linkId = parseInt(document.getElementById('widget-link').value, 10);
    const dayOfWeek = parseInt(document.getElementById('widget-day').value, 10);
    const hour = parseInt(document.getElementById('widget-hour').value, 10);

    // Retrieve historical baseline profile
    const hist = DataAdapter.historicalAverages[linkId]?.[dayOfWeek]?.[hour];

    const outSpeedEl = document.getElementById('widget-out-speed');
    const outProbEl = document.getElementById('widget-out-prob');

    if (hist) {
      // Create simulated predictions
      const simulatedSpeed = Math.max(20, Math.round(hist.speed));
      const simulatedProb = Math.min(100, Math.round(Math.min(1.0, hist.occupancy) * 100));

      outSpeedEl.textContent = `${simulatedSpeed} km/h`;
      outProbEl.textContent = `${simulatedProb}%`;

      // Change output colors based on congestion severity
      if (simulatedProb > 80) {
        outProbEl.style.color = 'var(--congested)';
      } else if (simulatedProb > 50) {
        outProbEl.style.color = 'var(--moderate)';
      } else {
        outProbEl.style.color = 'var(--free-flow)';
      }
    } else {
      outSpeedEl.textContent = '-- km/h';
      outProbEl.textContent = '--%';
      outProbEl.style.color = 'var(--text-primary)';
    }
  },

  /**
   * Draws the residual error bell curve histogram.
   */
  async renderResiduals() {
    if (!this.charts.residual) return;

    const res = await DataAdapter.getResidualErrors();
    const categories = res.map(item => `${item.bucket} km/h`);
    const values = res.map(item => item.count);

    const option = {
      grid: { top: '10%', left: '4%', right: '4%', bottom: '5%', containLabel: true },
      xAxis: {
        type: 'category',
        data: categories,
        axisLine: { lineStyle: { color: '#1e2d45' } },
        axisLabel: { color: '#94a3b8' }
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
              const bVal = parseInt(res[params.dataIndex].bucket, 10);
              if (Math.abs(bVal) <= 5) return '#10b981'; // near zero: green
              if (Math.abs(bVal) <= 15) return '#f59e0b'; // moderate error: yellow
              return '#ef4444'; // high error: red
            },
            borderRadius: [2, 2, 0, 0]
          }
        }
      ]
    };

    this.charts.residual.setOption(option);
  },

  renderForecasts() {
    this.renderPredVsActual();
    this.render24hForecast();
  },

  render() {
    this.init();
    this.renderScorecard();
    this.renderForecasts();
    this.renderFeatureImportance();
    this.simulateWidget();
    this.renderResiduals();
  }
};

/**
 * Shared button group styling utility.
 */
function toggleActiveButton(activeBtnId, allBtnIds) {
  allBtnIds.forEach(id => {
    const el = document.getElementById(id);
    if (id === activeBtnId) {
      el.className = 'btn-primary';
    } else {
      el.className = 'btn-secondary';
    }
  });
}
