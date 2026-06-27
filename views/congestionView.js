/**
 * CongestionView Module (Page 2)
 * Manages detailed link charts, per-lane occupancy gauges, scatter graphs, and calendar heatmaps.
 */

const CongestionView = {
  charts: {
    timeSeries: null,
    speedComparison: null,
    queueDelay: null,
    laneGauges: [],
    trafficDiagram: null,
    volumeByHour: null,
    calendarHeatmap: null
  },
  isInitialized: false,
  selectedLinkId: 1,
  selectedDate: '',

  init() {
    if (this.isInitialized) return;

    this.selectedLinkId = DataAdapter.allLinks[0] || 1;
    this.selectedDate = DataAdapter.allDates[0];

    // Populate filters
    const linkSelect = document.getElementById('filter-link');
    linkSelect.innerHTML = '';
    DataAdapter.allLinks.forEach(link => {
      const option = document.createElement('option');
      option.value = link;
      option.textContent = `Link ${link}`;
      linkSelect.appendChild(option);
    });
    linkSelect.value = this.selectedLinkId;

    const dateSelect = document.getElementById('filter-date');
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

    document.getElementById('btn-reset-congestion').addEventListener('click', () => {
      this.selectedLinkId = DataAdapter.allLinks[0];
      this.selectedDate = DataAdapter.allDates[0];
      linkSelect.value = this.selectedLinkId;
      dateSelect.value = this.selectedDate;
      this.render();
    });

    // Initialize ECharts instances
    this.charts.timeSeries = echarts.init(document.getElementById('chart-time-series'));
    this.charts.speedComparison = echarts.init(document.getElementById('chart-speed-over-time'));
    this.charts.queueDelay = echarts.init(document.getElementById('chart-queue-delay-area'));
    this.charts.trafficDiagram = echarts.init(document.getElementById('chart-traffic-diagram'));
    this.charts.volumeByHour = echarts.init(document.getElementById('chart-volume-by-hour'));
    this.charts.calendarHeatmap = echarts.init(document.getElementById('chart-calendar-heatmap'));

    // Initialize 6 gauges
    this.charts.laneGauges = [];
    for (let lane = 1; lane <= 6; lane++) {
      const gaugeEl = document.getElementById(`gauge-lane-${lane}`);
      if (gaugeEl) {
        this.charts.laneGauges.push(echarts.init(gaugeEl));
      }
    }

    // Calendar cell click event -> filters to selected date
    this.charts.calendarHeatmap.on('click', (params) => {
      if (params.seriesType === 'heatmap') {
        const clickedDate = params.value[0];
        this.selectedDate = clickedDate;
        document.getElementById('filter-date').value = clickedDate;
        this.render();
      }
    });

    window.addEventListener('resize', () => {
      if (this.charts.timeSeries) this.charts.timeSeries.resize();
      if (this.charts.speedComparison) this.charts.speedComparison.resize();
      if (this.charts.queueDelay) this.charts.queueDelay.resize();
      if (this.charts.trafficDiagram) this.charts.trafficDiagram.resize();
      if (this.charts.volumeByHour) this.charts.volumeByHour.resize();
      if (this.charts.calendarHeatmap) this.charts.calendarHeatmap.resize();
      this.charts.laneGauges.forEach(g => g && g.resize());
    });

    this.isInitialized = true;
  },

  /**
   * Sets filters externally (e.g., from drill-down) and redraws.
   */
  setFilters(linkId, date) {
    this.init();
    this.selectedLinkId = linkId;
    this.selectedDate = date;

    const linkSelect = document.getElementById('filter-link');
    if (linkSelect) linkSelect.value = linkId;

    const dateSelect = document.getElementById('filter-date');
    if (dateSelect) dateSelect.value = date;
  },

  /**
   * Main render function that retrieves time series, updates stats, draws chart, and shows prediction peaks.
   */
  async render() {
    this.init();

    // Trigger loading spinner states on ECharts panels
    if (this.charts.timeSeries) this.charts.timeSeries.showLoading({ text: 'Loading...', color: '#6366f1', textColor: '#f1f5f9', maskColor: 'rgba(17, 24, 39, 0.6)' });
    if (this.charts.speedComparison) this.charts.speedComparison.showLoading({ text: 'Loading...', color: '#6366f1', textColor: '#f1f5f9', maskColor: 'rgba(17, 24, 39, 0.6)' });
    if (this.charts.queueDelay) this.charts.queueDelay.showLoading({ text: 'Loading...', color: '#6366f1', textColor: '#f1f5f9', maskColor: 'rgba(17, 24, 39, 0.6)' });
    if (this.charts.trafficDiagram) this.charts.trafficDiagram.showLoading({ text: 'Loading...', color: '#6366f1', textColor: '#f1f5f9', maskColor: 'rgba(17, 24, 39, 0.6)' });
    if (this.charts.volumeByHour) this.charts.volumeByHour.showLoading({ text: 'Loading...', color: '#6366f1', textColor: '#f1f5f9', maskColor: 'rgba(17, 24, 39, 0.6)' });
    if (this.charts.calendarHeatmap) this.charts.calendarHeatmap.showLoading({ text: 'Loading...', color: '#6366f1', textColor: '#f1f5f9', maskColor: 'rgba(17, 24, 39, 0.6)' });

    // 1. Fetch data from adapter
    const series = await DataAdapter.getLinkTimeSeries(this.selectedLinkId, this.selectedDate);

    // Update label
    document.getElementById('time-series-label').textContent = `Link ID: ${this.selectedLinkId} | Date: ${this.selectedDate}`;

    // 2. Compute metrics for summary card
    if (series.length > 0) {
      let sumScore = 0;
      let maxScore = -1;
      let peakTime = '00:00';
      let dayVolume = 0;

      series.forEach(item => {
        sumScore += item.congestionScore;
        dayVolume += item.volume;
        if (item.congestionScore > maxScore) {
          maxScore = item.congestionScore;
          peakTime = item.time;
        }
      });

      const avgScore = sumScore / series.length;

      document.getElementById('link-info-id').textContent = this.selectedLinkId;
      document.getElementById('link-info-avg-score').textContent = avgScore.toFixed(2);
      document.getElementById('link-info-max-score').textContent = maxScore.toFixed(2);
      document.getElementById('link-info-peak-time').textContent = peakTime;
      document.getElementById('link-info-volume').textContent = dayVolume.toLocaleString();
    } else {
      document.getElementById('link-info-id').textContent = '--';
      document.getElementById('link-info-avg-score').textContent = '0.0';
      document.getElementById('link-info-max-score').textContent = '0.0';
      document.getElementById('link-info-peak-time').textContent = '00:00';
      document.getElementById('link-info-volume').textContent = '0';
    }

    // 3. Draw charts and clear spinner states
    this.drawTimeSeriesChart(series);
    this.drawSpeedComparison(series);
    this.drawQueueDelay(series);
    this.drawLaneGauges(series);
    this.drawTrafficDiagram();
    this.drawVolumeByHour();
    this.drawCalendarHeatmap();

    // 4. Render Predicted Peaks
    this.renderPredictedPeaks();
  },

  drawTimeSeriesChart(data) {
    if (!this.charts.timeSeries) return;
    this.charts.timeSeries.hideLoading();

    const xAxisData = data.map(item => item.time);
    const scores = data.map(item => item.congestionScore);

    const option = {
      grid: { top: '10%', left: '4%', right: '4%', bottom: '10%', containLabel: true },
      xAxis: {
        type: 'category',
        data: xAxisData,
        axisLine: { lineStyle: { color: '#1e2d45' } },
        axisLabel: { color: '#94a3b8' }
      },
      yAxis: {
        type: 'value',
        name: 'Congestion Score',
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
          name: 'Congestion Score',
          type: 'line',
          data: scores,
          smooth: true,
          symbol: 'none',
          lineStyle: { color: '#6366f1', width: 3 },
          areaStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: 'rgba(99, 102, 241, 0.3)' },
              { offset: 1, color: 'rgba(99, 102, 241, 0.0)' }
            ])
          },
          markArea: {
            silent: true,
            data: [
              [
                {
                  name: 'AM Peak',
                  xAxis: '07:30',
                  itemStyle: { color: 'rgba(239, 68, 68, 0.08)' },
                  label: { show: true, position: 'top', color: '#ef4444', fontSize: 10, fontWeight: 600 }
                },
                { xAxis: '09:30' }
              ],
              [
                {
                  name: 'PM Peak',
                  xAxis: '17:30',
                  itemStyle: { color: 'rgba(239, 68, 68, 0.08)' },
                  label: { show: true, position: 'top', color: '#ef4444', fontSize: 10, fontWeight: 600 }
                },
                { xAxis: '19:30' }
              ]
            ]
          }
        }
      ]
    };

    this.charts.timeSeries.setOption(option, true);
  },

  /**
   * Speed comparisons (Arithmetic vs Harmonic) with shaded delta gap.
   */
  drawSpeedComparison(data) {
    if (!this.charts.speedComparison) return;
    this.charts.speedComparison.hideLoading();

    const times = data.map(item => item.time);
    const speedArith = data.map(item => item.speedArith);
    const speedHarm = data.map(item => item.speed);

    // Creates red shaded delta highlights when arithmetic-harmonic gap is > 20
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
        name: 'Speed (km/h)',
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
        data: ['Arithmetic Speed', 'Harmonic Speed'],
        textStyle: { color: '#f1f5f9' },
        bottom: 0
      },
      series: [
        {
          name: 'Arithmetic Speed',
          type: 'line',
          data: speedArith,
          symbol: 'none',
          smooth: true,
          lineStyle: { color: '#94a3b8', width: 1.5, type: 'dashed' }
        },
        {
          name: 'Harmonic Speed',
          type: 'line',
          data: speedHarm,
          symbol: 'none',
          smooth: true,
          lineStyle: { color: '#6366f1', width: 2.5 },
          // Shade stop-go delta region
          markArea: {
            silent: true,
            itemStyle: { color: 'rgba(239, 68, 68, 0.05)' },
            data: data.map((item, idx) => {
              const gap = item.speedArith - item.speed;
              if (gap > 20) {
                // Return indices to mark
                return [
                  { xAxis: data[Math.max(0, idx - 1)].time },
                  { xAxis: item.time }
                ];
              }
              return null;
            }).filter(x => x !== null)
          }
        }
      ]
    };

    this.charts.speedComparison.setOption(option, true);
  },

  /**
   * Queue Delay area timeline.
   */
  drawQueueDelay(data) {
    if (!this.charts.queueDelay) return;
    this.charts.queueDelay.hideLoading();

    const times = data.map(item => item.time);
    const delays = data.map(item => item.delay);

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
        name: 'Queue Delay (s)',
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
          name: 'Queue Delay',
          type: 'line',
          data: delays,
          smooth: true,
          symbol: 'none',
          lineStyle: { color: '#ef4444', width: 2 },
          areaStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: 'rgba(239, 68, 68, 0.3)' },
              { offset: 1, color: 'rgba(239, 68, 68, 0.0)' }
            ])
          },
          // Guideline threshold at 150 seconds
          markLine: {
            silent: true,
            lineStyle: { color: '#ef4444', type: 'dashed' },
            data: [
              { yAxis: 150, label: { formatter: 'Queue Danger Zone (150s)', position: 'end', color: '#ef4444' } }
            ]
          }
        }
      ]
    };

    this.charts.queueDelay.setOption(option, true);
  },

  /**
   * Draws 6 circular gauges for lanes 1-6.
   */
  drawLaneGauges(series) {
    if (series.length === 0 || this.charts.laneGauges.length === 0) return;

    // Get average lane occupancy rates across all intervals in this date
    const laneSums = Array(6).fill(0);
    const laneCounts = Array(6).fill(0);

    series.forEach(item => {
      if (item.laneMetrics) {
        item.laneMetrics.forEach((lm, idx) => {
          if (lm.isActive) {
            laneSums[idx] += lm.occupancy;
            laneCounts[idx]++;
          }
        });
      }
    });

    const avgLanesOcc = laneSums.map((sum, idx) => laneCounts[idx] > 0 ? sum / laneCounts[idx] : 0);

    this.charts.laneGauges.forEach((gauge, idx) => {
      if (!gauge) return;

      const val = parseFloat(avgLanesOcc[idx].toFixed(3));
      
      const option = {
        series: [
          {
            type: 'gauge',
            startAngle: 180,
            endAngle: 0,
            min: 0,
            max: 1.2,
            radius: '95%',
            center: ['50%', '75%'],
            progress: {
              show: true,
              roundCap: true,
              width: 6,
              itemStyle: {
                color: val > 1.0 ? '#7f1d1d' : (val > 0.8 ? '#ef4444' : (val > 0.5 ? '#f59e0b' : '#10b981'))
              }
            },
            pointer: { show: false },
            axisLine: {
              lineStyle: {
                width: 6,
                color: [[1.0, '#1f2937']]
              }
            },
            axisTick: { show: false },
            splitLine: { show: false },
            axisLabel: { show: false },
            anchor: { show: false },
            title: {
              show: true,
              offsetCenter: [0, '-25%'],
              fontSize: 10,
              color: '#94a3b8',
              fontWeight: 500
            },
            detail: {
              show: true,
              offsetCenter: [0, '15%'],
              valueAnimation: true,
              formatter: () => {
                if (val > 1.0) return `${val.toFixed(2)}\n⚠️ OVER`;
                return val.toFixed(2);
              },
              fontSize: 12,
              color: '#f1f5f9',
              fontWeight: 700
            },
            data: [
              { value: val, name: `Lane ${idx + 1}` }
            ]
          }
        ]
      };

      gauge.setOption(option, true);
    });
  },

  /**
   * Draws Speed vs. Volume scatter plot.
   */
  async drawTrafficDiagram() {
    if (!this.charts.trafficDiagram) return;
    this.charts.trafficDiagram.hideLoading();

    const data = await DataAdapter.getSpeedAndDelayCorrelation(this.selectedLinkId, this.selectedDate);

    const option = {
      grid: { top: '10%', left: '4%', right: '4%', bottom: '10%', containLabel: true },
      xAxis: {
        type: 'value',
        name: 'Volume (Vehicles)',
        splitLine: { lineStyle: { color: '#1e2d45' } },
        axisLabel: { color: '#94a3b8' }
      },
      yAxis: {
        type: 'value',
        name: 'Speed (km/h)',
        splitLine: { lineStyle: { color: '#1e2d45' } },
        axisLabel: { color: '#94a3b8' }
      },
      tooltip: {
        trigger: 'item',
        formatter: (params) => {
          const pt = params.value;
          return `
            <strong>Time: ${pt[4]}</strong><br/>
            Volume: ${pt[0]} vehicles<br/>
            Speed: ${pt[1].toFixed(1)} km/h<br/>
            Score: <span style="color:var(--accent); font-weight:700;">${pt[2].toFixed(2)}</span>
          `;
        },
        backgroundColor: '#111827',
        borderColor: '#1e2d45',
        textStyle: { color: '#f1f5f9' }
      },
      series: [
        {
          type: 'scatter',
          symbolSize: 8,
          data: data,
          itemStyle: {
            color: (params) => {
              const score = params.value[2];
              if (score >= 7) return '#7f1d1d'; // critical
              if (score >= 5) return '#ef4444'; // congested
              if (score >= 3) return '#f59e0b'; // moderate
              return '#10b981'; // free-flow
            }
          }
        }
      ]
    };

    this.charts.trafficDiagram.setOption(option, true);
  },

  /**
   * Grouped volume weekday vs weekend bar.
   */
  async drawVolumeByHour() {
    if (!this.charts.volumeByHour) return;
    this.charts.volumeByHour.hideLoading();

    const vData = await DataAdapter.getWeekdayVsWeekendVolume(this.selectedLinkId);
    const hours = Array(24).fill(null).map((_, i) => `${String(i).padStart(2, '0')}:00`);

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
        name: 'Avg Volume',
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
        data: ['Weekday Avg', 'Weekend Avg'],
        textStyle: { color: '#f1f5f9' },
        bottom: 0
      },
      series: [
        {
          name: 'Weekday Avg',
          type: 'bar',
          data: vData.weekday.map(v => Math.round(v)),
          itemStyle: { color: '#6366f1' }
        },
        {
          name: 'Weekend Avg',
          type: 'bar',
          data: vData.weekend.map(v => Math.round(v)),
          itemStyle: { color: '#10b981' }
        }
      ]
    };

    this.charts.volumeByHour.setOption(option, true);
  },

  /**
   * 14-Day Calendar Heatmap of daily congestion.
   */
  async drawCalendarHeatmap() {
    if (!this.charts.calendarHeatmap) return;
    this.charts.calendarHeatmap.hideLoading();

    const calData = await DataAdapter.getCalendarHeatmap();

    const option = {
      visualMap: {
        show: false,
        min: 0,
        max: 4.5,
        inRange: {
          color: ['#10b981', '#f59e0b', '#ef4444']
        }
      },
      calendar: {
        top: 25,
        left: 40,
        right: 10,
        bottom: 10,
        range: ['2024-07-01', '2024-07-14'],
        cellSize: [55, 30],
        splitLine: { show: true, lineStyle: { color: '#1e2d45', width: 2 } },
        itemStyle: {
          color: '#111827',
          borderWidth: 1,
          borderColor: '#1e2d45'
        },
        yearLabel: { show: false },
        dayLabel: { color: '#94a3b8', fontSize: 10 },
        monthLabel: { color: '#94a3b8', fontSize: 10 }
      },
      tooltip: {
        formatter: (params) => {
          return `${params.value[0]}<br/>Daily Congestion: <strong>${params.value[1].toFixed(2)}</strong>/10`;
        },
        backgroundColor: '#111827',
        borderColor: '#1e2d45',
        textStyle: { color: '#f1f5f9' }
      },
      series: {
        type: 'heatmap',
        coordinateSystem: 'calendar',
        data: calData
      }
    };

    this.charts.calendarHeatmap.setOption(option, true);
  },

  /**
   * Renders the placeholder ML prediction card list.
   */
  async renderPredictedPeaks() {
    const listContainer = document.getElementById('ml-peaks-list');
    if (!listContainer) return;
    
    listContainer.innerHTML = '';

    const predictions = await DataAdapter.getPredictedPeaks(this.selectedLinkId);

    predictions.forEach(pred => {
      const card = document.createElement('div');
      card.style.background = 'rgba(30, 45, 69, 0.4)';
      card.style.border = '1px solid var(--bg-border)';
      card.style.borderRadius = '10px';
      card.style.padding = '12px';
      card.style.display = 'flex';
      card.style.flexDirection = 'column';
      card.style.gap = '4px';

      card.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center;">
          <strong style="color:var(--accent); font-size:0.9rem;">🕒 ${pred.timeWindow}</strong>
          <span style="font-size:0.75rem; background:rgba(99, 102, 241, 0.2); color:var(--accent); padding:2px 6px; border-radius:4px; border:1px solid rgba(99, 102, 241, 0.3);">
            Conf: ${Math.round(pred.confidence * 100)}%
          </span>
        </div>
        <div style="font-size:0.8rem; color:var(--text-secondary);">
          Predicted Congestion Peak: <strong style="color:var(--congested);">${pred.predictedCongestionScore.toFixed(1)}/10</strong>
        </div>
        <div style="font-size:0.75rem; color:var(--text-muted);">
          Reason: ${pred.reason}
        </div>
      `;

      listContainer.appendChild(card);
    });
  }
};
