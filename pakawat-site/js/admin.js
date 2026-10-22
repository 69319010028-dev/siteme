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
}

function saveWorksheets() {
  localStorage.setItem(STORAGE_WORKS_KEY, JSON.stringify(worksheets));
  renderAdminAll();
  if (adminFilterCalendarInstance) {
    adminFilterCalendarInstance.refresh();
  }
  broadcastRealtimeSync('WORKSHEETS_UPDATED', { count: worksheets.length });
}

function saveProfile() {
  localStorage.setItem(STORAGE_PROFILE_KEY, JSON.stringify(profileData));
  renderAdminEducation();
  renderAdminBrand();
  renderAdminHero();
  broadcastRealtimeSync('PROFILE_UPDATED');
}

/* ---------------- Tab Switching ---------------- */
window.switchAdminTab = function (tabName) {
  const tabWorks = document.getElementById('admin-tab-works');
  const tabEdu = document.getElementById('admin-tab-edu');
  const tabBrand = document.getElementById('admin-tab-brand');
  const tabHero = document.getElementById('admin-tab-hero');
  const btnWorks = document.getElementById('tab-btn-works');
  const btnEdu = document.getElementById('tab-btn-edu');
  const btnBrand = document.getElementById('tab-btn-brand');
  const btnHero = document.getElementById('tab-btn-hero');

  if (tabWorks) tabWorks.style.display = (tabName === 'works') ? 'block' : 'none';
  if (tabEdu) tabEdu.style.display = (tabName === 'edu') ? 'block' : 'none';
  if (tabBrand) tabBrand.style.display = (tabName === 'brand') ? 'block' : 'none';
  if (tabHero) tabHero.style.display = (tabName === 'hero') ? 'block' : 'none';

  if (btnWorks) btnWorks.classList.toggle('active', tabName === 'works');
  if (btnEdu) btnEdu.classList.toggle('active', tabName === 'edu');
  if (btnBrand) btnBrand.classList.toggle('active', tabName === 'brand');
  if (btnHero) btnHero.classList.toggle('active', tabName === 'hero');
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
  const badge = (profile && profile.brandBadge) || 'P';
  const logoImg = (profile && profile.brandLogoImage) || '';
  const name = (profile && profile.brandTitle) || 'ภควัต';
  const sub = (profile && profile.brandSubtitle !== undefined) ? profile.brandSubtitle : 'Portfolio';

  currentBrandLogoBase64 = logoImg;

  const badgeInput = document.getElementById('input-brand-badge');
  const nameInput = document.getElementById('input-brand-name');
  const subInput = document.getElementById('input-brand-subtitle');
  const previewImg = document.getElementById('brand-logo-preview-img');
  const placeholder = document.getElementById('brand-logo-placeholder');
  const clearBtn = document.getElementById('btn-clear-logo-img');

  if (badgeInput && document.activeElement !== badgeInput) badgeInput.value = badge;
  if (nameInput && document.activeElement !== nameInput) nameInput.value = name;
  if (subInput && document.activeElement !== subInput) subInput.value = sub;

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
  const badgeInput = document.getElementById('input-brand-badge');
  const nameInput = document.getElementById('input-brand-name');
  const subInput = document.getElementById('input-brand-subtitle');

  const badge = badgeInput ? badgeInput.value.trim() || 'P' : 'P';
  const name = nameInput ? nameInput.value.trim() || 'ภควัต' : 'ภควัต';
  const sub = subInput ? subInput.value.trim() : 'Portfolio';

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
  const badgeInput = document.getElementById('input-brand-badge');
  const nameInput = document.getElementById('input-brand-name');
  const subInput = document.getElementById('input-brand-subtitle');

  if (!profileData) profileData = JSON.parse(JSON.stringify(DEFAULT_PROFILE));

  profileData.brandBadge = badgeInput ? badgeInput.value.trim() || 'P' : 'P';
  profileData.brandLogoImage = (currentBrandLogoBase64 !== null) ? currentBrandLogoBase64 : (profileData.brandLogoImage || '');
  profileData.brandTitle = nameInput ? nameInput.value.trim() || 'ภควัต' : 'ภควัต';
  profileData.brandSubtitle = subInput ? subInput.value.trim() : '';

  saveProfile();
  showToast(`บันทึกโลโก้และชื่อ "${profileData.brandTitle}" สำเร็จเรียบร้อย! ✨`);
};

window.resetBrandDefaults = function () {
  if (confirm('ต้องการรีเซ็ตชื่อและโลโก้เว็บไซต์กลับเป็นค่าเริ่มต้นหรือไม่?')) {
    if (!profileData) profileData = JSON.parse(JSON.stringify(DEFAULT_PROFILE));
    currentBrandLogoBase64 = '';
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

function renderAdminHero() {
  const profile = profileData || DEFAULT_PROFILE;
  const def = DEFAULT_PROFILE;

  const tag = (profile && profile.heroTag) || def.heroTag || 'คลังเก็บผลงานและใบงานออนไลน์';
  const greeting = (profile && profile.heroGreeting) || def.heroGreeting || 'สวัสดีครับ, ผม';
  const name = (profile && profile.heroName) || (profile && profile.brandTitle) || def.heroName || 'ภควัต';
  const sub = (profile && profile.heroSubtitle) || def.heroSubtitle || 'ยินดีต้อนรับสู่พื้นที่รวมงาน';
  const desc = (profile && profile.heroDesc) || def.heroDesc || '';
  const avatar = (profile && profile.avatarImage) || '';
  const majorIcon = (profile && profile.heroMajorIcon) || def.heroMajorIcon || '💻';
  const majorLabel = (profile && profile.heroMajorLabel) || def.heroMajorLabel || 'สาขาการเรียน';
  const majorVal = (profile && profile.heroMajorVal) || def.heroMajorVal || 'วิทย์-คณิต-คอมฯ';
  const gpa = (profile && (profile.heroGpa || profile.gpa)) || def.heroGpa || '3.85';
  const gpaLabel = (profile && profile.heroGpaLabel) || def.heroGpaLabel || 'เกรดเฉลี่ยสะสม (GPA)';
  const commit = (profile && profile.heroCommitment) || def.heroCommitment || '100%';
  const commitLabel = (profile && profile.heroCommitmentLabel) || def.heroCommitmentLabel || 'ความตั้งใจและส่งตรงเวลา';

  currentHeroAvatarBase64 = avatar;

  const tagInput = document.getElementById('input-hero-tag');
  const greetingInput = document.getElementById('input-hero-greeting');
  const nameInput = document.getElementById('input-hero-name');
  const subInput = document.getElementById('input-hero-sub');
  const descInput = document.getElementById('input-hero-desc');
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
  if (descInput && document.activeElement !== descInput) descInput.value = desc;
  if (majorIconInput && document.activeElement !== majorIconInput) majorIconInput.value = majorIcon;
  if (majorLabelInput && document.activeElement !== majorLabelInput) majorLabelInput.value = majorLabel;
  if (majorValInput && document.activeElement !== majorValInput) majorValInput.value = majorVal;
  if (gpaInput && document.activeElement !== gpaInput) gpaInput.value = gpa;
  if (gpaLabelInput && document.activeElement !== gpaLabelInput) gpaLabelInput.value = gpaLabel;
  if (commitInput && document.activeElement !== commitInput) commitInput.value = commit;
  if (commitLabelInput && document.activeElement !== commitLabelInput) commitLabelInput.value = commitLabel;

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
  const pBadgeIcon = document.getElementById('preview-hero-badge-icon');
  const pBadgeLabel = document.getElementById('preview-hero-badge-label');
  const pBadgeVal = document.getElementById('preview-hero-badge-val');
  const pStatWorks = document.getElementById('preview-stat-works');
  const pStatBadgeWorks = document.getElementById('preview-stat-badge-works');
  const pStatGpa = document.getElementById('preview-stat-gpa');
  const pStatGpaLabel = document.getElementById('preview-stat-gpa-label');
  const pStatCommit = document.getElementById('preview-stat-commit');
  const pStatCommitLabel = document.getElementById('preview-stat-commit-label');

  if (pTag) pTag.innerText = (tagInput && tagInput.value.trim()) || 'คลังเก็บผลงานและใบงานออนไลน์';
  if (pGreeting) pGreeting.innerText = (greetingInput && greetingInput.value.trim()) || 'สวัสดีครับ, ผม';
  if (pName) pName.innerText = (nameInput && nameInput.value.trim()) || 'ภควัต';
  if (pSub) pSub.innerText = (subInput && subInput.value.trim()) || 'ยินดีต้อนรับสู่พื้นที่รวมงาน';
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
};

window.handleHeroSave = function (e) {
  if (e) e.preventDefault();
  const tagInput = document.getElementById('input-hero-tag');
  const greetingInput = document.getElementById('input-hero-greeting');
  const nameInput = document.getElementById('input-hero-name');
  const subInput = document.getElementById('input-hero-sub');
  const descInput = document.getElementById('input-hero-desc');
  const majorIconInput = document.getElementById('input-hero-major-icon');
  const majorLabelInput = document.getElementById('input-hero-major-label');
  const majorValInput = document.getElementById('input-hero-major-val');
  const gpaInput = document.getElementById('input-hero-gpa');
  const gpaLabelInput = document.getElementById('input-hero-gpa-label');
  const commitInput = document.getElementById('input-hero-commit');
  const commitLabelInput = document.getElementById('input-hero-commit-label');

  if (!profileData) profileData = JSON.parse(JSON.stringify(DEFAULT_PROFILE));

  profileData.heroTag = (tagInput && tagInput.value.trim()) || 'คลังเก็บผลงานและใบงานออนไลน์';
  profileData.heroGreeting = (greetingInput && greetingInput.value.trim()) || 'สวัสดีครับ, ผม';
  profileData.heroName = (nameInput && nameInput.value.trim()) || 'ภควัต';
  profileData.heroSubtitle = (subInput && subInput.value.trim()) || 'ยินดีต้อนรับสู่พื้นที่รวมงาน';
  profileData.heroDesc = (descInput && descInput.value.trim()) || DEFAULT_PROFILE.heroDesc;
  profileData.avatarImage = (currentHeroAvatarBase64 !== null) ? currentHeroAvatarBase64 : (profileData.avatarImage || '');
  profileData.heroMajorIcon = (majorIconInput && majorIconInput.value.trim()) || '💻';
  profileData.heroMajorLabel = (majorLabelInput && majorLabelInput.value.trim()) || 'สาขาการเรียน';
  profileData.heroMajorVal = (majorValInput && majorValInput.value.trim()) || 'วิทย์-คณิต-คอมฯ';
  profileData.heroGpa = (gpaInput && gpaInput.value.trim()) || '3.85';
  profileData.gpa = profileData.heroGpa;
  profileData.heroGpaLabel = (gpaLabelInput && gpaLabelInput.value.trim()) || 'เกรดเฉลี่ยสะสม (GPA)';
  profileData.heroCommitment = (commitInput && commitInput.value.trim()) || '100%';
  profileData.heroCommitmentLabel = (commitLabelInput && commitLabelInput.value.trim()) || 'ความตั้งใจและส่งตรงเวลา';

  saveProfile();
  showToast(`บันทึกข้อมูลแบนเนอร์หน้าแรก & รูปโปรไฟล์เรียบร้อย! ✨`);
};

window.resetHeroDefaults = function () {
  if (confirm('ต้องการรีเซ็ตแบนเนอร์หน้าแรกและรูปโปรไฟล์กลับเป็นค่าเริ่มต้นหรือไม่?')) {
    if (!profileData) profileData = JSON.parse(JSON.stringify(DEFAULT_PROFILE));
    const def = DEFAULT_PROFILE;

    currentHeroAvatarBase64 = '';
    profileData.heroTag = def.heroTag;
    profileData.heroGreeting = def.heroGreeting;
    profileData.heroName = def.heroName;
    profileData.heroSubtitle = def.heroSubtitle;
    profileData.heroDesc = def.heroDesc;
    profileData.avatarImage = '';
    profileData.heroMajorIcon = def.heroMajorIcon;
    profileData.heroMajorLabel = def.heroMajorLabel;
    profileData.heroMajorVal = def.heroMajorVal;
    profileData.heroGpa = def.heroGpa;
    profileData.gpa = def.gpa;
    profileData.heroGpaLabel = def.heroGpaLabel;
    profileData.heroCommitment = def.heroCommitment;
    profileData.heroCommitmentLabel = def.heroCommitmentLabel;

    const fileInput = document.getElementById('hero-avatar-file');
    if (fileInput) fileInput.value = '';

    saveProfile();
    renderAdminHero();
    showToast('รีเซ็ตแบนเนอร์หน้าแรกกลับเป็นค่าเริ่มต้นแล้ว');
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

  // Add Worksheet Image Upload
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

      const newWork = {
        id: 'work-' + Date.now(),
        title: title,
        date: formattedDate,
        rawDate: rawDate,
        link: link,
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
        fileLink: link || '#'
      };

      worksheets.unshift(newWork);
      saveWorksheets();
      closeAllModals();
      addForm.reset();

      currentAddImageBase64 = null;
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

  // Edit Worksheet Image Upload
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
        target.link = newLink;
        target.fileLink = newLink || '#';
        if (currentEditImageBase64) {
          target.image = currentEditImageBase64;
        }
        currentEditImageBase64 = null;

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

      const item = profileData.education.find(it => (it.id === id)) || profileData.education[id];
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
  const profile = profileData || DEFAULT_PROFILE;
  if (!profile || !profile.education) return;

  const item = profile.education.find(e => (e.id === eduId)) || profile.education[eduId];
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

/* ---------------- Helper: Image Processing & Formatters ---------------- */
function processImageFile(file, callback) {
  if (!file) return;
  const reader = new FileReader();

  if (file.size <= 8 * 1024 * 1024) {
    reader.onload = (e) => callback(e.target.result);
    reader.readAsDataURL(file);
    return;
  }

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
      callback(canvas.toDataURL('image/jpeg', 0.96));
    };
    img.src = e.target.result;
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
