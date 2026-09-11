/**
 * Talisay Beach Resort - Booking Engine
 * Free Selection (starts at 0), Cash on Arrival Only,
 * Real-time Admin Status Display (Pending until Admin Approves/Rejects),
 * and Cancel Booking feature that resets all availed accommodations and remains on page.
 */

document.addEventListener('DOMContentLoaded', () => {
  initBookingSystem();
});

function initBookingSystem() {
  const checkInInput = document.getElementById('checkInDate');
  const checkOutInput = document.getElementById('checkOutDate');
  const checkOutField = document.getElementById('checkOutField');
  const roomCards = document.querySelectorAll('.room-card');
  const confirmBtn = document.getElementById('confirmBookingBtn');

  // Callout elements (inside Step 2)
  const calloutBreakdown = document.getElementById('calloutBreakdown');
  const calloutTotalAmount = document.getElementById('calloutTotalAmount');

  // Stay Type (Day vs Night vs Mixed)
  const stayTypeDayBtn = document.getElementById('stayTypeDay');
  const stayTypeNightBtn = document.getElementById('stayTypeNight');
  const stayTypeMixedBtn = document.getElementById('stayTypeMixed');
  let currentStayType = 'night'; // preset mode

  // Summary elements
  const summaryCheckIn = document.getElementById('summaryCheckIn');
  const summaryCheckOut = document.getElementById('summaryCheckOut');
  const summaryRoomTitle = document.getElementById('summaryRoomTitle');
  const summaryRoomCalc = document.getElementById('summaryRoomCalc');
  const summaryRoomPrice = document.getElementById('summaryRoomPrice');
  const summaryTotalAmount = document.getElementById('summaryTotalAmount');

  // Reservation Status elements
  const statusPill = document.getElementById('activeStatusPill');
  const statusNoticeBox = document.getElementById('statusNoticeBox');
  const statusNoticeIcon = document.getElementById('statusNoticeIcon');
  const statusNoticeText = document.getElementById('statusNoticeText');
  const activeBookingRef = document.getElementById('activeBookingRef');
  const activeBookingFacility = document.getElementById('activeBookingFacility');
  const activeBookingAmount = document.getElementById('activeBookingAmount');
  const cancelReservationBtn = document.getElementById('cancelReservationBtn');
  const modalCancelBookingBtn = document.getElementById('modalCancelBookingBtn');

  // Downpayment / Confirmation modal elements
  const downpaymentModal = document.getElementById('downpaymentModal');
  const downpaymentCloseBtn = document.getElementById('closeDownpaymentBtn');
  const finishBookingBtn = document.getElementById('finishBookingBtn');

  // Active Booking Reference for Status Tracking
  let currentActiveBooking = null;

  if (!checkInInput || !checkOutInput) return;

  // Set default dates: Tomorrow (check-in) and Next Day (1 night check-out)
  const today = new Date();
  const defaultCheckIn = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
  const defaultCheckOut = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 2);

  // Format helpers
  const formatDateForInput = (d) => d.toISOString().split('T')[0];
  const formatDateDisplay = (dateStr) => {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      const d = new Date(parts[0], parts[1] - 1, parts[2]);
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    }
    return dateStr;
  };

  checkInInput.value = formatDateForInput(defaultCheckIn);
  checkOutInput.value = formatDateForInput(defaultCheckOut);
  checkInInput.min = formatDateForInput(today);

  // Read accommodation data from a card element (including its independent stay schedule)
  function getCardAccommodation(card) {
    const id = card.getAttribute('data-id');
    const name = card.getAttribute('data-name');
    const type = card.getAttribute('data-type') || 'room';
    const max = Number(card.getAttribute('data-max') || (type === 'cottage' ? 10 : 6));
    const qty = Number(card.getAttribute('data-qty') || 0);
    const priceDay = Number(card.getAttribute('data-price-day') || 1000);
    const priceNight = Number(card.getAttribute('data-price-night') || 2000);
    const schedule = card.getAttribute('data-schedule') || (type === 'cottage' ? 'day' : 'night');
    const price = schedule === 'day' ? priceDay : priceNight;
    return { id, name, type, max, qty, priceDay, priceNight, price, schedule, card };
  }

  // Get all currently selected accommodations (qty > 0)
  function getSelectedAccommodations() {
    const selected = [];
    roomCards.forEach(card => {
      const acc = getCardAccommodation(card);
      if (acc.qty > 0) {
        selected.push(acc);
      }
    });
    return selected;
  }

  function calculateNights() {
    const d1 = new Date(checkInInput.value);
    const d2 = new Date(checkOutInput.value);
    const diffTime = Math.abs(d2 - d1);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 1;
  }

  // Set quantity on a specific card
  function setCardQuantity(card, newQty) {
    const max = Number(card.getAttribute('data-max') || 6);
    let qty = parseInt(newQty, 10);
    if (isNaN(qty) || qty < 0) qty = 0;
    if (qty > max) qty = max;

    card.setAttribute('data-qty', qty);

    // Update select dropdown
    const select = card.querySelector('.room-qty-select');
    if (select) select.value = qty;

    // Update corner image badge
    const imgBadge = card.querySelector('.badge-selected-qty');
    const badgeNum = card.querySelector('.badge-qty-num');
    if (badgeNum) badgeNum.textContent = qty;

    if (qty > 0) {
      card.classList.add('selected');
      if (imgBadge) imgBadge.style.display = 'inline-flex';
    } else {
      card.classList.remove('selected');
      if (imgBadge) imgBadge.style.display = 'none';
    }

    syncGlobalStayType();
    updateCardSubtotals();
    updateBookingSummary();
  }

  // Reset all accommodation cards to 0
  function resetAllAccommodationsToZero() {
    roomCards.forEach(card => {
      card.setAttribute('data-qty', 0);
      card.classList.remove('selected');
      const select = card.querySelector('.room-qty-select');
      if (select) select.value = '0';
      const imgBadge = card.querySelector('.badge-selected-qty');
      if (imgBadge) imgBadge.style.display = 'none';
      const badgeNum = card.querySelector('.badge-qty-num');
      if (badgeNum) badgeNum.textContent = '0';
      const subtotalBadge = card.querySelector('.room-subtotal-badge');
      if (subtotalBadge) subtotalBadge.style.display = 'none';
    });
    syncGlobalStayType();
    updateCardSubtotals();
    updateBookingSummary();
  }

  // Set individual accommodation card schedule ('day' or 'night')
  function setCardSchedule(card, schedule) {
    card.setAttribute('data-schedule', schedule);
    const isCottage = card.getAttribute('data-type') === 'cottage';
    const pDay = Number(card.getAttribute('data-price-day') || 1000);
    const pNight = Number(card.getAttribute('data-price-night') || 2000);
    const activePrice = schedule === 'day' ? pDay : pNight;
    const perSuffix = isCottage ? ' (per cottage)' : '';
    const unitText = (schedule === 'day' ? '/day (8am-5pm)' : '/night') + perSuffix;
    card.setAttribute('data-price', activePrice);

    const priceDiv = card.querySelector('.room-price');
    if (priceDiv) {
      priceDiv.innerHTML = `₱ ${activePrice.toLocaleString('en-US')} <span class="rate-unit">${unitText}</span>`;
    }

    const dayBtn = card.querySelector('.card-sched-btn.sched-day');
    const nightBtn = card.querySelector('.card-sched-btn.sched-night');
    if (dayBtn && nightBtn) {
      if (schedule === 'day') {
        dayBtn.classList.add('active');
        nightBtn.classList.remove('active');
      } else {
        nightBtn.classList.add('active');
        dayBtn.classList.remove('active');
      }
    }

    const currentTag = card.querySelector('.card-schedule-current-tag');
    if (currentTag) {
      if (schedule === 'day') {
        currentTag.className = 'card-schedule-current-tag day-tag';
        currentTag.innerHTML = '<i class="fa-solid fa-sun"></i> Day Tour';
      } else {
        currentTag.className = 'card-schedule-current-tag night-tag';
        currentTag.innerHTML = '<i class="fa-solid fa-moon"></i> Overnight';
      }
    }

    syncGlobalStayType();
    updateCardSubtotals();
    updateBookingSummary();
  }

  // Synchronize Step 1 preset buttons & Check-out Date visibility
  function syncGlobalStayType() {
    const selected = getSelectedAccommodations();
    const cardsToCheck = selected.length > 0 ? selected : Array.from(roomCards).map(getCardAccommodation);
    const hasDay = cardsToCheck.some(c => c.schedule === 'day');
    const hasNight = cardsToCheck.some(c => c.schedule === 'night');

    if (stayTypeDayBtn) stayTypeDayBtn.classList.remove('active');
    if (stayTypeNightBtn) stayTypeNightBtn.classList.remove('active');
    if (stayTypeMixedBtn) stayTypeMixedBtn.classList.remove('active');

    if (hasDay && hasNight) {
      if (stayTypeMixedBtn) stayTypeMixedBtn.classList.add('active');
      currentStayType = 'mixed';
      if (checkOutField) checkOutField.style.display = 'block';
    } else if (hasDay) {
      if (stayTypeDayBtn) stayTypeDayBtn.classList.add('active');
      currentStayType = 'day';
      if (checkOutField) checkOutField.style.display = 'none';
    } else {
      if (stayTypeNightBtn) stayTypeNightBtn.classList.add('active');
      currentStayType = 'night';
      if (checkOutField) checkOutField.style.display = 'block';
    }
  }

  // Update per-card subtotal badge based on that card's schedule
  function updateCardSubtotals() {
    const count = calculateNights();

    roomCards.forEach(card => {
      const acc = getCardAccommodation(card);
      const subtotalBadge = card.querySelector('.room-subtotal-badge');
      if (!subtotalBadge) return;

      if (acc.qty > 0) {
        const rate = acc.schedule === 'day' ? acc.priceDay : acc.priceNight;
        const duration = acc.schedule === 'day' ? 1 : count;
        const subtotal = rate * duration * acc.qty;
        subtotalBadge.textContent = `Subtotal: ₱ ${subtotal.toLocaleString('en-US')}`;
        subtotalBadge.style.display = 'inline-block';
      } else {
        subtotalBadge.style.display = 'none';
      }
    });
  }

  // Apply Step 1 preset to all accommodation cards
  function applyStayType(type) {
    currentStayType = type;

    roomCards.forEach(card => {
      const isCottage = card.getAttribute('data-type') === 'cottage';
      let targetSched = 'night';
      if (type === 'day') {
        targetSched = 'day';
      } else if (type === 'night') {
        targetSched = 'night';
      } else if (type === 'mixed') {
        // Preset cottages for day tour and rooms for overnight
        targetSched = isCottage ? 'day' : 'night';
      }
      setCardSchedule(card, targetSched);
    });

    syncGlobalStayType();
  }

  if (stayTypeDayBtn) {
    stayTypeDayBtn.addEventListener('click', () => applyStayType('day'));
  }

  if (stayTypeNightBtn) {
    stayTypeNightBtn.addEventListener('click', () => applyStayType('night'));
  }

  if (stayTypeMixedBtn) {
    stayTypeMixedBtn.addEventListener('click', () => applyStayType('mixed'));
  }

  // Setup per-card quantity controls and per-card schedule controls
  roomCards.forEach(card => {
    const minusBtn = card.querySelector('.qty-minus');
    const plusBtn = card.querySelector('.qty-plus');
    const select = card.querySelector('.room-qty-select');

    if (minusBtn) {
      minusBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const current = Number(card.getAttribute('data-qty') || 0);
        setCardQuantity(card, current - 1);
      });
    }

    if (plusBtn) {
      plusBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const current = Number(card.getAttribute('data-qty') || 0);
        setCardQuantity(card, current + 1);
      });
    }

    if (select) {
      select.addEventListener('change', (e) => {
        e.stopPropagation();
        setCardQuantity(card, select.value);
      });
      select.addEventListener('click', (e) => {
        e.stopPropagation();
      });
    }

    // Schedule buttons on card
    const schedBtns = card.querySelectorAll('.card-sched-btn');
    schedBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const sched = btn.getAttribute('data-schedule') || 'night';
        setCardSchedule(card, sched);
      });
    });

    // Clicking anywhere on card (outside inputs/buttons/schedule toggles) toggles 1 or 0
    card.addEventListener('click', (e) => {
      if (e.target.closest('.qty-btn') || e.target.closest('.room-qty-select') || e.target.closest('.card-sched-btn') || e.target.closest('.card-schedule-box')) return;
      if (card.classList.contains('fully-booked') || Number(card.getAttribute('data-max') || 0) <= 0) return;
      const current = Number(card.getAttribute('data-qty') || 0);
      if (current === 0) {
        setCardQuantity(card, 1);
      }
    });
  });

  // Date change listeners
  checkInInput.addEventListener('change', () => {
    if (checkOutInput.value <= checkInInput.value) {
      const nextDay = new Date(checkInInput.value);
      nextDay.setDate(nextDay.getDate() + 1);
      checkOutInput.value = formatDateForInput(nextDay);
    }
    checkOutInput.min = checkInInput.value;
    updateCardSubtotals();
    updateBookingSummary();
  });

  checkOutInput.addEventListener('change', () => {
    if (checkOutInput.value <= checkInInput.value) {
      if (window.showUserConfirm) {
        window.showUserConfirm({
          title: 'Invalid Date Selection',
          message: 'Your check-out date must be after your check-in date. We have automatically adjusted it for you.',
          confirmText: 'Understood',
          cancelText: null,
          type: 'warning',
          icon: 'fa-regular fa-calendar-xmark'
        });
      }
      const nextDay = new Date(checkInInput.value);
      nextDay.setDate(nextDay.getDate() + 1);
      checkOutInput.value = formatDateForInput(nextDay);
    }
    updateCardSubtotals();
    updateBookingSummary();
  });

  function updateBookingSummary() {
    const count = calculateNights();
    const selected = getSelectedAccommodations();
    const hasDay = selected.some(a => a.schedule === 'day');
    const hasNight = selected.some(a => a.schedule === 'night');

    // If nothing selected (starts at 0, user free to select)
    if (selected.length === 0) {
      const isPresetDay = currentStayType === 'day';
      if (calloutBreakdown) {
        calloutBreakdown.textContent = 'No room or cottage selected. Select how many rooms or cottages you want above.';
      }
      if (calloutTotalAmount) {
        calloutTotalAmount.textContent = '₱ 0';
      }
      if (summaryCheckIn) {
        summaryCheckIn.textContent = formatDateDisplay(checkInInput.value) + (isPresetDay ? ' (8:00 AM)' : ' (2:00 PM)');
      }
      if (summaryCheckOut) {
        summaryCheckOut.textContent = isPresetDay ? formatDateDisplay(checkInInput.value) + ' (5:00 PM)' : formatDateDisplay(checkOutInput.value) + ' (12:00 PM)';
      }
      if (summaryRoomTitle) {
        summaryRoomTitle.textContent = 'None Selected';
      }
      if (summaryRoomCalc) {
        summaryRoomCalc.textContent = 'Select quantity above';
      }
      if (summaryRoomPrice) {
        summaryRoomPrice.textContent = '₱ 0';
      }
      if (summaryTotalAmount) {
        summaryTotalAmount.textContent = '₱ 0';
      }
      return;
    }

    // Calculate total from all selected accommodations using each accommodation's individual schedule
    let grandTotal = 0;
    let totalUnits = 0;
    let dayUnits = 0;
    let nightUnits = 0;
    const breakdownParts = [];

    selected.forEach(acc => {
      const isAccDay = acc.schedule === 'day';
      const rate = isAccDay ? acc.priceDay : acc.priceNight;
      const duration = isAccDay ? 1 : count;
      const itemTotal = rate * duration * acc.qty;
      grandTotal += itemTotal;
      totalUnits += acc.qty;

      if (isAccDay) dayUnits += acc.qty;
      else nightUnits += acc.qty;

      const isCottage = acc.type === 'cottage';
      const unitWord = isCottage ? (acc.qty > 1 ? 'Cottages' : 'Cottage') : (acc.qty > 1 ? 'Rooms' : 'Room');
      const perLabel = isCottage ? ' (per cottage)' : '';

      if (isAccDay) {
        breakdownParts.push(`<strong>${acc.qty}x ${acc.name}</strong> <span style="color: #b45309; font-size: 12px; font-weight: 700;">(Day Tour: 8am-5pm)</span> &bull; ${acc.qty} ${unitWord} &times; 1 Day Tour &times; ₱${rate.toLocaleString('en-US')}${perLabel} = <strong>₱ ${itemTotal.toLocaleString('en-US')}</strong>`);
      } else {
        breakdownParts.push(`<strong>${acc.qty}x ${acc.name}</strong> <span style="color: #0369a1; font-size: 12px; font-weight: 700;">(Overnight: ${count} Night${count > 1 ? 's' : ''})</span> &bull; ${acc.qty} ${unitWord} &times; ${count} Night${count > 1 ? 's' : ''} &times; ₱${rate.toLocaleString('en-US')}${perLabel} = <strong>₱ ${itemTotal.toLocaleString('en-US')}</strong>`);
      }
    });

    const formattedTotal = '₱ ' + grandTotal.toLocaleString('en-US');

    // Update Live Total Callout in Step 2
    if (calloutBreakdown) {
      calloutBreakdown.innerHTML = breakdownParts.join('<br>');
    }

    if (calloutTotalAmount) {
      calloutTotalAmount.textContent = formattedTotal;
    }

    // Build names list for summary
    const namesList = selected.map(a => `${a.qty}x ${a.name} (${a.schedule === 'day' ? 'Day Tour' : 'Overnight'})`).join(', ');

    // Update Right Summary Sidebar
    if (summaryCheckIn) {
      summaryCheckIn.textContent = formatDateDisplay(checkInInput.value) + (hasDay ? ' (8:00 AM)' : ' (2:00 PM)');
    }

    if (summaryCheckOut) {
      if (hasNight) {
        summaryCheckOut.textContent = formatDateDisplay(checkOutInput.value) + ' (12:00 PM)';
      } else {
        summaryCheckOut.textContent = formatDateDisplay(checkInInput.value) + ' (5:00 PM)';
      }
    }

    if (summaryRoomTitle) {
      summaryRoomTitle.textContent = namesList;
    }

    if (summaryRoomCalc) {
      if (hasDay && hasNight) {
        summaryRoomCalc.textContent = `Mixed Stay • ${totalUnits} Units (${dayUnits} Day Tour + ${nightUnits} Overnight, ${count} Night${count > 1 ? 's' : ''})`;
      } else if (hasDay) {
        summaryRoomCalc.textContent = `${totalUnits} Units Total • Day Tour (8:00 AM - 5:00 PM)`;
      } else {
        summaryRoomCalc.textContent = `${totalUnits} Units Total • ${count} Night${count > 1 ? 's' : ''}`;
      }
    }

    if (summaryRoomPrice) summaryRoomPrice.textContent = formattedTotal;
    if (summaryTotalAmount) summaryTotalAmount.textContent = formattedTotal;
  }

  // Initial calculation & render (starts at 0)
  applyStayType('night');

  // =========================================================
  // REAL-TIME AVAILABILITY: Reduce slots based on other users'
  // Approved/Pending bookings so each facility can't be double-booked
  // =========================================================
  function updateAvailability() {
    const curUser = TalisayDB.getCurrentUser();
    const curUserId = curUser ? (curUser.id || curUser.username || curUser.email) : null;
    const allBookings = TalisayDB.getBookings();

    // Tally booked qty per facility-id from active bookings (not cancelled/rejected)
    // Exclude the current user's own bookings
    const bookedMap = {}; // { facilityId: totalQtyBooked }
    allBookings.forEach(b => {
      if (b.status === 'Cancelled' || b.status === 'Rejected') return;
      // Skip current user's own bookings
      if (curUserId && (b.userId === curUserId || (!b.userId && b.email === (curUser.email || '')))) return;
      
      if (b.selections && Array.isArray(b.selections)) {
        b.selections.forEach(sel => {
          bookedMap[sel.id] = (bookedMap[sel.id] || 0) + sel.qty;
        });
      } else if (b.facility) {
        // Fallback for compound booking text, e.g. "2x Elizabeth Room, 1x Cottage 1 (Beachfront) (Overnight)"
        const facClean = b.facility.replace(/\s*\([^)]*\)\s*$/g, '');
        const items = facClean.split(',').map(s => s.trim()).filter(Boolean);

        items.forEach(item => {
          const match = item.match(/^(\d+)x\s*(.*)$/i);
          const qty = match ? parseInt(match[1], 10) : (Number(b.quantity) || 1);
          const name = match ? match[2].trim().toLowerCase() : item.toLowerCase();

          if (name.includes('elizabeth')) bookedMap['elizabeth-room'] = (bookedMap['elizabeth-room'] || 0) + qty;
          else if (name.includes('fernando') && name.includes('standard')) bookedMap['fernando-room-standard'] = (bookedMap['fernando-room-standard'] || 0) + qty;
          else if (name.includes('fernando')) bookedMap['fernando-room'] = (bookedMap['fernando-room'] || 0) + qty;
          else if (name.includes('beach front') || name.includes('beachfront') || name.includes('cottage 1')) bookedMap['cottage-beachfront'] = (bookedMap['cottage-beachfront'] || 0) + qty;
          else if (name.includes('sunset') || name.includes('cottage 2')) bookedMap['cottage-sunset'] = (bookedMap['cottage-sunset'] || 0) + qty;
          else if (name.includes('garden') || name.includes('cottage 3')) bookedMap['cottage-garden'] = (bookedMap['cottage-garden'] || 0) + qty;
        });
      }
    });

    // Update each room card
    roomCards.forEach(card => {
      const id = card.getAttribute('data-id');
      const originalMax = Number(card.getAttribute('data-original-max') || card.getAttribute('data-max'));
      // Store original max on first run so we don't lose it
      if (!card.getAttribute('data-original-max')) {
        card.setAttribute('data-original-max', originalMax);
      }

      const booked = bookedMap[id] || 0;
      const available = Math.max(0, originalMax - booked);

      // Update data-max to the available count
      card.setAttribute('data-max', available);

      // If current qty exceeds available, clamp it
      const currentQty = Number(card.getAttribute('data-qty') || 0);
      if (currentQty > available) {
        setCardQuantity(card, available);
      }

      // Update the dropdown options
      const isCottage = card.getAttribute('data-type') === 'cottage';
      const select = card.querySelector('.room-qty-select');
      if (select) {
        const unitSingle = isCottage ? 'Cottage' : 'Room';
        const unitPlural = isCottage ? 'Cottages' : 'Rooms';
        select.innerHTML = '';
        const optNone = document.createElement('option');
        optNone.value = '0';
        optNone.textContent = '0 (None)';
        select.appendChild(optNone);
        for (let i = 1; i <= available; i++) {
          const opt = document.createElement('option');
          opt.value = i;
          if (i === available) {
            opt.textContent = `${i} ${i === 1 ? unitSingle : unitPlural} (Max)`;
          } else {
            opt.textContent = `${i} ${i === 1 ? unitSingle : unitPlural}`;
          }
          select.appendChild(opt);
        }
        select.value = Math.min(currentQty, available);
      }

      // Update vacant badges
      const vacantCorner = card.querySelector('.badge-vacant-corner');
      const vacantInfo = card.querySelector('.rate-badge-row .badge-vacant');

      if (available === 0) {
        // Fully booked — disable card
        card.classList.add('fully-booked');
        if (vacantCorner) {
          vacantCorner.innerHTML = '<i class="fa-solid fa-circle-xmark"></i> Fully Booked';
          vacantCorner.style.background = 'rgba(220, 38, 38, 0.85)';
        }
        if (vacantInfo) {
          vacantInfo.innerHTML = `<i class="fa-solid fa-ban"></i> Fully Booked`;
          vacantInfo.style.background = '#fee2e2';
          vacantInfo.style.color = '#dc2626';
        }
      } else {
        card.classList.remove('fully-booked');
        const bedIcon = isCottage ? 'fa-umbrella-beach' : 'fa-bed';
        if (vacantCorner) {
          vacantCorner.innerHTML = `<i class="fa-solid fa-circle-check"></i> ${available} Vacant`;
          vacantCorner.style.background = '';
        }
        if (vacantInfo) {
          vacantInfo.innerHTML = `<i class="fa-solid fa-${bedIcon}"></i> ${available} Vacant`;
          vacantInfo.style.background = '';
          vacantInfo.style.color = '';
        }
      }
    });
  }

  // Run availability check on load
  updateAvailability();

  // Re-check availability periodically (when admin approves/rejects, or other users book)
  setInterval(updateAvailability, 3000);

  // Also listen for localStorage changes (multi-tab support)
  window.addEventListener('storage', (e) => {
    if (e.key === 'talisay_bookings') {
      updateAvailability();
    }
  });


  // =========================================================
  // RESERVATION STATUS FEATURE (DISPLAY ONLY FROM ADMIN)
  // Shows Pending until Admin Approves or Rejects
  // =========================================================
  function refreshBookingStatus() {
    if (!currentActiveBooking) {
      if (activeBookingRef) activeBookingRef.textContent = 'None';
      if (activeBookingFacility) activeBookingFacility.textContent = 'No active booking yet';
      if (activeBookingAmount) activeBookingAmount.textContent = '₱ 0.00';
      if (cancelReservationBtn) cancelReservationBtn.style.display = 'none';

      if (statusPill) {
        statusPill.innerHTML = '<i class="fa-solid fa-circle-info"></i> No Active Booking';
        statusPill.className = 'status-badge';
        statusPill.style.background = '#f1f5f9';
        statusPill.style.color = '#64748b';
        statusPill.style.border = '1px solid #cbd5e1';
      }
      if (statusNoticeBox) {
        statusNoticeBox.style.background = '#f8fafc';
        statusNoticeBox.style.borderColor = '#e2e8f0';
        statusNoticeBox.style.color = '#64748b';
      }
      if (statusNoticeIcon) {
        statusNoticeIcon.className = 'fa-solid fa-circle-info';
        statusNoticeIcon.style.color = '#64748b';
      }
      if (statusNoticeText) {
        statusNoticeText.textContent = 'Once you confirm a booking, it will show Pending until the Admin approves or rejects it.';
      }
      return;
    }

    // Refresh status from database to reflect admin updates
    const allBookings = TalisayDB.getBookings();
    const fresh = allBookings.find(b => b.id === currentActiveBooking.id);
    if (fresh) {
      currentActiveBooking = fresh;
    }

    const status = currentActiveBooking.status || 'Pending';

    if (activeBookingRef) activeBookingRef.textContent = currentActiveBooking.id;
    if (activeBookingFacility) activeBookingFacility.textContent = currentActiveBooking.facility;
    if (activeBookingAmount) activeBookingAmount.textContent = '₱ ' + Number(currentActiveBooking.amount).toLocaleString('en-US', { minimumFractionDigits: 2 });

    // Cancel button is shown for active pending/approved bookings
    if (cancelReservationBtn) {
      if (status === 'Cancelled' || status === 'Rejected') {
        cancelReservationBtn.style.display = 'none';
      } else {
        cancelReservationBtn.style.display = 'flex';
      }
    }

    if (status.toLowerCase() === 'approved') {
      if (statusPill) {
        statusPill.innerHTML = '<i class="fa-solid fa-circle-check"></i> Approved';
        statusPill.className = 'status-badge approved';
        statusPill.style.background = '';
        statusPill.style.color = '';
        statusPill.style.border = '';
      }
      if (statusNoticeBox) {
        statusNoticeBox.style.background = '#dcfce7';
        statusNoticeBox.style.borderColor = '#86efac';
        statusNoticeBox.style.color = '#15803d';
      }
      if (statusNoticeIcon) {
        statusNoticeIcon.className = 'fa-solid fa-circle-check';
        statusNoticeIcon.style.color = '#16a34a';
      }
      if (statusNoticeText) {
        statusNoticeText.textContent = 'Your reservation has been Approved by the Admin! Please prepare cash payment upon arrival.';
      }
    } else if (status.toLowerCase() === 'rejected') {
      if (statusPill) {
        statusPill.innerHTML = '<i class="fa-solid fa-circle-xmark"></i> Rejected';
        statusPill.className = 'status-badge rejected';
        statusPill.style.background = '';
        statusPill.style.color = '';
        statusPill.style.border = '';
      }
      if (statusNoticeBox) {
        statusNoticeBox.style.background = '#fee2e2';
        statusNoticeBox.style.borderColor = '#fca5a5';
        statusNoticeBox.style.color = '#b91c1c';
      }
      if (statusNoticeIcon) {
        statusNoticeIcon.className = 'fa-solid fa-circle-xmark';
        statusNoticeIcon.style.color = '#dc2626';
      }
      if (statusNoticeText) {
        statusNoticeText.textContent = 'Your reservation was Rejected by the Admin. You may choose other dates or accommodations.';
      }
    } else if (status.toLowerCase() === 'cancelled') {
      if (statusPill) {
        statusPill.innerHTML = '<i class="fa-solid fa-ban"></i> Cancelled';
        statusPill.className = 'status-badge cancelled';
        statusPill.style.background = '';
        statusPill.style.color = '';
        statusPill.style.border = '';
      }
      if (statusNoticeBox) {
        statusNoticeBox.style.background = '#f1f5f9';
        statusNoticeBox.style.borderColor = '#cbd5e1';
        statusNoticeBox.style.color = '#64748b';
      }
      if (statusNoticeIcon) {
        statusNoticeIcon.className = 'fa-solid fa-ban';
        statusNoticeIcon.style.color = '#64748b';
      }
      if (statusNoticeText) {
        statusNoticeText.textContent = 'Reservation has been cancelled. You did not avail of this booking.';
      }
    } else {
      // Pending by default until Admin acts
      if (statusPill) {
        statusPill.innerHTML = '<i class="fa-solid fa-clock"></i> Pending';
        statusPill.className = 'status-badge pending';
        statusPill.style.background = '';
        statusPill.style.color = '';
        statusPill.style.border = '';
      }
      if (statusNoticeBox) {
        statusNoticeBox.style.background = '#fef9c3';
        statusNoticeBox.style.borderColor = '#fef08a';
        statusNoticeBox.style.color = '#854d0e';
      }
      if (statusNoticeIcon) {
        statusNoticeIcon.className = 'fa-solid fa-hourglass-half';
        statusNoticeIcon.style.color = '#ca8a04';
      }
      if (statusNoticeText) {
        statusNoticeText.textContent = 'Awaiting Admin approval. Shows Pending until the Admin approves or rejects your reservation.';
      }
    }
  }

  // Load only THIS user's latest booking into the status section
  const currentUser = TalisayDB.getCurrentUser();
  const currentUserId = currentUser ? (currentUser.id || currentUser.username || currentUser.email) : null;
  const allBookings = TalisayDB.getBookings();
  const userBookings = currentUserId
    ? allBookings.filter(b => b.userId === currentUserId || (!b.userId && b.email === (currentUser.email || '')))
    : [];

  if (userBookings.length > 0) {
    currentActiveBooking = userBookings[0];
    refreshBookingStatus();
  } else {
    currentActiveBooking = null;
    refreshBookingStatus();
  }

  // Listen to storage events so when Admin approves/rejects in admin panel, this page reflects it immediately
  window.addEventListener('storage', (e) => {
    if (e.key === 'talisay_bookings') {
      refreshBookingStatus();
    }
  });
  setInterval(refreshBookingStatus, 2500);

  // =========================================================
  // CANCEL BOOKING (NOT AVAIL)
  // Removes all user availed selections and resets to zero
  // Stays on availability page
  // =========================================================
  function handleCancelBooking() {
    if (!currentActiveBooking) {
      return;
    }

    const bookingId = currentActiveBooking.id;

    if (window.showUserConfirm) {
      window.showUserConfirm({
        title: 'Cancel Reservation',
        message: `Are you sure you want to cancel booking <strong>#${bookingId}</strong>? All selected rooms and cottages will be released.`,
        confirmText: 'Yes, Cancel Booking',
        cancelText: 'Keep Booking',
        type: 'danger',
        icon: 'fa-solid fa-ban',
        onConfirm: () => {
          executeCancellation();
        }
      });
    } else {
      executeCancellation();
    }

    function executeCancellation() {
      // Update in database to Cancelled
      TalisayDB.updateBookingStatus(bookingId, 'Cancelled');
      if (currentActiveBooking && currentActiveBooking.id === bookingId) {
        currentActiveBooking.status = 'Cancelled';
      }

      // 1. Remove all user availed room & cottage selections (reset to zero)
      resetAllAccommodationsToZero();

      // 2. Update status display
      refreshBookingStatus();

      // 3. Refresh availability so cancelled slots become available again
      updateAvailability();

      // 4. Close confirmation modal if open
      if (downpaymentModal) {
        downpaymentModal.classList.remove('active');
      }
    }
  }

  if (cancelReservationBtn) {
    cancelReservationBtn.addEventListener('click', handleCancelBooking);
  }

  if (modalCancelBookingBtn) {
    modalCancelBookingBtn.addEventListener('click', handleCancelBooking);
  }

  // =========================================================
  // CONFIRM BOOKING & CASH ON ARRIVAL PAYMENT
  // =========================================================
  if (confirmBtn) {
    confirmBtn.addEventListener('click', () => {
      const count = calculateNights();
      const selected = getSelectedAccommodations();

      if (selected.length === 0) {
        if (window.showUserConfirm) {
          window.showUserConfirm({
            title: 'No Selection Made',
            message: 'Please choose at least one room or cottage before confirming your reservation.',
            confirmText: 'Got It',
            cancelText: null,
            type: 'warning',
            icon: 'fa-solid fa-bed'
          });
        }
        return;
      }

      let grandTotal = 0;
      selected.forEach(acc => {
        const rate = acc.schedule === 'day' ? acc.priceDay : acc.priceNight;
        const duration = acc.schedule === 'day' ? 1 : count;
        grandTotal += rate * duration * acc.qty;
      });

      // Open Cash on Arrival Confirmation Modal (GCash removed)
      const paymentSelectorModal = document.getElementById('paymentChoiceModal');
      if (paymentSelectorModal) {
        const payAmountEl = document.getElementById('modalPaymentAmount');
        if (payAmountEl) payAmountEl.textContent = '₱ ' + grandTotal.toLocaleString('en-US');
        paymentSelectorModal.classList.add('active');
      } else {
        const user = TalisayDB.getCurrentUser();
        let totalUnits = 0;
        selected.forEach(acc => totalUnits += acc.qty);
        executePaymentSuccess(user, count, grandTotal, totalUnits, selected);
      }
    });
  }

  // Submit Reservation inside modal (Cash on Arrival)
  const submitPaymentBtn = document.getElementById('submitPaymentBtn');
  if (submitPaymentBtn) {
    submitPaymentBtn.addEventListener('click', () => {
      const user = TalisayDB.getCurrentUser();
      const count = calculateNights();
      const selected = getSelectedAccommodations();
      let grandTotal = 0;
      let totalUnits = 0;

      selected.forEach(acc => {
        const rate = acc.schedule === 'day' ? acc.priceDay : acc.priceNight;
        const duration = acc.schedule === 'day' ? 1 : count;
        grandTotal += rate * duration * acc.qty;
        totalUnits += acc.qty;
      });

      const paymentChoiceModal = document.getElementById('paymentChoiceModal');
      if (paymentChoiceModal) paymentChoiceModal.classList.remove('active');

      executePaymentSuccess(user, count, grandTotal, totalUnits, selected, 'Cash on Arrival');
    });
  }

  function executePaymentSuccess(user, count, total, totalUnits, selected, paymentMethod = 'Cash on Arrival') {
    const hasDay = selected.some(a => a.schedule === 'day');
    const hasNight = selected.some(a => a.schedule === 'night');
    let scheduleLabel = 'Overnight';
    if (hasDay && hasNight) {
      scheduleLabel = 'Mixed Stay';
    } else if (hasDay) {
      scheduleLabel = 'Day Tour';
    }

    const checkOutVal = hasNight ? checkOutInput.value : checkInInput.value;
    const facilityName = selected.map(a => `${a.qty}x ${a.name} (${a.schedule === 'day' ? 'Day Tour' : 'Overnight'})`).join(', ');

    // Generate booking in DB (Status starts as Pending for Admin review)
    const newBooking = TalisayDB.addBooking({
      userId: user.id || user.username || user.email || 'guest',
      customer: user.name && user.name !== 'Guest' ? user.name : 'Registered Guest',
      email: user.email || 'guest@example.com',
      phone: user.phone || '09979051718',
      facility: facilityName,
      selections: selected.map(acc => ({
        id: acc.id,
        name: acc.name,
        qty: acc.qty,
        schedule: acc.schedule,
        rate: acc.schedule === 'day' ? acc.priceDay : acc.priceNight
      })),
      quantity: totalUnits,
      checkIn: checkInInput.value,
      checkOut: checkOutVal,
      dateDisplay: formatDateDisplay(checkInInput.value) + (hasNight ? ' - ' + formatDateDisplay(checkOutInput.value) : '') + ` (${scheduleLabel})`,
      amount: total,
      status: 'Pending',
      paymentMethod: 'Cash on Arrival',
      paymentRef: 'COA-' + Math.floor(100000 + Math.random() * 900000)
    });

    // Set as active booking and update status display
    currentActiveBooking = newBooking;
    refreshBookingStatus();
    updateAvailability();

    // Populate Confirmation Modal
    const refEl = document.getElementById('downpaymentRefId');
    const custEl = document.getElementById('downpaymentCustName');
    const amtEl = document.getElementById('downpaymentTotalAmount');
    const amtLabel = document.getElementById('downpaymentAmountLabel');
    const methodEl = document.getElementById('downpaymentPayMethod');
    const statusEl = document.getElementById('downpaymentStatusText');

    if (refEl) refEl.textContent = newBooking.id;
    if (custEl) custEl.textContent = newBooking.customer;
    if (amtEl) amtEl.textContent = '₱ ' + total.toLocaleString('en-US') + '.00';
    if (amtLabel) amtLabel.textContent = 'Pay on Arrival:';
    if (methodEl) methodEl.textContent = 'Cash on Arrival';
    if (statusEl) statusEl.textContent = 'Pending Admin Approval / Pay at Front Desk';

    if (downpaymentModal) {
      downpaymentModal.classList.add('active');
    }
  }

  // Close confirmation modal — STAYS ON AVAILABILITY PAGE
  if (downpaymentCloseBtn && downpaymentModal) {
    downpaymentCloseBtn.addEventListener('click', () => {
      downpaymentModal.classList.remove('active');
    });
  }

  // Done button — STAYS ON AVAILABILITY PAGE (No redirect)
  if (finishBookingBtn && downpaymentModal) {
    finishBookingBtn.addEventListener('click', () => {
      downpaymentModal.classList.remove('active');
    });
  }
}
