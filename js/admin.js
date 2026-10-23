/**
 * Admin Portal Logic for Pakawat Portfolio
 * Handles authentication, worksheets CRUD, education logos, and profile management
 */

// Storage Keys
const STORAGE_WORKS_KEY = 'pakawat_worksheets_data';
const STORAGE_PROFILE_KEY = 'pakawat_profile_data';
const STORAGE_THEME_KEY = 'pakawat_theme_pref';
const STORAGE_PIN_KEY = 'pakawat_admin_pin';
const STORAGE_ADMIN_AUTH_KEY = 'pakawat_admin_session_auth';
const DEFAULT_PIN = '1234';

// Real-Time Cross-Tab Synchronization
const REALTIME_CHANNEL_NAME = 'pakawat_realtime_sync';
let realtimeChannel = null;
try {
  if ('BroadcastChannel' in window) {
    realtimeChannel = new BroadcastChannel(REALTIME_CHANNEL_NAME);
  }
} catch (e) {
  console.warn('BroadcastChannel error:', e);
}

function broadcastRealtimeSync(type, payload = {}) {
  if (realtimeChannel) {
    try {
      realtimeChannel.postMessage({
        type: type,
        timestamp: Date.now(),
        ...payload
      });
    } catch (e) {
      console.warn('Error broadcasting sync:', e);
    }
  }
}

// State
let worksheets = [];
let profileData = null;
let currentSearch = '';
let selectedFilterDate = null;
let currentAddImageBase64 = null;
let currentEditImageBase64 = null;
let currentEditEduImageBase64 = null;

// DOM Elements
const loginScreen = document.getElementById('admin-login-screen');
const mainDashboard = document.getElementById('admin-main-dashboard');
const loginForm = document.getElementById('admin-login-page-form');
const pinInput = document.getElementById('admin-pin-page-input');
const rememberCheck = document.getElementById('admin-remember-page');
const loginError = document.getElementById('admin-login-page-error');
const themeToggleBtn = document.getElementById('theme-toggle-btn');

// Modals
const addModal = document.getElementById('add-worksheet-modal');
const editModal = document.getElementById('edit-worksheet-modal');
const editEduModal = document.getElementById('edit-education-modal');
const changePinModal = document.getElementById('change-pin-modal');
const lightboxModal = document.getElementById('image-lightbox-modal');
const lightboxImg = document.getElementById('lightbox-img');
const lightboxTitle = document.getElementById('lightbox-image-title');
const toastContainer = document.getElementById('toast-container');

// Lightbox state
let currentZoom = 1;
let currentLightboxSrc = '';

// Calendar instances
let addCalendarInstance = null;
let editCalendarInstance = null;
let adminFilterCalendarInstance = null;

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  initData();
  checkAuthentication();
  setupEventListeners();
});

/* ---------------- Authentication ---------------- */
function checkAuthentication() {
  const isAuth = sessionStorage.getItem(STORAGE_ADMIN_AUTH_KEY) === 'true' ||
    localStorage.getItem(STORAGE_ADMIN_AUTH_KEY) === 'true';

  if (isAuth) {
    showDashboard();
  } else {
    showLoginScreen();
  }
}

function showLoginScreen() {
  if (loginScreen) loginScreen.style.display = 'flex';
  if (mainDashboard) mainDashboard.style.display = 'none';
  if (pinInput) {
    pinInput.value = '';
    setTimeout(() => pinInput.focus(), 150);
  }
}

function showDashboard() {
  if (loginScreen) loginScreen.style.display = 'none';
  if (mainDashboard) mainDashboard.style.display = 'block';

  // Initialize interactive calendars
  const todayIso = new Date().toISOString().split('T')[0];
  if (!addCalendarInstance) {
    addCalendarInstance = initInteractiveCalendar('add-calendar-picker', 'add-date', 'add-date-label', todayIso);
  }
  if (!editCalendarInstance) {
    editCalendarInstance = initInteractiveCalendar('edit-calendar-picker', 'edit-date', 'edit-date-label', todayIso);
  }
  if (!adminFilterCalendarInstance) {
    adminFilterCalendarInstance = initInteractiveCalendar(
      'admin-filter-calendar-picker',
      null,
      null,
      todayIso,
      (iso) => {
        applyAdminDateFilter(iso);
        closeAdminCalPopover();
      }
    );
  }

  renderAdminAll();
}

window.togglePinVisibility = function (inputId) {
  const el = document.getElementById(inputId);
  if (el) {
    el.type = el.type === 'password' ? 'text' : 'password';
  }
};

window.adminLogout = function () {
  if (confirm('คุณต้องการออกจากระบบผู้ดูแล (Admin) ใช่หรือไม่?')) {
    sessionStorage.removeItem(STORAGE_ADMIN_AUTH_KEY);
    localStorage.removeItem(STORAGE_ADMIN_AUTH_KEY);
    showLoginScreen();
    showToast('ออกจากระบบผู้ดูแลเรียบร้อยแล้ว 👋');
  }
};

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
    ? `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>`
    : `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>`;
}

/* ---------------- Data Management ---------------- */
function initData() {
  const storedWorks = localStorage.getItem(STORAGE_WORKS_KEY);
  if (storedWorks) {
    try {
      worksheets = JSON.parse(storedWorks);
    } catch (e) {
      worksheets = [...DEFAULT_WORKSHEETS];
    }
  } else {
    worksheets = [...DEFAULT_WORKSHEETS];
    localStorage.setItem(STORAGE_WORKS_KEY, JSON.stringify(worksheets));
  }

  const storedProfile = localStorage.getItem(STORAGE_PROFILE_KEY);
  if (storedProfile) {
    try {
      profileData = JSON.parse(storedProfile);
    } catch (e) {
      profileData = JSON.parse(JSON.stringify(DEFAULT_PROFILE));
    }
  } else {
    profileData = JSON.parse(JSON.stringify(DEFAULT_PROFILE));
    localStorage.setItem(STORAGE_PROFILE_KEY, JSON.stringify(profileData));
  }

  if (profileData) {
    if (!profileData.education || !Array.isArray(profileData.education) || profileData.education.length === 0) {
      profileData.education = JSON.parse(JSON.stringify(DEFAULT_PROFILE.education));
    }
    if (!profileData.skills || !Array.isArray(profileData.skills) || profileData.skills.length === 0) {
      profileData.skills = JSON.parse(JSON.stringify(DEFAULT_PROFILE.skills));
    }
    if (!profileData.typewriterPhrases || !Array.isArray(profileData.typewriterPhrases) || profileData.typewriterPhrases.length === 0) {
      profileData.typewriterPhrases = JSON.parse(JSON.stringify(DEFAULT_PROFILE.typewriterPhrases));
    }
    window.profileData = profileData;
  }

  // Auto-upgrade if local cache still has old v1 placeholder values
  if (profileData && profileData.brandTitle === 'ภควัต' && !profileData.brandLogoImage && (profileData.heroGpa === '3.85' || !profileData.avatarImage)) {
    profileData = JSON.parse(JSON.stringify(DEFAULT_PROFILE));
    localStorage.setItem(STORAGE_PROFILE_KEY, JSON.stringify(profileData));
    window.profileData = profileData;
  }
  if (worksheets && worksheets.length === 5 && worksheets.some(w => w.id === 'work-5')) {
    worksheets = JSON.parse(JSON.stringify(DEFAULT_WORKSHEETS));
    localStorage.setItem(STORAGE_WORKS_KEY, JSON.stringify(worksheets));
  }

  // Initialize Cloud Sync in Admin with real-time updates
  if (typeof CloudSync !== 'undefined') {
    CloudSync.init((cloudData) => {
      if (cloudData) {
        let changed = false;
        if (cloudData.worksheets && Array.isArray(cloudData.worksheets)) {
          worksheets = cloudData.worksheets;
          localStorage.setItem(STORAGE_WORKS_KEY, JSON.stringify(worksheets));
          changed = true;
        }
        if (cloudData.profile && typeof cloudData.profile === 'object') {
          profileData = Object.assign({}, DEFAULT_PROFILE, cloudData.profile);
          if (!profileData.education || !Array.isArray(profileData.education) || profileData.education.length === 0) {
            profileData.education = JSON.parse(JSON.stringify(DEFAULT_PROFILE.education));
          }
          if (!profileData.skills || !Array.isArray(profileData.skills) || profileData.skills.length === 0) {
            profileData.skills = JSON.parse(JSON.stringify(DEFAULT_PROFILE.skills));
          }
          if (!profileData.typewriterPhrases || !Array.isArray(profileData.typewriterPhrases) || profileData.typewriterPhrases.length === 0) {
            profileData.typewriterPhrases = JSON.parse(JSON.stringify(DEFAULT_PROFILE.typewriterPhrases));
          }
          window.profileData = profileData;
          localStorage.setItem(STORAGE_PROFILE_KEY, JSON.stringify(profileData));
          changed = true;
        }
        if (changed) {
          renderAdminAll();
        }
      }
    });
  }
}

function saveWorksheets() {
  localStorage.setItem(STORAGE_WORKS_KEY, JSON.stringify(worksheets));
  renderAdminAll();
  if (adminFilterCalendarInstance) {
    adminFilterCalendarInstance.refresh();
  }
  broadcastRealtimeSync('WORKSHEETS_UPDATED', { count: worksheets.length });
  if (typeof CloudSync !== 'undefined') {
    CloudSync.saveToCloud(profileData, worksheets).then(res => {
      if (res && res.success) {
        showToast('☁️ ใบงานซิงค์ขึ้น Google Cloud แล้ว! ทุกคนที่เปิดเว็บจะเห็นทันที');
      }
    });
  }
}

function saveProfile() {
  localStorage.setItem(STORAGE_PROFILE_KEY, JSON.stringify(profileData));
  renderAdminEducation();
  renderAdminBrand();
  renderAdminHero();
  broadcastRealtimeSync('PROFILE_UPDATED');
  if (typeof CloudSync !== 'undefined') {
    CloudSync.saveToCloud(profileData, worksheets).then(res => {
      if (res && res.success) {
        showToast('☁️ ข้อมูลส่วนตัวซิงค์ขึ้น Google Cloud แล้ว! ทุกคนจะเห็นอัปเดตทันที');
      }
    });
  }
}

/* ---------------- Tab Switching ---------------- */
window.switchAdminTab = function (tabName) {
  const tabWorks = document.getElementById('admin-tab-works');
  const tabEdu = document.getElementById('admin-tab-edu');
  const tabBrand = document.getElementById('admin-tab-brand');
  const tabHero = document.getElementById('admin-tab-hero');
  const tabBackup = document.getElementById('admin-tab-backup');
  const tabCloud = document.getElementById('admin-tab-cloud');
  const btnWorks = document.getElementById('tab-btn-works');
  const btnEdu = document.getElementById('tab-btn-edu');
  const btnBrand = document.getElementById('tab-btn-brand');
  const btnHero = document.getElementById('tab-btn-hero');
  const btnBackup = document.getElementById('tab-btn-backup');
  const btnCloud = document.getElementById('tab-btn-cloud');

  if (tabWorks) tabWorks.style.display = (tabName === 'works') ? 'block' : 'none';
  if (tabEdu) tabEdu.style.display = (tabName === 'edu') ? 'block' : 'none';
  if (tabBrand) tabBrand.style.display = (tabName === 'brand') ? 'block' : 'none';
  if (tabHero) tabHero.style.display = (tabName === 'hero') ? 'block' : 'none';
  if (tabBackup) tabBackup.style.display = (tabName === 'backup') ? 'block' : 'none';
  if (tabCloud) tabCloud.style.display = (tabName === 'cloud') ? 'block' : 'none';

  if (btnWorks) btnWorks.classList.toggle('active', tabName === 'works');
  if (btnEdu) btnEdu.classList.toggle('active', tabName === 'edu');
  if (btnBrand) btnBrand.classList.toggle('active', tabName === 'brand');
  if (btnHero) btnHero.classList.toggle('active', tabName === 'hero');
  if (btnBackup) btnBackup.classList.toggle('active', tabName === 'backup');
  if (btnCloud) btnCloud.classList.toggle('active', tabName === 'cloud');

  if (tabName === 'backup') {
    if (typeof renderBackupStats === 'function') renderBackupStats();
    if (typeof renderLocalSnapshots === 'function') renderLocalSnapshots();
  }
  if (tabName === 'cloud') {
    if (typeof renderAdminCloud === 'function') renderAdminCloud();
  }
};

/* ---------------- Render Admin Content ---------------- */
function renderAdminAll() {
  // Update stats
  const statWorksEl = document.getElementById('admin-stat-works-count');
  const tabWorksCountEl = document.getElementById('tab-works-count');
  if (statWorksEl) statWorksEl.innerText = worksheets.length;
  if (tabWorksCountEl) tabWorksCountEl.innerText = worksheets.length;

  renderAdminWorksheets();
  renderAdminEducation();
  renderAdminBrand();
  renderAdminHero();
}

let currentBrandLogoBase64 = null;

function renderAdminBrand() {
  const profile = profileData || DEFAULT_PROFILE;
  const def = DEFAULT_PROFILE;
  const siteTitle = (profile && profile.siteTitle) || def.siteTitle || 'ภควัต (Pakawat) | พอร์ตโฟลิโอ & คลังเก็บใบงาน';
  const siteFavicon = (profile && profile.siteFavicon) || def.siteFavicon || '🚀';
  const badge = (profile && profile.brandBadge) || 'P';
  const logoImg = (profile && profile.brandLogoImage) || '';
  const name = (profile && profile.brandTitle) || 'ภควัต';
  const sub = (profile && profile.brandSubtitle !== undefined) ? profile.brandSubtitle : 'Portfolio';

  currentBrandLogoBase64 = logoImg;

  const titleInput = document.getElementById('input-site-title');
  const faviconInput = document.getElementById('input-site-favicon');
  const badgeInput = document.getElementById('input-brand-badge');
  const nameInput = document.getElementById('input-brand-name');
  const subInput = document.getElementById('input-brand-subtitle');
  const previewImg = document.getElementById('brand-logo-preview-img');
  const placeholder = document.getElementById('brand-logo-placeholder');
  const clearBtn = document.getElementById('btn-clear-logo-img');
  const clearFaviconBtn = document.getElementById('btn-clear-favicon-img');

  if (titleInput && document.activeElement !== titleInput) titleInput.value = siteTitle;
  if (faviconInput && document.activeElement !== faviconInput) faviconInput.value = siteFavicon;
  if (badgeInput && document.activeElement !== badgeInput) badgeInput.value = badge;
  if (nameInput && document.activeElement !== nameInput) nameInput.value = name;
  if (subInput && document.activeElement !== subInput) subInput.value = sub;

  if (clearFaviconBtn) {
    const isImage = siteFavicon && (siteFavicon.startsWith('data:') || siteFavicon.startsWith('http') || siteFavicon.includes('.'));
    clearFaviconBtn.style.display = isImage ? 'inline-block' : 'none';
  }

  if (logoImg) {
    if (previewImg) {
      previewImg.src = logoImg;
      previewImg.classList.add('has-image');
    }
    if (placeholder) placeholder.style.display = 'none';
    if (clearBtn) clearBtn.style.display = 'inline-block';
  } else {
    if (previewImg) {
      previewImg.src = '';
      previewImg.classList.remove('has-image');
    }
    if (placeholder) placeholder.style.display = 'flex';
    if (clearBtn) clearBtn.style.display = 'none';
  }

  updateBrandPreview();

  const headerName = document.getElementById('admin-header-name');
  if (headerName) {
    headerName.innerText = name;
  }
}

window.handleFaviconUpload = function (fileInput) {
  const file = fileInput.files && fileInput.files[0];
  if (!file) return;

  processImageFile(file, (dataUrl) => {
    const faviconInput = document.getElementById('input-site-favicon');
    if (faviconInput) faviconInput.value = dataUrl;
    const clearFaviconBtn = document.getElementById('btn-clear-favicon-img');
    if (clearFaviconBtn) clearFaviconBtn.style.display = 'inline-block';
    updateBrandPreview();
    showToast('โหลดรูปภาพโลโก้สำหรับไอคอนแท็บเรียบร้อย! (อย่าลืมกดบันทึก)');
  });
};

window.useBrandLogoAsFavicon = function () {
  if (currentBrandLogoBase64) {
    const faviconInput = document.getElementById('input-site-favicon');
    if (faviconInput) faviconInput.value = currentBrandLogoBase64;
    const clearFaviconBtn = document.getElementById('btn-clear-favicon-img');
    if (clearFaviconBtn) clearFaviconBtn.style.display = 'inline-block';
    updateBrandPreview();
    showToast('นำรูปโลโก้เว็บไซต์มาเป็นไอคอนแท็บแล้ว! (อย่าลืมกดบันทึก)');
  } else {
    showToast('ยังไม่มีรูปโลโก้เว็บไซต์ กรุณาอัปโหลดรูปโลโก้ด้านล่างก่อนครับ', 'error');
  }
};

window.useAvatarAsFavicon = function () {
  const profile = profileData || DEFAULT_PROFILE;
  const avatar = profile.avatarImage || 'assets/images/avatar.jpg';
  const faviconInput = document.getElementById('input-site-favicon');
  if (faviconInput) faviconInput.value = avatar;
  const clearFaviconBtn = document.getElementById('btn-clear-favicon-img');
  if (clearFaviconBtn) clearFaviconBtn.style.display = 'inline-block';
  updateBrandPreview();
  showToast('นำรูปโปรไฟล์มาเป็นไอคอนแท็บแล้ว! (อย่าลืมกดบันทึก)');
};

window.clearFaviconImage = function () {
  const fileInput = document.getElementById('favicon-file');
  if (fileInput) fileInput.value = '';
  const faviconInput = document.getElementById('input-site-favicon');
  if (faviconInput) faviconInput.value = '';
  const clearFaviconBtn = document.getElementById('btn-clear-favicon-img');
  if (clearFaviconBtn) clearFaviconBtn.style.display = 'none';
  updateBrandPreview();
  showToast('ลบรูปภาพไอคอนแท็บแล้ว');
};

window.setFaviconEmoji = function (emoji) {
  const faviconInput = document.getElementById('input-site-favicon');
  if (faviconInput) {
    faviconInput.value = emoji;
    updateBrandPreview();
  }
};

window.handleBrandLogoUpload = function (fileInput) {
  const file = fileInput.files && fileInput.files[0];
  if (!file) return;

  processImageFile(file, (dataUrl) => {
    currentBrandLogoBase64 = dataUrl;
    const previewImg = document.getElementById('brand-logo-preview-img');
    const placeholder = document.getElementById('brand-logo-placeholder');
    const clearBtn = document.getElementById('btn-clear-logo-img');

    if (previewImg) {
      previewImg.src = dataUrl;
      previewImg.classList.add('has-image');
    }
    if (placeholder) placeholder.style.display = 'none';
    if (clearBtn) clearBtn.style.display = 'inline-block';

    updateBrandPreview();
    showToast('โหลดรูปภาพโลโก้เข้าพรีวิวแล้ว (อย่าลืมกดบันทึก)');
  });
};

window.clearLogoImage = function () {
  currentBrandLogoBase64 = '';
  const fileInput = document.getElementById('brand-logo-file');
  const previewImg = document.getElementById('brand-logo-preview-img');
  const placeholder = document.getElementById('brand-logo-placeholder');
  const clearBtn = document.getElementById('btn-clear-logo-img');

  if (fileInput) fileInput.value = '';
  if (previewImg) {
    previewImg.src = '';
    previewImg.classList.remove('has-image');
  }
  if (placeholder) placeholder.style.display = 'flex';
  if (clearBtn) clearBtn.style.display = 'none';

  updateBrandPreview();
  showToast('ลบรูปภาพโลโก้แล้ว (สลับมาใช้ตัวอักษรย่อ)');
};

window.updateBrandPreview = function () {
  const titleInput = document.getElementById('input-site-title');
  const faviconInput = document.getElementById('input-site-favicon');
  const badgeInput = document.getElementById('input-brand-badge');
  const nameInput = document.getElementById('input-brand-name');
  const subInput = document.getElementById('input-brand-subtitle');

  const titleVal = titleInput ? titleInput.value.trim() || 'ภควัต (Pakawat) | พอร์ตโฟลิโอ & คลังเก็บใบงาน' : 'ภควัต (Pakawat) | พอร์ตโฟลิโอ & คลังเก็บใบงาน';
  const faviconVal = faviconInput ? faviconInput.value.trim() : '';
  const badge = badgeInput ? badgeInput.value.trim() || 'P' : 'P';
  const name = nameInput ? nameInput.value.trim() || 'ภควัต' : 'ภควัต';
  const sub = subInput ? subInput.value.trim() : 'Portfolio';

  // Update Browser Tab Live Preview
  const previewTabFavicon = document.getElementById('preview-tab-favicon');
  const previewTabTitle = document.getElementById('preview-tab-title');
  if (previewTabFavicon) {
    if (faviconVal && (faviconVal.startsWith('data:') || faviconVal.startsWith('http') || faviconVal.startsWith('assets/') || faviconVal.includes('.'))) {
      previewTabFavicon.innerHTML = `<img src="${faviconVal}" alt="Favicon" style="width:18px; height:18px; object-fit:contain; border-radius:3px; display:inline-block; vertical-align:middle;" />`;
    } else {
      previewTabFavicon.innerText = faviconVal || '🚀';
    }
  }
  if (previewTabTitle) previewTabTitle.innerText = titleVal;

  const previewBadge = document.getElementById('preview-brand-badge');
  const previewText = document.getElementById('preview-brand-text');

  if (previewBadge) {
    if (currentBrandLogoBase64) {
      previewBadge.innerHTML = `<img src="${currentBrandLogoBase64}" alt="Logo" class="logo-badge-img" style="width:100%; height:100%; object-fit:cover; display:block;" />`;
      previewBadge.style.background = 'transparent';
      previewBadge.style.padding = '0';
    } else {
      previewBadge.innerText = badge;
      previewBadge.style.background = 'linear-gradient(135deg, var(--accent-cyan), var(--accent-blue))';
      previewBadge.style.padding = '';
    }
  }

  if (previewText) {
    previewText.innerHTML = `${name} ${sub ? `<b style="color:var(--accent-cyan);">${sub}</b>` : ''}`;
  }
};

window.handleBrandSave = function (e) {
  if (e) e.preventDefault();
  const titleInput = document.getElementById('input-site-title');
  const faviconInput = document.getElementById('input-site-favicon');
  const badgeInput = document.getElementById('input-brand-badge');
  const nameInput = document.getElementById('input-brand-name');
  const subInput = document.getElementById('input-brand-subtitle');

  if (!profileData) profileData = JSON.parse(JSON.stringify(DEFAULT_PROFILE));

  profileData.siteTitle = titleInput ? titleInput.value.trim() || DEFAULT_PROFILE.siteTitle : DEFAULT_PROFILE.siteTitle;
  profileData.siteFavicon = faviconInput ? faviconInput.value.trim() || '🚀' : '🚀';
  profileData.brandBadge = badgeInput ? badgeInput.value.trim() || 'P' : 'P';
  profileData.brandLogoImage = (currentBrandLogoBase64 !== null) ? currentBrandLogoBase64 : (profileData.brandLogoImage || '');
  profileData.brandTitle = nameInput ? nameInput.value.trim() || 'ภควัต' : 'ภควัต';
  profileData.brandSubtitle = subInput ? subInput.value.trim() : '';

  saveProfile();
  showToast(`บันทึกชื่อแท็บ & โลโก้เว็บไซต์ "${profileData.siteTitle}" สำเร็จเรียบร้อย! ✨`);
};

window.resetBrandDefaults = function () {
  if (confirm('ต้องการรีเซ็ตชื่อและโลโก้เว็บไซต์กลับเป็นค่าเริ่มต้นหรือไม่?')) {
    if (!profileData) profileData = JSON.parse(JSON.stringify(DEFAULT_PROFILE));
    currentBrandLogoBase64 = '';
    profileData.siteTitle = DEFAULT_PROFILE.siteTitle;
    profileData.siteFavicon = DEFAULT_PROFILE.siteFavicon;
    profileData.brandBadge = 'P';
    profileData.brandLogoImage = '';
    profileData.brandTitle = 'ภควัต';
    profileData.brandSubtitle = 'Portfolio';

    const fileInput = document.getElementById('brand-logo-file');
    if (fileInput) fileInput.value = '';

    saveProfile();
    renderAdminBrand();
    showToast('รีเซ็ตชื่อและโลโก้เว็บไซต์กลับเป็นค่าเริ่มต้นแล้ว');
  }
};

/* ---------------- Hero Banner & Avatar Management ---------------- */
let currentHeroAvatarBase64 = null;
let currentHeroBannerImageBase64 = null;

function renderAdminHero() {
  const profile = profileData || DEFAULT_PROFILE;
  const def = DEFAULT_PROFILE;

  const tag = (profile && profile.heroTag) || def.heroTag || 'คลังเก็บผลงานและใบงานออนไลน์';
  const greeting = (profile && profile.heroGreeting) || def.heroGreeting || 'สวัสดีครับ, ผม';
  const name = (profile && profile.heroName) || (profile && profile.brandTitle) || def.heroName || 'ภควัต';
  const sub = (profile && profile.heroSubtitle) || def.heroSubtitle || 'ยินดีต้อนรับสู่พื้นที่รวมงาน';
  const desc = (profile && profile.heroDesc) || def.heroDesc || '';
  const avatar = (profile && profile.avatarImage) || '';
  const bannerImg = (profile && profile.heroBannerImage) || '';
  const bannerBg = (profile && profile.heroBannerBg) || '';
  const bannerOverlay = (profile && profile.heroBannerOverlay) !== undefined ? profile.heroBannerOverlay : '70';
  const bannerHeight = (profile && profile.heroBannerHeight) || '';
  const bannerFit = (profile && profile.heroBannerFit) || 'cover';
  const avatarSize = (profile && profile.heroAvatarSize) || '300';
  const avatarZoom = (profile && profile.heroAvatarZoom) || '100';
  const avatarPosY = (profile && profile.heroAvatarPosY) !== undefined ? profile.heroAvatarPosY : '50';
  const majorIcon = (profile && profile.heroMajorIcon) || def.heroMajorIcon || '💻';
  const majorLabel = (profile && profile.heroMajorLabel) || def.heroMajorLabel || 'สาขาการเรียน';
  const majorVal = (profile && profile.heroMajorVal) || def.heroMajorVal || 'วิทย์-คณิต-คอมฯ';
  const gpa = (profile && (profile.heroGpa || profile.gpa)) || def.heroGpa || '3.85';
  const gpaLabel = (profile && profile.heroGpaLabel) || def.heroGpaLabel || 'เกรดเฉลี่ยสะสม (GPA)';
  const commit = (profile && profile.heroCommitment) || def.heroCommitment || '100%';
  const commitLabel = (profile && profile.heroCommitmentLabel) || def.heroCommitmentLabel || 'ความตั้งใจและส่งตรงเวลา';

  currentHeroAvatarBase64 = avatar;
  currentHeroBannerImageBase64 = bannerImg;

  const tagInput = document.getElementById('input-hero-tag');
  const greetingInput = document.getElementById('input-hero-greeting');
  const nameInput = document.getElementById('input-hero-name');
  const subInput = document.getElementById('input-hero-sub');
  const descInput = document.getElementById('input-hero-desc');
  const bannerBgInput = document.getElementById('input-hero-banner-bg');
  const bannerColorPicker = document.getElementById('input-hero-banner-color-picker');
  const bannerOverlayInput = document.getElementById('input-hero-banner-overlay');
  const bannerOverlayText = document.getElementById('hero-overlay-val-text');
  const bannerHeightInput = document.getElementById('input-hero-banner-height');
  const bannerHeightText = document.getElementById('hero-banner-height-val-text');
  const bannerFitSelect = document.getElementById('select-hero-banner-fit');
  const avatarSizeInput = document.getElementById('input-hero-avatar-size');
  const avatarSizeText = document.getElementById('hero-avatar-size-val-text');
  const avatarZoomInput = document.getElementById('input-hero-avatar-zoom');
  const avatarZoomText = document.getElementById('hero-avatar-zoom-val-text');
  const avatarPosYInput = document.getElementById('input-hero-avatar-posy');
  const avatarPosYText = document.getElementById('hero-avatar-posy-val-text');
  const majorIconInput = document.getElementById('input-hero-major-icon');
  const majorLabelInput = document.getElementById('input-hero-major-label');
  const majorValInput = document.getElementById('input-hero-major-val');
  const gpaInput = document.getElementById('input-hero-gpa');
  const gpaLabelInput = document.getElementById('input-hero-gpa-label');
  const commitInput = document.getElementById('input-hero-commit');
  const commitLabelInput = document.getElementById('input-hero-commit-label');

  if (tagInput && document.activeElement !== tagInput) tagInput.value = tag;
  if (greetingInput && document.activeElement !== greetingInput) greetingInput.value = greeting;
  if (nameInput && document.activeElement !== nameInput) nameInput.value = name;
  if (subInput && document.activeElement !== subInput) subInput.value = sub;
  const typewriterInput = document.getElementById('input-hero-typewriter');
  const typewriterPhrases = (profile && profile.typewriterPhrases && Array.isArray(profile.typewriterPhrases) && profile.typewriterPhrases.length > 0)
    ? profile.typewriterPhrases
    : ((def && def.typewriterPhrases) || []);
  if (typewriterInput && document.activeElement !== typewriterInput) {
    typewriterInput.value = typewriterPhrases.join('\n');
  }
  if (descInput && document.activeElement !== descInput) descInput.value = desc;

  if (bannerBgInput && document.activeElement !== bannerBgInput) bannerBgInput.value = bannerBg;
  if (bannerColorPicker && bannerBg && bannerBg.startsWith('#') && bannerBg.length === 7) {
    bannerColorPicker.value = bannerBg;
  }
  if (bannerOverlayInput) bannerOverlayInput.value = bannerOverlay;
  if (bannerOverlayText) bannerOverlayText.innerText = `${bannerOverlay}%`;

  if (bannerHeightInput) bannerHeightInput.value = bannerHeight || '420';
  if (bannerHeightText) bannerHeightText.innerText = bannerHeight ? `${bannerHeight} px` : 'อัตโนมัติ (Default)';
  if (bannerFitSelect) bannerFitSelect.value = bannerFit;

  if (avatarSizeInput) avatarSizeInput.value = avatarSize;
  if (avatarSizeText) avatarSizeText.innerText = `${avatarSize} px`;
  if (avatarZoomInput) avatarZoomInput.value = avatarZoom;
  if (avatarZoomText) avatarZoomText.innerText = `${avatarZoom}%`;
  if (avatarPosYInput) avatarPosYInput.value = avatarPosY;
  if (avatarPosYText) avatarPosYText.innerText = `${avatarPosY}% (${avatarPosY == 50 ? 'กลาง' : avatarPosY < 50 ? 'บน' : 'ล่าง'})`;

  if (majorIconInput && document.activeElement !== majorIconInput) majorIconInput.value = majorIcon;
  if (majorLabelInput && document.activeElement !== majorLabelInput) majorLabelInput.value = majorLabel;
  if (majorValInput && document.activeElement !== majorValInput) majorValInput.value = majorVal;
  if (gpaInput && document.activeElement !== gpaInput) gpaInput.value = gpa;
  if (gpaLabelInput && document.activeElement !== gpaLabelInput) gpaLabelInput.value = gpaLabel;
  if (commitInput && document.activeElement !== commitInput) commitInput.value = commit;
  if (commitLabelInput && document.activeElement !== commitLabelInput) commitLabelInput.value = commitLabel;

  // Banner preview thumbnail
  const bannerThumb = document.getElementById('hero-banner-thumb');
  const bannerPlaceholder = document.getElementById('hero-banner-placeholder');
  const bannerClearBtn = document.getElementById('btn-clear-banner-img');

  if (bannerImg) {
    if (bannerThumb) {
      bannerThumb.src = bannerImg;
      bannerThumb.classList.add('has-image');
    }
    if (bannerPlaceholder) bannerPlaceholder.style.display = 'none';
    if (bannerClearBtn) bannerClearBtn.style.display = 'inline-block';
  } else {
    if (bannerThumb) {
      bannerThumb.src = '';
      bannerThumb.classList.remove('has-image');
    }
    if (bannerPlaceholder) bannerPlaceholder.style.display = 'flex';
    if (bannerClearBtn) bannerClearBtn.style.display = 'none';
  }

  // Avatar preview thumbnail
  const thumb = document.getElementById('hero-avatar-thumb');
  const placeholder = document.getElementById('hero-avatar-placeholder');
  const clearBtn = document.getElementById('btn-clear-avatar-img');

  if (avatar) {
    if (thumb) {
      thumb.src = avatar;
      thumb.classList.add('has-image');
    }
    if (placeholder) placeholder.style.display = 'none';
    if (clearBtn) clearBtn.style.display = 'inline-block';
  } else {
    if (thumb) {
      thumb.src = '';
      thumb.classList.remove('has-image');
    }
    if (placeholder) placeholder.style.display = 'flex';
    if (clearBtn) clearBtn.style.display = 'none';
  }

  updateHeroPreview();
}

window.handleHeroBannerUpload = function (fileInput) {
  const file = fileInput.files && fileInput.files[0];
  if (!file) return;

  processImageFile(file, (dataUrl) => {
    currentHeroBannerImageBase64 = dataUrl;
    const thumb = document.getElementById('hero-banner-thumb');
    const placeholder = document.getElementById('hero-banner-placeholder');
    const clearBtn = document.getElementById('btn-clear-banner-img');

    if (thumb) {
      thumb.src = dataUrl;
      thumb.classList.add('has-image');
    }
    if (placeholder) placeholder.style.display = 'none';
    if (clearBtn) clearBtn.style.display = 'inline-block';

    updateHeroPreview();
    showToast('โหลดรูปภาพแบนเนอร์เข้าพรีวิวแล้ว (อย่าลืมกดบันทึก)');
  });
};

window.clearBannerImage = function () {
  currentHeroBannerImageBase64 = '';
  const fileInput = document.getElementById('hero-banner-file');
  const thumb = document.getElementById('hero-banner-thumb');
  const placeholder = document.getElementById('hero-banner-placeholder');
  const clearBtn = document.getElementById('btn-clear-banner-img');

  if (fileInput) fileInput.value = '';
  if (thumb) {
    thumb.src = '';
    thumb.classList.remove('has-image');
  }
  if (placeholder) placeholder.style.display = 'flex';
  if (clearBtn) clearBtn.style.display = 'none';

  updateHeroPreview();
  showToast('ลบรูปภาพแบนเนอร์แล้ว (กลับไปใช้สีพื้นหลัง)');
};

window.setBannerBgPreset = function (color) {
  const bgInput = document.getElementById('input-hero-banner-bg');
  const colorPicker = document.getElementById('input-hero-banner-color-picker');
  if (bgInput) bgInput.value = color;
  if (colorPicker && color && color.startsWith('#') && color.length === 7) {
    colorPicker.value = color;
  }
  updateHeroPreview();
  showToast(color ? `เลือกโทนสี ${color} เรียบร้อย` : 'ใช้สีพื้นหลังเริ่มต้นตามระบบ');
};

window.onBannerColorPickerChange = function (val) {
  const bgInput = document.getElementById('input-hero-banner-bg');
  if (bgInput) bgInput.value = val;
  updateHeroPreview();
};

window.onOverlaySliderInput = function (val) {
  const overlayText = document.getElementById('hero-overlay-val-text');
  if (overlayText) overlayText.innerText = `${val}%`;
  updateHeroPreview();
};

window.onBannerHeightSliderInput = function (val) {
  const heightText = document.getElementById('hero-banner-height-val-text');
  if (heightText) heightText.innerText = val ? `${val} px` : 'อัตโนมัติ (Default)';
  updateHeroPreview();
};

window.setBannerHeightPreset = function (val) {
  const heightInput = document.getElementById('input-hero-banner-height');
  const heightText = document.getElementById('hero-banner-height-val-text');
  if (heightInput) heightInput.value = val || '420';
  if (heightText) heightText.innerText = val ? `${val} px` : 'อัตโนมัติ (Default)';
  updateHeroPreview();
};

window.onAvatarSizeSliderInput = function (val) {
  const sizeText = document.getElementById('hero-avatar-size-val-text');
  if (sizeText) sizeText.innerText = `${val} px`;
  updateHeroPreview();
};

window.setAvatarSizePreset = function (val) {
  const sizeInput = document.getElementById('input-hero-avatar-size');
  const sizeText = document.getElementById('hero-avatar-size-val-text');
  if (sizeInput) sizeInput.value = val;
  if (sizeText) sizeText.innerText = `${val} px`;
  updateHeroPreview();
};

window.onAvatarZoomSliderInput = function (val) {
  const zoomText = document.getElementById('hero-avatar-zoom-val-text');
  if (zoomText) zoomText.innerText = `${val}%`;
  updateHeroPreview();
};

window.onAvatarPosYSliderInput = function (val) {
  const posText = document.getElementById('hero-avatar-posy-val-text');
  if (posText) posText.innerText = `${val}% (${val == 50 ? 'กลาง' : val < 50 ? 'บน' : 'ล่าง'})`;
  updateHeroPreview();
};

window.handleHeroAvatarUpload = function (fileInput) {
  const file = fileInput.files && fileInput.files[0];
  if (!file) return;

  processImageFile(file, (dataUrl) => {
    currentHeroAvatarBase64 = dataUrl;
    const thumb = document.getElementById('hero-avatar-thumb');
    const placeholder = document.getElementById('hero-avatar-placeholder');
    const clearBtn = document.getElementById('btn-clear-avatar-img');

    if (thumb) {
      thumb.src = dataUrl;
      thumb.classList.add('has-image');
    }
    if (placeholder) placeholder.style.display = 'none';
    if (clearBtn) clearBtn.style.display = 'inline-block';

    updateHeroPreview();
    showToast('โหลดรูปโปรไฟล์เข้าพรีวิวแล้ว (อย่าลืมกดบันทึก)');
  });
};

window.clearAvatarImage = function () {
  currentHeroAvatarBase64 = '';
  const fileInput = document.getElementById('hero-avatar-file');
  const thumb = document.getElementById('hero-avatar-thumb');
  const placeholder = document.getElementById('hero-avatar-placeholder');
  const clearBtn = document.getElementById('btn-clear-avatar-img');

  if (fileInput) fileInput.value = '';
  if (thumb) {
    thumb.src = '';
    thumb.classList.remove('has-image');
  }
  if (placeholder) placeholder.style.display = 'flex';
  if (clearBtn) clearBtn.style.display = 'none';

  updateHeroPreview();
  showToast('ลบรูปภาพโปรไฟล์แล้ว (สลับมาใช้ภาพเริ่มต้น)');
};

window.updateHeroPreview = function () {
  const tagInput = document.getElementById('input-hero-tag');
  const greetingInput = document.getElementById('input-hero-greeting');
  const nameInput = document.getElementById('input-hero-name');
  const subInput = document.getElementById('input-hero-sub');
  const descInput = document.getElementById('input-hero-desc');
  const bannerBgInput = document.getElementById('input-hero-banner-bg');
  const bannerOverlayInput = document.getElementById('input-hero-banner-overlay');
  const bannerHeightInput = document.getElementById('input-hero-banner-height');
  const bannerFitSelect = document.getElementById('select-hero-banner-fit');
  const avatarSizeInput = document.getElementById('input-hero-avatar-size');
  const avatarZoomInput = document.getElementById('input-hero-avatar-zoom');
  const avatarPosYInput = document.getElementById('input-hero-avatar-posy');
  const majorIconInput = document.getElementById('input-hero-major-icon');
  const majorLabelInput = document.getElementById('input-hero-major-label');
  const majorValInput = document.getElementById('input-hero-major-val');
  const gpaInput = document.getElementById('input-hero-gpa');
  const gpaLabelInput = document.getElementById('input-hero-gpa-label');
  const commitInput = document.getElementById('input-hero-commit');
  const commitLabelInput = document.getElementById('input-hero-commit-label');

  const pTag = document.getElementById('preview-hero-tag');
  const pGreeting = document.getElementById('preview-hero-greeting');
  const pName = document.getElementById('preview-hero-name');
  const pSub = document.getElementById('preview-hero-sub');
  const pDesc = document.getElementById('preview-hero-desc');
  const pAvatar = document.getElementById('preview-hero-avatar-img');
  const pAvatarWrapper = document.getElementById('preview-avatar-wrapper');
  const pBadgeIcon = document.getElementById('preview-hero-badge-icon');
  const pBadgeLabel = document.getElementById('preview-hero-badge-label');
  const pBadgeVal = document.getElementById('preview-hero-badge-val');
  const pStatWorks = document.getElementById('preview-stat-works');
  const pStatBadgeWorks = document.getElementById('preview-stat-badge-works');
  const pStatGpa = document.getElementById('preview-stat-gpa');
  const pStatGpaLabel = document.getElementById('preview-stat-gpa-label');
  const pStatCommit = document.getElementById('preview-stat-commit');
  const pStatCommitLabel = document.getElementById('preview-stat-commit-label');

  // Update Hero Card Background (Banner Image & Color & Overlay & Height & Fit)
  const pCard = document.getElementById('preview-hero-card');
  if (pCard && typeof applyHeroCardBackground === 'function') {
    const bgVal = bannerBgInput ? bannerBgInput.value.trim() : '';
    const overlayVal = bannerOverlayInput ? bannerOverlayInput.value : '70';
    const heightVal = bannerHeightInput && bannerHeightInput.value && bannerHeightInput.value !== '420' ? bannerHeightInput.value : '';
    const fitVal = bannerFitSelect ? bannerFitSelect.value : 'cover';
    applyHeroCardBackground(pCard, currentHeroBannerImageBase64, bgVal, overlayVal, heightVal, fitVal);
  }

  // Update Avatar Sizing, Zoom, and Position
  if (typeof applyAvatarStyles === 'function') {
    const sizeVal = avatarSizeInput ? avatarSizeInput.value : '300';
    const zoomVal = avatarZoomInput ? avatarZoomInput.value : '100';
    const posYVal = avatarPosYInput ? avatarPosYInput.value : '50';
    applyAvatarStyles(pAvatarWrapper, pAvatar, sizeVal, zoomVal, posYVal, true);
  }

  if (pTag) pTag.innerText = (tagInput && tagInput.value.trim()) || 'คลังเก็บผลงานและใบงานออนไลน์';
  if (pGreeting) pGreeting.innerText = ((greetingInput && greetingInput.value.trim()) || 'สวัสดีครับ, ผม').replace(/\s+,/g, ',');
  if (pName) pName.innerText = (nameInput && nameInput.value.trim()) || 'ภควัต';
  if (pSub) {
    const typewriterInput = document.getElementById('input-hero-typewriter');
    if (typewriterInput && typewriterInput.value.trim()) {
      const firstLine = typewriterInput.value.split('\n').map(s => s.trim()).filter(Boolean)[0];
      pSub.innerText = firstLine || (subInput && subInput.value.trim()) || 'ยินดีต้อนรับสู่พื้นที่รวมงาน';
    } else {
      pSub.innerText = (subInput && subInput.value.trim()) || 'ยินดีต้อนรับสู่พื้นที่รวมงาน';
    }
  }
  if (pDesc) pDesc.innerText = (descInput && descInput.value.trim()) || DEFAULT_PROFILE.heroDesc;

  if (pAvatar) {
    pAvatar.src = currentHeroAvatarBase64 || 'assets/images/avatar.jpg';
  }

  if (pBadgeIcon) pBadgeIcon.innerText = (majorIconInput && majorIconInput.value.trim()) || '💻';
  if (pBadgeLabel) pBadgeLabel.innerText = (majorLabelInput && majorLabelInput.value.trim()) || 'สาขาการเรียน';
  if (pBadgeVal) pBadgeVal.innerText = (majorValInput && majorValInput.value.trim()) || 'วิทย์-คณิต-คอมฯ';

  if (pStatWorks) pStatWorks.innerText = worksheets.length;
  if (pStatBadgeWorks) pStatBadgeWorks.innerText = `${worksheets.length} รายการ`;

  if (pStatGpa) pStatGpa.innerText = (gpaInput && gpaInput.value.trim()) || '3.85';
  if (pStatGpaLabel) pStatGpaLabel.innerText = (gpaLabelInput && gpaLabelInput.value.trim()) || 'เกรดเฉลี่ยสะสม (GPA)';
  if (pStatCommit) pStatCommit.innerText = (commitInput && commitInput.value.trim()) || '100%';
  if (pStatCommitLabel) pStatCommitLabel.innerText = (commitLabelInput && commitLabelInput.value.trim()) || 'ความตั้งใจและส่งตรงเวลา';

  // Update Profile Bio Card preview (หน้านี้ด้วย)
  const pProfileCard = document.getElementById('preview-profile-card');
  const pProfileAvatarWrapper = document.getElementById('preview-profile-avatar-wrapper');
  const pProfileAvatarImg = document.getElementById('preview-profile-avatar-img');
  const pProfileName = document.getElementById('preview-profile-name');

  if (pProfileAvatarImg) {
    pProfileAvatarImg.src = currentHeroAvatarBase64 || 'assets/images/avatar.jpg';
  }
  if (pProfileName) {
    pProfileName.innerText = (nameInput && nameInput.value.trim()) || 'ภควัต';
  }

  // Apply avatar zoom/position to profile card preview
  if (typeof applyAvatarStyles === 'function' && pProfileAvatarWrapper && pProfileAvatarImg) {
    const sizeVal = avatarSizeInput ? avatarSizeInput.value : '300';
    const heroSizePx = parseInt(sizeVal, 10) || 300;
    const sidebarPreviewSize = Math.max(100, Math.min(200, Math.round(140 * (heroSizePx / 300))));
    const zoomVal = avatarZoomInput ? avatarZoomInput.value : '100';
    const posYVal = avatarPosYInput ? avatarPosYInput.value : '50';
    applyAvatarStyles(pProfileAvatarWrapper, pProfileAvatarImg, sidebarPreviewSize, zoomVal, posYVal, false);
  }

  // Apply card background + has-bg-image class to profile card preview
  if (pProfileCard && typeof applyProfileCardBackground === 'function') {
    const bgVal = bannerBgInput ? bannerBgInput.value.trim() : '';
    const overlayVal = bannerOverlayInput ? bannerOverlayInput.value : '70';
    const fitVal = bannerFitSelect ? bannerFitSelect.value : 'cover';
    applyProfileCardBackground(pProfileCard, currentHeroBannerImageBase64, bgVal, overlayVal, fitVal);
    if (currentHeroBannerImageBase64) {
      pProfileCard.classList.add('has-bg-image');
    } else {
      pProfileCard.classList.remove('has-bg-image');
    }
  }
};

/* ---------------- Preview Card Tab Switcher ---------------- */
window.switchPreviewCard = function (tab) {
  const heroCard = document.getElementById('preview-hero-card');
  const profileWrapper = document.getElementById('preview-profile-card-wrapper');
  const container = document.getElementById('preview-cards-container');
  const btnHero = document.getElementById('btn-preview-tab-hero');
  const btnProfile = document.getElementById('btn-preview-tab-profile');
  const btnBoth = document.getElementById('btn-preview-tab-both');

  const activeStyle = 'background:var(--accent-cyan); color:#000; font-weight:700;';
  const defaultStyle = '';

  if (btnHero) btnHero.removeAttribute('style');
  if (btnProfile) btnProfile.removeAttribute('style');
  if (btnBoth) btnBoth.removeAttribute('style');

  if (tab === 'hero') {
    if (heroCard) heroCard.style.display = '';
    if (profileWrapper) profileWrapper.style.display = 'none';
    if (container) container.style.gridTemplateColumns = '1fr';
    if (btnHero) btnHero.style.cssText = activeStyle;
  } else if (tab === 'profile') {
    if (heroCard) heroCard.style.display = 'none';
    if (profileWrapper) profileWrapper.style.display = '';
    if (container) container.style.gridTemplateColumns = '1fr';
    if (btnProfile) btnProfile.style.cssText = activeStyle;
  } else {
    if (heroCard) heroCard.style.display = '';
    if (profileWrapper) profileWrapper.style.display = '';
    if (container) container.style.gridTemplateColumns = 'repeat(auto-fit, minmax(350px, 1fr))';
    if (btnBoth) btnBoth.style.cssText = activeStyle;
  }
};

window.handleHeroSave = function (e) {
  if (e) e.preventDefault();
  const tagInput = document.getElementById('input-hero-tag');
  const greetingInput = document.getElementById('input-hero-greeting');
  const nameInput = document.getElementById('input-hero-name');
  const subInput = document.getElementById('input-hero-sub');
  const descInput = document.getElementById('input-hero-desc');
  const bannerBgInput = document.getElementById('input-hero-banner-bg');
  const bannerOverlayInput = document.getElementById('input-hero-banner-overlay');
  const bannerHeightInput = document.getElementById('input-hero-banner-height');
  const bannerFitSelect = document.getElementById('select-hero-banner-fit');
  const avatarSizeInput = document.getElementById('input-hero-avatar-size');
  const avatarZoomInput = document.getElementById('input-hero-avatar-zoom');
  const avatarPosYInput = document.getElementById('input-hero-avatar-posy');
  const majorIconInput = document.getElementById('input-hero-major-icon');
  const majorLabelInput = document.getElementById('input-hero-major-label');
  const majorValInput = document.getElementById('input-hero-major-val');
  const gpaInput = document.getElementById('input-hero-gpa');
  const gpaLabelInput = document.getElementById('input-hero-gpa-label');
  const commitInput = document.getElementById('input-hero-commit');
  const commitLabelInput = document.getElementById('input-hero-commit-label');

  if (!profileData) profileData = JSON.parse(JSON.stringify(DEFAULT_PROFILE));

  profileData.heroTag = (tagInput && tagInput.value.trim()) || 'คลังเก็บผลงานและใบงานออนไลน์';
  profileData.heroGreeting = ((greetingInput && greetingInput.value.trim()) || 'สวัสดีครับ, ผม').replace(/\s+,/g, ',');
  profileData.heroName = (nameInput && nameInput.value.trim()) || 'ภควัต';
  profileData.heroSubtitle = (subInput && subInput.value.trim()) || 'ยินดีต้อนรับสู่พื้นที่รวมงาน';
  const typewriterInput = document.getElementById('input-hero-typewriter');
  if (typewriterInput) {
    const lines = typewriterInput.value.split('\n').map(s => s.trim()).filter(s => s.length > 0);
    profileData.typewriterPhrases = lines.length > 0 ? lines : JSON.parse(JSON.stringify(DEFAULT_PROFILE.typewriterPhrases));
  }
  profileData.heroDesc = (descInput && descInput.value.trim()) || DEFAULT_PROFILE.heroDesc;
  profileData.avatarImage = (currentHeroAvatarBase64 !== null) ? currentHeroAvatarBase64 : (profileData.avatarImage || '');
  profileData.heroBannerImage = (currentHeroBannerImageBase64 !== null) ? currentHeroBannerImageBase64 : (profileData.heroBannerImage || '');
  profileData.heroBannerBg = bannerBgInput ? bannerBgInput.value.trim() : '';
  profileData.heroBannerOverlay = bannerOverlayInput ? bannerOverlayInput.value : '70';
  profileData.heroBannerHeight = bannerHeightInput && bannerHeightInput.value && bannerHeightInput.value !== '420' ? bannerHeightInput.value : '';
  profileData.heroBannerFit = bannerFitSelect ? bannerFitSelect.value : 'cover';
  profileData.heroAvatarSize = avatarSizeInput ? avatarSizeInput.value : '300';
  profileData.heroAvatarZoom = avatarZoomInput ? avatarZoomInput.value : '100';
  profileData.heroAvatarPosY = avatarPosYInput ? avatarPosYInput.value : '50';
  profileData.heroMajorIcon = (majorIconInput && majorIconInput.value.trim()) || '💻';
  profileData.heroMajorLabel = (majorLabelInput && majorLabelInput.value.trim()) || 'สาขาการเรียน';
  profileData.heroMajorVal = (majorValInput && majorValInput.value.trim()) || 'วิทย์-คณิต-คอมฯ';
  profileData.heroGpa = (gpaInput && gpaInput.value.trim()) || '3.85';
  profileData.gpa = profileData.heroGpa;
  profileData.heroGpaLabel = (gpaLabelInput && gpaLabelInput.value.trim()) || 'เกรดเฉลี่ยสะสม (GPA)';
  profileData.heroCommitment = (commitInput && commitInput.value.trim()) || '100%';
  profileData.heroCommitmentLabel = (commitLabelInput && commitLabelInput.value.trim()) || 'ความตั้งใจและส่งตรงเวลา';

  saveProfile();
  showToast(`บันทึกข้อมูลแบนเนอร์หน้าแรก & การปรับขนาดเรียบร้อย! ✨`);
};

window.resetHeroDefaults = function () {
  if (confirm('ต้องการรีเซ็ตแบนเนอร์หน้าแรก รูปโปรไฟล์ และการปรับขนาดกลับเป็นค่าเริ่มต้นหรือไม่?')) {
    if (!profileData) profileData = JSON.parse(JSON.stringify(DEFAULT_PROFILE));
    const def = DEFAULT_PROFILE;

    currentHeroAvatarBase64 = '';
    currentHeroBannerImageBase64 = '';
    profileData.heroTag = def.heroTag;
    profileData.heroGreeting = def.heroGreeting;
    profileData.heroName = def.heroName;
    profileData.heroSubtitle = def.heroSubtitle;
    profileData.typewriterPhrases = JSON.parse(JSON.stringify(def.typewriterPhrases || []));
    profileData.heroDesc = def.heroDesc;
    profileData.avatarImage = '';
    profileData.heroBannerImage = '';
    profileData.heroBannerBg = '';
    profileData.heroBannerOverlay = '70';
    profileData.heroBannerHeight = '';
    profileData.heroBannerFit = 'cover';
    profileData.heroAvatarSize = '300';
    profileData.heroAvatarZoom = '100';
    profileData.heroAvatarPosY = '50';
    profileData.heroMajorIcon = def.heroMajorIcon;
    profileData.heroMajorLabel = def.heroMajorLabel;
    profileData.heroMajorVal = def.heroMajorVal;
    profileData.heroGpa = def.heroGpa;
    profileData.gpa = def.gpa;
    profileData.heroGpaLabel = def.heroGpaLabel;
    profileData.heroCommitment = def.heroCommitment;
    profileData.heroCommitmentLabel = def.heroCommitmentLabel;

    const typewriterInput = document.getElementById('input-hero-typewriter');
    if (typewriterInput) typewriterInput.value = (def.typewriterPhrases || []).join('\n');

    const fileInput = document.getElementById('hero-avatar-file');
    if (fileInput) fileInput.value = '';
    const bannerFileInput = document.getElementById('hero-banner-file');
    if (bannerFileInput) bannerFileInput.value = '';

    saveProfile();
    renderAdminHero();
    showToast('รีเซ็ตแบนเนอร์หน้าแรกกลับเป็นค่าเริ่มต้นแล้ว');
  }
};

window.resetTypewriterDefaultPhrases = function () {
  const typewriterInput = document.getElementById('input-hero-typewriter');
  if (typewriterInput) {
    const defPhrases = (typeof DEFAULT_PROFILE !== 'undefined' && DEFAULT_PROFILE.typewriterPhrases) || [
      "ยินดีต้อนรับสู่พื้นที่รวมงานออนไลน์ ✨",
      "นักศึกษา ปวส. สาขาเทคโนโลยีสารสนเทศ 💻",
      "Web Developer & UI/UX Designer 🎨",
      "IoT & Microcontrollers Innovation ⚡",
      "เกรดเฉลี่ยสะสม 3.88 • มุ่งมั่นพัฒนาตนเอง 🏆"
    ];
    typewriterInput.value = defPhrases.join('\n');
    updateHeroPreview();
    showToast('โหลดชุดข้อความตัวพิมพ์ดีดตัวอย่างเรียบร้อย (อย่าลืมกดบันทึก)');
  }
};

function getFilteredWorksheets() {
  return worksheets.filter(w => {
    const matchSearch = !currentSearch ||
      w.title.toLowerCase().includes(currentSearch.toLowerCase()) ||
      (w.date && w.date.toLowerCase().includes(currentSearch.toLowerCase()));

    let matchDate = true;
    if (selectedFilterDate) {
      const itemIso = w.rawDate || toInputDateFormat(w.date);
      matchDate = (itemIso === selectedFilterDate);
    }

    return matchSearch && matchDate;
  });
}

function renderAdminWorksheets() {
  const container = document.getElementById('admin-worksheets-grid');
  if (!container) return;

  const filtered = getFilteredWorksheets();

  if (filtered.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">📂</div>
        <h3>ไม่พบใบงานที่ค้นหา</h3>
        <p style="color:var(--text-muted); margin-top:6px;">ลองค้นหาด้วยคำอื่น หรือกด "ทั้งหมด"</p>
        <button type="button" class="btn btn-cyan" onclick="clearAdminDateFilter();" style="margin-top:14px; font-size:0.88rem;">
          แสดงใบงานทั้งหมด
        </button>
      </div>
    `;
    return;
  }

  container.innerHTML = filtered.map(work => `
    <article class="work-card" data-id="${work.id}">
      <div class="work-thumb-wrapper" onclick="openLightbox('${work.id}')" title="คลิกเพื่อดูภาพขนาดใหญ่" style="cursor:pointer;">
        <img class="work-thumb" src="${work.image || 'assets/images/work1.jpg'}" alt="${work.title}" loading="lazy" />
      </div>
      <div class="work-body">
        <div class="work-date">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
          ${work.date}
        </div>
        <h3 class="work-title" onclick="openEditModal('${work.id}')" title="คลิกเพื่อแก้ไขใบงานนี้" style="cursor:pointer;">${work.title}</h3>

        <div class="work-footer" style="margin-top:auto;">
          <button class="btn-card-action edit" onclick="openEditModal('${work.id}')" title="แก้ไขข้อมูลใบงานนี้">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
            แก้ไข
          </button>
          <button class="btn-card-action delete" onclick="deleteWorksheet('${work.id}')" title="ลบใบงานนี้">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
            ลบ
          </button>
          ${work.link ? `
            <a href="${formatUrl(work.link)}" target="_blank" rel="noopener noreferrer" class="btn-card-action download" title="เปิดดูลิงก์แนบ" style="text-decoration:none;">
              🔗
            </a>
          ` : ''}
        </div>
      </div>
    </article>
  `).join('');
}

function renderAdminEducation() {
  const container = document.getElementById('admin-edu-cards-container');
  if (!container) return;

  const profile = profileData || DEFAULT_PROFILE;
  if (!profile || !profile.education) return;

  container.innerHTML = profile.education.map((item, idx) => {
    const logoSrc = item.logo || item.image || 'assets/images/logo_school_high.svg';
    return `
      <div class="admin-edu-card">
        <div class="admin-edu-logo-slot" onclick="openLightbox('${logoSrc}', 'โลโก้ - ${item.sub}')" title="คลิกเพื่อดูโลโก้ขนาดใหญ่">
          <img src="${logoSrc}" alt="โลโก้ ${item.sub}" class="admin-edu-logo-img" />
          <div class="admin-edu-logo-badge">🔍 คลิกซูม</div>
        </div>
        <div class="admin-edu-details">
          <div style="font-weight:700; font-size:1.15rem; color:var(--text-main); margin-bottom:4px;">
            ${item.title}
          </div>
          <div style="font-size:1rem; color:var(--accent-cyan); font-weight:600; margin-bottom:8px;">
            🏫 ${item.sub}
          </div>
          <p style="color:var(--text-muted); font-size:0.88rem; line-height:1.6; margin-bottom:1rem;">
            ${item.desc || 'ไม่มีรายละเอียดเพิ่มเติม'}
          </p>
          <button type="button" class="btn btn-cyan" onclick="openEditEducationModal('${item.id || idx}')" style="font-size:0.88rem; padding:8px 16px;">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
            เปลี่ยนโลโก้ & แก้ไขข้อมูล
          </button>
        </div>
      </div>
    `;
  }).join('');
}

/* ---------------- Filter & Search Handlers ---------------- */
window.handleAdminSearch = function (val) {
  currentSearch = val.trim();
  renderAdminWorksheets();
};

window.toggleAdminCalPopover = function () {
  const popover = document.getElementById('admin-filter-cal-popover');
  if (popover) {
    popover.classList.toggle('active');
    if (adminFilterCalendarInstance) adminFilterCalendarInstance.refresh();
  }
};

window.closeAdminCalPopover = function () {
  const popover = document.getElementById('admin-filter-cal-popover');
  if (popover) popover.classList.remove('active');
};

function applyAdminDateFilter(iso) {
  selectedFilterDate = iso;
  const btnAll = document.getElementById('admin-filter-all');
  const btnCal = document.getElementById('admin-btn-calendar-filter');
  const calText = document.getElementById('admin-cal-filter-text');

  if (btnAll) btnAll.classList.remove('active');
  if (btnCal) btnCal.classList.add('active');
  if (calText) calText.innerText = `📅 ${formatThaiDate(iso)} ✕`;

  renderAdminWorksheets();
  showToast(`กรองใบงานวันที่: ${formatThaiDate(iso)}`);
}

window.clearAdminDateFilter = function () {
  selectedFilterDate = null;
  const btnCal = document.getElementById('admin-btn-calendar-filter');
  const calText = document.getElementById('admin-cal-filter-text');

  if (btnCal) btnCal.classList.remove('active');
  if (calText) calText.innerText = 'กรองตามวันที่ (ปฏิทิน)';

  closeAdminCalPopover();
  renderAdminWorksheets();
};

/* ---------------- Event Listeners & Modals ---------------- */
function setupEventListeners() {
  // Theme toggle
  if (themeToggleBtn) {
    themeToggleBtn.addEventListener('click', toggleTheme);
  }

  // Admin Login Page Form
  if (loginForm) {
    loginForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const entered = pinInput ? pinInput.value.trim() : '';
      const currentPin = localStorage.getItem(STORAGE_PIN_KEY) || DEFAULT_PIN;

      if (entered === currentPin) {
        if (rememberCheck && rememberCheck.checked) {
          localStorage.setItem(STORAGE_ADMIN_AUTH_KEY, 'true');
        } else {
          sessionStorage.setItem(STORAGE_ADMIN_AUTH_KEY, 'true');
        }
        if (loginError) loginError.style.display = 'none';
        showDashboard();
        showToast('เข้าสู่ระบบผู้ดูแล (Admin Portal) สำเร็จ! ยินดีต้อนรับครับ 👑');
      } else {
        if (loginError) {
          loginError.innerText = '❌ รหัสผ่านไม่ถูกต้อง กรุณาลองใหม่อีกครั้ง';
          loginError.style.display = 'block';
        }
        if (pinInput) {
          pinInput.focus();
          pinInput.select();
        }
      }
    });
  }

  // Close modals on cancel or close button
  document.querySelectorAll('.modal-close, .btn-modal-cancel').forEach(btn => {
    btn.addEventListener('click', closeAllModals);
  });

  [addModal, editModal, editEduModal, changePinModal].forEach(modal => {
    if (modal) {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) closeAllModals();
      });
    }
  });

  // Image & PDF Upload Handling (Add Modal)
  let currentAddPdfBase64 = null;
  let currentEditPdfBase64 = null;

  const addFileInput = document.getElementById('add-image-file');
  const addPlaceholder = document.getElementById('add-upload-placeholder');
  const addPreview = document.getElementById('add-image-preview');
  const btnRemoveAddImage = document.getElementById('btn-remove-add-image');

  if (addFileInput) {
    addFileInput.addEventListener('change', (e) => {
      const file = e.target.files && e.target.files[0];
      if (file) {
        processImageFile(file, (dataUrl, pdfUrl) => {
          currentAddImageBase64 = dataUrl;
          if (pdfUrl) {
            currentAddPdfBase64 = pdfUrl;
          }
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
      currentAddPdfBase64 = null;
      if (addFileInput) addFileInput.value = '';
      if (addPreview) {
        addPreview.src = '';
        addPreview.classList.remove('has-image');
      }
      if (addPlaceholder) addPlaceholder.style.display = 'flex';
      btnRemoveAddImage.style.display = 'none';
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

      const sampleImages = ['assets/images/work1.jpg', 'assets/images/work2.jpg', 'assets/images/work3.jpg'];
      const chosenImage = currentAddImageBase64 || sampleImages[Math.floor(Math.random() * sampleImages.length)];
      const chosenPdf = currentAddPdfBase64 || (getPdfEmbedUrl(link) ? link : '');
      const finalLink = link || currentAddPdfBase64 || '';

      const newWork = {
        id: 'work-' + Date.now(),
        title: title,
        date: formattedDate,
        rawDate: rawDate,
        link: finalLink,
        pdfUrl: chosenPdf,
        subject: 'ใบงานการเรียนรู้',
        status: 'done',
        statusText: 'ส่งแล้ว',
        score: 'ส่งแล้ว',
        grade: '-',
        image: chosenImage,
        objectives: [
          'ส่งงานตามกำหนดและมีเนื้อหาครบถ้วนตามข้อกำหนด',
          'ประยุกต์ใช้ความรู้จากบทเรียนได้อย่างเหมาะสม'
        ],
        tools: ['เอกสารประกอบการเรียน', 'คอมพิวเตอร์'],
        instructorComment: 'บันทึกในระบบเรียบร้อยแล้ว',
        fileLink: finalLink || '#'
      };

      worksheets.unshift(newWork);
      saveWorksheets();
      closeAllModals();
      addForm.reset();

      currentAddImageBase64 = null;
      currentAddPdfBase64 = null;
      if (addFileInput) addFileInput.value = '';
      if (addPreview) {
        addPreview.src = '';
        addPreview.classList.remove('has-image');
      }
      if (addPlaceholder) addPlaceholder.style.display = 'flex';
      if (btnRemoveAddImage) btnRemoveAddImage.style.display = 'none';

      showToast(`เพิ่มใบงาน "${title}" สำเร็จเรียบร้อย! 🎉`);
    });
  }

  // Edit Worksheet Image & PDF Upload
  const editFileInput = document.getElementById('edit-image-file');
  const editPreview = document.getElementById('edit-image-preview');
  if (editFileInput) {
    editFileInput.addEventListener('change', (e) => {
      const file = e.target.files && e.target.files[0];
      if (file) {
        processImageFile(file, (dataUrl, pdfUrl) => {
          currentEditImageBase64 = dataUrl;
          if (pdfUrl) {
            currentEditPdfBase64 = pdfUrl;
          }
          if (editPreview) {
            editPreview.src = dataUrl;
            editPreview.classList.add('has-image');
          }
        });
      }
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

      const target = worksheets.find(w => w.id === id);
      if (target) {
        target.title = newTitle;

        if (rawDate) {
          target.date = formatThaiDate(rawDate);
          target.rawDate = rawDate;
        }
        if (newLink) {
          target.link = newLink;
          target.fileLink = newLink;
          if (getPdfEmbedUrl(newLink)) {
            target.pdfUrl = newLink;
          }
        }
        if (currentEditImageBase64) {
          target.image = currentEditImageBase64;
        }
        if (currentEditPdfBase64) {
          target.pdfUrl = currentEditPdfBase64;
          if (!newLink) {
            target.link = currentEditPdfBase64;
            target.fileLink = currentEditPdfBase64;
          }
        }
        currentEditImageBase64 = null;
        currentEditPdfBase64 = null;

        saveWorksheets();
        closeAllModals();
        showToast(`แก้ไขใบงาน "${newTitle}" เรียบร้อยแล้ว! ✏️`);
      }
    });
  }

  // Edit Education Logo File Upload
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
      const desc = document.getElementById('edit-edu-desc').value.trim();

      if (!profileData) profileData = JSON.parse(JSON.stringify(DEFAULT_PROFILE));
      if (!profileData.education || !Array.isArray(profileData.education)) {
        profileData.education = JSON.parse(JSON.stringify(DEFAULT_PROFILE.education));
      }

      let item = profileData.education.find(it => (it.id === id)) || profileData.education[id];
      if (!item) {
        const defaultMatch = DEFAULT_PROFILE.education.find(it => it.id === id);
        if (defaultMatch) {
          item = JSON.parse(JSON.stringify(defaultMatch));
          profileData.education.push(item);
        }
      }

      if (item) {
        item.title = title;
        item.sub = school;
        item.desc = desc;
        if (currentEditEduImageBase64) {
          item.logo = currentEditEduImageBase64;
          item.image = currentEditEduImageBase64;
        }
        currentEditEduImageBase64 = null;
        saveProfile();
        closeAllModals();
        showToast(`บันทึกข้อมูลและโลโก้ "${school}" เรียบร้อยแล้ว 🏫`);
      }
    });
  }

  // Change PIN Form Submit
  const changePinForm = document.getElementById('change-pin-form');
  if (changePinForm) {
    changePinForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const currInput = document.getElementById('current-pin-input');
      const newInput = document.getElementById('new-pin-input');
      const confirmInput = document.getElementById('confirm-pin-input');
      const errorEl = document.getElementById('change-pin-error');

      const currentPin = localStorage.getItem(STORAGE_PIN_KEY) || DEFAULT_PIN;
      if (currInput.value.trim() !== currentPin) {
        if (errorEl) {
          errorEl.innerText = '❌ รหัสผ่านปัจจุบันไม่ถูกต้อง';
          errorEl.style.display = 'block';
        }
        return;
      }

      if (newInput.value.trim().length < 4) {
        if (errorEl) {
          errorEl.innerText = '❌ รหัสผ่านใหม่ต้องมีอย่างน้อย 4 ตัวอักษร';
          errorEl.style.display = 'block';
        }
        return;
      }

      if (newInput.value.trim() !== confirmInput.value.trim()) {
        if (errorEl) {
          errorEl.innerText = '❌ ยืนยันรหัสผ่านใหม่ไม่ตรงกัน';
          errorEl.style.display = 'block';
        }
        return;
      }

      const updatedPin = newInput.value.trim();
      localStorage.setItem(STORAGE_PIN_KEY, updatedPin);
      closeAllModals();
      showToast('เปลี่ยนรหัสผ่าน Admin เรียบร้อยแล้ว! 🔑');
    });
  }

  // Lightbox Zoom Controls
  const btnZoomIn = document.getElementById('btn-zoom-in');
  const btnZoomOut = document.getElementById('btn-zoom-out');
  const btnZoomReset = document.getElementById('btn-zoom-reset');
  const btnCloseLightbox = document.getElementById('btn-close-lightbox');

  if (btnZoomIn) btnZoomIn.addEventListener('click', () => updateLightboxZoom(currentZoom + 0.3));
  if (btnZoomOut) btnZoomOut.addEventListener('click', () => updateLightboxZoom(currentZoom - 0.3));
  if (btnZoomReset) btnZoomReset.addEventListener('click', () => updateLightboxZoom(1));
  if (btnCloseLightbox) btnCloseLightbox.addEventListener('click', closeLightbox);

  if (lightboxModal) {
    lightboxModal.addEventListener('click', (e) => {
      if (e.target === lightboxModal || e.target.id === 'lightbox-container') {
        closeLightbox();
      }
    });
  }

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeLightbox();
      closeAllModals();
    }
  });

  // Real-Time Sync Listeners
  if (realtimeChannel) {
    realtimeChannel.onmessage = (event) => {
      if (event.data && (event.data.type === 'WORKSHEETS_UPDATED' || event.data.type === 'PROFILE_UPDATED' || event.data.type === 'SYNC_ALL')) {
        reloadAdminRealtimeData(false);
      }
    };
  }

  window.addEventListener('storage', (e) => {
    if (e.key === STORAGE_WORKS_KEY || e.key === STORAGE_PROFILE_KEY) {
      reloadAdminRealtimeData(false);
    } else if (e.key === STORAGE_THEME_KEY && e.newValue) {
      document.documentElement.setAttribute('data-theme', e.newValue);
      updateThemeIcon(e.newValue);
    }
  });

  window.addEventListener('focus', () => {
    reloadAdminRealtimeData(false);
  });

  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) {
      reloadAdminRealtimeData(false);
    }
  });
}

function reloadAdminRealtimeData(notify = false) {
  const storedWorks = localStorage.getItem(STORAGE_WORKS_KEY);
  if (storedWorks) {
    try {
      worksheets = JSON.parse(storedWorks);
    } catch (e) {
      console.error(e);
    }
  }

  const storedProfile = localStorage.getItem(STORAGE_PROFILE_KEY);
  if (storedProfile) {
    try {
      profileData = JSON.parse(storedProfile);
    } catch (e) {
      console.error(e);
    }
  }

  renderAdminAll();
  if (adminFilterCalendarInstance) {
    adminFilterCalendarInstance.refresh();
  }

  if (notify) {
    showToast('✨ ข้อมูลในระบบอัปเดตแบบเรียลไทม์');
  }
}

window.openAddModal = function () {
  const nowIso = new Date().toISOString().split('T')[0];
  if (addCalendarInstance) {
    addCalendarInstance.setDate(nowIso);
  }
  if (addModal) addModal.classList.add('active');
};

window.openEditModal = function (id) {
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

  if (editModal) editModal.classList.add('active');
};

window.openEditEducationModal = function (eduId) {
  if (!profileData) profileData = JSON.parse(JSON.stringify(DEFAULT_PROFILE));
  if (!profileData.education || !Array.isArray(profileData.education) || profileData.education.length === 0) {
    profileData.education = JSON.parse(JSON.stringify(DEFAULT_PROFILE.education));
  }

  let item = profileData.education.find(e => (e.id === eduId)) || profileData.education[eduId];
  if (!item) {
    const defaultMatch = DEFAULT_PROFILE.education.find(e => e.id === eduId);
    if (defaultMatch) {
      item = JSON.parse(JSON.stringify(defaultMatch));
      profileData.education.push(item);
    }
  }
  if (!item) return;

  currentEditEduImageBase64 = null;

  const idInput = document.getElementById('edit-edu-id');
  const titleInput = document.getElementById('edit-edu-title');
  const schoolInput = document.getElementById('edit-edu-school');
  const descInput = document.getElementById('edit-edu-desc');
  const fileInput = document.getElementById('edit-edu-image-file');
  const preview = document.getElementById('edit-edu-image-preview');
  const placeholder = document.getElementById('edit-edu-upload-placeholder');

  if (fileInput) fileInput.value = '';
  if (idInput) idInput.value = item.id || eduId;
  if (titleInput) titleInput.value = item.title || '';
  if (schoolInput) schoolInput.value = item.sub || '';
  if (descInput) descInput.value = item.desc || '';

  const currentLogo = item.logo || item.image;
  if (preview) {
    if (currentLogo) {
      preview.src = currentLogo;
      preview.classList.add('has-image');
      if (placeholder) placeholder.style.display = 'none';
    } else {
      preview.src = '';
      preview.classList.remove('has-image');
      if (placeholder) placeholder.style.display = 'flex';
    }
  }

  if (editEduModal) editEduModal.classList.add('active');
};

window.openChangePinModal = function () {
  const currInput = document.getElementById('current-pin-input');
  const newInput = document.getElementById('new-pin-input');
  const confirmInput = document.getElementById('confirm-pin-input');
  const errorEl = document.getElementById('change-pin-error');
  if (errorEl) {
    errorEl.style.display = 'none';
    errorEl.innerText = '';
  }
  if (currInput) currInput.value = '';
  if (newInput) newInput.value = '';
  if (confirmInput) confirmInput.value = '';

  if (changePinModal) {
    changePinModal.classList.add('active');
    setTimeout(() => {
      if (currInput) currInput.focus();
    }, 100);
  }
};

window.deleteWorksheet = function (id) {
  const work = worksheets.find(w => w.id === id);
  if (!work) return;

  const confirmed = confirm(`คุณต้องการลบใบงาน "${work.title}" ใช่หรือไม่?\n(การกระทำนี้จะลบใบงานออกจากระบบ)`);
  if (!confirmed) return;

  worksheets = worksheets.filter(w => w.id !== id);
  saveWorksheets();
  showToast(`ลบใบงาน "${work.title}" เรียบร้อยแล้ว 🗑️`);
};

window.resetSampleData = function () {
  if (confirm('ต้องการรีเซ็ตข้อมูลใบงานกลับเป็นค่าเริ่มต้นหรือไม่?')) {
    worksheets = JSON.parse(JSON.stringify(DEFAULT_WORKSHEETS));
    saveWorksheets();
    showToast('รีเซ็ตข้อมูลกลับสู่ค่าเริ่มต้นเรียบร้อยแล้ว');
  }
};

function closeAllModals() {
  if (addModal) addModal.classList.remove('active');
  if (editModal) editModal.classList.remove('active');
  if (editEduModal) editEduModal.classList.remove('active');
  if (changePinModal) changePinModal.classList.remove('active');
  const magicShareModal = document.getElementById('magic-share-modal');
  if (magicShareModal) magicShareModal.classList.remove('active');
}

/* ---------------- Lightbox ---------------- */
window.openLightbox = function (idOrSrc, customTitle) {
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

window.closeLightbox = function () {
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

/* ---------------- Interactive Calendar Component ---------------- */
function initInteractiveCalendar(containerId, inputId, labelId, initialDateStr, onDateSelect) {
  const container = document.getElementById(containerId);
  const input = inputId ? document.getElementById(inputId) : null;
  const label = labelId ? document.getElementById(labelId) : null;
  if (!container) return null;

  let selectedIso = initialDateStr ? toInputDateFormat(initialDateStr) : new Date().toISOString().split('T')[0];
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
    const firstDayIndex = new Date(viewYear, viewMonth, 1).getDay();
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();

    const now = new Date();
    const todayIso = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

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

      html += `<button type="button" class="${classNames.join(' ')}" data-iso="${thisCellIso}" title="${formatThaiDate(thisCellIso)}">${day}</button>`;
    }

    html += `</div>`;
    container.innerHTML = html;

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
    refresh: () => render()
  };
}

// Helper: Create stylish SVG preview thumbnail for uploaded PDF
function createPdfThumbnailSvg(fileName) {
  const safeName = String(fileName || 'เอกสาร PDF')
    .replaceAll('<', '')
    .replaceAll('>', '')
    .replaceAll('&', '')
    .replaceAll('"', '');
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400" viewBox="0 0 600 400">
    <defs>
      <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#241a14"/>
        <stop offset="100%" stop-color="#140f0c"/>
      </linearGradient>
      <linearGradient id="accentGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#d4a373"/>
        <stop offset="100%" stop-color="#c86d51"/>
      </linearGradient>
    </defs>
    <rect width="600" height="400" fill="url(#bgGrad)"/>
    <rect x="30" y="30" width="540" height="340" rx="16" fill="none" stroke="rgba(212,163,115,0.35)" stroke-width="2" stroke-dasharray="6,6"/>
    <rect x="225" y="70" width="150" height="190" rx="12" fill="#2d211a" stroke="url(#accentGrad)" stroke-width="3"/>
    <path d="M335 70 L375 110 L335 110 Z" fill="#d4a373"/>
    <text x="300" y="175" font-family="'Prompt', sans-serif" font-size="34" font-weight="bold" fill="#ef4444" text-anchor="middle">PDF</text>
    <text x="300" y="210" font-family="'Prompt', sans-serif" font-size="13" fill="#d4a373" text-anchor="middle">เอกสารประกอบใบงาน</text>
    <text x="300" y="300" font-family="'Prompt', sans-serif" font-size="16" font-weight="600" fill="#fbf7f2" text-anchor="middle">${safeName.length > 36 ? safeName.substring(0, 33) + '...' : safeName}</text>
    <text x="300" y="330" font-family="'Prompt', sans-serif" font-size="13" fill="#998471" text-anchor="middle">คลิกเพื่อเปิดอ่านเอกสาร PDF ในเว็บ 📖</text>
  </svg>`;
  return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
}

// Helper: Convert direct PDF or Google Drive URL to embeddable preview URL
function getPdfEmbedUrl(url) {
  if (!url) return null;
  const trimmed = String(url).trim();
  if (trimmed.startsWith('data:application/pdf')) {
    return trimmed;
  }
  // Google Drive
  const driveMatch = trimmed.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (driveMatch) {
    return `https://drive.google.com/file/d/${driveMatch[1]}/preview`;
  }
  // Direct PDF
  if (trimmed.toLowerCase().endsWith('.pdf') || trimmed.toLowerCase().includes('.pdf?')) {
    return trimmed;
  }
  return null;
}

/* ---------------- Helper: Image & PDF Processing & Formatters ---------------- */
function processImageFile(file, callback, maxDim = 1200, quality = 0.84) {
  if (!file) return;

  // Handle PDF files
  if (file.type === 'application/pdf' || (file.name && file.name.toLowerCase().endsWith('.pdf'))) {
    if (file.size > 2.5 * 1024 * 1024) {
      alert(`⚠️ ไฟล์ PDF นี้มีขนาด ${(file.size / (1024 * 1024)).toFixed(1)} MB (ค่อนข้างใหญ่)\n\nเพื่อให้เว็บไซต์เปิดได้เร็วและสามารถซิงค์ขึ้นคลาวด์ได้ แนะนำให้อัปโหลดไฟล์ลง Google Drive แล้วนำลิงก์มาวางในช่อง "ลิงก์ผลงานภายนอก" แทนนะครับ`);
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const pdfDataUrl = e.target.result;
      const pdfThumb = createPdfThumbnailSvg(file.name);
      callback(pdfThumb, pdfDataUrl, file.name);
    };
    reader.readAsDataURL(file);
    return;
  }

  const reader = new FileReader();

  reader.onload = (e) => {
    const rawResult = e.target.result;
    if (file.type === 'image/svg+xml' || rawResult.startsWith('data:image/svg+xml')) {
      return callback(rawResult);
    }

    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let width = img.width;
      let height = img.height;

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

      let compressed;
      if (file.type === 'image/png') {
        compressed = canvas.toDataURL('image/png');
        if (compressed.length > 400000) {
          compressed = canvas.toDataURL('image/jpeg', quality);
        }
      } else {
        compressed = canvas.toDataURL('image/jpeg', quality);
      }
      callback(compressed);
    };
    img.onerror = () => callback(rawResult);
    img.src = rawResult;
  };
  reader.readAsDataURL(file);
}

function formatUrl(url) {
  if (!url) return '#';
  if (!/^https?:\/\//i.test(url)) return 'https://' + url;
  return url;
}

function formatThaiDate(dateStr) {
  if (!dateStr) return new Intl.DateTimeFormat('th-TH', { dateStyle: 'long' }).format(new Date());
  if (!dateStr.includes('-')) return dateStr;
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Intl.DateTimeFormat('th-TH', { dateStyle: 'long' }).format(new Date(y, m - 1, d));
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

/* ---------------- Backup & Restore System ---------------- */
let pendingRestoreData = null;

function renderBackupStats() {
  const countWorksEl = document.getElementById('backup-count-works');
  const countEduEl = document.getElementById('backup-count-edu');
  const countSkillsEl = document.getElementById('backup-count-skills');

  if (countWorksEl) countWorksEl.innerText = `${worksheets.length} รายการ`;
  if (countEduEl) {
    const eduCount = (profileData && Array.isArray(profileData.education)) ? profileData.education.length : 3;
    countEduEl.innerText = `${eduCount} ระดับ`;
  }
  if (countSkillsEl) {
    const skillsCount = (profileData && Array.isArray(profileData.skills)) ? profileData.skills.length : 5;
    countSkillsEl.innerText = `${skillsCount} ทักษะ`;
  }
}

window.exportFullBackup = function () {
  const backupData = {
    app: "Pakawat-Site",
    version: "2.0.0",
    exportedAt: new Date().toISOString(),
    exportedAtFormatted: new Date().toLocaleString('th-TH'),
    worksheets: worksheets || [],
    profile: profileData || DEFAULT_PROFILE,
    adminPin: localStorage.getItem('pakawat_admin_pin') || ''
  };

  const jsonStr = JSON.stringify(backupData, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const now = new Date();
  const dateStr = now.toISOString().slice(0, 10);
  const timeStr = `${String(now.getHours()).padStart(2, '0')}-${String(now.getMinutes()).padStart(2, '0')}`;
  a.href = url;
  a.download = `pakawat-portfolio-backup-${dateStr}_${timeStr}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  showToast('📥 ดาวน์โหลดไฟล์สำรองข้อมูล .json เรียบร้อยแล้ว!');
};

window.copyBackupJson = function () {
  const backupData = {
    app: "Pakawat-Site",
    version: "2.0.0",
    exportedAt: new Date().toISOString(),
    exportedAtFormatted: new Date().toLocaleString('th-TH'),
    worksheets: worksheets || [],
    profile: profileData || DEFAULT_PROFILE,
    adminPin: localStorage.getItem('pakawat_admin_pin') || ''
  };

  const jsonStr = JSON.stringify(backupData, null, 2);
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(jsonStr).then(() => {
      showToast('📋 คัดลอกข้อมูลสำรอง (JSON) ลงในคลิปบอร์ดแล้ว!');
    }).catch(() => {
      fallbackCopyText(jsonStr);
    });
  } else {
    fallbackCopyText(jsonStr);
  }
};

function fallbackCopyText(text) {
  const textArea = document.createElement('textarea');
  textArea.value = text;
  document.body.appendChild(textArea);
  textArea.select();
  try {
    document.execCommand('copy');
    showToast('📋 คัดลอกข้อมูลสำรอง (JSON) ลงในคลิปบอร์ดแล้ว!');
  } catch (err) {
    showToast('กรุณาดาวน์โหลดเป็นไฟล์ .json แทนครับ', 'error');
  }
  document.body.removeChild(textArea);
}

window.handleBackupFileSelect = function (fileInput) {
  const file = fileInput.files && fileInput.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function (e) {
    try {
      const data = JSON.parse(e.target.result);
      if (!data || (!data.worksheets && !data.profile)) {
        throw new Error('โครงสร้างไฟล์ไม่ถูกต้อง ไม่พบข้อมูลใบงานหรือโปรไฟล์');
      }

      pendingRestoreData = data;
      const previewCard = document.getElementById('restore-preview-card');
      const detailsEl = document.getElementById('restore-preview-details');

      const worksCount = Array.isArray(data.worksheets) ? data.worksheets.length : 0;
      const profileName = (data.profile && (data.profile.name || data.profile.brandTitle)) || 'ไม่ระบุ';
      const exportDate = data.exportedAtFormatted || data.exportedAt || 'ไม่ระบุวันที่';

      if (detailsEl) {
        detailsEl.innerHTML = `
          <div>📁 <b>ชื่อไฟล์:</b> ${file.name} (${(file.size / 1024).toFixed(1)} KB)</div>
          <div>🕒 <b>วันที่สำรอง:</b> ${exportDate}</div>
          <div>📑 <b>จำนวนใบงาน:</b> ${worksCount} รายการ</div>
          <div>👤 <b>โปรไฟล์:</b> ${profileName}</div>
        `;
      }
      if (previewCard) previewCard.style.display = 'block';

      showToast('ตรวจพบไฟล์สำรองข้อมูลเรียบร้อย กรุณากดยืนยันการกู้คืน');
    } catch (err) {
      showToast('ไฟล์ไม่ถูกต้อง: ' + err.message, 'error');
      pendingRestoreData = null;
      const previewCard = document.getElementById('restore-preview-card');
      if (previewCard) previewCard.style.display = 'none';
    }
  };
  reader.readAsText(file);
};

window.confirmRestoreBackup = function () {
  if (!pendingRestoreData) {
    showToast('กรุณาเลือกไฟล์สำรองข้อมูลก่อนครับ', 'error');
    return;
  }

  if (!confirm('ยืนยันการกู้คืนข้อมูลหรือไม่? ข้อมูลทั้งหมดบนหน้าเว็บจะถูกอัปเดตเป็นข้อมูลจากไฟล์สำรองนี้ทันที')) {
    return;
  }

  try {
    if (Array.isArray(pendingRestoreData.worksheets)) {
      worksheets = pendingRestoreData.worksheets;
      saveWorksheets();
    }
    if (pendingRestoreData.profile && typeof pendingRestoreData.profile === 'object') {
      profileData = pendingRestoreData.profile;
      saveProfile();
    }
    if (pendingRestoreData.adminPin) {
      localStorage.setItem('pakawat_admin_pin', pendingRestoreData.adminPin);
    }

    renderAdminAll();
    renderBackupStats();
    showToast('✨ กู้คืนข้อมูลสำเร็จเรียบร้อย! ข้อมูลทั้งหมดถูกอัปเดตแล้ว');

    const previewCard = document.getElementById('restore-preview-card');
    if (previewCard) previewCard.style.display = 'none';
    const fileInput = document.getElementById('backup-json-file');
    if (fileInput) fileInput.value = '';
    pendingRestoreData = null;
  } catch (err) {
    showToast('เกิดข้อผิดพลาดในการกู้คืน: ' + err.message, 'error');
  }
};

/* ---------------- Local Snapshots System ---------------- */
const SNAPSHOTS_KEY = 'pakawat_local_snapshots';

function getLocalSnapshots() {
  try {
    const raw = localStorage.getItem(SNAPSHOTS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

function saveLocalSnapshots(snapshots) {
  try {
    localStorage.setItem(SNAPSHOTS_KEY, JSON.stringify(snapshots.slice(0, 8)));
  } catch (e) {}
}

window.createLocalSnapshot = function () {
  const snapshots = getLocalSnapshots();
  const now = new Date();
  const newSnapshot = {
    id: 'snap-' + Date.now(),
    date: now.toLocaleString('th-TH'),
    worksCount: worksheets.length,
    profileName: (profileData && profileData.name) || 'ภควัต ศรีรัตน์',
    data: {
      worksheets: worksheets || [],
      profile: profileData || DEFAULT_PROFILE
    }
  };

  snapshots.unshift(newSnapshot);
  saveLocalSnapshots(snapshots);
  renderLocalSnapshots();
  showToast('🕒 บันทึกจุดสำรองข้อมูลด่วนในเครื่องเรียบร้อยแล้ว');
};

window.restoreLocalSnapshot = function (snapId) {
  const snapshots = getLocalSnapshots();
  const snap = snapshots.find(s => s.id === snapId);
  if (!snap) return;

  if (confirm(`ต้องการกู้คืนข้อมูลจากจุดสำรองวันที่ "${snap.date}" หรือไม่?`)) {
    if (snap.data.worksheets) {
      worksheets = snap.data.worksheets;
      saveWorksheets();
    }
    if (snap.data.profile) {
      profileData = snap.data.profile;
      saveProfile();
    }
    renderAdminAll();
    renderBackupStats();
    showToast('✨ กู้คืนข้อมูลจากจุดสำรองเรียบร้อยแล้ว!');
  }
};

window.deleteLocalSnapshot = function (snapId) {
  if (confirm('ต้องการลบจุดสำรองข้อมูลนี้หรือไม่?')) {
    let snapshots = getLocalSnapshots();
    snapshots = snapshots.filter(s => s.id !== snapId);
    saveLocalSnapshots(snapshots);
    renderLocalSnapshots();
    showToast('ลบจุดสำรองข้อมูลเรียบร้อยแล้ว');
  }
};

function renderLocalSnapshots() {
  const container = document.getElementById('local-snapshots-container');
  if (!container) return;

  const snapshots = getLocalSnapshots();
  if (snapshots.length === 0) {
    container.innerHTML = `
      <div style="font-size:0.84rem; color:var(--text-dim); text-align:center; padding:1.5rem;">
        ยังไม่มีจุดสำรองข้อมูลด่วน กดปุ่ม "➕ บันทึกจุดสำรองเดี๋ยวนี้" ด้านบนเพื่อบันทึกสถานะปัจจุบันไว้ในเบราว์เซอร์
      </div>
    `;
    return;
  }

  container.innerHTML = `
    <div style="display:flex; flex-direction:column; gap:8px;">
      ${snapshots.map(s => `
        <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px; padding:10px 14px; background:rgba(0,0,0,0.3); border:1px solid rgba(255,255,255,0.06); border-radius:var(--radius-sm);">
          <div>
            <div style="font-size:0.88rem; font-weight:600; color:#fff;">🕒 ${s.date}</div>
            <div style="font-size:0.78rem; color:var(--text-dim); margin-top:2px;">
              ใบงาน: ${s.worksCount} รายการ | ผู้ใช้: ${s.profileName}
            </div>
          </div>
          <div style="display:flex; gap:6px;">
            <button type="button" class="btn btn-primary" onclick="restoreLocalSnapshot('${s.id}')" style="padding:4px 10px; font-size:0.78rem;">
              กู้คืนจุดนี้
            </button>
            <button type="button" class="btn btn-secondary" onclick="deleteLocalSnapshot('${s.id}')" style="padding:4px 8px; font-size:0.78rem; color:#ef4444;" title="ลบจุดนี้">
              ✕
            </button>
          </div>
        </div>
      `).join('')}
    </div>
  `;
}

/* ---------------- Real-Time Cloud Sync (Google Firebase) Management ---------------- */
function renderAdminCloud() {
  const cfg = (typeof getActiveFirebaseConfig === 'function') ? getActiveFirebaseConfig() : {};
  const status = (typeof CloudSync !== 'undefined') ? CloudSync.getStatus() : { isConnected: false };

  const apiKeyInput = document.getElementById('cloud-cfg-api-key');
  const projectIdInput = document.getElementById('cloud-cfg-project-id');
  const authDomainInput = document.getElementById('cloud-cfg-auth-domain');
  const storageBucketInput = document.getElementById('cloud-cfg-storage-bucket');
  const messagingIdInput = document.getElementById('cloud-cfg-messaging-id');
  const appIdInput = document.getElementById('cloud-cfg-app-id');
  const syncInfoEl = document.getElementById('admin-cloud-sync-info');

  if (apiKeyInput && cfg.apiKey) apiKeyInput.value = cfg.apiKey;
  if (projectIdInput && cfg.projectId) projectIdInput.value = cfg.projectId;
  if (authDomainInput && cfg.authDomain) authDomainInput.value = cfg.authDomain;
  if (storageBucketInput && cfg.storageBucket) storageBucketInput.value = cfg.storageBucket;
  if (messagingIdInput && cfg.messagingSenderId) messagingIdInput.value = cfg.messagingSenderId;
  if (appIdInput && cfg.appId) appIdInput.value = cfg.appId;

  if (syncInfoEl) {
    if (status.isConnected) {
      const syncDate = status.lastSync ? new Date(status.lastSync).toLocaleString('th-TH') : 'เพิ่งซิงค์';
      syncInfoEl.innerHTML = `🟢 เชื่อมต่อโปรเจกต์ <b>${cfg.projectId}</b> เรียบร้อย (ซิงค์ล่าสุด: ${syncDate}) — ทุกคนที่เปิดลิงก์เห็นข้อมูลอัปเดตตรงกันทันที!`;
    } else {
      syncInfoEl.innerText = 'เมื่อเชื่อมต่อแล้ว ไม่ว่าจะแก้ไขใบงาน รูปภาพ หรือเกรดเฉลี่ย ทุกคนที่เปิดลิงก์ Vercel จะเห็นข้อมูลอัปเดตสดทันทีโดยไม่ต้อง Export';
    }
  }

  if (typeof CloudSync !== 'undefined') {
    CloudSync.updateBadgeUI(status.isConnected);
  }
}

// Automatically parse javascript / JSON object from Firebase console
window.handleAutoParseFirebaseConfig = function (text) {
  if (!text || !text.trim()) return;
  const str = text.trim();

  // Try parsing apiKey, projectId, authDomain, storageBucket, messagingSenderId, appId
  const extract = (key) => {
    const regex = new RegExp(`['"]?${key}['"]?\\s*:\\s*['"]([^'"]+)['"]`, 'i');
    const match = str.match(regex);
    return match ? match[1] : '';
  };

  const apiKey = extract('apiKey');
  const projectId = extract('projectId');
  const authDomain = extract('authDomain');
  const storageBucket = extract('storageBucket');
  const messagingSenderId = extract('messagingSenderId');
  const appId = extract('appId');

  if (apiKey || projectId) {
    if (apiKey) document.getElementById('cloud-cfg-api-key').value = apiKey;
    if (projectId) document.getElementById('cloud-cfg-project-id').value = projectId;
    if (authDomain) document.getElementById('cloud-cfg-auth-domain').value = authDomain;
    if (storageBucket) document.getElementById('cloud-cfg-storage-bucket').value = storageBucket;
    if (messagingSenderId) document.getElementById('cloud-cfg-messaging-id').value = messagingSenderId;
    if (appId) document.getElementById('cloud-cfg-app-id').value = appId;

    showToast('✨ แยกค่า Firebase Config อัตโนมัติเรียบร้อย! กดปุ่มบันทึกเพื่อเริ่มใช้งาน');
  }
};

window.handleSaveCloudConfig = async function (e) {
  if (e) e.preventDefault();
  const apiKey = document.getElementById('cloud-cfg-api-key').value.trim();
  const projectId = document.getElementById('cloud-cfg-project-id').value.trim();
  const authDomain = document.getElementById('cloud-cfg-auth-domain').value.trim();
  const storageBucket = document.getElementById('cloud-cfg-storage-bucket').value.trim();
  const messagingSenderId = document.getElementById('cloud-cfg-messaging-id').value.trim();
  const appId = document.getElementById('cloud-cfg-app-id').value.trim();

  if (!apiKey || !projectId) {
    showToast('กรุณากรอก API Key และ Project ID ให้ครบถ้วน', 'error');
    return;
  }

  const configObj = {
    apiKey,
    projectId,
    authDomain: authDomain || `${projectId}.firebaseapp.com`,
    storageBucket: storageBucket || `${projectId}.appspot.com`,
    messagingSenderId,
    appId
  };

  const resultEl = document.getElementById('cloud-test-result');
  if (resultEl) {
    resultEl.style.display = 'block';
    resultEl.style.background = 'rgba(56, 189, 248, 0.15)';
    resultEl.style.border = '1px solid rgba(56, 189, 248, 0.4)';
    resultEl.style.color = '#38bdf8';
    resultEl.innerText = '⏳ กำลังทดสอบและบันทึกการเชื่อมต่อ Google Firebase...';
  }

  const test = await CloudSync.testConnection(configObj);
  if (!test.success) {
    if (resultEl) {
      resultEl.style.background = 'rgba(239, 68, 68, 0.15)';
      resultEl.style.border = '1px solid rgba(239, 68, 68, 0.4)';
      resultEl.style.color = '#f87171';
      resultEl.innerHTML = `❌ เชื่อมต่อไม่สำเร็จ: ${test.message}`;
    }
    showToast('การเชื่อมต่อล้มเหลว ตรวจสอบค่า Config หรือ Security Rules', 'error');
    return;
  }

  // Save config
  CloudSync.saveConfig(configObj);
  CloudSync.init();

  // Push current data immediately to cloud
  const pushRes = await CloudSync.saveToCloud(profileData, worksheets);

  if (resultEl) {
    resultEl.style.background = 'rgba(16, 185, 129, 0.15)';
    resultEl.style.border = '1px solid rgba(16, 185, 129, 0.4)';
    resultEl.style.color = '#34d399';
    resultEl.innerHTML = `✅ เชื่อมต่อ Google Firebase สำเร็จ 100%! อัปโหลดข้อมูลขึ้นคลาวด์แล้ว ทุกคนที่เปิดเว็บจะเห็นข้อมูลอัปเดตแบบเรียลไทม์ทันที 🚀`;
  }

  renderAdminCloud();
  showToast('🎉 บันทึกการเชื่อมต่อและซิงค์ข้อมูลขึ้นคลาวด์เรียบร้อยแล้ว!');
};

window.handleTestCloudConnection = async function () {
  const apiKey = document.getElementById('cloud-cfg-api-key').value.trim();
  const projectId = document.getElementById('cloud-cfg-project-id').value.trim();
  const authDomain = document.getElementById('cloud-cfg-auth-domain').value.trim();
  const storageBucket = document.getElementById('cloud-cfg-storage-bucket').value.trim();
  const messagingSenderId = document.getElementById('cloud-cfg-messaging-id').value.trim();
  const appId = document.getElementById('cloud-cfg-app-id').value.trim();

  const configObj = {
    apiKey,
    projectId,
    authDomain: authDomain || `${projectId}.firebaseapp.com`,
    storageBucket: storageBucket || `${projectId}.appspot.com`,
    messagingSenderId,
    appId
  };

  const resultEl = document.getElementById('cloud-test-result');
  if (resultEl) {
    resultEl.style.display = 'block';
    resultEl.style.background = 'rgba(56, 189, 248, 0.15)';
    resultEl.style.border = '1px solid rgba(56, 189, 248, 0.4)';
    resultEl.style.color = '#38bdf8';
    resultEl.innerText = '⏳ กำลังทดสอบเชื่อมต่อไปยัง Firebase Firestore...';
  }

  const test = await CloudSync.testConnection(configObj);
  if (resultEl) {
    if (test.success) {
      resultEl.style.background = 'rgba(16, 185, 129, 0.15)';
      resultEl.style.border = '1px solid rgba(16, 185, 129, 0.4)';
      resultEl.style.color = '#34d399';
      resultEl.innerHTML = `✅ ${test.message}`;
    } else {
      resultEl.style.background = 'rgba(239, 68, 68, 0.15)';
      resultEl.style.border = '1px solid rgba(239, 68, 68, 0.4)';
      resultEl.style.color = '#f87171';
      resultEl.innerHTML = `❌ ${test.message}`;
    }
  }
};

window.handlePushAllToCloud = async function () {
  if (typeof CloudSync === 'undefined' || !CloudSync.getStatus().isConnected) {
    showToast('กรุณาบันทึกและเชื่อมต่อ Firebase ด้านล่างก่อนครับ', 'error');
    return;
  }

  showToast('⏳ กำลังอัปโหลดข้อมูลทั้งหมดขึ้นคลาวด์...');
  const res = await CloudSync.saveToCloud(profileData, worksheets);
  if (res && res.success) {
    showToast('☁️ อัปโหลดข้อมูลทั้งหมดขึ้น Google Cloud สำเร็จเรียบร้อย! ✨');
    renderAdminCloud();
  } else {
    showToast(`เกิดข้อผิดพลาด: ${res ? res.error : 'ไม่สามารถบันทึกได้'}`, 'error');
  }
};

window.handlePullFromCloud = async function () {
  if (typeof CloudSync === 'undefined' || !CloudSync.getStatus().isConnected) {
    showToast('กรุณาเชื่อมต่อ Firebase ก่อนครับ', 'error');
    return;
  }

  showToast('⏳ กำลังดึงข้อมูลล่าสุดจากคลาวด์...');
  try {
    const config = getActiveFirebaseConfig();
    const app = firebase.app();
    const doc = await app.firestore().collection('pakawat_site_data').doc('main_content').get();
    if (doc.exists) {
      const data = doc.data();
      if (data.worksheets && Array.isArray(data.worksheets)) {
        worksheets = data.worksheets;
        localStorage.setItem(STORAGE_WORKS_KEY, JSON.stringify(worksheets));
      }
      if (data.profile && typeof data.profile === 'object') {
        profileData = data.profile;
        localStorage.setItem(STORAGE_PROFILE_KEY, JSON.stringify(profileData));
      }
      renderAdminAll();
      showToast('📥 ดึงข้อมูลล่าสุดจากคลาวด์และอัปเดตหน้าจอเรียบร้อย!');
    } else {
      showToast('ยังไม่มีข้อมูลบนคลาวด์ กรุณากดปุ่ม "อัปโหลดข้อมูลขึ้นคลาวด์เดี๋ยวนี้" ก่อนครับ');
    }
  } catch (err) {
    showToast(`ดึงข้อมูลไม่สำเร็จ: ${err.message}`, 'error');
  }
};

window.handleDisconnectCloud = function () {
  if (confirm('คุณต้องการยกเลิกการเชื่อมต่อคลาวด์และกลับมาใช้โหมดออฟไลน์/โลคอลใช่หรือไม่?')) {
    if (typeof CloudSync !== 'undefined') {
      CloudSync.clearConfig();
    }
    renderAdminCloud();
    showToast('ยกเลิกการเชื่อมต่อคลาวด์แล้ว (กลับสู่โหมดทำงานในเครื่อง)');
  }
};

// Export active state as a complete data.js file
window.handleDownloadDataJs = function () {
  const currentWorks = worksheets || DEFAULT_WORKSHEETS;
  const currentProf = profileData || DEFAULT_PROFILE;

  const code = `/**
 * Default sample data for Pakawat Portfolio & Worksheet Hub
 * Updated automatically from Admin Portal
 */

const DEFAULT_WORKSHEETS = ${JSON.stringify(currentWorks, null, 2)};

const DEFAULT_PROFILE = ${JSON.stringify(currentProf, null, 2)};

// Helper: Convert hex or color string to rgba
function hexToRgba(hexOrColor, opacity) {
  if (!hexOrColor) return \`rgba(20, 14, 10, \${opacity})\`;
  const trimmed = String(hexOrColor).trim();
  if (trimmed.startsWith('#')) {
    let c = trimmed.substring(1);
    if (c.length === 3) c = c.split('').map(x => x + x).join('');
    if (c.length === 6) {
      const num = parseInt(c, 16);
      if (!isNaN(num)) {
        const r = (num >> 16) & 255;
        const g = (num >> 8) & 255;
        const b = num & 255;
        return \`rgba(\${r}, \${g}, \${b}, \${opacity})\`;
      }
    }
  } else if (trimmed.startsWith('rgb')) {
    return trimmed;
  }
  return \`rgba(20, 14, 10, \${opacity})\`;
}

// Helper: Apply hero card background image, background color, gradient overlay, min-height, and image fit
function applyHeroCardBackground(el, imgUrl, bgColor, overlayPercent, minHeight, bgFit) {
  if (!el) return;
  const opacityVal = (overlayPercent !== undefined && overlayPercent !== null && overlayPercent !== '')
    ? Math.max(0, Math.min(100, parseInt(overlayPercent, 10))) / 100
    : 0.70;

  if (minHeight && parseInt(minHeight, 10) > 0) {
    el.style.minHeight = \`\${parseInt(minHeight, 10)}px\`;
  } else {
    el.style.minHeight = '';
  }

  const fitVal = (bgFit && String(bgFit).trim()) || 'cover';

  if (imgUrl) {
    el.classList.add('has-bg-image');
    const topOverlay = hexToRgba(bgColor || '#140e0a', Math.max(0.18, opacityVal - 0.12));
    const bottomOverlay = hexToRgba(bgColor || '#140e0a', Math.min(0.98, opacityVal + 0.15));
    el.style.backgroundImage = \`linear-gradient(\${topOverlay}, \${bottomOverlay}), url('\${imgUrl}')\`;
    el.style.backgroundSize = fitVal;
    el.style.backgroundPosition = 'center';
    el.style.backgroundRepeat = 'no-repeat';
    if (bgColor) el.style.backgroundColor = bgColor;
  } else if (bgColor) {
    el.classList.remove('has-bg-image');
    el.style.backgroundImage = 'none';
    el.style.backgroundColor = bgColor;
    el.style.backgroundSize = '';
    el.style.backgroundPosition = '';
    el.style.backgroundRepeat = '';
  } else {
    el.classList.remove('has-bg-image');
    el.style.backgroundImage = '';
    el.style.backgroundColor = '';
    el.style.backgroundSize = '';
    el.style.backgroundPosition = '';
    el.style.backgroundRepeat = '';
  }
}

// Helper: Apply avatar frame sizing, internal image zoom, and vertical focus position
function applyAvatarStyles(wrapperEl, imgEl, size, zoom, posY, isPreview = false) {
  if (wrapperEl) {
    if (size && parseInt(size, 10) > 0) {
      const parsedSize = parseInt(size, 10);
      const actualSize = isPreview ? Math.round(parsedSize * 0.62) : parsedSize;
      wrapperEl.style.width = \`\${actualSize}px\`;
      wrapperEl.style.height = \`\${actualSize}px\`;
    } else {
      wrapperEl.style.width = '';
      wrapperEl.style.height = '';
    }
  }

  if (imgEl) {
    const scaleVal = (zoom && parseInt(zoom, 10) > 0) ? parseInt(zoom, 10) / 100 : 1;
    imgEl.style.transform = scaleVal !== 1 ? \`scale(\${scaleVal})\` : '';
    const posVal = (posY !== undefined && posY !== null && posY !== '') ? parseInt(posY, 10) : 50;
    imgEl.style.objectPosition = \`center \${posVal}%\`;
  }
}

// Helper: Apply profile card styling (background image, color, gradient overlay, and fit)
function applyProfileCardBackground(el, imgUrl, bgColor, overlayPercent, bgFit) {
  if (!el) return;
  const opacityVal = (overlayPercent !== undefined && overlayPercent !== null && overlayPercent !== '')
    ? Math.max(0, Math.min(100, parseInt(overlayPercent, 10))) / 100
    : 0.70;
  const fitVal = (bgFit && String(bgFit).trim()) || 'cover';

  if (imgUrl) {
    el.classList.add('has-bg-image');
    const topOverlay = hexToRgba(bgColor || '#140e0a', Math.max(0.20, opacityVal - 0.15));
    const bottomOverlay = hexToRgba(bgColor || '#140e0a', Math.min(0.98, opacityVal + 0.15));
    el.style.backgroundImage = \`linear-gradient(\${topOverlay}, \${bottomOverlay}), url('\${imgUrl}')\`;
    el.style.backgroundSize = fitVal;
    el.style.backgroundPosition = 'center';
    el.style.backgroundRepeat = 'no-repeat';
    if (bgColor) el.style.backgroundColor = bgColor;
  } else if (bgColor) {
    el.classList.remove('has-bg-image');
    el.style.backgroundImage = 'none';
    el.style.backgroundColor = bgColor;
    el.style.backgroundSize = '';
    el.style.backgroundPosition = '';
    el.style.backgroundRepeat = '';
  } else {
    el.classList.remove('has-bg-image');
    el.style.backgroundImage = '';
    el.style.backgroundColor = '';
    el.style.backgroundSize = '';
    el.style.backgroundPosition = '';
    el.style.backgroundRepeat = '';
  }
}
`;

  const blob = new Blob([code], { type: 'application/javascript;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'data.js';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  showToast('📥 ดาวน์โหลดไฟล์ data.js สำเร็จ! นำไปวางทับใน js/data.js เพื่ออัปโหลดขึ้น GitHub ได้เลย');
};

/* ---------------- Magic Link Share Generator (Zero-Hassle Instant Sharing) ---------------- */
function buildMagicShareUrl(forLocalPreview = false) {
  const currentWorks = worksheets || DEFAULT_WORKSHEETS;
  const currentProf = profileData || DEFAULT_PROFILE;

  const payload = {
    p: currentProf,
    w: currentWorks,
    t: Date.now()
  };

  const jsonStr = JSON.stringify(payload);
  const base64Str = btoa(unescape(encodeURIComponent(jsonStr)));

  if (forLocalPreview) {
    return `index.html#sync=${base64Str}`;
  }

  let baseUrl = window.location.origin + window.location.pathname.replace('admin.html', '').replace('admin', '');
  if (!baseUrl.endsWith('/')) baseUrl += '/';
  if (baseUrl.includes('file:') || baseUrl.includes('localhost') || baseUrl.includes('127.0.0.1')) {
    baseUrl = 'https://siteme-liart.vercel.app/';
  }

  return `${baseUrl}#sync=${base64Str}`;
}

window.copyMagicShareLink = function () {
  const shareUrl = buildMagicShareUrl(false);

  // Set URL into modal input
  const input = document.getElementById('magic-share-link-input');
  if (input) input.value = shareUrl;

  // Open the modal
  const modal = document.getElementById('magic-share-modal');
  if (modal) modal.classList.add('active');

  // Trigger celebratory confetti burst
  if (typeof fireConfetti === 'function') {
    fireConfetti();
  }

  // Copy to clipboard
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(shareUrl).then(() => {
      showToast('🔗 คัดลอกลิงก์แชร์เรียบร้อยแล้ว! ส่งต่อให้ใครเปิดดูก็จะเห็นเว็บที่คุณแก้ล่าสุด 100% ทันที');
    }).catch(() => {
      fallbackCopyText(shareUrl);
    });
  } else {
    fallbackCopyText(shareUrl);
  }
};

window.closeMagicShareModal = function () {
  const modal = document.getElementById('magic-share-modal');
  if (modal) modal.classList.remove('active');
};

window.copyMagicModalLink = function () {
  const input = document.getElementById('magic-share-link-input');
  const url = input ? input.value : buildMagicShareUrl(false);

  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(url).then(() => {
      showToast('📋 คัดลอกลิงก์เรียบร้อยแล้ว!');
    }).catch(() => {
      fallbackCopyText(url);
    });
  } else {
    fallbackCopyText(url);
  }
};

window.openMagicPreview = function () {
  const localUrl = buildMagicShareUrl(true);
  window.open(localUrl, '_blank');
};
