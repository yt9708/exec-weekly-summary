const fs = require('fs');
const path = require('path');

/**
 * 内存数据存储
 * 初始化时加载 mock JSON，运行期间支持增删改操作
 */
class DataStore {
  constructor() {
    this.data = null;
    this.idCounter = {};
    this._loadMockData();
  }

  _loadMockData() {
    const dataPath = path.join(__dirname, '../data/mock-weekly-report.json');
    this.data = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));
    this._initCounters();
  }

  _initCounters() {
    const maxId = (items) => {
      if (!items || items.length === 0) return 0;
      return Math.max(...items.map(i => {
        const num = parseInt((i.id || '0').replace(/^\D+/, ''));
        return isNaN(num) ? 0 : num;
      }));
    };
    this.idCounter.decision = maxId([
      ...(this.data.decisions?.actionRequired || []),
      ...(this.data.decisions?.needsDecision || []),
      ...(this.data.decisions?.infoOnly || [])
    ]);
    this.idCounter.event = maxId(this.data.events || []);
    this.idCounter.warning = maxId(this.data.warnings || []);
  }

  _nextId(prefix) {
    this.idCounter[prefix] = (this.idCounter[prefix] || 0) + 1;
    const num = String(this.idCounter[prefix]).padStart(3, '0');
    return prefix === 'decision' ? `dec-${num}` :
           prefix === 'event' ? `evt-${num}` :
           prefix === 'warning' ? `wrn-${num}` : `${prefix}-${num}`;
  }

  getReport() { return this.data; }

  // ─── 决策事项 ───
  getDecisions() { return this.data.decisions; }

  addDecision(item) {
    item.id = this._nextId('decision');
    if (item.level === 'action') {
      this.data.decisions.actionRequired.push(item);
    } else if (item.level === 'decision') {
      this.data.decisions.needsDecision.push(item);
    } else {
      this.data.decisions.infoOnly.push(item);
    }
    return item;
  }

  updateDecision(id, updates) {
    for (const list of ['actionRequired', 'needsDecision', 'infoOnly']) {
      const idx = (this.data.decisions[list] || []).findIndex(d => d.id === id);
      if (idx !== -1) {
        Object.assign(this.data.decisions[list][idx], updates);
        return this.data.decisions[list][idx];
      }
    }
    return null;
  }

  deleteDecision(id) {
    for (const list of ['actionRequired', 'needsDecision', 'infoOnly']) {
      const idx = (this.data.decisions[list] || []).findIndex(d => d.id === id);
      if (idx !== -1) {
        this.data.decisions[list].splice(idx, 1);
        return true;
      }
    }
    return false;
  }

  // ─── 健康度 ───
  getHealthItems() { return this.data.healthCheck?.items || []; }

  updateHealthItem(index, updates) {
    if (this.data.healthCheck?.items[index]) {
      Object.assign(this.data.healthCheck.items[index], updates);
      return this.data.healthCheck.items[index];
    }
    return null;
  }

  // ─── 事件 ───
  getEvents() { return this.data.events || []; }

  addEvent(item) {
    item.id = this._nextId('event');
    this.data.events.push(item);
    return item;
  }

  updateEvent(id, updates) {
    const idx = this.data.events.findIndex(e => e.id === id);
    if (idx !== -1) {
      Object.assign(this.data.events[idx], updates);
      return this.data.events[idx];
    }
    return null;
  }

  deleteEvent(id) {
    const idx = this.data.events.findIndex(e => e.id === id);
    if (idx !== -1) { this.data.events.splice(idx, 1); return true; }
    return false;
  }

  // ─── 预警 ───
  getWarnings() { return this.data.warnings || []; }

  addWarning(item) {
    item.id = this._nextId('warning');
    this.data.warnings.push(item);
    return item;
  }

  updateWarning(id, updates) {
    const idx = this.data.warnings.findIndex(w => w.id === id);
    if (idx !== -1) {
      Object.assign(this.data.warnings[idx], updates);
      return this.data.warnings[idx];
    }
    return null;
  }

  deleteWarning(id) {
    const idx = this.data.warnings.findIndex(w => w.id === id);
    if (idx !== -1) { this.data.warnings.splice(idx, 1); return true; }
    return false;
  }

  // ─── 团队动态 ───
  getTeamUpdates() { return this.data.teamUpdates; }

  addPersonnelChange(item) {
    this.data.teamUpdates.personnelChanges.push(item);
    return item;
  }

  deletePersonnelChange(index) {
    if (this.data.teamUpdates.personnelChanges[index]) {
      this.data.teamUpdates.personnelChanges.splice(index, 1);
      return true;
    }
    return false;
  }
}

module.exports = new DataStore();
