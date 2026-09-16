/**
 * DIU ICE Routine - Firebase Cloud Sync Module
 * Provides global real-time synchronization for class routines using Cloud Firestore.
 * 
 * Instructions:
 * 1. Create a free project at https://console.firebase.google.com/
 * 2. Create a Firestore Database in Test Mode
 * 3. Copy your Web App config keys and paste them below, or configure via the UI modal.
 */

const DEFAULT_FIREBASE_CONFIG = {
  apiKey: "AIzaSyCwkXCLgIHEi9ZuXabaQxvR8Fm8I7i82Us",
  authDomain: "diu-ice-routine.firebaseapp.com",
  projectId: "diu-ice-routine",
  storageBucket: "diu-ice-routine.firebasestorage.app",
  messagingSenderId: "611304578107",
  appId: "1:611304578107:web:4dea4530efc395d33f501e",
  measurementId: "G-5ZBN5YLPQE"
};

class FirebaseSyncService {
  constructor() {
    this.app = null;
    this.db = null;
    this.initialized = false;
    this.unsubscribeListener = null;
  }

  getConfig() {
    try {
      const saved = localStorage.getItem('diu_ice_firebase_config');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.apiKey && parsed.projectId) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn("Failed to load saved Firebase config", e);
    }
    return DEFAULT_FIREBASE_CONFIG;
  }

  saveConfig(config) {
    try {
      localStorage.setItem('diu_ice_firebase_config', JSON.stringify(config));
      return true;
    } catch (e) {
      console.error("Failed to save Firebase config", e);
      return false;
    }
  }

  clearConfig() {
    localStorage.removeItem('diu_ice_firebase_config');
    this.initialized = false;
    this.app = null;
    this.db = null;
  }

  isConfigured() {
    const config = this.getConfig();
    return Boolean(config && config.apiKey && config.projectId && config.apiKey.length > 5);
  }

  init() {
    if (typeof firebase === 'undefined') {
      console.warn("Firebase SDK not loaded");
      return false;
    }

    const config = this.getConfig();
    if (!config || !config.apiKey || !config.projectId) {
      return false;
    }

    try {
      if (!firebase.apps || !firebase.apps.length) {
        this.app = firebase.initializeApp(config);
      } else {
        this.app = firebase.app();
      }
      this.db = firebase.firestore();
      this.initialized = true;
      console.log("🔥 Firebase Firestore connected successfully for DIU ICE Routine");
      return true;
    } catch (err) {
      console.error("Firebase init failed:", err);
      this.initialized = false;
      return false;
    }
  }

  /**
   * Listen to real-time routine updates published by anyone
   */
  subscribeToGlobalRoutine(onSuccess, onError) {
    if (!this.initialized && !this.init()) {
      return null;
    }

    try {
      const docRef = this.db.collection('ice_routines').doc('active');
      this.unsubscribeListener = docRef.onSnapshot((doc) => {
        if (doc.exists) {
          const data = doc.data();
          if (onSuccess) onSuccess(data);
        }
      }, (err) => {
        console.error("Firestore real-time subscription error:", err);
        if (onError) onError(err);
      });
      return this.unsubscribeListener;
    } catch (err) {
      console.error("Failed to subscribe to global routine:", err);
      return null;
    }
  }

  /**
   * Publish new routine data globally so every student immediately gets it
   */
  async publishGlobalRoutine(payload) {
    if (!this.initialized && !this.init()) {
      throw new Error("Firebase is not configured yet. Please configure Firebase keys first.");
    }

    try {
      const docRef = this.db.collection('ice_routines').doc('active');
      const docData = {
        sheetUrl: payload.sheetUrl || "",
        semester: payload.semester || "Active Semester",
        batches: payload.batches || [],
        rawSchedule: payload.rawSchedule || {},
        updatedAt: new Date().toISOString(),
        updatedBy: payload.updatedBy || "DIU Student/CR",
        totalClasses: payload.totalClasses || 0,
        sourceType: payload.sourceType || "google_sheet",
        recentUpdates: payload.recentUpdates || []
      };

      await docRef.set(docData, { merge: true });
      return docData;
    } catch (err) {
      console.error("Failed to publish global routine to Firestore:", err);
      throw err;
    }
  }

  /**
   * Fetch active routine once
   */
  async fetchActiveRoutine() {
    if (!this.initialized && !this.init()) {
      return null;
    }

    try {
      const docRef = this.db.collection('ice_routines').doc('active');
      const doc = await docRef.get();
      if (doc.exists) {
        return doc.data();
      }
      return null;
    } catch (err) {
      console.error("Firestore get error:", err);
      return null;
    }
  }

  /**
   * Real-time visitor counter & live presence tracker (100% Real, Firestore-backed)
   */
  initVisitorTracker(onUpdate) {
    if (!this.initialized && !this.init()) {
      console.warn("Visitor tracker could not initialize Firebase");
      return;
    }

    try {
      // 1. Generate or recover Session ID for presence tracking
      let sessionId = sessionStorage.getItem('ice_routine_session_id');
      if (!sessionId) {
        sessionId = 'vis_' + Math.random().toString(36).substring(2, 9) + '_' + Date.now().toString(36);
        sessionStorage.setItem('ice_routine_session_id', sessionId);
      }

      // 2. Track new visit session once per browser session
      const hasVisited = sessionStorage.getItem('ice_routine_visit_logged');
      if (!hasVisited) {
        sessionStorage.setItem('ice_routine_visit_logged', '1');
        const statsDocRef = this.db.collection('site_stats').doc('visitors');
        statsDocRef.set({
          totalVisits: firebase.firestore.FieldValue.increment(1),
          lastVisitedAt: firebase.firestore.FieldValue.serverTimestamp()
        }, { merge: true }).catch(err => {
          console.warn("Could not increment total visits:", err);
        });
      }

      // 3. Register live presence
      const presenceDocRef = this.db.collection('site_presence').doc(sessionId);
      const pingPresence = () => {
        presenceDocRef.set({
          lastActive: Date.now()
        }, { merge: true }).catch(() => {});
      };

      pingPresence();
      setInterval(pingPresence, 25000);

      // Clean up presence on tab close / navigate away
      const cleanupPresence = () => {
        try {
          presenceDocRef.delete();
        } catch (e) {}
      };
      window.addEventListener('pagehide', cleanupPresence);
      window.addEventListener('beforeunload', cleanupPresence);

      // 4. Real-time listener for Live Online Visitors
      this.db.collection('site_presence').onSnapshot((snapshot) => {
        const now = Date.now();
        const ACTIVE_THRESHOLD_MS = 65000; // Active within the last 65 seconds
        let activeCount = 0;
        const staleDocs = [];

        snapshot.forEach((doc) => {
          const data = doc.data();
          if (data && typeof data.lastActive === 'number') {
            if (now - data.lastActive <= ACTIVE_THRESHOLD_MS) {
              activeCount++;
            } else if (now - data.lastActive > 300000) {
              // Stale for more than 5 minutes, mark for pruning
              staleDocs.push(doc.ref);
            }
          }
        });

        // Always show at least 1 (the current user)
        const finalOnline = Math.max(1, activeCount);

        // Opportunistic housekeeping: prune stale docs (max 5 per cycle)
        if (staleDocs.length > 0) {
          staleDocs.slice(0, 5).forEach(ref => ref.delete().catch(() => {}));
        }

        if (onUpdate) {
          onUpdate({ online: finalOnline });
        }
      }, (err) => {
        console.warn("Firestore live presence subscription error:", err);
        if (onUpdate) onUpdate({ online: 1 });
      });

      // 5. Real-time listener for Total Visits
      this.db.collection('site_stats').doc('visitors').onSnapshot((doc) => {
        if (doc.exists) {
          const data = doc.data();
          const total = data.totalVisits || 1;
          if (onUpdate) {
            onUpdate({ total: total });
          }
        }
      }, (err) => {
        console.warn("Firestore total visits subscription error:", err);
      });

    } catch (err) {
      console.error("Error starting visitor tracker:", err);
    }
  }
}

// Global instance
window.firebaseSync = new FirebaseSyncService();
