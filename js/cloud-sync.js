/**
 * Cloud Sync Module (Google Firebase Firestore)
 * Enables Google Sites-like real-time data sync across all devices and visitors.
 */

const CLOUD_COLLECTION = 'pakawat_site_data';
const CLOUD_DOC = 'main_content';
const CLOUD_STORAGE_CONFIG_KEY = 'pakawat_firebase_config';

const CloudSync = (function () {
  let db = null;
  let unsubscribeListener = null;
  let isConnected = false;
  let lastSyncTime = null;
  let onDataCallbacks = [];

  // Initialize Firebase Firestore
  function init(onDataCallback) {
    if (onDataCallback && typeof onDataCallback === 'function') {
      onDataCallbacks.push(onDataCallback);
    }

    const config = getActiveFirebaseConfig();
    if (!config || !config.apiKey || !config.projectId) {
      console.log('CloudSync: Firebase config not found. Running in local mode.');
      updateBadgeUI(false);
      return false;
    }

    if (!window.firebase) {
      console.warn('CloudSync: Firebase SDK not loaded from CDN.');
      updateBadgeUI(false);
      return false;
    }

    try {
      if (!firebase.apps.length) {
        firebase.initializeApp(config);
      }
      db = firebase.firestore();
      isConnected = true;
      console.log('CloudSync: Connected to Firebase Firestore (' + config.projectId + ')');

      // Start Real-Time Listener
      startListener();
      updateBadgeUI(true);
      return true;
    } catch (err) {
      console.error('CloudSync: Firebase initialization error:', err);
      isConnected = false;
      updateBadgeUI(false, err.message);
      return false;
    }
  }

  // Subscribe to real-time updates from Firestore
  function startListener() {
    if (!db) return;

    if (unsubscribeListener) {
      unsubscribeListener();
    }

    try {
      unsubscribeListener = db.collection(CLOUD_COLLECTION).doc(CLOUD_DOC)
        .onSnapshot((doc) => {
          if (doc.exists) {
            const data = doc.data();
            lastSyncTime = data.updatedAt || Date.now();
            console.log('CloudSync: Received real-time update from cloud 🚀', new Date(lastSyncTime));

            // Broadcast to registered callbacks
            onDataCallbacks.forEach(cb => {
              try {
                cb(data);
              } catch (e) {
                console.error('Error in CloudSync callback:', e);
              }
            });

            updateBadgeUI(true);
          } else {
            console.log('CloudSync: Cloud document not found yet.');
            updateBadgeUI(true, 'เชื่อมต่อแล้ว (รอการบันทึกข้อมูลครั้งแรก)');
          }
        }, (error) => {
          console.warn('CloudSync: Real-time listener error:', error);
          updateBadgeUI(false, error.message);
        });
    } catch (err) {
      console.error('CloudSync: Failed to attach listener:', err);
      updateBadgeUI(false, err.message);
    }
  }

  // Compress Base64 image to prevent exceeding Firestore 1MB document limit
  function compressBase64(base64Str, maxWidth = 1200, quality = 0.82) {
    return new Promise((resolve) => {
      if (!base64Str || !base64Str.startsWith('data:image')) {
        return resolve(base64Str);
      }

      // If already small (< 150KB), no need to compress
      if (base64Str.length < 200000) {
        return resolve(base64Str);
      }

      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);

        const compressed = canvas.toDataURL('image/jpeg', quality);
        resolve(compressed);
      };
      img.onerror = () => resolve(base64Str);
      img.src = base64Str;
    });
  }

  // Sanitize and compress data before sending to Firestore
  async function prepareDataForCloud(profile, works) {
    const safeProfile = JSON.parse(JSON.stringify(profile || {}));
    const safeWorks = JSON.parse(JSON.stringify(works || []));

    if (safeProfile.avatarImage && safeProfile.avatarImage.startsWith('data:image')) {
      safeProfile.avatarImage = await compressBase64(safeProfile.avatarImage, 800, 0.85);
    }
    if (safeProfile.heroBannerImage && safeProfile.heroBannerImage.startsWith('data:image')) {
      safeProfile.heroBannerImage = await compressBase64(safeProfile.heroBannerImage, 1400, 0.80);
    }
    if (safeProfile.brandLogoImage && safeProfile.brandLogoImage.startsWith('data:image')) {
      safeProfile.brandLogoImage = await compressBase64(safeProfile.brandLogoImage, 400, 0.85);
    }

    for (let work of safeWorks) {
      if (work.image && work.image.startsWith('data:image')) {
        work.image = await compressBase64(work.image, 1000, 0.82);
      }
    }

    return {
      profile: safeProfile,
      worksheets: safeWorks,
      updatedAt: Date.now(),
      updatedFormatted: new Date().toLocaleString('th-TH')
    };
  }

  // Save data to Firestore Cloud
  async function saveToCloud(profile, works) {
    if (!db || !isConnected) {
      console.log('CloudSync: Not connected to cloud, saved locally only.');
      return { success: false, reason: 'not_connected' };
    }

    try {
      const payload = await prepareDataForCloud(profile, works);
      await db.collection(CLOUD_COLLECTION).doc(CLOUD_DOC).set(payload, { merge: true });
      lastSyncTime = payload.updatedAt;
      console.log('CloudSync: Data successfully pushed to Google Cloud! ☁️✨');
      return { success: true, timestamp: lastSyncTime };
    } catch (err) {
      console.error('CloudSync: Error saving to Firestore:', err);
      return { success: false, error: err.message };
    }
  }

  // Test connection with given Firebase config
  async function testConnection(customConfig) {
    const config = customConfig || getActiveFirebaseConfig();
    if (!config || !config.apiKey || !config.projectId) {
      return { success: false, message: 'กรุณากรอก API Key และ Project ID ให้ครบถ้วน' };
    }

    if (!window.firebase) {
      return { success: false, message: 'ไม่พบ Firebase SDK จาก CDN' };
    }

    try {
      let testApp;
      const appName = 'test_app_' + Date.now();
      testApp = firebase.initializeApp(config, appName);
      const testDb = testApp.firestore();

      // Test ping write/read
      const testRef = testDb.collection('_connection_test').doc('ping');
      await testRef.set({ test: true, timestamp: Date.now() });
      await testRef.get();
      await testApp.delete();

      return { success: true, message: 'เชื่อมต่อ Google Firebase Firestore สำเร็จ 100%! 🟢' };
    } catch (err) {
      let msg = err.message;
      if (msg.includes('permission-denied') || msg.includes('Missing or insufficient permissions')) {
        msg = 'เชื่อมต่อได้ แต่ถูกปฏิเสธสิทธิ์ (Security Rules): กรุณาไปที่ Firebase Console > Firestore > Rules แล้วตั้งค่าเป็น allow read, write: if true; (โหมด Test)';
      }
      return { success: false, message: msg };
    }
  }

  // Save config to LocalStorage
  function saveConfig(configObj) {
    try {
      localStorage.setItem(CLOUD_STORAGE_CONFIG_KEY, JSON.stringify(configObj));
      return true;
    } catch (e) {
      console.error('Error saving firebase config:', e);
      return false;
    }
  }

  // Clear config from LocalStorage
  function clearConfig() {
    try {
      localStorage.removeItem(CLOUD_STORAGE_CONFIG_KEY);
      if (unsubscribeListener) unsubscribeListener();
      isConnected = false;
      db = null;
      updateBadgeUI(false);
      return true;
    } catch (e) {
      return false;
    }
  }

  // Update UI Realtime Badges
  function updateBadgeUI(connected, info = '') {
    const badges = document.querySelectorAll('.realtime-live-badge');
    badges.forEach(badge => {
      if (connected) {
        badge.innerHTML = `
          <span class="pulse-green-dot"></span>
          <span>คลาวด์เรียลไทม์</span>
        `;
        badge.setAttribute('title', 'เชื่อมต่อ Google Cloud เรียลไทม์แล้ว! เมื่อแก้ไขข้อมูล ทุกคนที่เปิดลิงก์จะเห็นอัปเดตทันทีแบบ Google Sites');
        badge.style.borderColor = 'rgba(16, 185, 129, 0.4)';
        badge.style.background = 'rgba(16, 185, 129, 0.12)';
        badge.style.color = '#34d399';
      } else {
        badge.innerHTML = `
          <span class="pulse-yellow-dot" style="width:8px; height:8px; border-radius:50%; background:#eab308; display:inline-block; animation: pulse 2s infinite;"></span>
          <span>โหมดโลคอล</span>
        `;
        badge.setAttribute('title', info || 'ทำงานในเครื่อง (ยังไม่ได้เชื่อมต่อคลาวด์ Firebase: คลิกเพื่อดูวิธีเชื่อมต่อ)');
        badge.style.borderColor = 'rgba(234, 179, 8, 0.35)';
        badge.style.background = 'rgba(234, 179, 8, 0.08)';
        badge.style.color = '#fde047';
      }
    });

    const adminCloudStatus = document.getElementById('admin-cloud-status-badge');
    if (adminCloudStatus) {
      if (connected) {
        adminCloudStatus.innerHTML = `
          <span style="display:inline-block; width:10px; height:10px; border-radius:50%; background:#10b981; box-shadow:0 0 10px #10b981;"></span>
          <span style="font-weight:700; color:#34d399;">🟢 เชื่อมต่อคลาวด์เรียลไทม์แล้ว (Live Cloud Sync Active)</span>
        `;
      } else {
        adminCloudStatus.innerHTML = `
          <span style="display:inline-block; width:10px; height:10px; border-radius:50%; background:#eab308; box-shadow:0 0 8px #eab308;"></span>
          <span style="font-weight:600; color:#fde047;">🟡 โหมดโลคอล (ยังไม่ได้เชื่อมต่อ Google Firebase Cloud)</span>
        `;
      }
    }
  }

  return {
    init,
    saveToCloud,
    testConnection,
    saveConfig,
    clearConfig,
    getStatus: () => ({ isConnected, lastSyncTime, config: getActiveFirebaseConfig() }),
    updateBadgeUI
  };
})();
