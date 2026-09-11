/**
 * Talisay Beach Resort - Admin Management System
 */

document.addEventListener('DOMContentLoaded', () => {
  initExportDropdown();
  initAdminDashboard();
  initAdminReservations();
  initAdminUsers();
  initSidebarToggle();
});

// 1. Sidebar Toggle & Logout
function initSidebarToggle() {
  const logoutBtns = document.querySelectorAll('.admin-logout-trigger');
  logoutBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      showAdminConfirm({
        title: 'Log Out of Admin',
        message: 'Are you sure you want to log out from the Talisay Beach Resort Admin Portal?',
        confirmText: 'Log Out',
        cancelText: 'Stay Logged In',
        type: 'danger',
        icon: 'fa-solid fa-arrow-right-from-bracket',
        onConfirm: () => {
          TalisayDB.logout();
        }
      });
    });
  });
}

// 2. Export Dropdown Menu (CSV Only: By Day, Month, Year, All)
function initExportDropdown() {
  const exportBtn = document.getElementById('exportMenuBtn');
  const exportMenu = document.getElementById('exportMenu');

  if (!exportBtn || !exportMenu) return;

  exportBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    exportMenu.classList.toggle('show');
  });

  document.addEventListener('click', (e) => {
    if (!exportBtn.contains(e.target) && !exportMenu.contains(e.target)) {
      exportMenu.classList.remove('show');
    }
  });

  // CSV Export handlers
  const exportDayBtn = document.getElementById('exportCsvDayBtn');
  const exportMonthBtn = document.getElementById('exportCsvMonthBtn');
  const exportYearBtn = document.getElementById('exportCsvYearBtn');
  const exportAllBtn = document.getElementById('exportCsvAllBtn');

  if (exportDayBtn) {
    exportDayBtn.addEventListener('click', (e) => {
      e.preventDefault();
      exportMenu.classList.remove('show');
      exportBookingsByPeriod('day');
    });
  }

  if (exportMonthBtn) {
    exportMonthBtn.addEventListener('click', (e) => {
      e.preventDefault();
      exportMenu.classList.remove('show');
      exportBookingsByPeriod('month');
    });
  }

  if (exportYearBtn) {
    exportYearBtn.addEventListener('click', (e) => {
      e.preventDefault();
      exportMenu.classList.remove('show');
      exportBookingsByPeriod('year');
    });
  }

  if (exportAllBtn) {
    exportAllBtn.addEventListener('click', (e) => {
      e.preventDefault();
      exportMenu.classList.remove('show');
      exportBookingsByPeriod('all');
    });
  }
}

function exportBookingsByPeriod(periodType = 'all') {
  const allBookings = TalisayDB.getBookings();
  if (allBookings.length === 0) {
    showAdminToast('No booking records to export.', 'warning');
    return;
  }

  const now = new Date();
  const todayStr = now.toISOString().slice(0, 10);
  const currentMonthStr = todayStr.slice(0, 7);
  const currentYearStr = todayStr.slice(0, 4);

  let filtered = allBookings;
  let filename = 'talisay_bookings_all.csv';
  let label = 'All';

  if (periodType === 'day') {
    const selectedDay = prompt('Enter date to export (YYYY-MM-DD):', todayStr);
    if (!selectedDay) return;
    label = selectedDay;
    filtered = allBookings.filter(b => {
      const d = (b.createdAt || b.checkIn || '').slice(0, 10);
      return d === selectedDay || b.checkIn === selectedDay;
    });
    filename = `talisay_bookings_day_${selectedDay}.csv`;
  } else if (periodType === 'month') {
    const selectedMonth = prompt('Enter month to export (YYYY-MM):', currentMonthStr);
    if (!selectedMonth) return;
    label = selectedMonth;
    filtered = allBookings.filter(b => {
      const d = (b.createdAt || b.checkIn || '').slice(0, 7);
      return d === selectedMonth || (b.checkIn && b.checkIn.startsWith(selectedMonth));
    });
    filename = `talisay_bookings_month_${selectedMonth}.csv`;
  } else if (periodType === 'year') {
    const selectedYear = prompt('Enter year to export (YYYY):', currentYearStr);
    if (!selectedYear) return;
    label = selectedYear;
    filtered = allBookings.filter(b => {
      const d = (b.createdAt || b.checkIn || '').slice(0, 4);
      return d === selectedYear || (b.checkIn && b.checkIn.startsWith(selectedYear));
    });
    filename = `talisay_bookings_year_${selectedYear}.csv`;
  }

  if (filtered.length === 0) {
    showAdminToast(`No booking records found for period: ${label}`, 'warning');
    return;
  }

  downloadBookingsCSV(filtered, filename);
}

function downloadBookingsCSV(bookings, filename = 'talisay_bookings.csv') {
  const headers = ['Booking ID', 'Customer Name', 'Email', 'Phone', 'Facility', 'Check-In', 'Check-Out', 'Amount (PHP)', 'Status', 'Payment Method', 'Payment Ref', 'Date Created'];
  const rows = bookings.map(b => [
    `"${b.id}"`,
    `"${b.customer}"`,
    `"${b.email}"`,
    `"${b.phone || ''}"`,
    `"${b.facility}"`,
    `"${b.checkIn}"`,
    `"${b.checkOut}"`,
    `"${b.amount}"`,
    `"${b.status}"`,
    `"${b.paymentMethod || 'GCash'}"`,
    `"${b.paymentRef || ''}"`,
    `"${b.createdAt ? b.createdAt.slice(0, 10) : (b.checkIn || '')}"`
  ]);

  const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// 3. Admin Dashboard Overview
function initAdminDashboard() {
  const recentTableBody = document.getElementById('recentBookingsTbody');
  if (!recentTableBody) return;

  renderDashboardMetrics();
  renderRecentBookings();

  window.addEventListener('talisay:db_updated', () => {
    renderDashboardMetrics();
    renderRecentBookings();
  });
  window.addEventListener('storage', () => {
    renderDashboardMetrics();
    renderRecentBookings();
  });
}

function renderDashboardMetrics() {
  const metrics = TalisayDB.getMetrics();

  const totalBookingsEl = document.getElementById('metricTotalBookings');
  const totalVisitorsEl = document.getElementById('metricTotalVisitors');
  const usedFacilitiesEl = document.getElementById('metricUsedFacilities');
  const totalRevenueEl = document.getElementById('metricTotalRevenue');

  if (totalBookingsEl) totalBookingsEl.textContent = metrics.totalBookings;
  if (totalVisitorsEl) totalVisitorsEl.textContent = metrics.totalVisitors;
  if (usedFacilitiesEl) {
    usedFacilitiesEl.textContent = metrics.usedFacilities;
    const sub = document.getElementById('metricUsedFacilitiesSub') || usedFacilitiesEl.nextElementSibling;
    if (sub) {
      sub.innerHTML = `<strong>${metrics.roomsBooked || 0}</strong> room${metrics.roomsBooked === 1 ? '' : 's'} &bull; <strong>${metrics.cottagesBooked || 0}</strong> cottage${metrics.cottagesBooked === 1 ? '' : 's'} booked`;
    }

    const pillsContainer = document.getElementById('facilityBreakdownPills');
    if (pillsContainer && metrics.facilityBreakdown) {
      pillsContainer.innerHTML = '';
      const breakdown = metrics.facilityBreakdown;
      const activeItems = Object.entries(breakdown).filter(([_, qty]) => qty > 0);
      
      if (activeItems.length > 0) {
        activeItems.forEach(([name, qty]) => {
          const pill = document.createElement('span');
          pill.className = 'facility-mini-pill';
          const isCottage = name.toLowerCase().includes('cottage');
          pill.innerHTML = `<i class="fa-solid ${isCottage ? 'fa-umbrella-beach' : 'fa-bed'}"></i> ${qty}x ${name}`;
          pillsContainer.appendChild(pill);
        });
      }
    }
  }
  if (totalRevenueEl) totalRevenueEl.textContent = '₱' + Number(metrics.totalRevenue).toLocaleString('en-US', { minimumFractionDigits: 2 });
}

function renderRecentBookings() {
  const tbody = document.getElementById('recentBookingsTbody');
  if (!tbody) return;

  const bookings = TalisayDB.getBookings();
  tbody.innerHTML = '';

  if (bookings.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; color: #64748b; padding: 25px;">No bookings found.</td></tr>`;
    return;
  }

  let selectedDashboardBookings = new Set();

  function updateDashboardBulkBar() {
    const bulkBar = document.getElementById('dashboardBulkBar');
    const countEl = document.getElementById('dashboardSelectedCount');
    const selectAll = document.getElementById('dashboardSelectAll');

    if (!bulkBar || !countEl) return;

    const count = selectedDashboardBookings.size;
    countEl.textContent = count;

    if (count > 0) {
      bulkBar.classList.add('active');
    } else {
      bulkBar.classList.remove('active');
    }

    const displayedCheckboxes = tbody.querySelectorAll('.table-checkbox');
    if (selectAll && displayedCheckboxes.length > 0) {
      selectAll.checked = (count === displayedCheckboxes.length);
      selectAll.indeterminate = (count > 0 && count < displayedCheckboxes.length);
    }
  }

  // Show top 5 bookings
  bookings.slice(0, 5).forEach(b => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td class="col-checkbox">
        <input type="checkbox" class="table-checkbox dashboard-row-checkbox" data-id="${b.id}" ${selectedDashboardBookings.has(b.id) ? 'checked' : ''}>
      </td>
      <td style="font-weight: 700; color: #0066cc;">${b.id}</td>
      <td><strong>${b.customer}</strong></td>
      <td>${b.facility}</td>
      <td>${b.dateDisplay || b.checkIn}</td>
      <td><span class="badge ${b.status.toLowerCase()}">${b.status}</span></td>
      <td><strong>₱${Number(b.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}</strong></td>
      <td>
        <div class="action-btns">
          ${b.status !== 'Approved' ? `<button class="btn-table-action btn-approve" onclick="handleDashboardAction('${b.id}', 'Approved')"><i class="fa-solid fa-circle-check"></i> Approve</button>` : ''}
          ${b.status !== 'Rejected' ? `<button class="btn-table-action btn-reject" onclick="handleDashboardAction('${b.id}', 'Rejected')"><i class="fa-solid fa-circle-xmark"></i> Reject</button>` : ''}
          <button type="button" class="icon-action-btn delete" title="Delete Booking" onclick="deleteDashboardBooking('${b.id}')"><i class="fa-solid fa-trash-can"></i></button>
        </div>
      </td>
    `;
    tbody.appendChild(tr);
  });

  // Row checkbox listener
  tbody.querySelectorAll('.dashboard-row-checkbox').forEach(cb => {
    cb.addEventListener('change', (e) => {
      const id = e.target.getAttribute('data-id');
      if (e.target.checked) {
        selectedDashboardBookings.add(id);
      } else {
        selectedDashboardBookings.delete(id);
      }
      updateDashboardBulkBar();
    });
  });

  // Select All Header listener
  const selectAll = document.getElementById('dashboardSelectAll');
  if (selectAll) {
    selectAll.onclick = (e) => {
      const isChecked = e.target.checked;
      const displayed = bookings.slice(0, 5);
      if (isChecked) {
        displayed.forEach(b => selectedDashboardBookings.add(b.id));
      } else {
        selectedDashboardBookings.clear();
      }
      tbody.querySelectorAll('.dashboard-row-checkbox').forEach(cb => cb.checked = isChecked);
      updateDashboardBulkBar();
    };
  }

  // Clear / Cancel button
  const cancelBtn = document.getElementById('dashboardBulkCancelBtn');
  if (cancelBtn) {
    cancelBtn.onclick = () => {
      selectedDashboardBookings.clear();
      if (selectAll) {
        selectAll.checked = false;
        selectAll.indeterminate = false;
      }
      tbody.querySelectorAll('.dashboard-row-checkbox').forEach(cb => cb.checked = false);
      updateDashboardBulkBar();
    };
  }

  // Batch Delete button
  const bulkDeleteBtn = document.getElementById('dashboardBulkDeleteBtn');
  if (bulkDeleteBtn) {
    bulkDeleteBtn.onclick = () => {
      const count = selectedDashboardBookings.size;
      if (count === 0) return;

      showAdminConfirm({
        title: 'Delete Selected Bookings',
        message: `Are you sure you want to permanently delete <strong>${count}</strong> selected booking${count > 1 ? 's' : ''}? They will be removed from all records.`,
        confirmText: `Yes, Delete (${count})`,
        cancelText: 'Cancel',
        type: 'danger',
        icon: 'fa-solid fa-trash-can',
        onConfirm: () => {
          selectedDashboardBookings.forEach(id => {
            TalisayDB.deleteBooking(id);
          });
          selectedDashboardBookings.clear();
          renderDashboardMetrics();
          renderRecentBookings();
          showAdminToast(`Deleted ${count} booking${count > 1 ? 's' : ''} successfully.`, 'error');
        }
      });
    };
  }

  updateDashboardBulkBar();
}

window.deleteDashboardBooking = function(id) {
  showAdminConfirm({
    title: 'Delete Booking',
    message: `Are you sure you want to delete booking <strong>#${id}</strong>?`,
    confirmText: 'Delete',
    cancelText: 'Cancel',
    type: 'danger',
    icon: 'fa-solid fa-trash-can',
    onConfirm: () => {
      TalisayDB.deleteBooking(id);
      renderDashboardMetrics();
      renderRecentBookings();
      showAdminToast(`Booking #${id} deleted.`, 'error');
    }
  });
};

window.handleDashboardAction = function(id, newStatus) {
  const isApprove = newStatus === 'Approved';
  showAdminConfirm({
    title: isApprove ? 'Approve Reservation' : 'Reject Reservation',
    message: isApprove
      ? `Are you sure you want to <strong>approve</strong> booking <strong>#${id}</strong>?`
      : `Are you sure you want to <strong>reject</strong> booking <strong>#${id}</strong>?`,
    confirmText: isApprove ? 'Approve' : 'Reject',
    cancelText: 'Cancel',
    type: isApprove ? 'success' : 'danger',
    icon: isApprove ? 'fa-circle-check' : 'fa-circle-xmark',
    onConfirm: () => {
      TalisayDB.updateBookingStatus(id, newStatus);
      renderDashboardMetrics();
      renderRecentBookings();
    }
  });
};

// 4. Admin Reservations (reservationadmin.png)
// Custom Confirmation Dialog (Replaces native browser "localhost says" alert/confirm)
function showAdminConfirm({
  title = 'Confirmation',
  message = 'Are you sure you want to proceed?',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  type = 'danger', // 'danger' | 'success' | 'info'
  icon = null,
  onConfirm = null,
  onCancel = null
}) {
  let modalOverlay = document.getElementById('adminConfirmModal');
  if (!modalOverlay) {
    modalOverlay = document.createElement('div');
    modalOverlay.id = 'adminConfirmModal';
    modalOverlay.className = 'admin-confirm-overlay';
    modalOverlay.innerHTML = `
      <div class="admin-confirm-box">
        <div class="confirm-icon-circle danger" id="adminConfirmIcon">
          <i class="fa-solid fa-triangle-exclamation"></i>
        </div>
        <h3 class="confirm-title" id="adminConfirmTitle">Confirmation</h3>
        <div class="confirm-message" id="adminConfirmMessage">Are you sure?</div>
        <div class="confirm-actions">
          <button type="button" class="confirm-btn-cancel" id="adminConfirmCancelBtn">Cancel</button>
          <button type="button" class="confirm-btn-action danger" id="adminConfirmOkBtn">Confirm</button>
        </div>
      </div>
    `;
    document.body.appendChild(modalOverlay);
  }

  const iconCircle = modalOverlay.querySelector('#adminConfirmIcon');
  const titleEl = modalOverlay.querySelector('#adminConfirmTitle');
  const msgEl = modalOverlay.querySelector('#adminConfirmMessage');
  const cancelBtn = modalOverlay.querySelector('#adminConfirmCancelBtn');
  const okBtn = modalOverlay.querySelector('#adminConfirmOkBtn');

  // Set Type & Icons
  iconCircle.className = `confirm-icon-circle ${type}`;
  let defaultIcon = 'fa-solid fa-triangle-exclamation';
  if (type === 'danger') defaultIcon = 'fa-solid fa-trash-can';
  if (type === 'success') defaultIcon = 'fa-solid fa-circle-check';
  if (type === 'info') defaultIcon = 'fa-solid fa-circle-info';
  iconCircle.innerHTML = `<i class="${icon || defaultIcon}"></i>`;

  // Set Titles & Content
  titleEl.textContent = title;
  msgEl.innerHTML = message;
  cancelBtn.textContent = cancelText;
  okBtn.className = `confirm-btn-action ${type}`;
  okBtn.textContent = confirmText;

  function closeModal() {
    modalOverlay.classList.remove('active');
    cancelBtn.onclick = null;
    okBtn.onclick = null;
  }

  cancelBtn.onclick = () => {
    closeModal();
    if (onCancel) onCancel();
  };

  okBtn.onclick = () => {
    closeModal();
    if (onConfirm) onConfirm();
  };

  modalOverlay.onclick = (e) => {
    if (e.target === modalOverlay) {
      closeModal();
      if (onCancel) onCancel();
    }
  };

  modalOverlay.classList.add('active');
}

// Toast Notification Helper
function showAdminToast(message, type = 'success') {
  let container = document.getElementById('adminToastContainer');
  if (!container) {
    container = document.createElement('div');
    container.id = 'adminToastContainer';
    container.className = 'admin-toast-container';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = `admin-toast ${type}`;

  let icon = 'fa-solid fa-circle-check';
  if (type === 'warning') icon = 'fa-solid fa-triangle-exclamation';
  if (type === 'error') icon = 'fa-solid fa-circle-xmark';

  toast.innerHTML = `
    <i class="${icon}"></i>
    <span>${message}</span>
  `;

  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(10px)';
    setTimeout(() => {
      if (toast.parentNode) toast.parentNode.removeChild(toast);
    }, 300);
  }, 3500);
}

// 4. Admin Reservations Elevated Experience
function initAdminReservations() {
  const resTableBody = document.getElementById('reservationsTableBody');
  if (!resTableBody) return;

  const filterPills = document.querySelectorAll('.res-filter-pill');
  const detailsModal = document.getElementById('reservationDetailsModal');
  const closeDetailsModalBtn = document.getElementById('btnCloseDetailsModal');
  const bottomCloseDetailsModalBtn = document.getElementById('btnBottomCloseDetailsModal');

  let currentFilter = 'All';

  // Helper to extract customer initials for avatar
  function getInitials(name) {
    if (!name) return 'GU';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }

  // Render Metric Cards and Pill Badges
  function updateReservationMetrics(allBookings) {
    const total = allBookings.length;
    const pending = allBookings.filter(b => (b.status || '').toLowerCase() === 'pending').length;
    const approved = allBookings.filter(b => (b.status || '').toLowerCase() === 'approved').length;
    const rejected = allBookings.filter(b => (b.status || '').toLowerCase() === 'rejected').length;

    const totalRev = allBookings
      .filter(b => (b.status || '').toLowerCase() === 'approved')
      .reduce((sum, b) => sum + Number(b.amount || 0), 0);

    // Update Metric Cards
    const totalEl = document.getElementById('resMetricTotal');
    const pendingEl = document.getElementById('resMetricPending');
    const approvedEl = document.getElementById('resMetricApproved');
    const revenueEl = document.getElementById('resMetricRevenue');
    const pendingBadgeEl = document.getElementById('resMetricPendingBadge');

    if (totalEl) totalEl.textContent = total;
    if (pendingEl) pendingEl.textContent = pending;
    if (approvedEl) approvedEl.textContent = approved;
    if (revenueEl) revenueEl.textContent = '₱' + totalRev.toLocaleString('en-US', { minimumFractionDigits: 2 });

    if (pendingBadgeEl) {
      if (pending > 0) {
        pendingBadgeEl.textContent = `${pending} Needs Review`;
        pendingBadgeEl.style.display = 'inline-flex';
      } else {
        pendingBadgeEl.textContent = 'All Clear';
        pendingBadgeEl.style.background = '#dcfce7';
        pendingBadgeEl.style.color = '#15803d';
      }
    }

    // Update Filter Pill Badges
    const countAll = document.getElementById('pillCountAll');
    const countPending = document.getElementById('pillCountPending');
    const countApproved = document.getElementById('pillCountApproved');
    const countRejected = document.getElementById('pillCountRejected');

    if (countAll) countAll.textContent = total;
    if (countPending) countPending.textContent = pending;
    if (countApproved) countApproved.textContent = approved;
    if (countRejected) countRejected.textContent = rejected;
  }

  function renderReservations() {
    const allBookings = TalisayDB.getBookings();
    updateReservationMetrics(allBookings);

    let filtered = allBookings;

    // Filter by Status
    if (currentFilter !== 'All') {
      filtered = filtered.filter(b => (b.status || '').toLowerCase() === currentFilter.toLowerCase());
    }

    resTableBody.innerHTML = '';

    const countInfo = document.getElementById('reservationCountInfo');
    if (countInfo) {
      countInfo.textContent = `Showing 1 to ${filtered.length} of ${allBookings.length} bookings`;
    }

    if (filtered.length === 0) {
      resTableBody.innerHTML = `
        <tr>
          <td colspan="7" style="text-align: center; color: #64748b; padding: 45px 20px;">
            <i class="fa-regular fa-calendar-xmark" style="font-size: 36px; color: #cbd5e1; margin-bottom: 12px; display: block;"></i>
            <span style="font-size: 15px; font-weight: 600;">No reservations match the selected filter.</span>
          </td>
        </tr>
      `;
      return;
    }

    let selectedResBookings = new Set();

    function updateResBulkBar() {
      const bulkBar = document.getElementById('resBulkBar');
      const countEl = document.getElementById('resSelectedCount');
      const selectAll = document.getElementById('resSelectAll');

      if (!bulkBar || !countEl) return;

      const count = selectedResBookings.size;
      countEl.textContent = count;

      if (count > 0) {
        bulkBar.classList.add('active');
      } else {
        bulkBar.classList.remove('active');
      }

      const displayedCheckboxes = resTableBody.querySelectorAll('.table-checkbox');
      if (selectAll && displayedCheckboxes.length > 0) {
        selectAll.checked = (count === displayedCheckboxes.length);
        selectAll.indeterminate = (count > 0 && count < displayedCheckboxes.length);
      }
    }

    filtered.forEach(b => {
      const facText = (b.facility || '').toLowerCase();
      const dateText = (b.dateDisplay || '').toLowerCase();
      const hasDay = facText.includes('day') || dateText.includes('day');
      const hasNight = facText.includes('night') || facText.includes('overnight') || dateText.includes('night') || dateText.includes('overnight');

      let scheduleIcon, scheduleClass;
      if (hasDay && hasNight) {
        scheduleIcon = '<i class="fa-solid fa-layer-group"></i> Mixed Stay';
        scheduleClass = 'badge-mixed';
      } else if (hasDay) {
        scheduleIcon = '<i class="fa-solid fa-sun"></i> Day Tour';
        scheduleClass = 'badge-day';
      } else {
        scheduleIcon = '<i class="fa-solid fa-moon"></i> Overnight';
        scheduleClass = 'badge-night';
      }
      const initials = getInitials(b.customer);

      const checkInFormatted = b.checkIn || (b.dateDisplay || 'N/A');

      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td class="col-checkbox">
          <input type="checkbox" class="table-checkbox res-row-checkbox" data-id="${b.id}" ${selectedResBookings.has(b.id) ? 'checked' : ''}>
        </td>
        <td>
          <span class="booking-id-tag">
            <i class="fa-solid fa-receipt" style="color: #0066cc;"></i> ${b.id}
          </span>
        </td>
        <td>
          <div class="customer-cell">
            <div class="avatar-circle-sm" title="${b.customer}">${initials}</div>
            <div class="customer-info">
              <span class="customer-name">${b.customer}</span>
              <span class="customer-meta"><i class="fa-solid fa-phone" style="font-size: 10px;"></i> ${b.phone || '09979051718'}</span>
            </div>
          </div>
        </td>
        <td>
          <div>
            <strong style="color: #1e293b; font-size: 13px;">${b.facility}</strong>
            <br>
            <span class="badge-schedule ${scheduleClass}">${scheduleIcon}</span>
          </div>
        </td>
        <td>
          <div style="font-size: 13px; font-weight: 600; color: #334155;">
            <i class="fa-regular fa-calendar" style="color: #0066cc; margin-right: 4px;"></i> ${checkInFormatted}
          </div>
          <span class="date-duration-tag">${b.checkOut ? `Until ${b.checkOut}` : 'Standard booking'}</span>
        </td>
        <td>
          <strong style="color: #0f172a; font-size: 14px;">₱${Number(b.amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}</strong>
          <br>
          <span class="payment-pill"><i class="fa-solid fa-wallet" style="color: #0284c7; font-size: 10px;"></i> ${b.paymentMethod || 'Cash on Arrival'}</span>
        </td>
        <td>
          <span class="badge ${(b.status || 'pending').toLowerCase()}">${b.status || 'Pending'}</span>
        </td>
        <td style="text-align: right; padding-right: 20px;">
          <div class="action-btns" style="justify-content: flex-end;">
            ${b.status !== 'Approved' ? `
              <button type="button" class="btn-table-action btn-approve" title="Approve Booking" onclick="updateResStatus('${b.id}', 'Approved')">
                <i class="fa-solid fa-check"></i>
              </button>
            ` : ''}
            ${b.status !== 'Rejected' ? `
              <button type="button" class="btn-table-action btn-reject" title="Reject Booking" onclick="updateResStatus('${b.id}', 'Rejected')">
                <i class="fa-solid fa-xmark"></i>
              </button>
            ` : ''}
            <button type="button" class="icon-action-btn view" title="View Reservation Details" onclick="openReservationModal('${b.id}')">
              <i class="fa-solid fa-eye"></i>
            </button>
            <button type="button" class="icon-action-btn delete" title="Delete Reservation" onclick="deleteRes('${b.id}')">
              <i class="fa-solid fa-trash-can"></i>
            </button>
          </div>
        </td>
      `;
      resTableBody.appendChild(tr);
    });

    // Row checkbox listener
    resTableBody.querySelectorAll('.res-row-checkbox').forEach(cb => {
      cb.addEventListener('change', (e) => {
        const id = e.target.getAttribute('data-id');
        if (e.target.checked) {
          selectedResBookings.add(id);
        } else {
          selectedResBookings.delete(id);
        }
        updateResBulkBar();
      });
    });

    // Select All listener
    const selectAll = document.getElementById('resSelectAll');
    if (selectAll) {
      selectAll.onclick = (e) => {
        const isChecked = e.target.checked;
        if (isChecked) {
          filtered.forEach(b => selectedResBookings.add(b.id));
        } else {
          selectedResBookings.clear();
        }
        resTableBody.querySelectorAll('.res-row-checkbox').forEach(cb => cb.checked = isChecked);
        updateResBulkBar();
      };
    }

    // Clear listener
    const cancelBtn = document.getElementById('resBulkCancelBtn');
    if (cancelBtn) {
      cancelBtn.onclick = () => {
        selectedResBookings.clear();
        if (selectAll) {
          selectAll.checked = false;
          selectAll.indeterminate = false;
        }
        resTableBody.querySelectorAll('.res-row-checkbox').forEach(cb => cb.checked = false);
        updateResBulkBar();
      };
    }

    // Delete Selected listener
    const bulkDeleteBtn = document.getElementById('resBulkDeleteBtn');
    if (bulkDeleteBtn) {
      bulkDeleteBtn.onclick = () => {
        const count = selectedResBookings.size;
        if (count === 0) return;

        showAdminConfirm({
          title: 'Delete Selected Reservations',
          message: `Are you sure you want to permanently delete <strong>${count}</strong> selected reservation${count > 1 ? 's' : ''}? They will be completely removed from database.`,
          confirmText: `Yes, Delete (${count})`,
          cancelText: 'Cancel',
          type: 'danger',
          icon: 'fa-solid fa-trash-can',
          onConfirm: () => {
            selectedResBookings.forEach(id => {
              TalisayDB.deleteBooking(id);
            });
            selectedResBookings.clear();
            renderReservations();
            showAdminToast(`Deleted ${count} reservation${count > 1 ? 's' : ''} successfully.`, 'error');
          }
        });
      };
    }

    updateResBulkBar();
  }

  // Filter Pill Listeners
  filterPills.forEach(pill => {
    pill.addEventListener('click', () => {
      filterPills.forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      currentFilter = pill.getAttribute('data-status');
      renderReservations();
    });
  });

  // Global Status Update (Approve / Reject) with custom confirmation popup
  window.updateResStatus = function(id, newStatus) {
    const isApprove = newStatus === 'Approved';
    showAdminConfirm({
      title: isApprove ? 'Approve Reservation' : 'Reject Reservation',
      message: isApprove
        ? `Are you sure you want to approve booking <strong style="color: #0066cc;">${id}</strong>? The reservation will be marked as confirmed.`
        : `Are you sure you want to mark reservation <strong style="color: #0066cc;">${id}</strong> as rejected?`,
      confirmText: isApprove ? 'Approve Booking' : 'Reject Booking',
      cancelText: 'Cancel',
      type: isApprove ? 'success' : 'danger',
      icon: isApprove ? 'fa-solid fa-circle-check' : 'fa-solid fa-circle-xmark',
      onConfirm: () => {
        const updated = TalisayDB.updateBookingStatus(id, newStatus);
        if (updated) {
          renderReservations();
          showAdminToast(`Reservation ${id} updated to ${newStatus}.`, isApprove ? 'success' : 'warning');
        }
      }
    });
  };

  // Global Delete with custom confirmation popup
  window.deleteRes = function(id) {
    showAdminConfirm({
      title: 'Delete Reservation',
      message: `Are you sure you want to permanently delete reservation <strong style="color: #0066cc;">${id}</strong>? This booking will be removed from all records.`,
      confirmText: 'Delete Reservation',
      cancelText: 'Keep Reservation',
      type: 'danger',
      icon: 'fa-solid fa-trash-can',
      onConfirm: () => {
        TalisayDB.deleteBooking(id);
        renderReservations();
        showAdminToast(`Reservation ${id} deleted successfully.`, 'error');
        if (detailsModal && detailsModal.classList.contains('active')) {
          detailsModal.classList.remove('active');
        }
      }
    });
  };

  // Open Details Modal (Read-only summary)
  window.openReservationModal = function(id) {
    const booking = TalisayDB.getBookings().find(b => b.id === id);
    if (!booking) return;

    const modalId = document.getElementById('modalDetailBookingId');
    const modalBadge = document.getElementById('modalDetailStatusBadge');
    const modalCustomer = document.getElementById('modalDetailCustomer');
    const modalPhone = document.getElementById('modalDetailPhone');
    const modalEmail = document.getElementById('modalDetailEmail');
    const modalFacility = document.getElementById('modalDetailFacility');
    const modalCheckIn = document.getElementById('modalDetailCheckIn');
    const modalCheckOut = document.getElementById('modalDetailCheckOut');
    const modalPayMethod = document.getElementById('modalDetailPayMethod');
    const modalPayRef = document.getElementById('modalDetailPayRef');
    const modalAmount = document.getElementById('modalDetailAmount');

    if (modalId) modalId.textContent = booking.id;
    if (modalBadge) modalBadge.innerHTML = `<span class="badge ${(booking.status || 'pending').toLowerCase()}">${booking.status || 'Pending'}</span>`;
    if (modalCustomer) modalCustomer.textContent = booking.customer || 'Guest';
    if (modalPhone) modalPhone.textContent = booking.phone || '09979051718';
    if (modalEmail) modalEmail.textContent = booking.email || 'N/A';
    if (modalFacility) modalFacility.textContent = booking.facility || 'Standard Accommodation';
    if (modalCheckIn) modalCheckIn.textContent = booking.checkIn || (booking.dateDisplay || 'N/A');
    if (modalCheckOut) modalCheckOut.textContent = booking.checkOut || booking.checkIn || 'N/A';
    if (modalPayMethod) modalPayMethod.textContent = booking.paymentMethod || 'Cash on Arrival';
    if (modalPayRef) modalPayRef.textContent = booking.paymentRef || 'N/A';
    if (modalAmount) modalAmount.textContent = '₱' + Number(booking.amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2 });

    if (detailsModal) detailsModal.classList.add('active');
  };

  // Close Details Modal Handlers
  if (closeDetailsModalBtn && detailsModal) {
    closeDetailsModalBtn.addEventListener('click', () => {
      detailsModal.classList.remove('active');
    });
  }
  if (bottomCloseDetailsModalBtn && detailsModal) {
    bottomCloseDetailsModalBtn.addEventListener('click', () => {
      detailsModal.classList.remove('active');
    });
  }

  // Close when clicking outside modal box
  window.addEventListener('click', (e) => {
    if (e.target === detailsModal) detailsModal.classList.remove('active');
  });

  renderReservations();

  window.addEventListener('talisay:db_updated', () => {
    renderReservations();
  });
  window.addEventListener('storage', () => {
    renderReservations();
  });
}

// 5. Admin Users (Matching User Details Modal, Phone Number, No Overlap, No edit name)
function initAdminUsers() {
  const usersTableBody = document.getElementById('usersTableBody');
  if (!usersTableBody) return;

  const searchInput = document.getElementById('userSearchInput');
  const statusFilter = document.getElementById('userStatusFilter');
  const userModal = document.getElementById('userDetailsModal');
  const closeUserModalBtn = document.getElementById('btnCloseUserDetailsModal');
  const bottomCloseUserModalBtn = document.getElementById('btnBottomCloseUserDetailsModal');

  let searchQuery = '';
  let currentStatus = 'All';

  function getInitials(name) {
    if (!name) return 'GU';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }

  function renderUsers() {
    let users = TalisayDB.getUsers();

    if (currentStatus !== 'All') {
      users = users.filter(u => (u.status || 'Active').toLowerCase() === currentStatus.toLowerCase());
    }

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      users = users.filter(u => 
        (u.id || '').toLowerCase().includes(q) ||
        (u.name || '').toLowerCase().includes(q) ||
        (u.email || '').toLowerCase().includes(q) ||
        (u.phone || '').toLowerCase().includes(q) ||
        (u.username || '').toLowerCase().includes(q)
      );
    }

    usersTableBody.innerHTML = '';

    const countInfo = document.getElementById('userCountInfo');
    if (countInfo) {
      countInfo.textContent = `Showing 1 to ${users.length} of ${users.length} user${users.length !== 1 ? 's' : ''}`;
    }

    if (users.length === 0) {
      usersTableBody.innerHTML = `<tr><td colspan="7" style="text-align: center; color: #64748b; padding: 35px;">No registered users found.</td></tr>`;
      return;
    }

    let selectedUsers = new Set();

    function updateUsersBulkBar() {
      const bulkBar = document.getElementById('usersBulkBar');
      const countEl = document.getElementById('usersSelectedCount');
      const selectAll = document.getElementById('usersSelectAll');

      if (!bulkBar || !countEl) return;

      const count = selectedUsers.size;
      countEl.textContent = count;

      if (count > 0) {
        bulkBar.classList.add('active');
      } else {
        bulkBar.classList.remove('active');
      }

      const displayedCheckboxes = usersTableBody.querySelectorAll('.table-checkbox');
      if (selectAll && displayedCheckboxes.length > 0) {
        selectAll.checked = (count === displayedCheckboxes.length);
        selectAll.indeterminate = (count > 0 && count < displayedCheckboxes.length);
      }
    }

    users.forEach(u => {
      const initials = getInitials(u.name);
      const phoneDisplay = u.phone || '09979051718';

      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td class="col-checkbox">
          <input type="checkbox" class="table-checkbox user-row-checkbox" data-id="${u.id}" ${selectedUsers.has(u.id) ? 'checked' : ''}>
        </td>
        <td><span class="booking-id-tag"><i class="fa-solid fa-id-badge" style="color: #0066cc;"></i> ${u.id}</span></td>
        <td>
          <div class="customer-cell">
            <div class="avatar-circle-sm">${initials}</div>
            <strong style="color: #0f172a; font-size: 14px;">${u.name}</strong>
          </div>
        </td>
        <td><span style="color: #475569; font-size: 13px;">${u.email}</span></td>
        <td>
          <strong style="color: #334155; font-size: 13px;">
            <i class="fa-solid fa-phone" style="font-size: 11px; color: #0066cc; margin-right: 4px;"></i>${phoneDisplay}
          </strong>
        </td>
        <td>${u.registeredDate || 'Sept 1, 2026'}</td>
        <td><span class="badge ${u.status === 'Active' ? 'active' : 'banned'}">${u.status || 'Active'}</span></td>
        <td style="text-align: right; padding-right: 20px;">
          <div class="action-btns" style="justify-content: flex-end;">
            <button class="icon-action-btn view" title="View Profile Details" onclick="openUserDetailsModal('${u.id}')"><i class="fa-solid fa-eye"></i></button>
            <button class="icon-action-btn delete" title="Delete User" onclick="deleteUserRow('${u.id}')"><i class="fa-solid fa-trash-can"></i></button>
          </div>
        </td>
      `;
      usersTableBody.appendChild(tr);
    });

    // Row checkbox listeners
    usersTableBody.querySelectorAll('.user-row-checkbox').forEach(cb => {
      cb.addEventListener('change', (e) => {
        const id = e.target.getAttribute('data-id');
        if (e.target.checked) {
          selectedUsers.add(id);
        } else {
          selectedUsers.delete(id);
        }
        updateUsersBulkBar();
      });
    });

    // Select All listener
    const selectAll = document.getElementById('usersSelectAll');
    if (selectAll) {
      selectAll.onclick = (e) => {
        const isChecked = e.target.checked;
        if (isChecked) {
          users.forEach(u => selectedUsers.add(u.id));
        } else {
          selectedUsers.clear();
        }
        usersTableBody.querySelectorAll('.user-row-checkbox').forEach(cb => cb.checked = isChecked);
        updateUsersBulkBar();
      };
    }

    // Clear listener
    const cancelBtn = document.getElementById('usersBulkCancelBtn');
    if (cancelBtn) {
      cancelBtn.onclick = () => {
        selectedUsers.clear();
        if (selectAll) {
          selectAll.checked = false;
          selectAll.indeterminate = false;
        }
        usersTableBody.querySelectorAll('.user-row-checkbox').forEach(cb => cb.checked = false);
        updateUsersBulkBar();
      };
    }

    // Delete Selected listener
    const bulkDeleteBtn = document.getElementById('usersBulkDeleteBtn');
    if (bulkDeleteBtn) {
      bulkDeleteBtn.onclick = () => {
        const count = selectedUsers.size;
        if (count === 0) return;

        showAdminConfirm({
          title: 'Delete Selected Users',
          message: `Are you sure you want to permanently delete <strong>${count}</strong> selected user account${count > 1 ? 's' : ''}? Their profiles will be removed from all records.`,
          confirmText: `Yes, Delete (${count})`,
          cancelText: 'Cancel',
          type: 'danger',
          icon: 'fa-solid fa-trash-can',
          onConfirm: () => {
            selectedUsers.forEach(id => {
              TalisayDB.deleteUser(id);
            });
            selectedUsers.clear();
            renderUsers();
            showAdminToast(`Deleted ${count} user${count > 1 ? 's' : ''} successfully.`, 'error');
          }
        });
      };
    }

    updateUsersBulkBar();
  }

  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      searchQuery = e.target.value.trim();
      renderUsers();
    });
  }

  if (statusFilter) {
    statusFilter.addEventListener('change', (e) => {
      currentStatus = e.target.value;
      renderUsers();
    });
  }

  window.toggleUserStatus = function(id) {
    const users = TalisayDB.getUsers();
    const user = users.find(u => u.id === id);
    if (!user) return;
    const newStatus = user.status === 'Active' ? 'Banned' : 'Active';
    const isBan = newStatus === 'Banned';

    showAdminConfirm({
      title: isBan ? 'Ban User Account' : 'Reactivate User Account',
      message: isBan
        ? `Are you sure you want to ban user account <strong style="color: #0066cc;">${user.name}</strong> (${id})? The user will not be able to book.`
        : `Reactivate user account <strong style="color: #0066cc;">${user.name}</strong> (${id})?`,
      confirmText: isBan ? 'Yes, Ban Account' : 'Reactivate Account',
      cancelText: 'Cancel',
      type: isBan ? 'danger' : 'success',
      icon: isBan ? 'fa-solid fa-ban' : 'fa-solid fa-user-check',
      onConfirm: () => {
        TalisayDB.updateUser(id, { status: newStatus });
        renderUsers();
        showAdminToast(`User ${user.name} is now ${newStatus}.`, isBan ? 'warning' : 'success');
      }
    });
  };

  window.deleteUserRow = function(id) {
    showAdminConfirm({
      title: 'Delete User Account',
      message: `Are you sure you want to permanently remove user <strong style="color: #0066cc;">${id}</strong>? All user records will be deleted.`,
      confirmText: 'Delete User',
      cancelText: 'Cancel',
      type: 'danger',
      icon: 'fa-solid fa-trash-can',
      onConfirm: () => {
        TalisayDB.deleteUser(id);
        renderUsers();
        showAdminToast(`User ${id} was deleted successfully.`, 'error');
      }
    });
  };

  // Modern User Details Modal (matches reservation details)
  window.openUserDetailsModal = function(id) {
    const user = TalisayDB.getUsers().find(u => u.id === id);
    if (!user) return;

    const modalId = document.getElementById('modalDetailUserId');
    const modalStatus = document.getElementById('modalDetailUserStatus');
    const modalName = document.getElementById('modalDetailUserName');
    const modalUsername = document.getElementById('modalDetailUserUsername');
    const modalPhone = document.getElementById('modalDetailUserPhone');
    const modalRegDate = document.getElementById('modalDetailUserRegDate');
    const modalEmail = document.getElementById('modalDetailUserEmail');
    const modalRole = document.getElementById('modalDetailUserRole');

    if (modalId) modalId.textContent = user.id;
    if (modalStatus) modalStatus.innerHTML = `<span class="badge ${user.status === 'Active' ? 'active' : 'banned'}">${user.status || 'Active'}</span>`;
    if (modalName) modalName.textContent = user.name || 'Guest User';
    if (modalUsername) modalUsername.textContent = user.username || 'N/A';
    if (modalPhone) modalPhone.textContent = user.phone || '09979051718';
    if (modalRegDate) modalRegDate.textContent = user.registeredDate || 'Sept 1, 2026';
    if (modalEmail) modalEmail.textContent = user.email || 'N/A';
    if (modalRole) modalRole.textContent = user.role ? (user.role.toUpperCase() + ' Account') : 'Customer Account';

    if (userModal) userModal.classList.add('active');
  };

  if (closeUserModalBtn && userModal) {
    closeUserModalBtn.addEventListener('click', () => {
      userModal.classList.remove('active');
    });
  }
  if (bottomCloseUserModalBtn && userModal) {
    bottomCloseUserModalBtn.addEventListener('click', () => {
      userModal.classList.remove('active');
    });
  }

  window.addEventListener('click', (e) => {
    if (e.target === userModal) userModal.classList.remove('active');
  });

  renderUsers();

  window.addEventListener('talisay:db_updated', () => {
    renderUsers();
  });
  window.addEventListener('storage', () => {
    renderUsers();
  });
}

