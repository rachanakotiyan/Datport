/**
 * Main Application Orchestrator (Complete Implementation)
 * Coordinates page switching and state variables across the 6 dashboard screens.
 */

const App = {
  activePage: 'overview',
  selectedLinkId: 1,
  selectedDate: '',

  init() {
    this.initClock();
    this.initTabs();
    this.loadData();
  },

  /**
   * Runs the dynamic live clock in the site header.
   */
  initClock() {
    const clockEl = document.getElementById('live-clock');
    const updateTime = () => {
      const now = new Date();
      const timeString = now.toLocaleTimeString('en-US', { hour12: false });
      if (clockEl) clockEl.textContent = timeString;
    };
    updateTime();
    setInterval(updateTime, 1000);
  },

  /**
   * Binds click events on tabs to navigate to page views.
   */
  initTabs() {
    const tabs = document.querySelectorAll('.tab');
    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        if (tab.hasAttribute('disabled')) return;
        const pageId = tab.dataset.page;
        this.navigateTo(pageId);
      });
    });
  },

  /**
   * Handles page routing transition.
   */
  navigateTo(pageId) {
    if (this.activePage === pageId) return;

    // Toggle active navigation highlighting
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    const newTab = document.querySelector(`.tab[data-page="${pageId}"]`);
    if (newTab) newTab.classList.add('active');

    // Toggle visibility of panels
    document.querySelectorAll('.page-view').forEach(view => view.classList.add('hidden'));
    const newView = document.getElementById(`view-${pageId}`);
    if (newView) newView.classList.remove('hidden');

    this.activePage = pageId;

    // Render the newly activated view page
    this.renderActiveView();
  },

  /**
   * Downloads dataset and updates progress bar values.
   */
  loadData() {
    const fillEl = document.getElementById('progress-fill');
    const titleEl = document.getElementById('loader-title');
    const csvPath = 'Pangyo_14days_lanes_w_arith_adj.csv';

    DataAdapter.init(
      csvPath,
      (percent) => {
        if (fillEl) fillEl.style.width = `${percent}%`;
        if (titleEl) {
          if (percent < 50) {
            titleEl.textContent = `📡 Downloading dataset... (${percent * 2}%)`;
          } else if (percent < 70) {
            titleEl.textContent = '🔓 Decoding data streams...';
          } else if (percent < 80) {
            titleEl.textContent = '⚙️ Pre-parsing CSV rows...';
          } else if (percent < 100) {
            titleEl.textContent = '🔥 Indexing lane records & computing congestion...';
          } else {
            titleEl.textContent = '✅ System ready!';
          }
        }
      },
      () => {
        setTimeout(() => {
          const loadingScreen = document.getElementById('loading-screen');
          if (loadingScreen) {
            loadingScreen.classList.add('hidden');
          }
          this.onDataLoaded();
        }, 500);
      }
    );
  },

  /**
   * Initializes states once files have finished loading.
   */
  onDataLoaded() {
    this.selectedLinkId = DataAdapter.allLinks[0];
    this.selectedDate = DataAdapter.allDates[0];

    // Initialize stats badges in header
    document.getElementById('badge-links').textContent = `📡 ${DataAdapter.allLinks.length} Links`;
    document.getElementById('badge-rows').textContent = `📊 ${(DataAdapter.allData.length / 1000).toFixed(0)}K Rows`;
    document.getElementById('badge-days').textContent = `📅 ${DataAdapter.allDates.length} Days`;

    // Draw active page
    this.renderActiveView();
  },

  /**
   * Triggers rendering on the active view controller.
   */
  renderActiveView() {
    if (!DataAdapter.isLoaded) return;

    switch (this.activePage) {
      case 'overview':
        OverviewView.render();
        break;
      case 'congestion':
        // Ensure filters are synchronized to global selection
        CongestionView.setFilters(this.selectedLinkId, this.selectedDate);
        CongestionView.render();
        break;
      case 'predictions':
        // Synchronize predictions view filter states
        const predSelect = document.getElementById('filter-link-pred');
        if (predSelect) predSelect.value = this.selectedLinkId;
        const predDateSelect = document.getElementById('filter-date-pred');
        if (predDateSelect) predDateSelect.value = this.selectedDate;

        PredictionsView.selectedLinkId = this.selectedLinkId;
        PredictionsView.selectedDate = this.selectedDate;
        PredictionsView.render();
        break;
      case 'lanes':
        // Synchronize lanes view filter states
        const laneSelect = document.getElementById('filter-link-lanes');
        if (laneSelect) laneSelect.value = this.selectedLinkId;
        const laneDateSelect = document.getElementById('filter-date-lanes');
        if (laneDateSelect) laneDateSelect.value = this.selectedDate;

        LanesView.selectedLinkId = this.selectedLinkId;
        LanesView.selectedDate = this.selectedDate;
        LanesView.render();
        break;
      case 'safety':
        // Synchronize safety view filter states
        const safetySelect = document.getElementById('filter-link-safety');
        if (safetySelect) safetySelect.value = this.selectedLinkId;
        const safetyDateSelect = document.getElementById('filter-date-safety');
        if (safetyDateSelect) safetyDateSelect.value = this.selectedDate;

        SafetyView.selectedLinkId = this.selectedLinkId;
        SafetyView.selectedDate = this.selectedDate;
        SafetyView.render();
        break;
      case 'recommendations':
        // Synchronize recommendations date filter
        const recDateSelect = document.getElementById('filter-date-recs');
        if (recDateSelect) recDateSelect.value = this.selectedDate;

        RecommendationsView.selectedDate = this.selectedDate;
        RecommendationsView.render();
        break;
    }
  },

  /**
   * Drill-down routing: navs from hotspots rows list to Page 2 congestion time series.
   */
  navigateToLink(linkId, date) {
    this.selectedLinkId = linkId;
    this.selectedDate = date;

    this.navigateTo('congestion');
  }
};

// Auto boot on DOM load
document.addEventListener('DOMContentLoaded', () => {
  App.init();
});
