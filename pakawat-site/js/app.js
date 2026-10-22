/**
 * Application Logic for Pakawat Portfolio & Worksheet Hub
 */

// Storage keys
const STORAGE_WORKS_KEY = 'pakawat_worksheets_data';
const STORAGE_THEME_KEY = 'pakawat_theme_pref';
const STORAGE_PROFILE_KEY = 'pakawat_profile_data';

// State
let worksheets = [];
let profileData = null;
let currentFilter = 'all';
let currentSearch = '';
let currentAddImageBase64 = null;
let currentEditImageBase64 = null;
let currentEditEduImageBase64 = null;

// DOM Elements
const views = {
  home: document.getElementById('view-home'),
  profile: document.getElementById('view-profile'),
  worksheets: document.getElementById('view-worksheets')
};
const navItems = document.querySelectorAll('.nav-item');
const themeToggleBtn = document.getElementById('theme-toggle-btn');
const mobileMenuBtn = document.getElementById('mobile-menu-btn');
const navMenu = document.getElementById('nav-menu');

// Modals & Lightbox
const detailModal = document.getElementById('worksheet-detail-modal');
const addModal = document.getElementById('add-worksheet-modal');
const editModal = document.getElementById('edit-worksheet-modal');
const editEduModal = document.getElementById('edit-education-modal');
const lightboxModal = document.getElementById('image-lightbox-modal');
const lightboxImg = document.getElementById('lightbox-img');
const lightboxTitle = document.getElementById('lightbox-image-title');
const toastContainer = document.getElementById('toast-container');

// Lightbox state
let currentZoom = 1;
let currentLightboxSrc = '';

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  initData();
  setupNavigation();
  setupEventListeners();
  renderAll();
});

/* ---------------- Theme Management ---------------- */
function initTheme() {
  const savedTheme = localStorage.getItem(STORAGE_THEME_KEY) || 'dark';
  document.documentElement.setAttribute('data-theme', savedTheme);
  updateThemeIcon(savedTheme);
}

function toggleTheme() {
  const currentTheme = document.documentElement.getAttribute('data-theme') || 'dark';
  const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', newTheme);
  localStorage.setItem(STORAGE_THEME_KEY, newTheme);
  updateThemeIcon(newTheme);
  showToast(`เปลี่ยนโหมดเป็น ${newTheme === 'dark' ? 'ธีมมืด (Dark Mode)' : 'ธีมสว่าง (Light Mode)'}`);
}

function updateThemeIcon(theme) {
  if (!themeToggleBtn) return;
  themeToggleBtn.innerHTML = theme === 'dark' 
    ? `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>`
    : `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>`;
}

/* ---------------- Data Management ---------------- */
function initData() {
  const stored = localStorage.getItem(STORAGE_WORKS_KEY);
  if (stored) {
    try {
      worksheets = JSON.parse(stored);
    } catch (e) {
      worksheets = DEFAULT_WORKSHEETS;
    }
  } else {
    worksheets = DEFAULT_WORKSHEETS;
    saveWorksheets();
  }

  // Profile Data Management
  const storedProfile = localStorage.getItem(STORAGE_PROFILE_KEY);
  if (storedProfile) {
    try {
      profileData = JSON.parse(storedProfile);
    } catch (e) {
      profileData = JSON.parse(JSON.stringify(DEFAULT_PROFILE));
    }
  } else {
    profileData = JSON.parse(JSON.stringify(DEFAULT_PROFILE));
    saveProfile();
  }

  // Ensure each education item has the latest default images if missing
  if (profileData && profileData.education) {
    let needsUpdate = false;
    profileData.education.forEach((item, i) => {
      if (!item.image && DEFAULT_PROFILE.education[i]) {
        item.image = DEFAULT_PROFILE.education[i].image;
        item.caption = DEFAULT_PROFILE.education[i].caption;
        item.id = DEFAULT_PROFILE.education[i].id;
        needsUpdate = true;
      }
      if (!item.id && DEFAULT_PROFILE.education[i]) {
        item.id = DEFAULT_PROFILE.education[i].id;
        needsUpdate = true;
      }
    });
    if (needsUpdate) {
      saveProfile();
    }
  }
}

function saveProfile() {
  localStorage.setItem(STORAGE_PROFILE_KEY, JSON.stringify(profileData));
  renderProfileInfo();
}

function saveWorksheets() {
  localStorage.setItem(STORAGE_WORKS_KEY, JSON.stringify(worksheets));
  updateStats();
  if (filterCalendarInstance) {
    filterCalendarInstance.refresh();
  }
}

/* ---------------- Navigation / Routing ---------------- */
function setupNavigation() {
  // Check URL Hash on load
  const hash = window.location.hash.replace('#', '') || 'home';
  switchView(hash);

  window.addEventListener('hashchange', () => {
    const newHash = window.location.hash.replace('#', '') || 'home';
    switchView(newHash);
  });

  navItems.forEach(item => {
    item.addEventListener('click', (e) => {
      e.preventDefault();
      const targetView = item.getAttribute('data-target');
      window.location.hash = targetView;
      if (navMenu.classList.contains('open')) {
        navMenu.classList.remove('open');
      }
    });
  });

  // Mobile menu button
  if (mobileMenuBtn) {
    mobileMenuBtn.addEventListener('click', () => {
      navMenu.classList.toggle('open');
    });
  }
}

function switchView(viewName) {
  if (!views[viewName]) viewName = 'home';

  // Toggle active views
  Object.keys(views).forEach(k => {
    if (k === viewName) {
      views[k].classList.add('active');
    } else {
      views[k].classList.remove('active');
    }
  });

  // Toggle active nav links
  navItems.forEach(item => {
    if (item.getAttribute('data-target') === viewName) {
      item.classList.add('active');
    } else {
      item.classList.remove('active');
    }
  });

  // Scroll to top
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

/* ---------------- Render Functions ---------------- */
function renderAll() {
  renderProfileInfo();
  renderFeaturedWorks();
  renderWorksheetsGrid();
  updateStats();
}

function updateStats() {
  const countEl = document.getElementById('stat-total-works');
  const countBadgeEl = document.getElementById('stat-badge-works');
  const worksFoundEl = document.getElementById('works-found-count');

  if (countEl) countEl.innerText = worksheets.length;
  if (countBadgeEl) countBadgeEl.innerText = `${worksheets.length} รายการ`;
  if (worksFoundEl) {
    const filtered = getFilteredWorksheets();
    if (selectedFilterDate) {
      worksFoundEl.innerHTML = `<b>${filtered.length}</b> จาก ${worksheets.length} รายการ <span style="color:var(--accent-cyan); font-size:0.84rem;">(วันที่ ${formatThaiDate(selectedFilterDate)})</span>`;
    } else if (selectedFilterMonth) {
      const [y, m] = selectedFilterMonth.split('-').map(Number);
      const thaiMonths = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
      worksFoundEl.innerHTML = `<b>${filtered.length}</b> จาก ${worksheets.length} รายการ <span style="color:var(--accent-cyan); font-size:0.84rem;">(เดือน ${thaiMonths[m - 1]} ${y + 543})</span>`;
    } else {
      worksFoundEl.innerText = `${filtered.length} จาก ${worksheets.length} รายการ`;
    }
  }
}

function renderProfileInfo() {
  const profile = profileData || DEFAULT_PROFILE;

  // Render timeline with school photos
  const timelineEl = document.getElementById('education-timeline');
  if (timelineEl && profile.education) {
    timelineEl.innerHTML = profile.education.map((item, idx) => `
      <div class="timeline-item" data-edu-id="${item.id || idx}">
        <div class="timeline-dot"></div>
        <div class="timeline-header-row">
          <span class="timeline-date">${item.period}</span>
          <button type="button" class="btn-edu-edit" onclick="openEditEducationModal('${item.id || idx}')" title="เปลี่ยนรูปหรือแก้ไขข้อมูลโรงเรียนนี้">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
            เปลี่ยนรูป / แก้ไข
          </button>
        </div>
        <h4 class="timeline-title">${item.title}</h4>
        <div class="timeline-sub">${item.sub}</div>
        <p class="timeline-desc">${item.desc}</p>

        ${item.image ? `
          <div class="school-photo-card" onclick="openEduLightbox('${item.id || idx}')" title="คลิกเพื่อดูภาพโรงเรียนขนาดใหญ่ (ความละเอียดสูง)">
            <div class="school-photo-wrapper">
              <img src="${item.image}" alt="${item.sub}" class="school-photo-img" loading="lazy" />
              <div class="school-photo-overlay">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line><line x1="11" y1="8" x2="11" y2="14"></line><line x1="8" y1="11" x2="14" y2="11"></line></svg>
                <span>คลิกดูภาพขนาดใหญ่</span>
              </div>
            </div>
            ${item.caption ? `<div class="school-photo-caption">🏫 ${item.caption}</div>` : ''}
          </div>
        ` : ''}
      </div>
    `).join('');
  }

  // Render skills
  const skillsContainer = document.getElementById('skills-container');
  if (skillsContainer && DEFAULT_PROFILE.skills) {
    skillsContainer.innerHTML = DEFAULT_PROFILE.skills.map(sk => `
      <div class="skill-bar-wrapper">
        <div class="skill-info">
          <span>${sk.name}</span>
          <span style="color: var(--accent-cyan);">${sk.level}%</span>
        </div>
        <div class="skill-progress-bg">
          <div class="skill-progress-fill" style="width: ${sk.level}%;"></div>
        </div>
      </div>
    `).join('');
  }
}

function renderFeaturedWorks() {
  const featuredContainer = document.getElementById('featured-works-grid');
  if (!featuredContainer) return;

  const featured = worksheets.slice(0, 3);
  featuredContainer.innerHTML = featured.map(work => createWorkCardHTML(work)).join('');
}

let selectedFilterDate = null;
let selectedFilterMonth = null;

function getDatesWithWorksheets() {
  const set = new Set();
  worksheets.forEach(w => {
    const iso = w.rawDate || toInputDateFormat(w.date);
    if (iso) set.add(iso);
  });
  return set;
}

function getFilteredWorksheets() {
  return worksheets.filter(work => {
    const query = currentSearch.toLowerCase().trim();
    const matchesSearch = !query || 
      work.title.toLowerCase().includes(query) ||
      (work.date && work.date.toLowerCase().includes(query)) ||
      (work.subject && work.subject.toLowerCase().includes(query));

    const workIso = work.rawDate || toInputDateFormat(work.date);

    let matchesDate = true;
    if (selectedFilterDate) {
      matchesDate = (workIso === selectedFilterDate);
    } else if (selectedFilterMonth) {
      matchesDate = Boolean(workIso && workIso.startsWith(selectedFilterMonth));
    }

    return matchesSearch && matchesDate;
  });
}

function renderWorksheetsGrid() {
  const container = document.getElementById('all-worksheets-grid');
  if (!container) return;

  const filtered = getFilteredWorksheets();

  if (filtered.length === 0) {
    if (selectedFilterDate) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">📅</div>
          <h3>ไม่พบใบงานในวันที่เลือก (${formatThaiDate(selectedFilterDate)})</h3>
          <p style="color: var(--text-muted); margin-top: 6px;">ยังไม่มีการบันทึกใบงานในวันที่นี้</p>
          <button type="button" class="btn btn-cyan" onclick="clearDateFilter()" style="margin-top: 14px; font-size: 0.88rem;">
            แสดงใบงานทั้งหมด
          </button>
        </div>
      `;
    } else if (selectedFilterMonth) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">📅</div>
          <h3>ไม่พบใบงานในเดือนที่เลือก (${selectedFilterMonth})</h3>
          <p style="color: var(--text-muted); margin-top: 6px;">ยังไม่มีการบันทึกใบงานในเดือนนี้</p>
          <button type="button" class="btn btn-cyan" onclick="clearDateFilter()" style="margin-top: 14px; font-size: 0.88rem;">
            แสดงใบงานทั้งหมด
          </button>
        </div>
      `;
    } else {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">📂</div>
          <h3>ไม่พบใบงานที่ตรงกับการค้นหา</h3>
          <p style="color: var(--text-muted); margin-top: 6px;">ลองค้นหาด้วยคำอื่น หรือกด "ทั้งหมด"</p>
          <button type="button" class="btn btn-cyan" onclick="clearDateFilter()" style="margin-top: 14px; font-size: 0.88rem;">
            แสดงใบงานทั้งหมด
          </button>
        </div>
      `;
    }
    return;
  }

  container.innerHTML = filtered.map(work => createWorkCardHTML(work)).join('');
}

function createWorkCardHTML(work) {
  return `
    <article class="work-card" data-id="${work.id}">
      <div class="work-thumb-wrapper" style="cursor: pointer;" onclick="openWorkDetail('${work.id}')">
        <img class="work-thumb" src="${work.image || 'assets/images/work1.jpg'}" alt="${work.title}" loading="lazy" />
      </div>
      <div class="work-body">
        <div class="work-date">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
          ${work.date}
        </div>
        <h3 class="work-title" style="cursor: pointer;" onclick="openWorkDetail('${work.id}')">${work.title}</h3>

        <div class="work-footer" style="margin-top: auto;">
          <button class="btn-card-action view" onclick="openWorkDetail('${work.id}')">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
            ดูรูปใบงาน
          </button>
          ${work.link ? `
            <a href="${formatUrl(work.link)}" target="_blank" rel="noopener noreferrer" class="btn-card-action download" title="เปิดลิงก์ใบงาน/เอกสาร" style="flex:0 0 auto; padding:8px 12px; text-decoration:none;">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg>
              ลิงก์
            </a>
          ` : ''}
          <button class="btn-card-action edit" onclick="openEditModal('${work.id}')" title="แก้ไขชื่อ/รูป/ลิงก์ใบงาน">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
            แก้ไข
          </button>
          <button class="btn-card-action delete" onclick="deleteWorksheet('${work.id}')" title="ลบใบงานนี้">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
            ลบ
          </button>
        </div>
      </div>
    </article>
  `;
}

/* ---------------- Embedded Interactive Calendar ---------------- */
let addCalendarInstance = null;
let editCalendarInstance = null;
let filterCalendarInstance = null;

function initInteractiveCalendar(containerId, inputId, labelId, initialDateStr, onDateSelect) {
  const container = document.getElementById(containerId);
  const input = inputId ? document.getElementById(inputId) : null;
  const label = labelId ? document.getElementById(labelId) : null;
  if (!container) return null;

  // Selected date ISO (YYYY-MM-DD)
  let selectedIso = initialDateStr ? toInputDateFormat(initialDateStr) : new Date().toISOString().split('T')[0];

  // View month & year (displayed in calendar)
  let [sY, sM] = selectedIso.split('-').map(Number);
  let viewYear = sY || new Date().getFullYear();
  let viewMonth = sM ? sM - 1 : new Date().getMonth();

  const thaiMonths = [
    'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
    'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
  ];
  const thaiWeekDays = ['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส'];

  function updateDisplay() {
    if (input) input.value = selectedIso;
    if (label) {
      label.innerText = formatThaiDate(selectedIso);
    }
  }

  function render() {
    const thaiYear = viewYear + 543;
    const monthName = thaiMonths[viewMonth];

    // First day of month (0 = Sunday, 1 = Monday, ...)
    const firstDayIndex = new Date(viewYear, viewMonth, 1).getDay();
    // Total days in month
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();

    // Today's ISO
    const now = new Date();
    const todayIso = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

    // Get dates with worksheets for indicator dots
    const workDates = typeof getDatesWithWorksheets === 'function' ? getDatesWithWorksheets() : new Set();

    let html = `
      <div class="calendar-header">
        <div class="calendar-title">
          <span>📅 ${monthName} ${thaiYear}</span>
        </div>
        <div class="calendar-nav-btns">
          <button type="button" class="cal-today-btn" data-cal-action="today">วันนี้</button>
          <button type="button" class="cal-nav-btn" data-cal-action="prev" title="เดือนก่อนหน้า">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="15 18 9 12 15 6"></polyline></svg>
          </button>
          <button type="button" class="cal-nav-btn" data-cal-action="next" title="เดือนถัดไป">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="9 18 15 12 9 6"></polyline></svg>
          </button>
        </div>
      </div>
      <div class="calendar-weekdays">
        ${thaiWeekDays.map(d => `<div>${d}</div>`).join('')}
      </div>
      <div class="calendar-grid">
    `;

    // Blank cells before first day of month
    for (let i = 0; i < firstDayIndex; i++) {
      html += `<div class="cal-day-cell empty"></div>`;
    }

    // Days in current month
    for (let day = 1; day <= daysInMonth; day++) {
      const dayPad = String(day).padStart(2, '0');
      const monthPad = String(viewMonth + 1).padStart(2, '0');
      const thisCellIso = `${viewYear}-${monthPad}-${dayPad}`;

      let classNames = ['cal-day-cell'];
      if (thisCellIso === selectedIso) {
        classNames.push('selected');
      }
      if (thisCellIso === todayIso) {
        classNames.push('today');
      }
      if (workDates.has(thisCellIso)) {
        classNames.push('has-work');
      }

      html += `<button type="button" class="${classNames.join(' ')}" data-iso="${thisCellIso}" title="${formatThaiDate(thisCellIso)}${workDates.has(thisCellIso) ? ' (มีใบงาน)' : ''}">${day}</button>`;
    }

    html += `</div>`;
    container.innerHTML = html;

    // Attach navigation & selection handlers
    const prevBtn = container.querySelector('[data-cal-action="prev"]');
    const nextBtn = container.querySelector('[data-cal-action="next"]');
    const todayBtn = container.querySelector('[data-cal-action="today"]');

    if (prevBtn) {
      prevBtn.onclick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        viewMonth--;
        if (viewMonth < 0) {
          viewMonth = 11;
          viewYear--;
        }
        render();
      };
    }

    if (nextBtn) {
      nextBtn.onclick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        viewMonth++;
        if (viewMonth > 11) {
          viewMonth = 0;
          viewYear++;
        }
        render();
      };
    }

    if (todayBtn) {
      todayBtn.onclick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        const curr = new Date();
        viewYear = curr.getFullYear();
        viewMonth = curr.getMonth();
        selectedIso = `${curr.getFullYear()}-${String(curr.getMonth() + 1).padStart(2, '0')}-${String(curr.getDate()).padStart(2, '0')}`;
        updateDisplay();
        render();
        if (typeof onDateSelect === 'function') {
          onDateSelect(selectedIso);
        }
      };
    }

    container.querySelectorAll('.cal-day-cell[data-iso]').forEach(cell => {
      cell.onclick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        selectedIso = cell.getAttribute('data-iso');
        updateDisplay();
        render();
        if (typeof onDateSelect === 'function') {
          onDateSelect(selectedIso);
        }
      };
    });
  }

  updateDisplay();
  render();

  return {
    setDate: (newDateStr) => {
      selectedIso = toInputDateFormat(newDateStr || new Date().toISOString().split('T')[0]);
      const [y, m] = selectedIso.split('-').map(Number);
      if (y && m) {
        viewYear = y;
        viewMonth = m - 1;
      }
      updateDisplay();
      render();
    },
    getDate: () => selectedIso,
    getViewMonthIso: () => `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}`,
    refresh: () => render()
  };
}

/* ---------------- Date Filter Controller Functions ---------------- */
window.applyDateFilter = function(iso) {
  selectedFilterDate = iso;
  selectedFilterMonth = null;

  const btnAll = document.getElementById('btn-filter-all');
  const btnCal = document.getElementById('btn-calendar-filter');
  const calText = document.getElementById('cal-filter-btn-text');

  if (btnAll) btnAll.classList.remove('active');
  if (btnCal) {
    btnCal.classList.add('active');
    const [y, m, d] = iso.split('-').map(Number);
    const shortThaiMonths = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
    const thaiYear = y + 543;
    if (calText) {
      calText.innerText = `📅 ${d} ${shortThaiMonths[m - 1]} ${thaiYear} ✕`;
    }
  }

  renderWorksheetsGrid();
  updateStats();
  showToast(`กรองใบงานวันที่: ${formatThaiDate(iso)} 📅`);
};

window.applyMonthFilter = function(monthIso) {
  selectedFilterMonth = monthIso;
  selectedFilterDate = null;

  const btnAll = document.getElementById('btn-filter-all');
  const btnCal = document.getElementById('btn-calendar-filter');
  const calText = document.getElementById('cal-filter-btn-text');

  if (btnAll) btnAll.classList.remove('active');
  if (btnCal) {
    btnCal.classList.add('active');
    const [y, m] = monthIso.split('-').map(Number);
    const thaiMonths = [
      'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
      'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
    ];
    if (calText) {
      calText.innerText = `📅 เดือน${thaiMonths[m - 1]} ${y + 543} ✕`;
    }
  }

  renderWorksheetsGrid();
  updateStats();
  showToast(`กรองใบงานประจำเดือน: ${monthIso} 📅`);
};

window.clearDateFilter = function() {
  selectedFilterDate = null;
  selectedFilterMonth = null;

  const btnAll = document.getElementById('btn-filter-all');
  const btnCal = document.getElementById('btn-calendar-filter');
  const calText = document.getElementById('cal-filter-btn-text');

  if (btnAll) btnAll.classList.add('active');
  if (btnCal) {
    btnCal.classList.remove('active');
    btnCal.classList.remove('open');
    if (calText) calText.innerText = 'เลือกดูตามวันที่ (ปฏิทิน)';
  }

  renderWorksheetsGrid();
  updateStats();
};

/* ---------------- Event Listeners ---------------- */
function setupEventListeners() {
  // Theme toggle
  if (themeToggleBtn) {
    themeToggleBtn.addEventListener('click', toggleTheme);
  }

  // Filter: All Worksheets
  const btnFilterAll = document.getElementById('btn-filter-all');
  if (btnFilterAll) {
    btnFilterAll.addEventListener('click', () => {
      clearDateFilter();
    });
  }

  // Filter: Calendar Trigger Button & Popover
  const btnCalFilter = document.getElementById('btn-calendar-filter');
  const calPopover = document.getElementById('filter-calendar-popover');
  const closeCalPopoverBtn = document.getElementById('btn-close-cal-popover');
  const btnFilterClear = document.getElementById('btn-filter-clear');
  const btnFilterThisMonth = document.getElementById('btn-filter-this-month');

  if (btnCalFilter && calPopover) {
    btnCalFilter.addEventListener('click', (e) => {
      e.stopPropagation();
      // If already filtered and clicked, allow user to either re-open calendar or clear
      const isOpen = calPopover.classList.toggle('active');
      btnCalFilter.classList.toggle('open', isOpen);
      if (isOpen && filterCalendarInstance) {
        filterCalendarInstance.refresh();
      }
    });
  }

  if (closeCalPopoverBtn && calPopover) {
    closeCalPopoverBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      calPopover.classList.remove('active');
      if (btnCalFilter) btnCalFilter.classList.remove('open');
    });
  }

  // Click outside to close calendar popover
  document.addEventListener('click', (e) => {
    const calContainer = document.getElementById('cal-filter-container');
    if (calPopover && calPopover.classList.contains('active')) {
      if (calContainer && !calContainer.contains(e.target)) {
        calPopover.classList.remove('active');
        if (btnCalFilter) btnCalFilter.classList.remove('open');
      }
    }
  });

  // Search Input
  const searchInput = document.getElementById('search-worksheet');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      currentSearch = e.target.value;
      renderWorksheetsGrid();
      updateStats();
    });
  }

  // Initialize interactive calendars
  const todayIso = new Date().toISOString().split('T')[0];
  addCalendarInstance = initInteractiveCalendar('add-calendar-picker', 'add-date', 'add-date-label', todayIso);
  editCalendarInstance = initInteractiveCalendar('edit-calendar-picker', 'edit-date', 'edit-date-label', todayIso);

  // Initialize Filter Calendar Popover
  const initialFilterDate = worksheets.length > 0 && worksheets[0].date
    ? (worksheets[0].rawDate || toInputDateFormat(worksheets[0].date))
    : todayIso;

  filterCalendarInstance = initInteractiveCalendar(
    'filter-calendar-picker',
    'filter-selected-date',
    null,
    initialFilterDate,
    (chosenIso) => {
      applyDateFilter(chosenIso);
      if (calPopover) calPopover.classList.remove('active');
      if (btnCalFilter) btnCalFilter.classList.remove('open');
    }
  );

  if (btnFilterThisMonth) {
    btnFilterThisMonth.addEventListener('click', (e) => {
      e.stopPropagation();
      if (!filterCalendarInstance) return;
      const viewMonthIso = filterCalendarInstance.getViewMonthIso();
      applyMonthFilter(viewMonthIso);
      if (calPopover) calPopover.classList.remove('active');
      if (btnCalFilter) btnCalFilter.classList.remove('open');
    });
  }

  if (btnFilterClear) {
    btnFilterClear.addEventListener('click', (e) => {
      e.stopPropagation();
      clearDateFilter();
      if (calPopover) calPopover.classList.remove('active');
      if (btnCalFilter) btnCalFilter.classList.remove('open');
    });
  }

  // Add Worksheet Modal
  const openAddBtn = document.getElementById('btn-open-add-modal');
  if (openAddBtn) {
    openAddBtn.addEventListener('click', () => {
      const nowIso = new Date().toISOString().split('T')[0];
      if (addCalendarInstance) {
        addCalendarInstance.setDate(nowIso);
      }
      addModal.classList.add('active');
    });
  }

  // Close modals on click backdrop or close button
  document.querySelectorAll('.modal-close, .btn-modal-cancel').forEach(btn => {
    btn.addEventListener('click', () => {
      closeAllModals();
    });
  });

  [detailModal, addModal, editModal, editEduModal].forEach(modal => {
    if (modal) {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) {
          closeAllModals();
        }
      });
    }
  });

  // Image Upload Handling (Add Modal)
  const addFileInput = document.getElementById('add-image-file');
  const addPlaceholder = document.getElementById('add-upload-placeholder');
  const addPreview = document.getElementById('add-image-preview');
  const btnRemoveAddImage = document.getElementById('btn-remove-add-image');

  if (addFileInput) {
    addFileInput.addEventListener('change', (e) => {
      const file = e.target.files && e.target.files[0];
      if (file) {
        processImageFile(file, (dataUrl) => {
          currentAddImageBase64 = dataUrl;
          if (addPreview) {
            addPreview.src = dataUrl;
            addPreview.classList.add('has-image');
          }
          if (addPlaceholder) addPlaceholder.style.display = 'none';
          if (btnRemoveAddImage) btnRemoveAddImage.style.display = 'inline-block';
        });
      }
    });
  }

  if (btnRemoveAddImage) {
    btnRemoveAddImage.addEventListener('click', () => {
      currentAddImageBase64 = null;
      if (addFileInput) addFileInput.value = '';
      if (addPreview) {
        addPreview.src = '';
        addPreview.classList.remove('has-image');
      }
      if (addPlaceholder) addPlaceholder.style.display = 'flex';
      btnRemoveAddImage.style.display = 'none';
    });
  }

  // Image Upload Handling (Edit Modal)
  const editFileInput = document.getElementById('edit-image-file');
  const editPreview = document.getElementById('edit-image-preview');
  if (editFileInput) {
    editFileInput.addEventListener('change', (e) => {
      const file = e.target.files && e.target.files[0];
      if (file) {
        processImageFile(file, (dataUrl) => {
          currentEditImageBase64 = dataUrl;
          if (editPreview) {
            editPreview.src = dataUrl;
            editPreview.classList.add('has-image');
          }
        });
      }
    });
  }

  // Add Worksheet Form Submit
  const addForm = document.getElementById('add-worksheet-form');
  if (addForm) {
    addForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const titleInput = document.getElementById('add-title');
      const title = titleInput ? titleInput.value.trim() : '';

      if (!title) return;

      const dateInput = document.getElementById('add-date');
      const rawDate = dateInput && dateInput.value ? dateInput.value : new Date().toISOString().split('T')[0];
      const formattedDate = formatThaiDate(rawDate);

      const linkInput = document.getElementById('add-link');
      const link = linkInput ? linkInput.value.trim() : '';

      // Use user attached image, or fallback to sample images
      const sampleImages = ['assets/images/work1.jpg', 'assets/images/work2.jpg', 'assets/images/work3.jpg'];
      const chosenImage = currentAddImageBase64 || sampleImages[Math.floor(Math.random() * sampleImages.length)];

      const newWork = {
        id: 'work-' + Date.now(),
        title: title,
        date: formattedDate,
        rawDate: rawDate,
        link: link,
        subject: 'ใบงานการเรียนรู้',
        category: 'web',
        status: 'done',
        statusText: 'ส่งแล้ว',
        score: 'ส่งแล้ว',
        grade: '-',
        image: chosenImage,
        description: `บันทึกผลงานและใบงาน: ${title}`,
        objectives: [
          'ส่งงานตามกำหนดและมีเนื้อหาครบถ้วนตามข้อกำหนด',
          'ประยุกต์ใช้ความรู้จากบทเรียนได้อย่างเหมาะสม'
        ],
        tools: ['เอกสารประกอบการเรียน', 'คอมพิวเตอร์'],
        instructorComment: 'บันทึกในระบบเรียบร้อยแล้ว',
        fileLink: link || '#'
      };

      worksheets.unshift(newWork);
      saveWorksheets();
      renderAll();
      closeAllModals();
      addForm.reset();

      // Reset image preview state & link input
      currentAddImageBase64 = null;
      if (addFileInput) addFileInput.value = '';
      if (linkInput) linkInput.value = '';
      if (addPreview) {
        addPreview.src = '';
        addPreview.classList.remove('has-image');
      }
      if (addPlaceholder) addPlaceholder.style.display = 'flex';
      if (btnRemoveAddImage) btnRemoveAddImage.style.display = 'none';
      if (addCalendarInstance) {
        addCalendarInstance.setDate(new Date().toISOString().split('T')[0]);
      }

      showToast(`เพิ่มใบงาน "${title}" วันที่ ${formattedDate} สำเร็จเรียบร้อย! 🎉`);
    });
  }

  // Edit Worksheet Form Submit
  const editForm = document.getElementById('edit-worksheet-form');
  if (editForm) {
    editForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const id = document.getElementById('edit-work-id').value;
      const titleInput = document.getElementById('edit-title');
      const newTitle = titleInput ? titleInput.value.trim() : '';
      const editDateInput = document.getElementById('edit-date');
      const rawDate = editDateInput && editDateInput.value ? editDateInput.value : '';
      const editLinkInput = document.getElementById('edit-link');
      const newLink = editLinkInput ? editLinkInput.value.trim() : '';

      if (!newTitle) return;

      const targetWork = worksheets.find(w => w.id === id);
      if (targetWork) {
        targetWork.title = newTitle;
        if (rawDate) {
          targetWork.date = formatThaiDate(rawDate);
          targetWork.rawDate = rawDate;
        }
        targetWork.link = newLink;
        targetWork.fileLink = newLink || '#';
        targetWork.description = `บันทึกผลงานและใบงาน: ${newTitle}`;
        if (currentEditImageBase64) {
          targetWork.image = currentEditImageBase64;
        }
        currentEditImageBase64 = null;

        saveWorksheets();
        renderAll();
        closeAllModals();
        showToast(`แก้ไขใบงาน "${newTitle}" เรียบร้อยแล้ว! ✏️`);
      }
    });
  }

  // Edit Education Image Upload Handling
  const editEduFileInput = document.getElementById('edit-edu-image-file');
  const editEduPreview = document.getElementById('edit-edu-image-preview');
  const editEduPlaceholder = document.getElementById('edit-edu-upload-placeholder');
  if (editEduFileInput) {
    editEduFileInput.addEventListener('change', (e) => {
      const file = e.target.files && e.target.files[0];
      if (file) {
        processImageFile(file, (dataUrl) => {
          currentEditEduImageBase64 = dataUrl;
          if (editEduPreview) {
            editEduPreview.src = dataUrl;
            editEduPreview.classList.add('has-image');
          }
          if (editEduPlaceholder) editEduPlaceholder.style.display = 'none';
        });
      }
    });
  }

  // Edit Education Form Submit
  const editEduForm = document.getElementById('edit-education-form');
  if (editEduForm) {
    editEduForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const id = document.getElementById('edit-edu-id').value;
      const title = document.getElementById('edit-edu-title').value.trim();
      const school = document.getElementById('edit-edu-school').value.trim();
      const period = document.getElementById('edit-edu-period').value.trim();
      const caption = document.getElementById('edit-edu-caption').value.trim();
      const desc = document.getElementById('edit-edu-desc').value.trim();

      if (!profileData) profileData = JSON.parse(JSON.stringify(DEFAULT_PROFILE));

      const item = profileData.education.find(it => (it.id === id)) || profileData.education[id];
      if (item) {
        item.title = title;
        item.sub = school;
        item.period = period;
        item.caption = caption;
        item.desc = desc;
        if (currentEditEduImageBase64) {
          item.image = currentEditEduImageBase64;
        }
        currentEditEduImageBase64 = null;
        saveProfile();
        closeAllModals();
        showToast(`บันทึกข้อมูลโรงเรียน "${school}" เรียบร้อยแล้ว 🏫`);
      }
    });
  }

  // Lightbox Toolbar Controls
  const btnZoomIn = document.getElementById('btn-zoom-in');
  const btnZoomOut = document.getElementById('btn-zoom-out');
  const btnZoomReset = document.getElementById('btn-zoom-reset');
  const btnOpenNewTab = document.getElementById('btn-open-newtab');
  const btnCloseLightbox = document.getElementById('btn-close-lightbox');

  if (btnZoomIn) btnZoomIn.addEventListener('click', () => updateLightboxZoom(currentZoom + 0.3));
  if (btnZoomOut) btnZoomOut.addEventListener('click', () => updateLightboxZoom(currentZoom - 0.3));
  if (btnZoomReset) btnZoomReset.addEventListener('click', () => updateLightboxZoom(1));
  if (btnOpenNewTab) {
    btnOpenNewTab.addEventListener('click', () => {
      if (!currentLightboxSrc) return;
      const win = window.open('');
      if (win) {
        win.document.write(`
          <!DOCTYPE html>
          <html>
          <head><title>ภาพใบงานต้นฉบับความละเอียดสูง</title></head>
          <body style="margin:0; background:#0b0f19; display:flex; justify-content:center; align-items:center; min-height:100vh;">
            <img src="${currentLightboxSrc}" style="max-width:100%; height:auto;" />
          </body>
          </html>
        `);
      }
    });
  }
  if (btnCloseLightbox) btnCloseLightbox.addEventListener('click', closeLightbox);

  if (lightboxModal) {
    lightboxModal.addEventListener('click', (e) => {
      if (e.target === lightboxModal || e.target.id === 'lightbox-container') {
        closeLightbox();
      }
    });

    // Mouse wheel zoom inside lightbox
    lightboxModal.addEventListener('wheel', (e) => {
      e.preventDefault();
      if (e.deltaY < 0) {
        updateLightboxZoom(currentZoom + 0.15);
      } else {
        updateLightboxZoom(currentZoom - 0.15);
      }
    }, { passive: false });
  }

  // Escape key closes lightbox and modals
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeLightbox();
      closeAllModals();
    }
  });
}

function closeAllModals() {
  if (detailModal) detailModal.classList.remove('active');
  if (addModal) addModal.classList.remove('active');
  if (editModal) editModal.classList.remove('active');
  if (editEduModal) editEduModal.classList.remove('active');
}

/* ---------------- Helper: Process & Keep High-Res Image File ---------------- */
function processImageFile(file, callback) {
  if (!file) return;
  const reader = new FileReader();

  // If under 8MB, keep 100% RAW original quality & resolution without downscaling!
  if (file.size <= 8 * 1024 * 1024) {
    reader.onload = (e) => {
      callback(e.target.result);
    };
    reader.readAsDataURL(file);
    return;
  }

  // If extremely large (>8MB), preserve high resolution up to 3200px at 0.96 quality
  reader.onload = (e) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let width = img.width;
      let height = img.height;
      const maxDim = 3200;

      if (width > maxDim || height > maxDim) {
        if (width > height) {
          height = Math.round((height * maxDim) / width);
          width = maxDim;
        } else {
          width = Math.round((width * maxDim) / height);
          height = maxDim;
        }
      }

      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0, width, height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.96);
      callback(dataUrl);
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
}

/* ---------------- Worksheet Detail View ---------------- */
window.openWorkDetail = function(id) {
  const work = worksheets.find(w => w.id === id);
  if (!work) return;

  const contentEl = document.getElementById('worksheet-detail-content');
  if (!contentEl) return;

  contentEl.innerHTML = `
    <div class="detail-preview-container" onclick="openLightbox('${work.id}')" title="คลิกเพื่อดูรูปภาพขนาดใหญ่เต็มจอ (ความละเอียดสูง)">
      <img src="${work.image || 'assets/images/work1.jpg'}" alt="${work.title}" class="detail-preview-img" style="max-height: 520px; object-fit: contain; width: 100%; display: block;" />
      <div class="detail-preview-hint">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line><line x1="11" y1="8" x2="11" y2="14"></line><line x1="8" y1="11" x2="14" y2="11"></line></svg>
        คลิกดูภาพขนาดใหญ่เต็มจอ (ความละเอียดสูง)
      </div>
    </div>
    
    <div style="margin-top: 1.25rem;">
      <div style="font-size: 0.88rem; color: var(--text-muted); display: flex; align-items: center; gap: 6px; margin-bottom: 6px;">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
        วันที่: ${work.date}
      </div>
      <h2 style="font-size: 1.5rem; color: var(--text-main); font-weight: 700; line-height: 1.4;">${work.title}</h2>
      
      ${work.link ? `
        <div style="margin-top: 1.25rem;">
          <a href="${formatUrl(work.link)}" target="_blank" rel="noopener noreferrer" class="btn btn-cyan" style="display:inline-flex; align-items:center; gap:8px; padding:10px 20px; font-size:0.95rem; text-decoration:none; border-radius:var(--radius-md);">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg>
            🔗 เปิดดูลิงก์ผลงาน / ไฟล์งาน
          </a>
        </div>
      ` : ''}
    </div>

    <div style="display:flex; gap:10px; margin-top:1.5rem; padding-top:1rem; border-top:1px solid var(--border-subtle); flex-wrap:wrap;">
      <button class="btn-card-action edit" style="padding:10px 16px; border-radius:var(--radius-sm);" onclick="closeAllModals(); openEditModal('${work.id}')">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
        แก้ไขชื่อและรูปใบงานนี้
      </button>
      <button class="btn-card-action delete" style="padding:10px 16px; border-radius:var(--radius-sm); flex:0 0 auto;" onclick="deleteWorksheet('${work.id}')">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
        ลบใบงานนี้
      </button>
    </div>
  `;

  detailModal.classList.add('active');
};

/* ---------------- Lightbox Fullscreen Image Viewer ---------------- */
window.openLightbox = function(idOrSrc, customTitle) {
  let src = idOrSrc;
  let title = customTitle || 'รูปภาพใบงาน';

  const work = worksheets.find(w => w.id === idOrSrc);
  if (work) {
    src = work.image || 'assets/images/work1.jpg';
    title = work.title;
  }

  currentLightboxSrc = src;
  currentZoom = 1;

  if (lightboxImg) {
    lightboxImg.src = src;
    lightboxImg.style.transform = `scale(1)`;
  }
  if (lightboxTitle) lightboxTitle.innerText = title;

  const resetBtn = document.getElementById('btn-zoom-reset');
  if (resetBtn) resetBtn.innerText = '100%';

  if (lightboxModal) {
    lightboxModal.classList.add('active');
    document.body.style.overflow = 'hidden';
  }
};

window.closeLightbox = function() {
  if (lightboxModal) {
    lightboxModal.classList.remove('active');
    document.body.style.overflow = '';
  }
  currentZoom = 1;
};

function updateLightboxZoom(newZoom) {
  currentZoom = Math.max(0.4, Math.min(newZoom, 5));
  if (lightboxImg) {
    lightboxImg.style.transform = `scale(${currentZoom})`;
  }
  const resetBtn = document.getElementById('btn-zoom-reset');
  if (resetBtn) {
    resetBtn.innerText = `${Math.round(currentZoom * 100)}%`;
  }
}

/* ---------------- Edit & Delete Worksheet Handlers ---------------- */
window.openEditModal = function(id) {
  const work = worksheets.find(w => w.id === id);
  if (!work) return;

  currentEditImageBase64 = null;
  const editIdInput = document.getElementById('edit-work-id');
  const editTitleInput = document.getElementById('edit-title');
  const editDateInput = document.getElementById('edit-date');
  const editPreview = document.getElementById('edit-image-preview');
  const editFileInput = document.getElementById('edit-image-file');
  const editLinkInput = document.getElementById('edit-link');

  if (editFileInput) editFileInput.value = '';
  if (editIdInput) editIdInput.value = work.id;
  if (editTitleInput) editTitleInput.value = work.title;
  const workDate = work.rawDate || toInputDateFormat(work.date);
  if (editDateInput) editDateInput.value = workDate;
  if (editCalendarInstance) {
    editCalendarInstance.setDate(workDate);
  }
  if (editLinkInput) editLinkInput.value = work.link || '';

  if (editPreview) {
    editPreview.src = work.image || 'assets/images/work1.jpg';
    editPreview.classList.add('has-image');
  }

  if (editModal) {
    editModal.classList.add('active');
    setTimeout(() => {
      if (editTitleInput) {
        editTitleInput.focus();
        editTitleInput.select();
      }
    }, 100);
  }
};

window.openEditEducationModal = function(eduId) {
  const profile = profileData || DEFAULT_PROFILE;
  if (!profile || !profile.education) return;

  const item = profile.education.find(e => (e.id === eduId)) || profile.education[eduId];
  if (!item) return;

  currentEditEduImageBase64 = null;

  const idInput = document.getElementById('edit-edu-id');
  const titleInput = document.getElementById('edit-edu-title');
  const schoolInput = document.getElementById('edit-edu-school');
  const periodInput = document.getElementById('edit-edu-period');
  const captionInput = document.getElementById('edit-edu-caption');
  const descInput = document.getElementById('edit-edu-desc');
  const fileInput = document.getElementById('edit-edu-image-file');
  const preview = document.getElementById('edit-edu-image-preview');
  const placeholder = document.getElementById('edit-edu-upload-placeholder');

  if (fileInput) fileInput.value = '';
  if (idInput) idInput.value = item.id || eduId;
  if (titleInput) titleInput.value = item.title || '';
  if (schoolInput) schoolInput.value = item.sub || '';
  if (periodInput) periodInput.value = item.period || '';
  if (captionInput) captionInput.value = item.caption || '';
  if (descInput) descInput.value = item.desc || '';

  if (preview) {
    if (item.image) {
      preview.src = item.image;
      preview.classList.add('has-image');
      if (placeholder) placeholder.style.display = 'none';
    } else {
      preview.src = '';
      preview.classList.remove('has-image');
      if (placeholder) placeholder.style.display = 'flex';
    }
  }

  if (editEduModal) {
    editEduModal.classList.add('active');
  }
};

window.openEduLightbox = function(eduId) {
  const profile = profileData || DEFAULT_PROFILE;
  if (!profile || !profile.education) return;
  const item = profile.education.find(e => (e.id === eduId)) || profile.education[eduId];
  if (item && item.image) {
    window.openLightbox(item.image, `${item.sub} - ${item.title}`);
  }
};

/* ---------------- Helper: URL & Date Formatters ---------------- */
function formatUrl(url) {
  if (!url) return '#';
  if (!/^https?:\/\//i.test(url)) {
    return 'https://' + url;
  }
  return url;
}

function formatThaiDate(dateStr) {
  if (!dateStr) return new Intl.DateTimeFormat('th-TH', { dateStyle: 'long' }).format(new Date());
  if (!dateStr.includes('-')) return dateStr;
  const [y, m, d] = dateStr.split('-').map(Number);
  const dateObj = new Date(y, m - 1, d);
  return new Intl.DateTimeFormat('th-TH', { dateStyle: 'long' }).format(dateObj);
}

function toInputDateFormat(dateStr) {
  if (!dateStr) return new Date().toISOString().split('T')[0];
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr;

  const thaiMonths = [
    'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
    'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
  ];

  const parts = dateStr.trim().split(/\s+/);
  if (parts.length >= 3) {
    const day = parts[0].padStart(2, '0');
    const monthIndex = thaiMonths.findIndex(m => parts[1].includes(m));
    let year = parseInt(parts[2], 10);
    if (year > 2400) year -= 543;
    if (monthIndex !== -1 && !isNaN(year)) {
      const month = String(monthIndex + 1).padStart(2, '0');
      return `${year}-${month}-${day}`;
    }
  }

  return new Date().toISOString().split('T')[0];
}

window.deleteWorksheet = function(id) {
  const work = worksheets.find(w => w.id === id);
  if (!work) return;

  const confirmed = confirm(`คุณต้องการลบใบงาน "${work.title}" ใช่หรือไม่?\n(การกระทำนี้จะลบใบงานออกจากระบบ)`);
  if (!confirmed) return;

  worksheets = worksheets.filter(w => w.id !== id);
  saveWorksheets();
  renderAll();
  closeAllModals();
  showToast(`ลบใบงาน "${work.title}" เรียบร้อยแล้ว 🗑️`);
};

/* ---------------- Helper Utilities ---------------- */
window.simulateDownload = function(title) {
  showToast(`กำลังเปิดไฟล์เอกสารสำหรับ: "${title}" 📄`);
};

window.copyContact = function(text, label) {
  if (navigator.clipboard) {
    navigator.clipboard.writeText(text).then(() => {
      showToast(`คัดลอก ${label} เรียบร้อยแล้ว: ${text}`);
    });
  } else {
    showToast(`${label}: ${text}`);
  }
};

window.resetSampleData = function() {
  if (confirm('ต้องการรีเซ็ตข้อมูลใบงานกลับเป็นค่าเริ่มต้นหรือไม่?')) {
    worksheets = [...DEFAULT_WORKSHEETS];
    saveWorksheets();
    renderAll();
    showToast('รีเซ็ตข้อมูลกลับสู่ค่าเริ่มต้นเรียบร้อยแล้ว');
  }
};

function showToast(message) {
  if (!toastContainer) return;

  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.innerHTML = `
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--accent-cyan)" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/></svg>
    <span>${message}</span>
  `;

  toastContainer.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(10px)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 3200);
}
