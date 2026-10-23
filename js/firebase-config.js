/**
 * Firebase Real-Time Cloud Configuration for Pakawat Portfolio
 * 
 * คุณสามารถนำ Firebase Config จาก Google Firebase Console มาใส่ที่นี่
 * หรือสามารถกรอกผ่านหน้า Admin เมนู "☁️ คลาวด์เรียลไทม์ (Google Cloud)" ได้โดยตรง
 */

const DEFAULT_FIREBASE_CONFIG = {
  apiKey: "",
  authDomain: "",
  projectId: "",
  storageBucket: "",
  messagingSenderId: "",
  appId: ""
};

// อ่าน config จาก localStorage หากมีการบันทึกผ่านหน้า Admin
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
