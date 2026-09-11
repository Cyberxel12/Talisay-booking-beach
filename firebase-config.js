/**
 * Talisay Beach Resort - Firebase Realtime Cloud Synchronization
 * Enables live cross-device communication between Admin and Users (phones, tablets, laptops, desktops).
 */

(function() {
  // Firebase configuration for Talisay Beach Resort
  const defaultFirebaseConfig = {
    apiKey: "AIzaSyDrqMVWkuPFxEJ0fTf8ae4MzL1rWmKsho8",
    authDomain: "talisay-beach-resort.firebaseapp.com",
    databaseURL: "https://talisay-beach-resort-default-rtdb.firebaseio.com",
    projectId: "talisay-beach-resort",
    storageBucket: "talisay-beach-resort.firebasestorage.app",
    messagingSenderId: "62730517208",
    appId: "1:62730517208:web:b96da08068cc758cf6f5ad",
    measurementId: "G-8JDF08Z5D0"
  };

  // Retrieve any custom Firebase config stored in localStorage, or use default
  let customConfig = null;
  try {
    const saved = localStorage.getItem('talisay_custom_firebase_config');
    if (saved) customConfig = JSON.parse(saved);
  } catch (e) {}

  const firebaseConfig = customConfig || defaultFirebaseConfig;

  // Check if config has been set with user credentials or is still placeholder
  const isPlaceholder = !firebaseConfig.apiKey ||
    firebaseConfig.apiKey.includes('TALISAY-BEACH-RESORT-PUBLIC-KEY');

  let firebaseApp = null;
  let firebaseDb = null;
  let isCloudConnected = false;

  // Initialize Firebase if library is loaded and real credentials are provided
  if (typeof firebase !== 'undefined' && !isPlaceholder) {
    try {
      if (!firebase.apps || !firebase.apps.length) {
        firebaseApp = firebase.initializeApp(firebaseConfig);
      } else {
        firebaseApp = firebase.app();
      }
      firebaseDb = firebase.database();
      isCloudConnected = true;
      console.log('[TalisayCloud] ✅ Connected to Firebase Realtime Database for cross-device synchronization.');
    } catch (err) {
      console.warn('[TalisayCloud] ⚠️ Firebase initialization notice:', err.message);
    }
  } else {
    console.info(
      '%c[TalisayCloud] ℹ️ Local Mode Active%c\n' +
      'Offline LocalStorage is currently powering your bookings & accounts.\n' +
      'To enable live cross-device sync between phones, tablets, and admin dashboards:\n' +
      '1. Open Firebase Console (https://console.firebase.google.com)\n' +
      '2. Create a project and add a Realtime Database\n' +
      '3. Run TalisayCloud.openConfigModal() in the browser console or edit assets/js/firebase-config.js',
      'color: #0284c7; font-weight: bold; font-size: 12px;',
      'color: inherit;'
    );
  }

  // Cloud Sync Interface
  window.TalisayCloud = {
    isAvailable: function() {
      return isCloudConnected && firebaseDb !== null;
    },

    isConfigured: function() {
      return !isPlaceholder;
    },

    getConfig: function() {
      return firebaseConfig;
    },

    setConfig: function(newConfig) {
      try {
        localStorage.setItem('talisay_custom_firebase_config', JSON.stringify(newConfig));
        location.reload();
      } catch (e) {
        console.error('[TalisayCloud] Failed to save custom Firebase config', e);
      }
    },

    clearConfig: function() {
      try {
        localStorage.removeItem('talisay_custom_firebase_config');
        location.reload();
      } catch (e) {
        console.error('[TalisayCloud] Failed to reset Firebase config', e);
      }
    },

    // Interactive configuration dialog for setting up Firebase credentials
    openConfigModal: function() {
      const current = customConfig ? JSON.stringify(customConfig, null, 2) : '';
      const input = prompt(
        'Paste your Firebase Project Configuration JSON below (from Firebase Console > Project Settings > General > Your apps):\n\nExample:\n{\n  "apiKey": "AIzaSy...",\n  "authDomain": "...",\n  "databaseURL": "https://...",\n  "projectId": "..."\n}',
        current
      );
      if (input === null) return;
      if (!input.trim()) {
        if (confirm('Clear custom cloud configuration and revert to local offline mode?')) {
          this.clearConfig();
        }
        return;
      }
      try {
        let parsed = null;
        // Accept either raw JSON or JavaScript object syntax
        try {
          parsed = JSON.parse(input);
        } catch (jsonErr) {
          // Try loose object evaluation if user copied const firebaseConfig = { ... }
          const match = input.match(/\{[\s\S]*\}/);
          if (match) {
            parsed = (new Function(`return ${match[0]}`))();
          }
        }

        if (parsed && typeof parsed === 'object' && (parsed.apiKey || parsed.databaseURL)) {
          this.setConfig(parsed);
        } else {
          alert('Invalid Firebase configuration object. Please ensure it contains at least apiKey and databaseURL.');
        }
      } catch (e) {
        alert('Failed to parse Firebase configuration: ' + e.message);
      }
    },

    // Listen for real-time bookings updates across devices
    onBookingsChanged: function(callback) {
      if (!this.isAvailable()) return;
      try {
        const bookingsRef = firebaseDb.ref('talisay_resort/bookings');
        bookingsRef.on('value', (snapshot) => {
          const val = snapshot.val();
          if (val) {
            const bookingsList = Array.isArray(val) ? val.filter(Boolean) : Object.values(val);
            callback(bookingsList);
          }
        });
      } catch (e) {
        console.warn('[TalisayCloud] Error subscribing to bookings:', e);
      }
    },

    // Listen for real-time users updates across devices
    onUsersChanged: function(callback) {
      if (!this.isAvailable()) return;
      try {
        const usersRef = firebaseDb.ref('talisay_resort/users');
        usersRef.on('value', (snapshot) => {
          const val = snapshot.val();
          if (val) {
            const usersList = Array.isArray(val) ? val.filter(Boolean) : Object.values(val);
            callback(usersList);
          }
        });
      } catch (e) {
        console.warn('[TalisayCloud] Error subscribing to users:', e);
      }
    },

    // Push full bookings list to cloud
    syncAllBookings: function(bookings) {
      if (!this.isAvailable()) return;
      try {
        const map = {};
        bookings.forEach(b => {
          if (b && b.id) map[b.id] = b;
        });
        firebaseDb.ref('talisay_resort/bookings').set(map);
      } catch (e) {
        console.warn('[TalisayCloud] Error syncing bookings:', e);
      }
    },

    // Save or update a single booking in the cloud
    saveBooking: function(booking) {
      if (!this.isAvailable() || !booking || !booking.id) return;
      try {
        firebaseDb.ref('talisay_resort/bookings/' + booking.id).set(booking);
      } catch (e) {
        console.warn('[TalisayCloud] Error saving booking:', e);
      }
    },

    // Update status in the cloud
    updateBookingStatus: function(bookingId, status) {
      if (!this.isAvailable() || !bookingId) return;
      try {
        firebaseDb.ref('talisay_resort/bookings/' + bookingId + '/status').set(status);
      } catch (e) {
        console.warn('[TalisayCloud] Error updating booking status:', e);
      }
    },

    // Delete booking in the cloud
    deleteBooking: function(bookingId) {
      if (!this.isAvailable() || !bookingId) return;
      try {
        firebaseDb.ref('talisay_resort/bookings/' + bookingId).remove();
      } catch (e) {
        console.warn('[TalisayCloud] Error deleting booking:', e);
      }
    },

    // Push full users list to cloud
    syncAllUsers: function(users) {
      if (!this.isAvailable()) return;
      try {
        const map = {};
        users.forEach(u => {
          if (u && (u.id || u.username)) {
            const key = (u.id || u.username).replace(/[^a-zA-Z0-9_-]/g, '_');
            map[key] = u;
          }
        });
        firebaseDb.ref('talisay_resort/users').set(map);
      } catch (e) {
        console.warn('[TalisayCloud] Error syncing users:', e);
      }
    },

    // Save or update user
    saveUser: function(user) {
      if (!this.isAvailable() || !user) return;
      try {
        const key = (user.id || user.username || user.email).replace(/[^a-zA-Z0-9_-]/g, '_');
        firebaseDb.ref('talisay_resort/users/' + key).set(user);
      } catch (e) {
        console.warn('[TalisayCloud] Error saving user:', e);
      }
    },

    // Delete user
    deleteUser: function(userId) {
      if (!this.isAvailable() || !userId) return;
      try {
        const key = userId.replace(/[^a-zA-Z0-9_-]/g, '_');
        firebaseDb.ref('talisay_resort/users/' + key).remove();
      } catch (e) {
        console.warn('[TalisayCloud] Error deleting user:', e);
      }
    }
  };
})();
