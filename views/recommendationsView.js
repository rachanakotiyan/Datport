/**
 * RecommendationsView Module (Page 6)
 * Compiles traffic science optimization advisory calendars and maps CSV export triggers.
 */

const RecommendationsView = {
  isInitialized: false,
  selectedDate: '',

  init() {
    if (this.isInitialized) return;

    this.selectedDate = DataAdapter.allDates[0];

    // Populate selectors
    const dateSelect = document.getElementById('filter-date-recs');
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
      this.render();
    });

    document.getElementById('btn-export-csv').addEventListener('click', () => {
      this.exportPredictionsCSV();
    });

    this.isInitialized = true;
  },

  /**
   * Updates economic wastage time lost counts.
   */
  async renderStats() {
    const s = await DataAdapter.getCommuterLossSummary();
    document.getElementById('kpi-loss-hours').innerHTML = `${s.totalDelayHours.toLocaleString()} <span style="font-size:1.1rem; font-weight:400; color:var(--text-secondary);">Hours</span>`;
    document.getElementById('kpi-loss-cost').textContent = `$${s.totalWastedCost.toLocaleString()}`;
    document.getElementById('kpi-loss-saving').innerHTML = `$${s.savedCost.toLocaleString()} <span style="font-size:0.9rem; font-weight:400; color:var(--text-secondary);">/ Year</span>`;
  },

  /**
   * Renders signal timing mitigation recommendations.
   */
  async renderSignalTiming() {
    const tableBody = document.querySelector('#signal-timing-table tbody');
    if (!tableBody) return;

    tableBody.innerHTML = '';

    const recs = await DataAdapter.getSignalTimingRecommendations(this.selectedDate);

    recs.forEach(rec => {
      const row = document.createElement('tr');
      row.dataset.linkId = rec.linkId;

      let badgeClass = 'score-badge moderate';
      if (rec.priority.includes('Urgent')) badgeClass = 'score-badge critical';
      else if (rec.priority.includes('High')) badgeClass = 'score-badge congested';
      else if (rec.priority.includes('Minor')) badgeClass = 'score-badge free-flow';

      row.innerHTML = `
        <td><span style="color:var(--accent); font-weight:600;">Link ${rec.linkId}</span></td>
        <td>${rec.timeWindow}</td>
        <td>${rec.currentDelay.toFixed(0)}s</td>
        <td>${rec.recommendedAction}</td>
        <td><span class="${badgeClass}">${rec.priority}</span></td>
      `;

      row.addEventListener('click', () => {
        App.navigateToLink(rec.linkId, this.selectedDate);
      });

      tableBody.appendChild(row);
    });
  },

  /**
   * Renders lane control dynamic allocation list.
   */
  async renderLaneControl() {
    const list = document.getElementById('lane-control-list');
    if (!list) return;

    list.innerHTML = '';

    const recs = await DataAdapter.getLaneManagementRecommendations(this.selectedDate);

    recs.forEach(rec => {
      const card = document.createElement('div');
      card.style.background = 'rgba(30, 45, 69, 0.4)';
      card.style.border = '1px solid var(--bg-border)';
      card.style.borderRadius = '10px';
      card.style.padding = '12px';
      card.style.cursor = 'pointer';

      let pBadge = `<span style="font-size:0.75rem; background:rgba(245, 158, 11, 0.2); color:var(--moderate); border:1px solid rgba(245, 158, 11, 0.3); padding:2px 6px; border-radius:4px; font-weight:700;">MEDIUM</span>`;
      if (rec.priority.includes('Urgent')) {
        pBadge = `<span style="font-size:0.75rem; background:rgba(239, 68, 68, 0.2); color:#ef4444; border:1px solid rgba(239, 68, 68, 0.3); padding:2px 6px; border-radius:4px; font-weight:700;">URGENT</span>`;
      }

      card.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
          <strong style="color:var(--accent); font-size:0.9rem;">📡 Link ${rec.linkId}</strong>
          ${pBadge}
        </div>
        <div style="font-size:0.8rem; color:var(--text-secondary); margin-bottom:4px;">
          Lanes volume distribution coefficient of variation is <strong>${(rec.lbi).toFixed(2)}</strong>.
        </div>
        <div style="font-size:0.75rem; color:#a78bfa; font-weight:500;">
          Action: ${rec.action}
        </div>
      `;

      card.addEventListener('click', () => {
        App.navigateToLink(rec.linkId, this.selectedDate);
      });

      list.appendChild(card);
    });

    if (recs.length === 0) {
      list.innerHTML = `<div style="text-align:center; color:var(--text-muted); padding:24px;">No lane interventions required.</div>`;
    }
  },

  /**
   * Populates 7-day intersections optimization planner calendar.
   */
  async renderCalendarPlanner() {
    const calendarEl = document.getElementById('interventions-calendar');
    if (!calendarEl) return;

    calendarEl.innerHTML = '';

    const calData = await DataAdapter.getWeeklyInterventionsCalendar();
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

    days.forEach((day, idx) => {
      const card = document.createElement('div');
      const item = calData[idx + 1];
      
      card.style.background = 'rgba(17, 24, 39, 0.6)';
      card.style.border = '1px solid var(--bg-border)';
      card.style.borderRadius = '10px';
      card.style.padding = '12px';
      card.style.display = 'flex';
      card.style.flexDirection = 'column';
      card.style.justifyContent = 'space-between';

      let dotColor = '#10b981'; // minor
      if (item.type === 'urgent') dotColor = '#ef4444';
      else if (item.type === 'medium') dotColor = '#f59e0b';

      card.innerHTML = `
        <div>
          <div style="font-size:0.75rem; font-weight:700; color:var(--text-secondary); text-transform:uppercase; margin-bottom:4px;">${day}</div>
          <div style="font-size:0.75rem; color:var(--text-primary); line-height:1.2;">${item.title}</div>
        </div>
        <div style="display:flex; align-items:center; gap:6px; margin-top:8px;">
          <span style="display:inline-block; width:6px; height:6px; background:${dotColor}; border-radius:50%;"></span>
          <span style="font-size:0.65rem; text-transform:uppercase; color:var(--text-muted); font-weight:600;">${item.type}</span>
        </div>
      `;

      calendarEl.appendChild(card);
    });
  },

  /**
   * Compiles the adapter's analytical timeseries arrays to CSV and fires browser download triggers.
   */
  exportPredictionsCSV() {
    const filename = 'Pangyo_Traffic_Analytics_Export.csv';
    const csvContent = DataAdapter.allData.map(r => ({
      LINK_ID: r.linkId,
      date: r.date,
      DAY: r.dayOfWeek,
      volume: r.volume,
      avg_speed: Math.round(r.speed),
      avg_delay: Math.round(r.delay),
      avg_occupancy: r.occupancy.toFixed(4),
      congestion_score: r.congestionScore.toFixed(4),
      lane_balance_index: r.laneBalanceIndex.toFixed(4),
      accident_risk_score: r.accidentRiskScore.toFixed(4)
    }));

    const csvText = Papa.unparse(csvContent);
    const blob = new Blob([csvText], { type: 'text/csv;charset=utf-8;' });
    
    if (navigator.msSaveBlob) { // IE 10+
      navigator.msSaveBlob(blob, filename);
    } else {
      const link = document.createElement('a');
      if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', filename);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    }
  },

  async render() {
    this.init();
    this.renderStats();
    this.renderSignalTiming();
    this.renderLaneControl();
    this.renderCalendarPlanner();
  }
};
