/**
 * Firebase Real-Time Cloud Configuration for Pakawat Portfolio
 * Google Sites-like Real-Time Database Sync
 */

const DEFAULT_FIREBASE_CONFIG = {
  apiKey: "AIzaSyBqLbjZ1RJINHPvHBa9e3neIBR2LK7TukY",
  authDomain: "pakawat-site.firebaseapp.com",
  projectId: "pakawat-site",
  storageBucket: "pakawat-site.firebasestorage.app",
  messagingSenderId: "280773564027",
  appId: "1:280773564027:web:19454bacbcdaf05d0974de",
  measurementId: "G-1ZFZ60MCDJ"
};

// อ่าน config จาก localStorage หรือใช้ DEFAULT_FIREBASE_CONFIG
function getActiveFirebaseConfig() {
  try {
    const saved = localStorage.getItem('pakawat_firebase_config');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed && parsed.apiKey && parsed.projectId) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn('Error reading saved firebase config:', e);
  }
  return DEFAULT_FIREBASE_CONFIG;
}
