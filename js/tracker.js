// Tracker & UI Rendering Controller for 3-Month Prep
class TrackerApp {
  constructor() {
    this.problems = [];
    this.companyData = null;
    this.weeklyPlan = [];
    this.coreSubjects = null;
    this.aiProjects = [];

    // Filters
    this.searchQuery = '';
    this.selectedWeek = 'all';
    this.selectedTopic = 'all';
    this.selectedLevel = 'all';
    this.selectedCompany = 'all';
    this.selectedStatus = 'all'; // all, solved, unsolved, starred

    this.currentActiveCompany = 'Amazon';
    this.currentActiveSubject = 'Operating Systems';

    this.currentModalProblemId = null;
  }

  async init() {
    await this.loadAllData();
    this.setupEventListeners();
    this.renderAll();
  }

  async loadAllData() {
    try {
      const [probRes, compRes, weekRes, coreRes, projRes] = await Promise.all([
        fetch('data/dsa_problems.json'),
        fetch('data/company_revision.json'),
        fetch('data/weekly_plan.json'),
        fetch('data/core_subjects.json'),
        fetch('data/ai_projects.json')
      ]);

      this.problems = await probRes.json();
      this.companyData = await compRes.json();
      this.weeklyPlan = await weekRes.json();
      this.coreSubjects = await coreRes.json();
      this.aiProjects = await projRes.json();
    } catch (e) {
      console.error('Error loading JSON data files', e);
      window.showToast?.('Error loading database. Ensure files are present.');
    }
  }

  setupEventListeners() {
    // Search input
    const searchInput = document.getElementById('problemSearch');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        this.searchQuery = e.target.value.toLowerCase().trim();
        this.renderProblemsTable();
      });
    }

    // Filters
    const weekSelect = document.getElementById('weekFilter');
    if (weekSelect) {
      weekSelect.addEventListener('change', (e) => {
        this.selectedWeek = e.target.value;
        this.renderProblemsTable();
      });
    }

    const topicSelect = document.getElementById('topicFilter');
    if (topicSelect) {
      topicSelect.addEventListener('change', (e) => {
        this.selectedTopic = e.target.value;
        this.renderProblemsTable();
      });
    }

    // Filter pills
    document.querySelectorAll('.filter-pill[data-level]').forEach(pill => {
      pill.addEventListener('click', () => {
        document.querySelectorAll('.filter-pill[data-level]').forEach(p => p.classList.remove('active'));
        pill.classList.add('active');
        this.selectedLevel = pill.dataset.level;
        this.renderProblemsTable();
      });
    });

    document.querySelectorAll('.filter-pill[data-company]').forEach(pill => {
      pill.addEventListener('click', () => {
        document.querySelectorAll('.filter-pill[data-company]').forEach(p => p.classList.remove('active'));
        pill.classList.add('active');
        this.selectedCompany = pill.dataset.company;
        this.renderProblemsTable();
      });
    });

    document.querySelectorAll('.filter-pill[data-status]').forEach(pill => {
      pill.addEventListener('click', () => {
        document.querySelectorAll('.filter-pill[data-status]').forEach(p => p.classList.remove('active'));
        pill.classList.add('active');
        this.selectedStatus = pill.dataset.status;
        this.renderProblemsTable();
      });
    });

    // Populate topic dropdown
    if (topicSelect && this.problems.length > 0) {
      const topics = [...new Set(this.problems.map(p => p.topic))];
      topicSelect.innerHTML = '<option value="all">All Topics (38)</option>' +
        topics.map(t => `<option value="${t}">${t}</option>`).join('');
    }

    // Problem Notes Modal Form
    const noteForm = document.getElementById('problemNoteForm');
    if (noteForm) {
      noteForm.addEventListener('submit', (e) => {
        e.preventDefault();
        this.saveCurrentProblemNote();
      });
    }

    // Modal Close
    const closeBtn = document.getElementById('closeNoteModal');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        const dialog = document.getElementById('noteDialog');
        if (dialog) dialog.close();
      });
    }

    // Project Details Modal Close
    const closeProjectBtn = document.getElementById('closeProjectModal');
    if (closeProjectBtn) {
      closeProjectBtn.addEventListener('click', () => {
        const dialog = document.getElementById('projectDialog');
        if (dialog) dialog.close();
      });
    }
  }

  renderAll() {
    this.renderDashboardStats();
    this.renderProblemsTable();
    this.renderWeeklyPlan();
    this.renderCompanySets();
    this.renderCoreSubjects();
    this.renderAIProjects();
  }

  // 1. Dashboard Stats
  renderDashboardStats() {
    const total = this.problems.length;
    const solved = window.appStorage.state.solvedProblems.length;
    const pct = total > 0 ? Math.round((solved / total) * 100) : 0;

    const easyTotal = this.problems.filter(p => p.level === 'Easy').length;
    const easySolved = this.problems.filter(p => p.level === 'Easy' && window.appStorage.isProblemSolved(p.id)).length;
    const easyPct = easyTotal > 0 ? Math.round((easySolved / easyTotal) * 100) : 0;

    const medTotal = this.problems.filter(p => p.level === 'Medium').length;
    const medSolved = this.problems.filter(p => p.level === 'Medium' && window.appStorage.isProblemSolved(p.id)).length;
    const medPct = medTotal > 0 ? Math.round((medSolved / medTotal) * 100) : 0;

    const hardTotal = this.problems.filter(p => p.level === 'Hard').length;
    const hardSolved = this.problems.filter(p => p.level === 'Hard' && window.appStorage.isProblemSolved(p.id)).length;
    const hardPct = hardTotal > 0 ? Math.round((hardSolved / hardTotal) * 100) : 0;

    // Update UI elements
    const totalSolvedEl = document.getElementById('dashTotalSolved');
    if (totalSolvedEl) totalSolvedEl.textContent = `${solved} / ${total}`;

    const totalPctEl = document.getElementById('dashTotalPct');
    if (totalPctEl) totalPctEl.textContent = `${pct}% Complete`;

    const totalBar = document.getElementById('dashTotalBar');
    if (totalBar) totalBar.style.width = `${pct}%`;

    const easyEl = document.getElementById('dashEasy');
    if (easyEl) easyEl.textContent = `${easySolved} / ${easyTotal}`;
    const easyBar = document.getElementById('dashEasyBar');
    if (easyBar) easyBar.style.width = `${easyPct}%`;

    const medEl = document.getElementById('dashMedium');
    if (medEl) medEl.textContent = `${medSolved} / ${medTotal}`;
    const medBar = document.getElementById('dashMediumBar');
    if (medBar) medBar.style.width = `${medPct}%`;

    const hardEl = document.getElementById('dashHard');
    if (hardEl) hardEl.textContent = `${hardSolved} / ${hardTotal}`;
    const hardBar = document.getElementById('dashHardBar');
    if (hardBar) hardBar.style.width = `${hardPct}%`;

    // Streak
    const streakEl = document.getElementById('dashStreak');
    if (streakEl) streakEl.textContent = window.appStorage.state.streak.count;

    // Active project highlight on dashboard
    const activeProjId = window.appStorage.getActiveProjectId();
    const activeProject = this.aiProjects.find(p => p.id === activeProjId);
    const activeProjTitleEl = document.getElementById('dashActiveProjectTitle');
    const activeProjMilestoneEl = document.getElementById('dashActiveProjectMilestone');
    if (activeProject && activeProjTitleEl) {
      activeProjTitleEl.textContent = activeProject.title;
      const totalM = activeProject.milestones.length;
      const doneM = (window.appStorage.state.projectMilestones[activeProjId] || []).length;
      const mPct = totalM > 0 ? Math.round((doneM / totalM) * 100) : 0;
      activeProjMilestoneEl.textContent = `${doneM} / ${totalM} Milestones (${mPct}%)`;
    }
  }

  // 2. Problems Table & Filters
  getFilteredProblems() {
    return this.problems.filter(p => {
      // Week filter
      if (this.selectedWeek !== 'all' && p.week.toString() !== this.selectedWeek) {
        return false;
      }
      // Topic filter
      if (this.selectedTopic !== 'all' && p.topic !== this.selectedTopic) {
        return false;
      }
      // Difficulty filter
      if (this.selectedLevel !== 'all' && p.level !== this.selectedLevel) {
        return false;
      }
      // Company filter
      if (this.selectedCompany !== 'all' && !p.companies.includes(this.selectedCompany)) {
        return false;
      }
      // Status filter
      const isSolved = window.appStorage.isProblemSolved(p.id);
      const isStarred = window.appStorage.isProblemStarred(p.id);
      if (this.selectedStatus === 'solved' && !isSolved) return false;
      if (this.selectedStatus === 'unsolved' && isSolved) return false;
      if (this.selectedStatus === 'starred' && !isStarred) return false;

      // Search query
      if (this.searchQuery) {
        const titleMatch = p.title.toLowerCase().includes(this.searchQuery);
        const ibMatch = p.ibTitle && p.ibTitle.toLowerCase().includes(this.searchQuery);
        const topicMatch = p.topic.toLowerCase().includes(this.searchQuery);
        const compMatch = p.companies.some(c => c.toLowerCase().includes(this.searchQuery));
        const idMatch = p.id.toString() === this.searchQuery;
        if (!titleMatch && !ibMatch && !topicMatch && !compMatch && !idMatch) {
          return false;
        }
      }

      return true;
    });
  }

  renderProblemsTable() {
    const container = document.getElementById('problemsContainer');
    if (!container) return;

    const filtered = this.getFilteredProblems();
    const resultCountEl = document.getElementById('problemsResultCount');
    if (resultCountEl) {
      resultCountEl.textContent = `Showing ${filtered.length} of ${this.problems.length} problems`;
    }

    if (filtered.length === 0) {
      container.innerHTML = `
        <div style="text-align:center; padding: 3rem 1rem; color: var(--text-muted);">
          <p style="font-size:1.1rem; margin-bottom:0.5rem;">🔍 No problems found matching current filters.</p>
          <button class="btn btn-sm" onclick="appTracker.resetFilters()">Clear Filters</button>
        </div>
      `;
      return;
    }

    // Group by topic if no specific search query, or display tabular
    const topicsMap = new Map();
    filtered.forEach(p => {
      if (!topicsMap.has(p.topic)) {
        topicsMap.set(p.topic, { tip: p.patternTip, problems: [] });
      }
      topicsMap.get(p.topic).problems.push(p);
    });

    let html = '';
    topicsMap.forEach((data, topicName) => {
      const topicSolved = data.problems.filter(p => window.appStorage.isProblemSolved(p.id)).length;
      html += `
        <div class="topic-group-header">
          <div class="topic-group-title">
            <span>${topicName}</span>
            <span class="topic-count">${topicSolved} / ${data.problems.length} solved</span>
          </div>
          <div class="topic-tip">
            💡 <strong>Pattern Tip:</strong> ${data.tip}
          </div>
        </div>
        <div class="problems-table-wrap">
          <table class="problems-table">
            <thead>
              <tr>
                <th style="width: 44px; text-align: center;">Done</th>
                <th style="width: 48px;">#</th>
                <th>Problem Title</th>
                <th style="width: 85px;">Level</th>
                <th style="width: 130px;">Asked At</th>
                <th style="width: 70px; text-align: center;">Week</th>
                <th style="width: 170px;">Solve Platform</th>
                <th style="width: 80px; text-align: right;">Actions</th>
              </tr>
            </thead>
            <tbody>
              ${data.problems.map(p => this.renderProblemRow(p)).join('')}
            </tbody>
          </table>
        </div>
      `;
    });

    container.innerHTML = html;
    this.attachProblemRowEvents();
  }

  renderProblemRow(p) {
    const isSolved = window.appStorage.isProblemSolved(p.id);
    const isStarred = window.appStorage.isProblemStarred(p.id);
    const note = window.appStorage.getProblemNote(p.id);
    const hasNote = note.notes || note.approach;

    const companyBadges = p.companies.length > 0 
      ? p.companies.map(c => `<span class="company-tag ${c}">${c}</span>`).join('') 
      : '<span style="color:var(--text-muted); font-size:0.75rem;">—</span>';

    const links = p.links.map(l => {
      const cls = l.name.toLowerCase();
      return `<a href="${l.url}" target="_blank" rel="noopener noreferrer" class="solve-link ${cls}" title="Open on ${l.name}">
        ${l.name} ↗
      </a>`;
    }).join('');

    return `
      <tr class="${isSolved ? 'solved' : ''}" data-id="${p.id}">
        <td style="text-align: center;">
          <input type="checkbox" class="prob-check" data-id="${p.id}" ${isSolved ? 'checked' : ''} title="Mark as Solved">
        </td>
        <td class="prob-id">${p.id}</td>
        <td>
          <div class="prob-title-cell">
            <span class="prob-title">${p.title}</span>
            ${p.ibTitle ? `<span class="prob-sub">IB: ${p.ibTitle}</span>` : ''}
          </div>
        </td>
        <td><span class="level-badge ${p.level}">${p.level}</span></td>
        <td><div class="company-badges">${companyBadges}</div></td>
        <td style="text-align: center; font-weight: 600; color: var(--accent-cyan);">W${p.week}</td>
        <td><div class="platform-links">${links}</div></td>
        <td style="text-align: right;">
          <div class="action-buttons" style="justify-content: flex-end;">
            <button class="btn btn-sm ${hasNote ? 'btn-primary' : ''}" data-note-id="${p.id}" title="Problem Notes & Complexity">
              ${hasNote ? '📝 Note' : '✏️ Notes'}
            </button>
            <button class="star-btn ${isStarred ? 'starred' : ''}" data-star-id="${p.id}" title="${isStarred ? 'Flagged for Revision' : 'Flag for Revision'}">
              ${isStarred ? '★' : '☆'}
            </button>
          </div>
        </td>
      </tr>
    `;
  }

  attachProblemRowEvents() {
    // Checkboxes
    document.querySelectorAll('.prob-check').forEach(cb => {
      cb.addEventListener('change', (e) => {
        const id = parseInt(e.target.dataset.id, 10);
        window.appStorage.toggleProblemSolved(id);
        const row = document.querySelector(`tr[data-id="${id}"]`);
        if (row) {
          row.classList.toggle('solved', e.target.checked);
        }
        this.renderDashboardStats();
        // Also update topic counter if visible
        this.updateTopicCounter(id);
      });
    });

    // Star buttons
    document.querySelectorAll('.star-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = parseInt(btn.dataset.starId, 10);
        const isStarred = window.appStorage.toggleProblemStarred(id);
        btn.classList.toggle('starred', isStarred);
        btn.textContent = isStarred ? '★' : '☆';
        window.showToast?.(isStarred ? 'Flagged for weekly revision!' : 'Unflagged from revision.');
      });
    });

    // Note buttons
    document.querySelectorAll('button[data-note-id]').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = parseInt(btn.dataset.noteId, 10);
        this.openProblemNoteModal(id);
      });
    });
  }

  updateTopicCounter(probId) {
    // Quick re-render to update counts accurately
    this.renderDashboardStats();
  }

  resetFilters() {
    this.searchQuery = '';
    this.selectedWeek = 'all';
    this.selectedTopic = 'all';
    this.selectedLevel = 'all';
    this.selectedCompany = 'all';
    this.selectedStatus = 'all';

    const searchInput = document.getElementById('problemSearch');
    if (searchInput) searchInput.value = '';

    const weekSelect = document.getElementById('weekFilter');
    if (weekSelect) weekSelect.value = 'all';

    const topicSelect = document.getElementById('topicFilter');
    if (topicSelect) topicSelect.value = 'all';

    document.querySelectorAll('.filter-pill').forEach(p => {
      if (p.dataset.level === 'all' || p.dataset.company === 'all' || p.dataset.status === 'all') {
        p.classList.add('active');
      } else {
        p.classList.remove('active');
      }
    });

    this.renderProblemsTable();
  }

  // 3. Notes Modal
  openProblemNoteModal(id) {
    this.currentModalProblemId = id;
    const problem = this.problems.find(p => p.id === id);
    if (!problem) return;

    const dialog = document.getElementById('noteDialog');
    const titleEl = document.getElementById('noteModalProblemTitle');
    const subtitleEl = document.getElementById('noteModalProblemSub');
    const patternEl = document.getElementById('noteModalPattern');

    if (titleEl) titleEl.textContent = `#${problem.id}. ${problem.title}`;
    if (subtitleEl) subtitleEl.textContent = `${problem.topic} • ${problem.level} • Week ${problem.week}`;
    if (patternEl) patternEl.textContent = `Pattern Tip: ${problem.patternTip}`;

    const note = window.appStorage.getProblemNote(id);
    document.getElementById('noteApproach').value = note.approach || '';
    document.getElementById('noteTimeComp').value = note.timeComplexity || '';
    document.getElementById('noteSpaceComp').value = note.spaceComplexity || '';
    document.getElementById('noteText').value = note.notes || '';
    document.getElementById('noteStruggled').checked = !!note.struggled;

    if (dialog) dialog.showModal();
  }

  saveCurrentProblemNote() {
    if (!this.currentModalProblemId) return;
    const id = this.currentModalProblemId;
    const noteData = {
      approach: document.getElementById('noteApproach').value.trim(),
      timeComplexity: document.getElementById('noteTimeComp').value.trim(),
      spaceComplexity: document.getElementById('noteSpaceComp').value.trim(),
      notes: document.getElementById('noteText').value.trim(),
      struggled: document.getElementById('noteStruggled').checked
    };

    window.appStorage.saveProblemNote(id, noteData);
    if (noteData.struggled && !window.appStorage.isProblemStarred(id)) {
      window.appStorage.toggleProblemStarred(id);
    }

    const dialog = document.getElementById('noteDialog');
    if (dialog) dialog.close();
    window.showToast?.('Notes saved successfully!');
    this.renderProblemsTable();
  }

  // 4. Weekly Plan View
  renderWeeklyPlan() {
    const container = document.getElementById('weeklyPlanGrid');
    if (!container || this.weeklyPlan.length === 0) return;

    container.innerHTML = this.weeklyPlan.map(w => {
      // Calculate how many problems completed in this week
      const weekProbs = this.problems.filter(p => p.week === w.week);
      const solvedInWeek = weekProbs.filter(p => window.appStorage.isProblemSolved(p.id)).length;
      const weekPct = weekProbs.length > 0 ? Math.round((solvedInWeek / weekProbs.length) * 100) : 0;

      return `
        <div class="week-card">
          <div class="week-badge-bar">
            <span class="week-number">Week ${w.week}</span>
            <span class="week-target-pill">${w.problems}</span>
          </div>
          <div class="week-topics-title">${w.topics}</div>
          <div class="week-goal">🎯 <strong>Target:</strong> ${w.dailyTarget}</div>
          <div style="font-size:0.83rem; color:var(--text-secondary);">${w.goal}</div>
          <div class="week-tip-box">
            💡 <strong>Key Focus:</strong> ${w.tips}
          </div>
          ${weekProbs.length > 0 ? `
            <div style="margin-top:auto; padding-top:0.5rem;">
              <div style="display:flex; justify-content:space-between; font-size:0.75rem; color:var(--text-muted); margin-bottom:0.25rem;">
                <span>Progress</span>
                <span>${solvedInWeek} / ${weekProbs.length} (${weekPct}%)</span>
              </div>
              <div class="progress-container">
                <div class="progress-fill" style="width: ${weekPct}%"></div>
              </div>
              <button class="btn btn-sm" style="margin-top:0.75rem; width:100%; justify-content:center;" onclick="appTracker.filterByWeek(${w.week})">
                Solve Week ${w.week} Problems →
              </button>
            </div>
          ` : `
            <div style="margin-top:auto; padding-top:0.5rem;">
              <button class="btn btn-sm btn-primary" style="width:100%; justify-content:center;" onclick="switchTab('company')">
                View Company Revision Sets →
              </button>
            </div>
          `}
        </div>
      `;
    }).join('');
  }

  filterByWeek(weekNum) {
    this.selectedWeek = weekNum.toString();
    const weekSelect = document.getElementById('weekFilter');
    if (weekSelect) weekSelect.value = this.selectedWeek;
    window.switchTab('problems');
    this.renderProblemsTable();
  }

  // 5. Company Revision Hub
  renderCompanySets() {
    if (!this.companyData) return;

    // Company Tab Buttons
    const tabContainer = document.getElementById('companyTabs');
    const companies = ['Amazon', 'Google', 'Microsoft', 'Flipkart'];
    if (tabContainer) {
      tabContainer.innerHTML = companies.map(c => `
        <button class="company-tab-btn ${c === this.currentActiveCompany ? 'active' : ''}" onclick="appTracker.switchCompanyTab('${c}')">
          ${c} (${this.companyData[c].length})
        </button>
      `).join('');
    }

    // Problems for active company
    const listContainer = document.getElementById('companyProblemsList');
    if (listContainer) {
      const compList = this.companyData[this.currentActiveCompany] || [];
      const solvedCount = compList.filter(item => window.appStorage.isCompanyProblemSolved(this.currentActiveCompany, item.sheetId)).length;
      const compPct = compList.length > 0 ? Math.round((solvedCount / compList.length) * 100) : 0;

      listContainer.innerHTML = `
        <div style="margin-bottom:1rem; display:flex; justify-content:space-between; align-items:center;">
          <div>
            <h3 style="font-size:1.1rem; font-weight:700;">${this.currentActiveCompany} Revision Set (${compList.length} Most Frequent Problems)</h3>
            <p style="font-size:0.82rem; color:var(--text-secondary);">Timed Practice: Re-solve from memory without looking at hints (under 25 min each).</p>
          </div>
          <span class="topic-count">${solvedCount} / ${compList.length} Solved (${compPct}%)</span>
        </div>
        <div class="problems-table-wrap">
          <table class="problems-table">
            <thead>
              <tr>
                <th style="width: 44px; text-align:center;">Done</th>
                <th style="width: 48px;">Sheet #</th>
                <th>Problem Title</th>
                <th style="width: 85px;">Level</th>
                <th>Direct Solve</th>
              </tr>
            </thead>
            <tbody>
              ${compList.map(item => {
                const isSolved = window.appStorage.isCompanyProblemSolved(this.currentActiveCompany, item.sheetId);
                const fullProb = this.problems.find(p => p.id === item.sheetId);
                const linksHtml = fullProb 
                  ? fullProb.links.map(l => `<a href="${l.url}" target="_blank" rel="noopener noreferrer" class="solve-link ${l.name.toLowerCase()}">${l.name} ↗</a>`).join(' ') 
                  : '';

                return `
                  <tr class="${isSolved ? 'solved' : ''}">
                    <td style="text-align:center;">
                      <input type="checkbox" class="prob-check" ${isSolved ? 'checked' : ''} onchange="appTracker.toggleCompanyProblem('${this.currentActiveCompany}', ${item.sheetId}, this.checked)">
                    </td>
                    <td class="prob-id">#${item.sheetId}</td>
                    <td><strong>${item.title}</strong></td>
                    <td><span class="level-badge ${item.level}">${item.level}</span></td>
                    <td><div class="platform-links">${linksHtml}</div></td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
      `;
    }

    // Interview Checklist
    const checklistContainer = document.getElementById('finalChecklistList');
    if (checklistContainer && this.companyData.checklist) {
      checklistContainer.innerHTML = this.companyData.checklist.map((item, idx) => {
        const isDone = window.appStorage.isChecklistItemDone(idx);
        return `
          <li class="checklist-item">
            <input type="checkbox" ${isDone ? 'checked' : ''} onchange="appTracker.toggleChecklistItem(${idx}, this.checked)">
            <span style="${isDone ? 'text-decoration: line-through; color: var(--text-muted);' : ''}">${item}</span>
          </li>
        `;
      }).join('');
    }
  }

  switchCompanyTab(comp) {
    this.currentActiveCompany = comp;
    this.renderCompanySets();
  }

  toggleCompanyProblem(comp, sheetId, checked) {
    window.appStorage.toggleCompanyProblem(comp, sheetId);
    if (checked && !window.appStorage.isProblemSolved(sheetId)) {
      window.appStorage.toggleProblemSolved(sheetId);
    }
    this.renderCompanySets();
    this.renderDashboardStats();
  }

  toggleChecklistItem(index, checked) {
    window.appStorage.toggleChecklistItem(index);
    this.renderCompanySets();
  }

  // 6. Core CSE Subjects
  renderCoreSubjects() {
    if (!this.coreSubjects) return;

    // Subjects sidebar navigation
    const navContainer = document.getElementById('coreSubjectNav');
    const subjects = Object.keys(this.coreSubjects);

    if (navContainer) {
      navContainer.innerHTML = subjects.map(subKey => {
        const subData = this.coreSubjects[subKey];
        // Calculate progress
        let totalTopics = 0;
        subData.modules.forEach(m => totalTopics += m.topics.length);
        const doneList = window.appStorage.state.coreSubjectChecks[subKey] || [];
        const pct = totalTopics > 0 ? Math.round((doneList.length / totalTopics) * 100) : 0;

        return `
          <button class="core-nav-btn ${subKey === this.currentActiveSubject ? 'active' : ''}" onclick="appTracker.switchCoreSubject('${subKey}')">
            <span>${subKey}</span>
            <span style="font-size:0.75rem; opacity:0.85;">${pct}%</span>
          </button>
        `;
      }).join('');
    }

    // Active Subject Details
    const detailContainer = document.getElementById('coreSubjectDetail');
    const currentSub = this.coreSubjects[this.currentActiveSubject];
    if (detailContainer && currentSub) {
      detailContainer.innerHTML = `
        <div style="margin-bottom: 0.5rem;">
          <h2 style="font-size:1.35rem; font-weight:800; color:var(--text-primary);">${this.currentActiveSubject}</h2>
          <p style="font-size:0.88rem; color:var(--text-secondary); margin-top:0.25rem;">${currentSub.description}</p>
        </div>

        <h3 style="font-size:1.05rem; font-weight:700; margin-top:1rem;">📚 Core Syllabus & Concept Checkpoints</h3>
        ${currentSub.modules.map(mod => `
          <div class="module-card">
            <div class="module-title">${mod.name}</div>
            <ul class="topic-check-list">
              ${mod.topics.map(t => {
                const isChecked = window.appStorage.isCoreTopicDone(this.currentActiveSubject, t);
                return `
                  <li class="topic-check-item">
                    <input type="checkbox" ${isChecked ? 'checked' : ''} onchange="appTracker.toggleCoreTopic('${this.currentActiveSubject}', '${t}')">
                    <span style="${isChecked ? 'color:var(--text-muted); text-decoration:line-through;' : ''}">${t}</span>
                  </li>
                `;
              }).join('')}
            </ul>
            <div class="takeaway-box">
              🎯 <strong>Key Insight:</strong> ${mod.keyTakeaway}
            </div>
          </div>
        `).join('')}

        <h3 style="font-size:1.05rem; font-weight:700; margin-top:1.5rem;">🔥 High-Yield Technical Interview Questions</h3>
        <p style="font-size:0.82rem; color:var(--text-secondary); margin-bottom:0.75rem;">Click question to reveal concise answer and technical explanation.</p>
        <div>
          ${currentSub.interviewQuestions.map((qa, qidx) => `
            <div class="qa-card">
              <div class="qa-question" onclick="this.nextElementSibling.style.display = this.nextElementSibling.style.display === 'none' ? 'block' : 'none'">
                <span>Q${qidx + 1}: ${qa.question}</span>
                <span style="font-size:0.8rem; color:var(--accent-cyan);">▼ Toggle Answer</span>
              </div>
              <div class="qa-answer" style="display:none;">
                ${qa.answer}
              </div>
            </div>
          `).join('')}
        </div>
      `;
    }
  }

  switchCoreSubject(subKey) {
    this.currentActiveSubject = subKey;
    this.renderCoreSubjects();
  }

  toggleCoreTopic(subKey, topicName) {
    window.appStorage.toggleCoreTopic(subKey, topicName);
    this.renderCoreSubjects();
    this.renderDashboardStats();
  }

  // 7. Modern AI Projects Hub
  renderAIProjects() {
    const container = document.getElementById('aiProjectsGrid');
    if (!container || this.aiProjects.length === 0) return;

    const activeId = window.appStorage.getActiveProjectId();

    container.innerHTML = this.aiProjects.map(p => {
      const isActive = p.id === activeId;
      const totalM = p.milestones.length;
      const doneM = (window.appStorage.state.projectMilestones[p.id] || []).length;
      const mPct = totalM > 0 ? Math.round((doneM / totalM) * 100) : 0;

      return `
        <div class="project-card ${isActive ? 'active-project' : ''}">
          <div class="project-header-top">
            <div class="project-badge-group">
              <span class="project-category">${p.category}</span>
              <span class="project-diff">${p.difficulty}</span>
            </div>
            ${isActive ? `<span style="font-size:0.75rem; background:rgba(56,189,248,0.15); color:var(--accent-cyan); padding:0.2rem 0.6rem; border-radius:var(--radius-full); font-weight:700;">★ Active Target</span>` : ''}
          </div>

          <div>
            <h3 class="project-title">${p.title}</h3>
            <p class="project-tagline">${p.tagline}</p>
          </div>

          <div class="why-stands-out">
            🌟 <strong>Why Recruiters Value This:</strong> ${p.whyItStandsOut}
          </div>

          <div>
            <div style="font-size:0.75rem; font-weight:700; color:var(--text-muted); margin-bottom:0.35rem; text-transform:uppercase;">Core Technologies:</div>
            <div class="tech-tags">
              ${p.techStack.map(t => `<span class="tech-tag">${t}</span>`).join('')}
            </div>
          </div>

          <div>
            <div style="display:flex; justify-content:space-between; font-size:0.75rem; color:var(--text-muted); margin-bottom:0.25rem;">
              <span>Milestones Progress</span>
              <span>${doneM} / ${totalM} (${mPct}%)</span>
            </div>
            <div class="progress-container">
              <div class="progress-fill" style="width: ${mPct}%"></div>
            </div>
          </div>

          <div class="project-actions">
            <button class="btn btn-primary" style="flex:1; justify-content:center;" onclick="appTracker.openProjectModal('${p.id}')">
              📖 View Blueprint & Milestones
            </button>
            <button class="btn" onclick="appTracker.setActiveProject('${p.id}')" title="Set as primary resume project">
              ${isActive ? '✓ Selected' : 'Select'}
            </button>
          </div>
        </div>
      `;
    }).join('');
  }

  setActiveProject(id) {
    window.appStorage.setActiveProjectId(id);
    window.showToast?.('Target resume project updated!');
    this.renderAIProjects();
    this.renderDashboardStats();
  }

  openProjectModal(id) {
    const project = this.aiProjects.find(p => p.id === id);
    if (!project) return;

    const dialog = document.getElementById('projectDialog');
    const content = document.getElementById('projectDialogContent');

    if (content) {
      const activeId = window.appStorage.getActiveProjectId();
      const isActive = project.id === activeId;

      content.innerHTML = `
        <div class="modal-header">
          <div>
            <div class="project-badge-group" style="margin-bottom:0.4rem;">
              <span class="project-category">${project.category}</span>
              <span class="project-diff">${project.difficulty}</span>
            </div>
            <h2 class="modal-title" style="font-size:1.35rem;">${project.title}</h2>
            <p class="modal-subtitle">${project.tagline}</p>
          </div>
          <button class="close-btn" onclick="document.getElementById('projectDialog').close()">✕</button>
        </div>

        <div style="display:flex; flex-direction:column; gap:1.25rem; max-height:70vh; overflow-y:auto; padding-right:0.5rem;">
          <div class="why-stands-out">
            🌟 <strong>Resume Advantage:</strong> ${project.whyItStandsOut}
          </div>

          <div>
            <h3 style="font-size:1rem; font-weight:700; margin-bottom:0.5rem; color:var(--accent-cyan);">🏛️ Architecture & Component Flow</h3>
            <p style="font-size:0.85rem; color:var(--text-secondary); margin-bottom:0.5rem;">${project.architecture.overview}</p>
            <ul style="list-style:none; display:flex; flex-direction:column; gap:0.4rem;">
              ${project.architecture.components.map(c => `
                <li style="font-size:0.82rem; background:var(--bg-primary); padding:0.4rem 0.65rem; border-radius:var(--radius-sm); border-left:3px solid var(--accent-indigo);">
                  ${c}
                </li>
              `).join('')}
            </ul>
          </div>

          <div>
            <h3 style="font-size:1rem; font-weight:700; margin-bottom:0.5rem; color:var(--accent-cyan);">🚀 5-Week Step-by-Step Implementation Milestones</h3>
            <div>
              ${project.milestones.map((m, idx) => {
                const isDone = window.appStorage.isMilestoneDone(project.id, idx);
                return `
                  <div class="milestone-item">
                    <input type="checkbox" ${isDone ? 'checked' : ''} onchange="appTracker.toggleMilestone('${project.id}', ${idx}, this.checked)">
                    <div>
                      <strong style="color:var(--accent-cyan);">Week ${m.week}:</strong>
                      <span style="${isDone ? 'text-decoration:line-through; color:var(--text-muted);' : ''}">${m.task}</span>
                    </div>
                  </div>
                `;
              }).join('')}
            </div>
          </div>

          <div>
            <h3 style="font-size:1rem; font-weight:700; margin-bottom:0.5rem; color:var(--accent-cyan);">📋 Ready-to-Paste Resume Bullets (STAR Format)</h3>
            <p style="font-size:0.8rem; color:var(--text-muted); margin-bottom:0.5rem;">Engineered with quantifiable impact and industry metrics.</p>
            <div>
              ${project.resumeBullets.map((bullet, bidx) => `
                <div class="resume-bullet-box">
                  <span>${bullet}</span>
                  <button class="copy-bullet-btn" onclick="appTracker.copyText('${bullet.replace(/'/g, "\\'")}', this)">
                    📋 Copy
                  </button>
                </div>
              `).join('')}
            </div>
          </div>

          <div>
            <h3 style="font-size:1rem; font-weight:700; margin-bottom:0.5rem; color:var(--accent-cyan);">🎤 Anticipated Interview Questions & Defense</h3>
            <div style="display:flex; flex-direction:column; gap:0.5rem;">
              ${project.interviewQuestions.map(iq => `
                <div style="background:var(--bg-primary); padding:0.75rem; border-radius:var(--radius-md); border:1px solid var(--border-color);">
                  <div style="font-weight:700; font-size:0.85rem; color:var(--accent-amber); margin-bottom:0.25rem;">Q: ${iq.q}</div>
                  <div style="font-size:0.82rem; color:var(--text-secondary); line-height:1.5;">${iq.a}</div>
                </div>
              `).join('')}
            </div>
          </div>
        </div>

        <div class="modal-footer">
          <button class="btn btn-primary" onclick="appTracker.setActiveProject('${project.id}')">
            ${isActive ? '✓ Current Target Project' : 'Set as My Target Project'}
          </button>
        </div>
      `;
    }

    if (dialog) dialog.showModal();
  }

  toggleMilestone(projId, mIdx, checked) {
    window.appStorage.toggleMilestone(projId, mIdx);
    this.renderAIProjects();
    this.renderDashboardStats();
  }

  copyText(text, btnEl) {
    navigator.clipboard.writeText(text).then(() => {
      const original = btnEl.textContent;
      btnEl.textContent = '✓ Copied!';
      setTimeout(() => { btnEl.textContent = original; }, 1500);
      window.showToast?.('Copied resume bullet to clipboard!');
    }).catch(() => {
      window.showToast?.('Could not copy automatically. Please copy manually.');
    });
  }
}

window.appTracker = new TrackerApp();
