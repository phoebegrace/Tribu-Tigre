// ---------- CONFIG ----------
const EVENT_DATE = new Date('2025-12-27T18:00:00'); // December 27, 2025 at 6:00 PM
// Google Apps Script Web App endpoint (optional). Set your deployed URL here
// to log RSVPs to the Sheet: `https://docs.google.com/spreadsheets/d/1VR0oTgMXPyXVroAp-RrCOZZTQmi9brpA-XImKp3hyTU/edit?usp=sharing`
const SHEETS_ENDPOINT = 'https://script.google.com/macros/s/AKfycbynhj8lyIvjuUZt7aXzIi4H0QqlELYA-S_5jEB2mqKmnQUY_X9vuW-Fo4rJkCPnz74B/exec';

// sample data (replace with your real data or connect to Google Sheets later)
const announcements = [
  {text: 'Hatdog cheese dog', date: '2025-10-01'},
  {text: 'pebi so prettyyy <3', date: '2025-10-01'},
];

const program = [
  {time: '6:00 AM', title: 'Caravan'},
  {time: '8:00 AM', title: 'Mass'},
  {time: '10:00 AM', title: 'Opening Program'},
  {time: '12:00 PM', title: 'Solidarity Lunch'},
  {time: '3:00 PM', title: 'Bingo Party'},
  {time: '6:00 PM', title: 'Coronation and Night Party'},
];

const foodResults = [
  {dish: 'Lechon', votes: 0},
  {dish: 'Hatdog', votes: 0},
  {dish: 'Kabayo', votes: 0},
];

const suggestions = [
  {from: 'William', text: 'Bring your own food starting with the first letter of your name'},
];

// ---------- UI RENDER ----------
function renderAnnouncements() {
  const el = document.getElementById('annList');
  el.innerHTML = '';
  announcements.forEach(a => {
    const div = document.createElement('div');
    div.className = 'ann';
    div.innerHTML = `<div style="display:flex;justify-content:space-between"><div>${a.text}</div><div class="pill">${a.date}</div></div>`;
    el.appendChild(div);
  });
  document.getElementById('suggestCount').innerText = suggestions.length;
}

function renderProgram() {
  const el = document.getElementById('programList');
  el.innerHTML = '';
  program.forEach(p => {
    const div = document.createElement('div');
    div.className = 'prog-item';
    div.innerHTML = `<div>${p.title}</div><div style="color:var(--muted)">${p.time}</div>`;
    el.appendChild(div);
  });
}

function renderFood() {
  const tb = document.getElementById('foodTable');
  tb.innerHTML = '';
  foodResults.forEach(f => {
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${f.dish}</td><td>${f.votes}</td>`;
    tb.appendChild(tr);
  });
}

function renderSuggestions() {
  const box = document.getElementById('suggestionsBox');
  box.innerHTML = '';
  // Load suggestions from Firestore if available
  try {
    firebase.firestore().collection('suggestions').orderBy('ts','desc').limit(100)
      .get().then(snapshot => {
        box.innerHTML = '';
        snapshot.forEach(doc => {
          const s = doc.data();
          const d = document.createElement('div');
          d.style.padding = '8px';
          d.style.borderBottom = '1px solid #f1f5f9';
          d.innerHTML = `<strong>${s.from || 'Anonymous'}</strong> – <span style="color:var(--muted)">${s.text}</span>`;
          box.appendChild(d);
        });
      });
  } catch {
    // Fallback to local data
    const merged = suggestions;
    merged.forEach(s => {
      const d = document.createElement('div');
      d.style.padding = '8px';
      d.style.borderBottom = '1px solid #f1f5f9';
      d.innerHTML = `<strong>${s.from || 'Anonymous'}</strong> – <span style="color:var(--muted)">${s.text}</span>`;
      box.appendChild(d);
    });
  }
}

// countdown
function updateCountdown() {
  const now = new Date();
  const diff = EVENT_DATE - now;
  if (diff <= 0) {
    document.getElementById('d').innerText = '0';
    document.getElementById('h').innerText = '0';
    document.getElementById('m').innerText = '0';
    document.getElementById('s').innerText = '0';
    return;
  }
  const days = Math.floor(diff / 86400000);
  const hrs = Math.floor((diff % 86400000) / 3600000);
  const mins = Math.floor((diff % 3600000) / 60000);
  const secs = Math.floor((diff % 60000) / 1000);
  document.getElementById('d').innerText = days;
  document.getElementById('h').innerText = hrs;
  document.getElementById('m').innerText = mins;
  document.getElementById('s').innerText = secs;
}

// simple counters (these read from sample arrays; later connect to Sheets)
function updateStats() {
  const confirmed = Number(localStorage.getItem('confirmedCount') || '0');
  document.getElementById('comingCount').innerText = confirmed;
  document.getElementById('paidCount').innerText = 0; // replace with real count
  document.getElementById('suggestCount').innerText = suggestions.length;
}

async function sendToGoogleSheets(payload) {
  if (!SHEETS_ENDPOINT) return { ok: false, skipped: true };
  try {
    // Use no-cors to avoid preflight on Apps Script Web App
    await fetch(SHEETS_ENDPOINT, {
      method: 'POST',
      mode: 'no-cors',
      // Intentionally omit custom headers to keep it a simple request
      body: JSON.stringify(payload)
    });
    // Response will be opaque; assume success fire-and-forget
    return { ok: true, opaque: true };
  } catch (err) {
    console.error('Sheets submission failed', err);
    return { ok: false, error: String(err) };
  }
}

// modal helpers
function openModal(title, html) {
  document.getElementById('modalTitle').innerText = title;
  document.getElementById('modalBody').innerHTML = html;
  document.getElementById('modal').classList.add('open');
}

function closeModal() {
  document.getElementById('modal').classList.remove('open');
}

// quick action handlers
document.getElementById('rsvpBtn').addEventListener('click', () => openRSVPModal());
document.getElementById('payBtn').addEventListener('click', () => openPaymentModal());
document.getElementById('suggestBtn').addEventListener('click', () => {
  const el = document.getElementById('suggestInput');
  if (el) el.focus();
  window.scrollTo({ top: document.getElementById('suggestionsBox').offsetTop - 100, behavior: 'smooth' });
});

document.getElementById('remindBtn').addEventListener('click', () => {
  // free option: open a prefilled mailto (organizer can send) or copy text
  const mailto = `mailto:organizers@batch20xx.com?subject=Reminder%20to%20Batch%20-%20Payment%20Deadline&body=Hi%20batchmates,%0A%0AThis%20is%20a%20friendly%20reminder%20to%20complete%20your%20payment%20for%20the%20reunion%20by%20Dec%2015.%0A%0AThanks!`;
  openModal('Send Reminder', `<p>Open your email to send a reminder to the group organizer list.</p><p><a href="${mailto}" target="_blank">Open email client</a></p>`);
});

function openLink(key) {
  // placeholders: replace these URLs with your actual Google Forms / Sheets links
  const links = {
    rsvp: 'https://forms.gle/your-rsvp-form',
    payments: '',
    food: 'https://forms.gle/your-food-form',
    suggest: 'https://forms.gle/your-suggestions-form',
    photos: 'photos.html',
    contact: '',
    community: 'https://m.me/j/AbYqQJ1QhMOAHoL0/'
  };
  const url = links[key];
  if (!url) {
    if (key === 'contact') { openContactModal(); return; }
    if (key === 'payments') { openPaymentModal(); return; }
    openModal('Not Set', '<p>This link is not set yet. Edit the HTML to add your form links.</p>');
    return;
  }
  window.open(url, '_blank');
}

// RSVP Modal Functions
function openRSVPModal() {
  document.getElementById('rsvpModal').classList.add('open');
}

function closeRSVPModal() {
  document.getElementById('rsvpModal').classList.remove('open');
  document.getElementById('rsvpForm').reset();
  const box = document.getElementById('attendanceChecklist');
  if (box) box.style.display = 'none';
}

// Payment modal helpers
function openPaymentModal() {
  document.getElementById('paymentModal').classList.add('open');
}
function closePaymentModal() {
  document.getElementById('paymentModal').classList.remove('open');
  document.getElementById('paymentForm').reset();
}

// Contact modal helpers
function openContactModal() {
  document.getElementById('contactModal').classList.add('open');
}
function closeContactModal() {
  document.getElementById('contactModal').classList.remove('open');
}

// Handle RSVP Form Submission
document.getElementById('rsvpForm').addEventListener('submit', function(e) {
  e.preventDefault();
  
  const formData = {
    fullName: document.getElementById('fullName').value,
    email: document.getElementById('email').value,
    grade10Section: document.getElementById('grade10Section').value,
    grade12Section: document.getElementById('grade12Section').value,
    attending: document.querySelector('input[name="attending"]:checked').value,
    attendanceParts: Array.from(document.querySelectorAll('input[name="attendanceParts"]:checked')).map(i => i.value)
  };
  
  // if attending yes, ensure at least one part is selected
  if (formData.attending === 'yes' && formData.attendanceParts.length === 0) {
    openModal('Select attendance parts', '<p>Please select at least one part you will attend.</p>');
    return;
  }

  console.log('RSVP Submitted:', formData);
  
  // Optimistically persist confirmed count locally
  const attendingYes = formData.attending === 'yes';
  if (attendingYes) {
    const current = Number(localStorage.getItem('confirmedCount') || '0');
    localStorage.setItem('confirmedCount', String(current + 1));
    updateStats();
  }

  // Submit to Google Sheets (if endpoint configured)
  sendToGoogleSheets({
    type: 'rsvp',
    timestamp: new Date().toISOString(),
    ...formData
  }).then((result) => {
    if (!result.ok && !result.skipped) {
      console.warn('Could not write to Google Sheets');
    }
  });
  
  // Show success message
  const attending = formData.attending === 'yes';
  const message = attending 
    ? `<div style="text-align:center;padding:20px"><h3 style="color:var(--primary);margin-top:0">🎉 See you there, ${formData.fullName.split(' ')[0]}!</h3><p>We've received your RSVP. Check your email for more details.</p></div>`
    : `<div style="text-align:center;padding:20px"><h3 style="margin-top:0">Thanks for letting us know</h3><p>We'll miss you, ${formData.fullName.split(' ')[0]}! Hope to see you at the next one.</p></div>`;
  
  closeRSVPModal();
  openModal('RSVP Confirmed', message);
  
  // Here you would send the data to your backend or Google Sheets
  // Example: sendToGoogleSheets(formData);
});

// Sponsor Modal Functions
function openSponsorModal() {
  document.getElementById('sponsorModal').classList.add('open');
}

function closeSponsorModal() {
  document.getElementById('sponsorModal').classList.remove('open');
  document.getElementById('sponsorForm').reset();
}

// Handle Sponsor Form Submission
document.getElementById('sponsorForm').addEventListener('submit', function(e) {
  e.preventDefault();
  
  const formData = {
    sponsorName: document.getElementById('sponsorName').value,
    sponsorEmail: document.getElementById('sponsorEmail').value,
    sponsorAmount: document.getElementById('sponsorAmount').value,
    sponsorItem: document.getElementById('sponsorItem').value,
    sponsorMessage: document.getElementById('sponsorMessage').value
  };
  
  console.log('Sponsorship Submitted:', formData);
  
  const itemText = formData.sponsorItem ? ` for ${document.querySelector(`#sponsorItem option[value="${formData.sponsorItem}"]`).text}` : '';
  const message = `<div style="text-align:center;padding:20px">
    <h3 style="color:var(--primary);margin-top:0">Thank you, ${formData.sponsorName.split(' ')[0]}! 💝</h3>
    <p>Your generous sponsorship of ₱${formData.sponsorAmount}${itemText} means a lot to us!</p>
    <p style="color:var(--muted);font-size:14px">We'll contact you via email with payment details.</p>
  </div>`;
  
  closeSponsorModal();
  openModal('Sponsorship Received', message);
  
  // Here you would send the data to your backend or Google Sheets
  sendToGoogleSheets({ type: 'sponsor', timestamp: new Date().toISOString(), ...formData });

  // Save to Firestore as well
  try {
    firebase.firestore().collection('sponsors').add({ ...formData, ts: Date.now() });
  } catch {}

  // Optimistically add to sponsors list on page
  try {
    const listEl = document.getElementById('sponsorsList');
    if (listEl) {
      const div = document.createElement('div');
      div.className = 'sponsor-item';
      div.innerHTML = `<div class="sponsor-info"><strong>${formData.sponsorName}</strong><span class="sponsor-badge">${formData.sponsorItem || 'General'}</span></div><div class="sponsor-amount">₱${formData.sponsorAmount}</div>`;
      listEl.insertBefore(div, listEl.firstChild);
    }
  } catch {}
});

// Handle Payment Form Submission
document.getElementById('paymentForm').addEventListener('submit', function(e) {
  e.preventDefault();
  (async () => {
    const payerName = document.getElementById('payerName').value;
    const paymentAmount = document.getElementById('paymentAmount').value;
    const paymentMethod = document.getElementById('paymentMethod').value;
    const paymentRef = document.getElementById('paymentRef').value;
    const proofUrlInput = document.getElementById('proofUrl').value;
    const proofFileEl = document.getElementById('payerProofFile');

    let proofUrl = proofUrlInput;
    try {
      if (!proofUrl && proofFileEl && proofFileEl.files && proofFileEl.files[0]) {
        const file = proofFileEl.files[0];
        const storageRef = firebase.storage().ref();
        const path = `payments/${Date.now()}_${file.name}`;
        const snap = await storageRef.child(path).put(file);
        proofUrl = await snap.ref.getDownloadURL();
      }
    } catch {}

    const payload = { type: 'payment', payerName, paymentAmount, paymentMethod, paymentRef, proofUrl };
    // Save to Firestore
    try {
      await firebase.firestore().collection('payments').add({ ...payload, ts: Date.now() });
    } catch {}
    // Also send to Sheets for backup
    sendToGoogleSheets({ ...payload, timestamp: new Date().toISOString() });

    closePaymentModal();
    openModal('Payment Submitted', '<p>Thanks! We\'ll verify your payment shortly.</p>');
  })();
});

// Suggestions submit
const suggestInputEl = document.getElementById('suggestInput');
const suggestNameEl = document.getElementById('suggestName');
const suggestSubmitBtn = document.getElementById('suggestSubmitBtn');
if (suggestSubmitBtn) {
  suggestSubmitBtn.addEventListener('click', () => {
    const text = (suggestInputEl && suggestInputEl.value || '').trim();
    const fromName = (suggestNameEl && suggestNameEl.value || '').trim() || 'Anonymous';
    if (!text) return;
    const item = { from: fromName, text };
    try {
      firebase.firestore().collection('suggestions').add({ ...item, ts: Date.now() });
    } catch {}
    renderSuggestions();
    suggestInputEl.value = '';
    if (suggestNameEl) suggestNameEl.value = '';
    sendToGoogleSheets({ type: 'suggestion', from: fromName, text, timestamp: new Date().toISOString() });
  });
}

// initial render
renderAnnouncements();
renderProgram();
renderFood();
renderSuggestions();
updateStats();
updateCountdown();
setInterval(updateCountdown, 1000);

// Show/hide attendance checklist based on radio selection
document.querySelectorAll('input[name="attending"]').forEach(r => {
  r.addEventListener('change', () => {
    const show = r.value === 'yes' && r.checked;
    const box = document.getElementById('attendanceChecklist');
    if (box) box.style.display = show ? 'block' : 'none';
  });
});