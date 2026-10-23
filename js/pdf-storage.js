/**
 * PdfStorage - High Performance Storage & Blob Manager for PDF Documents
 * Fixes browser localStorage 5MB quota and Chrome data: URL blocking (about:blank#blocked)
 */
const PdfStorage = (function () {
  const DB_NAME = 'pakawat_pdf_db';
  const DB_VERSION = 1;
  const STORE_NAME = 'pdf_files';

  // In-memory cache for fast synchronous access
  const memoryCache = new Map();

  function openDb() {
    return new Promise((resolve, reject) => {
      if (!window.indexedDB) {
        return resolve(null);
      }
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      request.onupgradeneeded = (e) => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        }
      };
      request.onsuccess = (e) => resolve(e.target.result);
      request.onerror = (e) => {
        console.warn('PdfStorage: IndexedDB open failed, using memory fallback', e);
        resolve(null);
      };
    });
  }

  // Convert Base64 data:application/pdf to binary Blob
  function dataUrlToBlob(dataUrl) {
    if (!dataUrl || !dataUrl.startsWith('data:')) {
      return null;
    }
    try {
      const parts = dataUrl.split(';base64,');
      const contentType = parts[0].split(':')[1] || 'application/pdf';
      const raw = window.atob(parts[1]);
      const rawLength = raw.length;
      const uInt8Array = new Uint8Array(rawLength);
      for (let i = 0; i < rawLength; ++i) {
        uInt8Array[i] = raw.charCodeAt(i);
      }
      return new Blob([uInt8Array], { type: contentType });
    } catch (err) {
      console.error('PdfStorage: Failed to convert dataUrl to Blob:', err);
      return null;
    }
  }

  // Save PDF data to IndexedDB
  async function savePdf(id, dataUrl, fileName) {
    if (!id || !dataUrl) return false;
    memoryCache.set(id, { dataUrl, fileName });

    try {
      const db = await openDb();
      if (!db) return true;

      return new Promise((resolve) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        store.put({
          id: id,
          data: dataUrl,
          fileName: fileName || 'document.pdf',
          updatedAt: Date.now()
        });
        tx.oncomplete = () => resolve(true);
        tx.onerror = (err) => {
          console.warn('PdfStorage put failed:', err);
          resolve(false);
        };
      });
    } catch (e) {
      console.warn('PdfStorage savePdf error:', e);
      return false;
    }
  }

  // Retrieve PDF data from IndexedDB
  async function getPdf(id) {
    if (!id) return null;
    if (memoryCache.has(id)) {
      return memoryCache.get(id).dataUrl;
    }

    try {
      const db = await openDb();
      if (!db) return null;

      return new Promise((resolve) => {
        const tx = db.transaction(STORE_NAME, 'readonly');
        const store = tx.objectStore(STORE_NAME);
        const req = store.get(id);
        req.onsuccess = () => {
          if (req.result && req.result.data) {
            memoryCache.set(id, { dataUrl: req.result.data, fileName: req.result.fileName });
            resolve(req.result.data);
          } else {
            resolve(null);
          }
        };
        req.onerror = () => resolve(null);
      });
    } catch (e) {
      console.warn('PdfStorage getPdf error:', e);
      return null;
    }
  }

  // Delete PDF
  async function deletePdf(id) {
    if (!id) return;
    memoryCache.delete(id);
    try {
      const db = await openDb();
      if (!db) return;
      const tx = db.transaction(STORE_NAME, 'readwrite');
      tx.objectStore(STORE_NAME).delete(id);
    } catch (e) {
      // ignore
    }
  }

  // Open PDF in a new tab safely without about:blank#blocked
  function openPdfInNewTab(pdfSource, fileName = 'เอกสาร.pdf') {
    if (!pdfSource) {
      alert('ไม่พบที่อยู่เอกสาร PDF');
      return;
    }

    // Direct base64 data URL: convert to Blob URL to bypass Chrome about:blank#blocked
    if (pdfSource.startsWith('data:application/pdf')) {
      const blob = dataUrlToBlob(pdfSource);
      if (blob) {
        const blobUrl = URL.createObjectURL(blob);
        const newWin = window.open(blobUrl, '_blank');
        if (!newWin) {
          // If popup blocked, fallback to download
          downloadPdf(pdfSource, fileName);
        }
        return;
      }
    }

    // Google Drive URL
    const driveMatch = pdfSource.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/);
    if (driveMatch) {
      window.open(`https://drive.google.com/file/d/${driveMatch[1]}/preview`, '_blank');
      return;
    }

    // Web / HTTP URL
    window.open(pdfSource, '_blank');
  }

  // Download PDF file
  function downloadPdf(pdfSource, fileName = 'เอกสาร.pdf') {
    if (!pdfSource) return;

    if (!fileName.toLowerCase().endsWith('.pdf')) {
      fileName += '.pdf';
    }

    const a = document.createElement('a');
    if (pdfSource.startsWith('data:application/pdf')) {
      const blob = dataUrlToBlob(pdfSource);
      if (blob) {
        const blobUrl = URL.createObjectURL(blob);
        a.href = blobUrl;
      } else {
        a.href = pdfSource;
      }
    } else {
      a.href = pdfSource;
    }

    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
    }, 120);
  }

  return {
    savePdf,
    getPdf,
    deletePdf,
    dataUrlToBlob,
    openPdfInNewTab,
    downloadPdf
  };
})();

window.PdfStorage = PdfStorage;
