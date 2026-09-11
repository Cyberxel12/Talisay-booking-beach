/**
 * Talisay Beach Resort - LocalStorage Database & State Management
 */

const DB_KEYS = {
  USERS: 'talisay_users',
  BOOKINGS: 'talisay_bookings',
  CURRENT_USER: 'talisay_current_user',
  INITIALIZED: 'talisay_db_v1_init'
};

// Initial Seed Data - only admin account by default (users create accounts via registration)
const INITIAL_USERS = [
  {
    id: 'USR-2026-001',
    name: 'Admin Manager',
    username: 'admin',
    password: 'admin123',
    email: 'admin@talisaybeach.com',
    registeredDate: 'Aug 15, 2026',
    status: 'Active',
    role: 'admin'
  }
];

const INITIAL_BOOKINGS = [
  {
    id: 'HI-143',
    customer: 'Dona Laurito',
    email: 'dona@example.com',
    phone: '09979051718',
    facility: 'Poolside Gazebo',
    checkIn: '2026-09-07',
    checkOut: '2026-09-08',
    dateDisplay: 'Sept 7, 2026',
    amount: 2500,
    status: 'Pending',
    createdAt: '2026-09-07T08:30:00Z',
    paymentMethod: 'GCash',
    paymentRef: 'GC-892147391'
  },
  {
    id: 'HI-142',
    customer: 'Mark Santos',
    email: 'mark@example.com',
    phone: '09123456789',
    facility: 'Beach Front Cottage',
    checkIn: '2026-09-05',
    checkOut: '2026-09-07',
    dateDisplay: 'Sept 5, 2026',
    amount: 9000,
    status: 'Approved',
    createdAt: '2026-09-05T10:00:00Z',
    paymentMethod: 'Bank Transfer',
    paymentRef: 'BT-441209531'
  },
  {
    id: 'HI-141',
    customer: 'Sarah Perez',
    email: 'sarah@example.com',
    phone: '09223334455',
    facility: 'Family Room',
    checkIn: '2026-09-02',
    checkOut: '2026-09-04',
    dateDisplay: 'Sept 2, 2026',
    amount: 14400,
    status: 'Approved',
    createdAt: '2026-09-02T14:15:00Z',
    paymentMethod: 'Maya',
    paymentRef: 'MY-772910382'
  },
  {
    id: 'HI-140',
    customer: 'John Cruz',
    email: 'john@example.com',
    phone: '09334445566',
    facility: 'Beach Front Cottage',
    checkIn: '2026-08-28',
    checkOut: '2026-08-30',
    dateDisplay: 'Aug 28, 2026',
    amount: 4500,
    status: 'Rejected',
    createdAt: '2026-08-28T09:20:00Z',
    paymentMethod: 'Cash on Arrival',
    paymentRef: 'CASH-0012'
  }
];

// Initialize DB
function initDB() {
  const isV3 = localStorage.getItem('talisay_db_clean_v3');
  if (!isV3) {
    let users = [];
    try {
      users = JSON.parse(localStorage.getItem(DB_KEYS.USERS)) || [];
    } catch(e) {
      users = [];
    }

    // Filter out old test seed accounts
    users = users.filter(u => u.username.toLowerCase() !== 'user' && u.username.toLowerCase() !== 'marksantos');

    // Ensure admin user exists with admin / admin123
    const adminIndex = users.findIndex(u => u.username.toLowerCase() === 'admin' && u.role === 'admin');
    if (adminIndex === -1) {
      users.push({
        id: 'ADM-001',
        name: 'Admin Manager',
        username: 'admin',
        password: 'admin123',
        email: 'admin@talisaybeach.com',
        registeredDate: 'Aug 15, 2026',
        status: 'Active',
        role: 'admin'
      });
    } else {
      users[adminIndex].password = 'admin123';
    }

    localStorage.setItem(DB_KEYS.USERS, JSON.stringify(users));

    // Clear all sample/seed bookings - start with empty bookings list
    const sampleIds = ['HI-143', 'HI-142', 'HI-141', 'HI-140'];
    let bookings = [];
    try {
      bookings = JSON.parse(localStorage.getItem(DB_KEYS.BOOKINGS)) || [];
    } catch(e) {
      bookings = [];
    }
    bookings = bookings.filter(b => !sampleIds.includes(b.id));
    localStorage.setItem(DB_KEYS.BOOKINGS, JSON.stringify(bookings));

    // Clear current user if it was a test user
    try {
      const curr = JSON.parse(localStorage.getItem(DB_KEYS.CURRENT_USER));
      if (curr && (curr.username === 'user' || curr.username === 'marksantos')) {
        localStorage.removeItem(DB_KEYS.CURRENT_USER);
      }
    } catch(e) {}

    // Migrate from older flags
    localStorage.removeItem('talisay_db_clean_v2');
    localStorage.setItem('talisay_db_clean_v3', 'true');
  }
}

initDB();

// User Auth & Session API
const TalisayDB = {
  getUsers() {
    try {
      return JSON.parse(localStorage.getItem(DB_KEYS.USERS)) || [];
    } catch(e) {
      return [];
    }
  },
  saveUsers(users) {
    localStorage.setItem(DB_KEYS.USERS, JSON.stringify(users));
  },
  findUser(username, role = null) {
    const users = this.getUsers();
    return users.find(u => {
      const matchName = u.username.toLowerCase() === username.toLowerCase() || u.email.toLowerCase() === username.toLowerCase();
      if (role) {
        return matchName && u.role === role;
      }
      return matchName;
    });
  },
  addUser(userData) {
    const users = this.getUsers();
    const newId = 'USR-2026-' + String(users.length + 1).padStart(3, '0');
    const newUser = {
      id: newId,
      status: 'Active',
      role: 'user',
      registeredDate: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      ...userData
    };
    users.unshift(newUser);
    this.saveUsers(users);

    if (window.TalisayCloud && TalisayCloud.isAvailable()) {
      TalisayCloud.saveUser(newUser);
    }

    return newUser;
  },
  updateUser(id, updatedFields) {
    const users = this.getUsers();
    const index = users.findIndex(u => u.id === id);
    if (index !== -1) {
      users[index] = { ...users[index], ...updatedFields };
      this.saveUsers(users);

      if (window.TalisayCloud && TalisayCloud.isAvailable()) {
        TalisayCloud.saveUser(users[index]);
      }

      return users[index];
    }
    return null;
  },
  deleteUser(id) {
    let users = this.getUsers();
    users = users.filter(u => u.id !== id);
    this.saveUsers(users);

    if (window.TalisayCloud && TalisayCloud.isAvailable()) {
      TalisayCloud.deleteUser(id);
    }
  },
  changePassword(usernameOrId, oldPassword, newPassword) {
    const users = this.getUsers();
    // Match by id or username
    let user = users.find(u => (u.id && u.id === usernameOrId) || (u.username && u.username.toLowerCase() === (usernameOrId || '').toLowerCase()));
    
    // If not found in user list but current user exists, match current user
    const curr = this.getCurrentUser();
    if (!user && curr && (curr.id === usernameOrId || curr.username === usernameOrId || curr.email === usernameOrId)) {
      user = curr;
    }

    if (!user) {
      return { success: false, message: 'User account not found.' };
    }

    // If account has an existing password, verify old password
    if (user.password && user.password !== oldPassword) {
      return { success: false, message: 'Current password does not match.' };
    }

    // Update in users array
    const userIndex = users.findIndex(u => (u.id && u.id === user.id) || (u.username && u.username.toLowerCase() === user.username.toLowerCase()));
    if (userIndex !== -1) {
      users[userIndex].password = newPassword;
      this.saveUsers(users);
    }

    // Update in current user session
    if (curr) {
      curr.password = newPassword;
      this.setCurrentUser(curr);
    }

    return { success: true, message: 'Password updated successfully!' };
  },
  getCurrentUser() {
    try {
      const stored = localStorage.getItem(DB_KEYS.CURRENT_USER);
      if (stored) return JSON.parse(stored);
    } catch(e) {}
    return {
      name: 'Guest',
      username: '',
      email: '',
      role: 'user'
    };
  },
  setCurrentUser(user) {
    localStorage.setItem(DB_KEYS.CURRENT_USER, JSON.stringify(user));
  },
  logout() {
    localStorage.removeItem(DB_KEYS.CURRENT_USER);
    window.location.href = 'index.html';
  },

  // Bookings API
  getBookings() {
    try {
      return JSON.parse(localStorage.getItem(DB_KEYS.BOOKINGS)) || [];
    } catch(e) {
      return [];
    }
  },
  saveBookings(bookings) {
    localStorage.setItem(DB_KEYS.BOOKINGS, JSON.stringify(bookings));
  },
  addBooking(bookingData) {
    const bookings = this.getBookings();
    const newNum = 100 + bookings.length + 1;
    const newId = 'HI-' + newNum;
    const newBooking = {
      id: newId,
      status: 'Pending',
      createdAt: new Date().toISOString(),
      ...bookingData
    };
    bookings.unshift(newBooking);
    this.saveBookings(bookings);

    // Sync to Firebase Cloud across devices
    if (window.TalisayCloud && TalisayCloud.isAvailable()) {
      TalisayCloud.saveBooking(newBooking);
    }

    return newBooking;
  },
  updateBookingStatus(id, newStatus) {
    const bookings = this.getBookings();
    const booking = bookings.find(b => b.id === id);
    if (booking) {
      booking.status = newStatus;
      this.saveBookings(bookings);

      // Sync status change to Firebase Cloud across devices
      if (window.TalisayCloud && TalisayCloud.isAvailable()) {
        TalisayCloud.updateBookingStatus(id, newStatus);
      }

      return booking;
    }
    return null;
  },
  deleteBooking(id) {
    let bookings = this.getBookings();
    bookings = bookings.filter(b => b.id !== id);
    this.saveBookings(bookings);

    // Delete in Firebase Cloud across devices
    if (window.TalisayCloud && TalisayCloud.isAvailable()) {
      TalisayCloud.deleteBooking(id);
    }
  },

  // Initialize Real-time Cloud Sync Listener
  initCloudSync() {
    if (!window.TalisayCloud || !TalisayCloud.isAvailable()) return;

    // Listen for live bookings from cloud
    TalisayCloud.onBookingsChanged((cloudBookings) => {
      if (cloudBookings && Array.isArray(cloudBookings)) {
        // Sort newest first
        cloudBookings.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
        localStorage.setItem(DB_KEYS.BOOKINGS, JSON.stringify(cloudBookings));
        window.dispatchEvent(new Event('storage'));
        window.dispatchEvent(new CustomEvent('talisay:db_updated', { detail: { type: 'bookings' } }));
      }
    });

    // Listen for live users from cloud
    TalisayCloud.onUsersChanged((cloudUsers) => {
      if (cloudUsers && Array.isArray(cloudUsers)) {
        localStorage.setItem(DB_KEYS.USERS, JSON.stringify(cloudUsers));
        window.dispatchEvent(new Event('storage'));
        window.dispatchEvent(new CustomEvent('talisay:db_updated', { detail: { type: 'users' } }));
      }
    });

    // If cloud is ready and we have local records, initial seed push
    const localBookings = this.getBookings();
    if (localBookings.length > 0) {
      TalisayCloud.syncAllBookings(localBookings);
    }
    const localUsers = this.getUsers();
    if (localUsers.length > 0) {
      TalisayCloud.syncAllUsers(localUsers);
    }
  },

  // Metrics Calculation for Admin
  getMetrics() {
    const bookings = this.getBookings();
    const users = this.getUsers();

    const totalBookings = bookings.length;
    const totalVisitors = users.filter(u => u.role === 'user').length;

    // Total Revenue: sum of approved bookings only
    const totalRevenue = bookings
      .filter(b => b.status === 'Approved')
      .reduce((sum, b) => sum + Number(b.amount || 0), 0);

    // Used Facilities: count every per cottage or room the user booked
    const facilityCounts = {
      rooms: 0,
      cottages: 0,
      totalUnits: 0,
      breakdown: {
        'Elizabeth Room': 0,
        'Fernando Room': 0,
        'Fernando Room (Standard)': 0,
        'Cottage 1 (Beachfront)': 0,
        'Cottage 2 (Sunset View)': 0,
        'Cottage 3 (Garden View)': 0
      }
    };

    // Consider all active bookings (Approved or Pending)
    const activeBookings = bookings.filter(b => b.status === 'Approved' || b.status === 'Pending');

    activeBookings.forEach(b => {
      if (b.selections && Array.isArray(b.selections)) {
        b.selections.forEach(sel => {
          const qty = Number(sel.qty) || 0;
          if (qty <= 0) return;

          facilityCounts.totalUnits += qty;
          if (sel.id.includes('cottage')) {
            facilityCounts.cottages += qty;
          } else {
            facilityCounts.rooms += qty;
          }

          if (sel.id === 'elizabeth-room') {
            facilityCounts.breakdown['Elizabeth Room'] += qty;
          } else if (sel.id === 'fernando-room-standard') {
            facilityCounts.breakdown['Fernando Room (Standard)'] += qty;
          } else if (sel.id === 'fernando-room') {
            facilityCounts.breakdown['Fernando Room'] += qty;
          } else if (sel.id === 'cottage-beachfront') {
            facilityCounts.breakdown['Cottage 1 (Beachfront)'] += qty;
          } else if (sel.id === 'cottage-sunset') {
            facilityCounts.breakdown['Cottage 2 (Sunset View)'] += qty;
          } else if (sel.id === 'cottage-garden') {
            facilityCounts.breakdown['Cottage 3 (Garden View)'] += qty;
          }
        });
      } else if (b.facility) {
        // Fallback for compound booking text, e.g. "2x Elizabeth Room, 1x Cottage 1 (Beachfront) (Overnight)"
        const facClean = b.facility.replace(/\s*\([^)]*\)\s*$/g, ''); // strip trailing schedule like (Overnight)
        const items = facClean.split(',').map(s => s.trim()).filter(Boolean);

        items.forEach(item => {
          const match = item.match(/^(\d+)x\s*(.*)$/i);
          const qty = match ? parseInt(match[1], 10) : (Number(b.quantity) || 1);
          const name = match ? match[2].trim().toLowerCase() : item.toLowerCase();

          facilityCounts.totalUnits += qty;

          if (name.includes('cottage') || name.includes('gazebo')) {
            facilityCounts.cottages += qty;
            if (name.includes('sunset') || name.includes('cottage 2')) {
              facilityCounts.breakdown['Cottage 2 (Sunset View)'] += qty;
            } else if (name.includes('garden') || name.includes('cottage 3')) {
              facilityCounts.breakdown['Cottage 3 (Garden View)'] += qty;
            } else {
              facilityCounts.breakdown['Cottage 1 (Beachfront)'] += qty;
            }
          } else {
            // It's a room
            facilityCounts.rooms += qty;
            if (name.includes('elizabeth')) {
              facilityCounts.breakdown['Elizabeth Room'] += qty;
            } else if (name.includes('standard')) {
              facilityCounts.breakdown['Fernando Room (Standard)'] += qty;
            } else {
              facilityCounts.breakdown['Fernando Room'] += qty;
            }
          }
        });
      }
    });

    return {
      totalBookings,
      totalVisitors,
      usedFacilities: facilityCounts.totalUnits,
      roomsBooked: facilityCounts.rooms,
      cottagesBooked: facilityCounts.cottages,
      facilityBreakdown: facilityCounts.breakdown,
      totalRevenue
    };
  }
};

window.TalisayDB = TalisayDB;

// Initialize cloud sync on load
document.addEventListener('DOMContentLoaded', () => {
  TalisayDB.initCloudSync();
});
