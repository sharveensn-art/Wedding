// ── Init Supabase ─────────────────────────────────────────
const { createClient } = supabase;
const db = createClient(SUPABASE_URL, SUPABASE_ANON);

// ── State ─────────────────────────────────────────────────
let guest      = null;
let attendance = null;
let paxCount   = 1;

// ── Populate static content from config ──────────────────
document.getElementById('hero-bride').textContent    = WEDDING.brideFirstName;
document.getElementById('hero-groom').textContent    = WEDDING.groomFirstName;
document.getElementById('hero-date').textContent     = WEDDING.date;
document.getElementById('detail-date').textContent   = WEDDING.date;
document.getElementById('detail-time').textContent   = WEDDING.time;
document.getElementById('detail-venue').innerHTML    = `<strong>${WEDDING.venue}</strong><br><small style="color:var(--muted)">${WEDDING.venueAddress}</small>`;
document.getElementById('detail-map').href           = WEDDING.googleMapsUrl;
document.getElementById('detail-dresscode').textContent = WEDDING.dressCode;
document.getElementById('footer-names').textContent  = `${WEDDING.brideFullName} & ${WEDDING.groomFullName}`;

const deadline = new Date(WEDDING.rsvpDeadline);
document.getElementById('rsvp-subtitle').textContent =
  `Kindly respond by ${deadline.toLocaleDateString('en-MY', { day:'numeric', month:'long', year:'numeric' })}`;
document.getElementById('deadline-notice').textContent =
  `RSVP closes on ${deadline.toLocaleDateString('en-MY', { day:'numeric', month:'long', year:'numeric' })}`;

// ── Phone lookup ──────────────────────────────────────────
async function lookupPhone() {
  const raw = document.getElementById('phone-input').value.trim();
  if (!raw) return;

  // Normalise: strip spaces and dashes
  const phone = raw.replace(/[\s\-]/g, '');

  document.getElementById('err-phone').classList.add('hidden');
  showState('loading');

  if (new Date() > deadline) { showState('closed'); return; }

  const { data, error } = await db
    .from('guests')
    .select('*')
    .eq('phone', phone)
    .single();

  if (error || !data) {
    showState('phone');
    document.getElementById('err-phone').classList.remove('hidden');
    return;
  }

  guest = data;

  if (guest.rsvp_status !== 'pending') {
    const msg = guest.rsvp_status === 'confirmed'
      ? `You confirmed attendance for ${guest.pax_count} pax. Thank you!`
      : `You indicated that you are unable to attend. We will miss you!`;
    document.getElementById('done-msg').textContent = msg;
    showState('done');
    return;
  }

  // Set up form
  document.getElementById('guest-name-display').textContent = guest.name;
  document.getElementById('pax-max').textContent = guest.max_pax;
  paxCount = 1;
  renderAttendeeFields();
  showState('form');
}

// ── Attendance toggle ─────────────────────────────────────
function selectAttendance(val) {
  attendance = val;
  document.getElementById('btn-yes').className = 'attendance-btn' + (val === 'yes' ? ' selected-yes' : '');
  document.getElementById('btn-no').className  = 'attendance-btn' + (val === 'no'  ? ' selected-no'  : '');
  document.getElementById('err-attendance').classList.add('hidden');

  const fields = document.getElementById('attending-fields');
  if (val === 'yes') {
    fields.classList.remove('hidden');
  } else {
    fields.classList.add('hidden');
  }
}

// ── Pax counter ───────────────────────────────────────────
function changePax(delta) {
  const max = guest ? guest.max_pax : 2;
  paxCount = Math.min(max, Math.max(1, paxCount + delta));
  document.getElementById('pax-display').textContent = paxCount;
  renderAttendeeFields();
}

function renderAttendeeFields() {
  const container = document.getElementById('attendee-names');
  const existing  = container.querySelectorAll('input');
  const prevValues = Array.from(existing).map(i => i.value);

  container.innerHTML = '';
  for (let i = 0; i < paxCount; i++) {
    const row = document.createElement('div');
    row.className = 'attendee-row';
    row.innerHTML = `
      <span class="attendee-num">${i + 1}.</span>
      <input type="text" placeholder="Full name" value="${prevValues[i] || ''}" />
    `;
    container.appendChild(row);
  }
}

// ── Form submit ───────────────────────────────────────────
document.getElementById('rsvp-form').addEventListener('submit', async (e) => {
  e.preventDefault();

  if (!attendance) {
    document.getElementById('err-attendance').classList.remove('hidden');
    return;
  }

  const btn = document.getElementById('submit-btn');
  btn.disabled = true;
  btn.textContent = 'Sending…';
  document.getElementById('err-submit').classList.add('hidden');

  try {
    const now = new Date().toISOString();

    if (attendance === 'no') {
      await db.from('guests').update({
        rsvp_status:  'declined',
        pax_count:    0,
        responded_at: now,
      }).eq('id', guest.id);

      showSuccess(
        'We\'ll miss you!',
        'Thank you for letting us know. We hope to celebrate with you another time.'
      );
      return;
    }

    // Collect attendee names
    const inputs = document.querySelectorAll('#attendee-names input');
    const names  = Array.from(inputs).map(i => i.value.trim()).filter(Boolean);
    const dietary = document.getElementById('dietary').value.trim();

    if (names.length < paxCount) {
      document.getElementById('err-submit').textContent = 'Please enter all attendee names.';
      document.getElementById('err-submit').classList.remove('hidden');
      btn.disabled = false;
      btn.textContent = 'Send RSVP';
      return;
    }

    // Update guest row
    await db.from('guests').update({
      rsvp_status:   'confirmed',
      pax_count:     paxCount,
      dietary_notes: dietary || null,
      responded_at:  now,
    }).eq('id', guest.id);

    // Insert attendee rows
    const attendeeRows = names.map(name => ({
      guest_id: guest.id,
      name,
      dietary: dietary || null,
    }));
    await db.from('attendees').insert(attendeeRows);

    showSuccess(
      'See you there! 🎊',
      `Thank you, ${guest.name}! We've noted ${paxCount} guest${paxCount > 1 ? 's' : ''} from your party. Can't wait to celebrate with you!`
    );

  } catch (err) {
    document.getElementById('err-submit').textContent = 'Something went wrong. Please try again.';
    document.getElementById('err-submit').classList.remove('hidden');
    btn.disabled = false;
    btn.textContent = 'Send RSVP';
  }
});

// ── Helpers ───────────────────────────────────────────────
function showState(state) {
  ['loading','phone','done','closed','form','success'].forEach(s => {
    document.getElementById(`state-${s}`).classList.add('hidden');
  });
  document.getElementById(`state-${state}`).classList.remove('hidden');
}

function showSuccess(title, msg) {
  document.getElementById('success-title').textContent = title;
  document.getElementById('success-msg').textContent   = msg;
  showState('success');
}

// ── Boot ──────────────────────────────────────────────────
if (new Date() > deadline) {
  showState('closed');
} else {
  showState('phone');
}
