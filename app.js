'use strict';

const SVG_NS = 'http://www.w3.org/2000/svg';
const STORAGE_KEY = 'classroomClockCardMakerState';
const SAMPLE_SCHEDULE = `Arrival | 7:00
Breakfast | 8:30
Choice Time | 9:00
Bodily Care | 9:15
Large Group with Music and Movement | 9:45
Group Time with Materials | 10:00
Brush Teeth | 10:20
Outside Time | 10:30
Lunch | 11:30
Naptime | 12:00
Bodily Care | 2:30
Snack | 2:45
Choice Time | 3:00
Outside Time | 4:15
Departure | 5:00`;

const CARD_SIZES = {
  small: { width: '3.0in', height: '1.0in' },
  medium: { width: '3.5in', height: '1.25in' },
  large: { width: '4.0in', height: '1.5in' },
};

const defaults = {
  schedule: SAMPLE_SCHEDULE,
  cardSize: 'medium',
  columns: '2',
  clockSize: '0.82',
  timeFontSize: '30',
  activityFontSize: '11',
  layout: 'row',
  edgeStyle: 'cut',
  showActivities: true,
  showTicks: true,
  showNumerals: true,
  showEnteredAmPm: true,
  forceAmPm: false,
};

const els = {};
let currentItems = [];

function init() {
  cacheElements();
  bindEvents();
  loadState();
  applySettingsToCss();
  handleGenerate();
}

function cacheElements() {
  ['scheduleInput', 'generateButton', 'printButton', 'resetButton', 'cardSize', 'columns', 'layout', 'edgeStyle', 'clockSize', 'clockSizeValue', 'timeFontSize', 'timeFontSizeValue', 'activityFontSize', 'activityFontSizeValue', 'showActivities', 'showTicks', 'showNumerals', 'showEnteredAmPm', 'forceAmPm', 'messages', 'cardsGrid'].forEach((id) => {
    els[id] = document.getElementById(id);
  });
}

function loadState() {
  const saved = safeJsonParse(localStorage.getItem(STORAGE_KEY));
  const state = { ...defaults, ...(saved || {}) };
  if (saved && !saved.edgeStyle) {
    state.edgeStyle = saved.showBorders ? 'border' : (saved.showCutLines ? 'cut' : 'none');
  }
  els.scheduleInput.value = state.schedule;
  els.cardSize.value = state.cardSize;
  els.columns.value = state.columns;
  els.layout.value = state.layout;
  els.edgeStyle.value = state.edgeStyle;
  els.clockSize.value = state.clockSize;
  els.timeFontSize.value = state.timeFontSize;
  els.activityFontSize.value = state.activityFontSize;
  els.showActivities.checked = state.showActivities;
  els.showTicks.checked = state.showTicks;
  els.showNumerals.checked = state.showNumerals;
  els.showEnteredAmPm.checked = state.showEnteredAmPm;
  els.forceAmPm.checked = state.forceAmPm;
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(getSettings()));
}

function getSettings() {
  return {
    schedule: els.scheduleInput.value,
    cardSize: els.cardSize.value,
    columns: els.columns.value,
    layout: els.layout.value,
    edgeStyle: els.edgeStyle.value,
    clockSize: els.clockSize.value,
    timeFontSize: els.timeFontSize.value,
    activityFontSize: els.activityFontSize.value,
    showActivities: els.showActivities.checked,
    showTicks: els.showTicks.checked,
    showNumerals: els.showNumerals.checked,
    showEnteredAmPm: els.showEnteredAmPm.checked,
    forceAmPm: els.forceAmPm.checked,
  };
}

function bindEvents() {
  els.generateButton.addEventListener('click', handleGenerate);
  els.printButton.addEventListener('click', printCards);
  els.resetButton.addEventListener('click', () => {
    localStorage.removeItem(STORAGE_KEY);
    els.scheduleInput.value = SAMPLE_SCHEDULE;
    loadDefaultsIntoControls();
    handleGenerate();
  });
  [...document.querySelectorAll('select, input, textarea')].forEach((control) => {
    control.addEventListener('change', () => { applySettingsToCss(); saveState(); });
    if (control.tagName === 'TEXTAREA' || control.type === 'range') {
      control.addEventListener('input', () => { applySettingsToCss(); saveState(); });
    }
  });
}

function loadDefaultsIntoControls() {
  els.cardSize.value = defaults.cardSize;
  els.columns.value = defaults.columns;
  els.layout.value = defaults.layout;
  els.edgeStyle.value = defaults.edgeStyle;
  els.clockSize.value = defaults.clockSize;
  els.timeFontSize.value = defaults.timeFontSize;
  els.activityFontSize.value = defaults.activityFontSize;
  els.showActivities.checked = defaults.showActivities;
  els.showTicks.checked = defaults.showTicks;
  els.showNumerals.checked = defaults.showNumerals;
  els.showEnteredAmPm.checked = defaults.showEnteredAmPm;
  els.forceAmPm.checked = defaults.forceAmPm;
}

function handleGenerate() {
  applySettingsToCss();
  const result = parseScheduleInput(els.scheduleInput.value);
  const forceErrors = els.forceAmPm.checked
    ? result.items.filter((item) => !item.hasAmPm).map((item) => `Line ${item.lineNumber}: add AM or PM before forcing AM/PM labels.`)
    : [];
  currentItems = result.items.filter((item) => !els.forceAmPm.checked || item.hasAmPm);
  generateCards(currentItems);
  showErrors([...result.errors, ...forceErrors], currentItems.length);
  saveState();
}

function parseScheduleInput(text) {
  const items = [];
  const errors = [];
  text.split(/\r?\n/).forEach((rawLine, index) => {
    const line = rawLine.trim();
    if (!line) return;
    const parsed = parseLine(line);
    if (parsed.error) {
      errors.push(`Line ${index + 1}: ${parsed.error}`);
      return;
    }
    items.push({ ...parsed.item, lineNumber: index + 1 });
  });
  return { items, errors };
}

function parseLine(line) {
  const timeAtEnd = /(.*?)(?:\s*(?:\||-|—)\s*)?((?:[01]?\d|2[0-3]):[0-5]?\d\s*(?:[AaPp]\.?[Mm]\.?)?)$/;
  const match = line.match(timeAtEnd);
  if (!match) return { error: `Could not find a valid time in “${line}”. Use formats like 7:00, Arrival 7:00, or Arrival - 7:00.` };
  const activity = match[1].replace(/[|—-]\s*$/, '').trim();
  const rawTime = match[2].trim();
  const parsedTime = parseTime(rawTime);
  if (parsedTime.error) return { error: parsedTime.error };
  return { item: { activity, rawTime, ...parsedTime } };
}

function parseTime(rawTime) {
  const normalized = rawTime.trim().replace(/\s+/g, ' ');
  const match = normalized.match(/^(\d{1,2}):(\d{1,2})(?:\s*([AaPp])\.?[Mm]\.?)?$/);
  if (!match) return { error: `“${rawTime}” is not a readable time.` };
  const originalHour = Number(match[1]);
  const minute = Number(match[2]);
  const amPm = match[3] ? `${match[3].toUpperCase()}M` : null;
  const hasAmPm = Boolean(amPm);

  if (minute < 0 || minute > 59) return { error: `Minutes in “${rawTime}” must be 0–59.` };
  if (hasAmPm && (originalHour < 1 || originalHour > 12)) return { error: `Use hours 1–12 when AM/PM is included in “${rawTime}”.` };
  if (!hasAmPm && (originalHour < 0 || originalHour > 23)) return { error: `Hour in “${rawTime}” must be 1–12, or 0–23 for 24-hour input.` };
  if (!hasAmPm && originalHour === 0 && !/^0{1,2}:/.test(normalized)) return { error: `Use 12:xx or 00:xx instead of “${rawTime}”.` };

  let hour = originalHour;
  if (!hasAmPm && originalHour > 12) hour = originalHour - 12;
  if (!hasAmPm && originalHour === 0) hour = 12;
  const displayTime = normalizeDisplayTime(normalized);
  return { displayTime, hour, minute, hasAmPm, amPm };
}

function normalizeDisplayTime(rawTime) {
  const match = rawTime.trim().replace(/\s+/g, ' ').match(/^(\d{1,2}):(\d{1,2})(?:\s*([AaPp])\.?[Mm]\.?)?$/);
  if (!match) return rawTime.trim();
  let hour = Number(match[1]);
  const minute = Number(match[2]);
  const amPm = match[3] ? `${match[3].toUpperCase()}M` : '';
  if (!amPm && hour > 12) hour -= 12;
  if (!amPm && hour === 0) hour = 12;
  return `${hour}:${String(minute).padStart(2, '0')}${amPm ? ` ${amPm}` : ''}`;
}

function generateCards(items) {
  const settings = getSettings();
  els.cardsGrid.innerHTML = '';
  items.forEach((item) => {
    const card = document.createElement('article');
    card.className = `clock-card layout-${settings.layout} edge-${settings.edgeStyle}`;
    card.classList.toggle('no-activity', !settings.showActivities || !item.activity);

    const clockWrap = document.createElement('div');
    clockWrap.className = 'clock-wrapper';
    clockWrap.append(createClockSvg(item.hour, item.minute, settings));

    const timeBlock = document.createElement('div');
    timeBlock.className = 'time-block';
    const activity = document.createElement('div');
    activity.className = 'activity';
    activity.textContent = settings.showActivities ? item.activity : '';
    const time = document.createElement('div');
    time.className = 'digital-time';
    time.textContent = displayTimeForSettings(item, settings);
    timeBlock.append(activity, time);

    card.append(clockWrap, timeBlock);
    els.cardsGrid.append(card);
  });
}

function displayTimeForSettings(item, settings) {
  if (settings.forceAmPm && item.hasAmPm) return item.displayTime;
  if (!settings.showEnteredAmPm && item.hasAmPm) return item.displayTime.replace(/\s+[AP]M$/, '');
  return item.displayTime;
}

function createClockSvg(hour, minute, options = {}) {
  const svg = createSvgElement('svg', { viewBox: '0 0 100 100', role: 'img', 'aria-label': `${hour}:${String(minute).padStart(2, '0')} analog clock` });
  svg.append(createSvgElement('circle', { cx: 50, cy: 50, r: 47, fill: '#fff' }));
  svg.append(createSvgElement('circle', { cx: 50, cy: 50, r: 45, fill: 'none', stroke: '#000', 'stroke-width': 3.5 }));

  if (options.showTicks) {
    for (let i = 0; i < 60; i += 1) {
      const major = i % 5 === 0;
      const start = polarToCartesian(50, 50, major ? 39 : 42, i * 6);
      const end = polarToCartesian(50, 50, 45, i * 6);
      svg.append(createSvgElement('line', { x1: start.x, y1: start.y, x2: end.x, y2: end.y, stroke: '#000', 'stroke-width': major ? 1.8 : 0.8, 'stroke-linecap': 'round' }));
    }
  }

  if (options.showNumerals) {
    for (let n = 1; n <= 12; n += 1) {
      const point = polarToCartesian(50, 50, 34.5, n * 30);
      const text = createSvgElement('text', { x: point.x, y: point.y + 0.7, 'text-anchor': 'middle', 'dominant-baseline': 'middle', 'font-family': 'system-ui, sans-serif', 'font-size': 10, 'font-weight': 800, fill: '#000' });
      text.textContent = String(n);
      svg.append(text);
    }
  }

  const hourAngleDegrees = ((hour % 12) + minute / 60) * 30;
  const minuteAngleDegrees = minute * 6;
  const hourEnd = polarToCartesian(50, 50, 26, hourAngleDegrees);
  const minuteEnd = polarToCartesian(50, 50, 36, minuteAngleDegrees);
  svg.append(createSvgElement('line', { x1: 50, y1: 50, x2: hourEnd.x, y2: hourEnd.y, stroke: '#000', 'stroke-width': 6, 'stroke-linecap': 'round' }));
  svg.append(createSvgElement('line', { x1: 50, y1: 50, x2: minuteEnd.x, y2: minuteEnd.y, stroke: '#000', 'stroke-width': 4, 'stroke-linecap': 'round' }));
  svg.append(createSvgElement('circle', { cx: 50, cy: 50, r: 4, fill: '#000' }));
  return svg;
}

function polarToCartesian(cx, cy, radius, angleDegrees) {
  const angleRadians = (angleDegrees - 90) * Math.PI / 180;
  return { x: cx + radius * Math.cos(angleRadians), y: cy + radius * Math.sin(angleRadians) };
}

function createSvgElement(tag, attrs) {
  const element = document.createElementNS(SVG_NS, tag);
  Object.entries(attrs).forEach(([key, value]) => element.setAttribute(key, value));
  return element;
}

function applySettingsToCss() {
  const size = CARD_SIZES[els.cardSize.value] || CARD_SIZES.medium;
  document.documentElement.style.setProperty('--card-width', size.width);
  document.documentElement.style.setProperty('--card-height', size.height);
  document.documentElement.style.setProperty('--columns', els.columns.value);
  document.documentElement.style.setProperty('--clock-size', `${els.clockSize.value}in`);
  document.documentElement.style.setProperty('--time-font-size', `${els.timeFontSize.value}px`);
  document.documentElement.style.setProperty('--activity-font-size', `${els.activityFontSize.value}px`);
  els.clockSizeValue.textContent = `${Number(els.clockSize.value).toFixed(2)}in`;
  els.timeFontSizeValue.textContent = `${els.timeFontSize.value}px`;
  els.activityFontSizeValue.textContent = `${els.activityFontSize.value}px`; 
}

function showErrors(errors, count = currentItems.length) {
  els.messages.innerHTML = '';
  const summary = document.createElement('p');
  summary.textContent = errors.length ? `Generated ${count} card(s). Please review ${errors.length} issue(s).` : `Generated ${count} printable card(s).`;
  els.messages.append(summary);
  if (errors.length) {
    const list = document.createElement('ul');
    errors.forEach((error) => {
      const item = document.createElement('li');
      item.textContent = error;
      list.append(item);
    });
    els.messages.append(list);
  }
}

function printCards() {
  if (!currentItems.length) handleGenerate();
  window.print();
}

function safeJsonParse(value) {
  try { return value ? JSON.parse(value) : null; } catch { return null; }
}

document.addEventListener('DOMContentLoaded', init);
