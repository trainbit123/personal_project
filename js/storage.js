// LocalStorage & State Management for 3-Month Prep App
const STORAGE_KEY = 'career_prep_3month_state_v1';

const defaultState = {
  solvedProblems: [],
  starredProblems: [],
  problemNotes: {},
  companySolved: {
    Amazon: [],
    Google: [],
    Microsoft: [],
    Flipkart: []
  },
  checklistState: {},
  coreSubjectChecks: {},
  activeProjectId: 'agentic-devops-sre',
  projectMilestones: {},
  streak: {
    count: 1,
    lastDate: new Date().toISOString().slice(0, 10),
    history: [new Date().toISOString().slice(0, 10)]
  },
  theme: 'dark'
};

class StorageManager {
  constructor() {
    this.state = this.loadState();
    this.checkAndUpdateStreak();
  }

  loadState() {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (data) {
        const parsed = JSON.parse(data);
        return { ...defaultState, ...parsed };
      }
    } catch (e) {
      console.error('Failed to load state from localStorage', e);
    }
    return JSON.parse(JSON.stringify(defaultState));
  }

  saveState() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state));
    } catch (e) {
      console.error('Failed to save state to localStorage', e);
    }
  }

  checkAndUpdateStreak() {
    const today = new Date().toISOString().slice(0, 10);
    const lastDate = this.state.streak.lastDate;

    if (lastDate !== today) {
      const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
      if (lastDate === yesterday) {
        this.state.streak.count += 1;
      } else {
        // Streak reset if more than 1 day missed
        const lastTime = new Date(lastDate).getTime();
        const diffDays = Math.round((new Date(today).getTime() - lastTime) / (1000 * 3600 * 24));
        if (diffDays > 1) {
          this.state.streak.count = 1;
        }
      }
      this.state.streak.lastDate = today;
      if (!this.state.streak.history.includes(today)) {
        this.state.streak.history.push(today);
      }
      this.saveState();
    }
  }

  // Problems
  isProblemSolved(id) {
    return this.state.solvedProblems.includes(id);
  }

  toggleProblemSolved(id) {
    const index = this.state.solvedProblems.indexOf(id);
    if (index > -1) {
      this.state.solvedProblems.splice(index, 1);
    } else {
      this.state.solvedProblems.push(id);
    }
    this.saveState();
    return this.isProblemSolved(id);
  }

  isProblemStarred(id) {
    return this.state.starredProblems.includes(id);
  }

  toggleProblemStarred(id) {
    const index = this.state.starredProblems.indexOf(id);
    if (index > -1) {
      this.state.starredProblems.splice(index, 1);
    } else {
      this.state.starredProblems.push(id);
    }
    this.saveState();
    return this.isProblemStarred(id);
  }

  getProblemNote(id) {
    return this.state.problemNotes[id] || { notes: '', approach: '', timeComplexity: '', spaceComplexity: '', struggled: false };
  }

  saveProblemNote(id, noteData) {
    this.state.problemNotes[id] = noteData;
    this.saveState();
  }

  // Company Revision Sets
  isCompanyProblemSolved(company, sheetId) {
    return (this.state.companySolved[company] || []).includes(sheetId) || this.isProblemSolved(sheetId);
  }

  toggleCompanyProblem(company, sheetId) {
    if (!this.state.companySolved[company]) {
      this.state.companySolved[company] = [];
    }
    const list = this.state.companySolved[company];
    const idx = list.indexOf(sheetId);
    if (idx > -1) {
      list.splice(idx, 1);
    } else {
      list.push(sheetId);
    }
    this.saveState();
  }

  // Checklist
  isChecklistItemDone(index) {
    return !!this.state.checklistState[index];
  }

  toggleChecklistItem(index) {
    this.state.checklistState[index] = !this.state.checklistState[index];
    this.saveState();
    return this.state.checklistState[index];
  }

  // Core Subjects
  isCoreTopicDone(subject, topic) {
    const list = this.state.coreSubjectChecks[subject] || [];
    return list.includes(topic);
  }

  toggleCoreTopic(subject, topic) {
    if (!this.state.coreSubjectChecks[subject]) {
      this.state.coreSubjectChecks[subject] = [];
    }
    const list = this.state.coreSubjectChecks[subject];
    const idx = list.indexOf(topic);
    if (idx > -1) {
      list.splice(idx, 1);
    } else {
      list.push(topic);
    }
    this.saveState();
    return this.isCoreTopicDone(subject, topic);
  }

  // AI Projects
  getActiveProjectId() {
    return this.state.activeProjectId || 'agentic-devops-sre';
  }

  setActiveProjectId(id) {
    this.state.activeProjectId = id;
    this.saveState();
  }

  isMilestoneDone(projectId, milestoneIndex) {
    const list = this.state.projectMilestones[projectId] || [];
    return list.includes(milestoneIndex);
  }

  toggleMilestone(projectId, milestoneIndex) {
    if (!this.state.projectMilestones[projectId]) {
      this.state.projectMilestones[projectId] = [];
    }
    const list = this.state.projectMilestones[projectId];
    const idx = list.indexOf(milestoneIndex);
    if (idx > -1) {
      list.splice(idx, 1);
    } else {
      list.push(milestoneIndex);
    }
    this.saveState();
    return this.isMilestoneDone(projectId, milestoneIndex);
  }

  // Export / Import
  exportToJSON() {
    const jsonStr = JSON.stringify(this.state, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `career_prep_backup_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  importFromJSON(jsonText) {
    try {
      const parsed = JSON.parse(jsonText);
      if (typeof parsed === 'object' && parsed !== null) {
        this.state = { ...defaultState, ...parsed };
        this.saveState();
        return true;
      }
    } catch (e) {
      console.error('Invalid JSON import file', e);
    }
    return false;
  }

  resetAll() {
    this.state = JSON.parse(JSON.stringify(defaultState));
    this.saveState();
  }
}

window.appStorage = new StorageManager();
