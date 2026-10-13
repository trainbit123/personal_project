// Main Application Controller & Event Bootstrapper

// Toast notifications
window.showToast = function(msg) {
  const container = document.getElementById('toastContainer');
  if (!container) return;
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.innerHTML = `<span>ℹ️</span> <span>${msg}</span>`;
  container.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(10px)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
};

// Global Tab Switcher
window.switchTab = function(tabId) {
  // Update nav buttons
  document.querySelectorAll('.nav-tab-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.tab === tabId);
  });

  // Update tab panes
  document.querySelectorAll('.tab-pane').forEach(pane => {
    pane.classList.toggle('active', pane.id === `${tabId}Pane`);
  });

  // Save current active tab in session
  sessionStorage.setItem('active_tab', tabId);

  // If opening problems, make sure table is updated
  if (tabId === 'problems' && window.appTracker) {
    window.appTracker.renderProblemsTable();
  }
};

document.addEventListener('DOMContentLoaded', async () => {
  // 1. Theme initialization
  const savedTheme = window.appStorage.state.theme || 'dark';
  document.documentElement.setAttribute('data-theme', savedTheme);
  const themeToggleBtn = document.getElementById('themeToggleBtn');
  if (themeToggleBtn) {
    themeToggleBtn.textContent = savedTheme === 'dark' ? '☀️' : '🌙';
    themeToggleBtn.addEventListener('click', () => {
      const current = document.documentElement.getAttribute('data-theme');
      const next = current === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', next);
      window.appStorage.state.theme = next;
      window.appStorage.saveState();
      themeToggleBtn.textContent = next === 'dark' ? '☀️' : '🌙';
    });
  }

  // 2. Tab Navigation
  document.querySelectorAll('.nav-tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      window.switchTab(btn.dataset.tab);
    });
  });

  // Restore active tab
  const lastTab = sessionStorage.getItem('active_tab') || 'dashboard';
  window.switchTab(lastTab);

  // 3. Initialize Tracker App
  await window.appTracker.init();

  // 4. Focus Timer Bindings
  const timerDisplay = document.getElementById('timerBigDisplay');
  const timerStartBtn = document.getElementById('timerStartBtn');
  const timerResetBtn = document.getElementById('timerResetBtn');
  const headerTimerDisplay = document.getElementById('headerTimerDisplay');

  window.appTimer.onTick = (data) => {
    if (timerDisplay) timerDisplay.textContent = data.formatted;
    if (headerTimerDisplay) headerTimerDisplay.textContent = data.formatted;
    if (timerStartBtn) {
      timerStartBtn.textContent = data.isRunning ? '⏸ Pause' : '▶ Start';
      timerStartBtn.className = data.isRunning ? 'btn btn-primary timer-btn-lg' : 'btn timer-btn-lg';
    }
  };

  // Timer modes
  document.querySelectorAll('.timer-mode-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.timer-mode-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const min = parseInt(btn.dataset.time, 10);
      window.appTimer.setMode(min);
    });
  });

  if (timerStartBtn) {
    timerStartBtn.addEventListener('click', () => {
      if (window.appTimer.isRunning) {
        window.appTimer.pause();
      } else {
        window.appTimer.start();
      }
    });
  }

  if (timerResetBtn) {
    timerResetBtn.addEventListener('click', () => {
      window.appTimer.reset();
    });
  }

  // Floating header badge jumps to timer tab
  const headerTimerBadge = document.getElementById('headerTimerBadge');
  if (headerTimerBadge) {
    headerTimerBadge.addEventListener('click', () => {
      window.switchTab('timer');
    });
  }

  // 5. Data Backup & Restore
  const exportBtn = document.getElementById('exportDataBtn');
  if (exportBtn) {
    exportBtn.addEventListener('click', () => {
      window.appStorage.exportToJSON();
      window.showToast('Data exported successfully!');
    });
  }

  const importBtn = document.getElementById('importDataBtn');
  const importFileInput = document.getElementById('importFileInput');
  if (importBtn && importFileInput) {
    importBtn.addEventListener('click', () => {
      importFileInput.click();
    });

    importFileInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (event) => {
        const success = window.appStorage.importFromJSON(event.target.result);
        if (success) {
          window.showToast('Data imported successfully!');
          window.appTracker.renderAll();
        } else {
          window.showToast('Failed to import JSON file. Please check file format.');
        }
      };
      reader.readAsText(file);
    });
  }

  const resetBtn = document.getElementById('resetDataBtn');
  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      if (confirm('Are you sure you want to reset all your progress and notes? This action cannot be undone.')) {
        window.appStorage.resetAll();
        window.appTracker.renderAll();
        window.showToast('All progress reset to default.');
      }
    });
  }
});
