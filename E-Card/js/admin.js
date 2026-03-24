// ── Init ──────────────────────────────────────────────────
const { createClient } = supabase;
const db = createClient(SUPABASE_URL, SUPABASE_ANON);

let allGuests = [];

// ── Set title ─────────────────────────────────────────────
document.getElementById('admin-wedding-title').textContent =
  `${WEDDING.brideFullName} & ${WEDDING.groomFullName} · ${WEDDING.date}`;

// ── Login ─────────────────────────────────────────────────
document.getElementById('pw-input').addEventListener('keydown', e => {
  if (e.key === 'Enter') checkPassword();
});

function checkPassword() {
  const val = document.getElementById('pw-input').value;
  if (val === WEDDING.adminPassword) {
    document.getElementById('login-screen').classList.add('hidden');
    document.getElementById('dashboard').classList.remove('hidden');
    loadAll();
  } else {
    document.getElementById('pw-error').classList.remove('hidden');
  }
}

// ── Load all guests ───────────────────────────────────────
async function loadAll() {
  const { data, error } = await db
    .from('guests')
    .select('*')
    .order('created_at', { ascending: true });

  if (error) { alert('Failed to load guests: ' + error.message); return; }
  allGuests = data || [];
  updateSummary();
  applyFilters();
}

// ── Summary counters ──────────────────────────────────────
function updateSummary() {
  const confirmed = allGuests.filter(g => g.rsvp_status === 'confirmed');
  const pending   = allGuests.filter(g => g.rsvp_status === 'pending');
  const declined  = allGuests.filter(g => g.rsvp_status === 'declined');
  const totalPax  = confirmed.reduce((s, g) => s + (g.pax_count || 0), 0);

  document.getElementById('s-total').textContent     = allGuests.length;
  document.getElementById('s-confirmed').textContent = confirmed.length;
  document.getElementById('s-pending').textContent   = pending.length;
  document.getElementById('s-declined').textContent  = declined.length;
  document.getElementById('s-pax').textContent       = totalPax;

  // Side breakdown
  const brideGuests = allGuests.filter(g => g.side === 'bride');
  const groomGuests = allGuests.filter(g => g.side === 'groom');

  document.getElementById('b-confirmed').textContent = brideGuests.filter(g => g.rsvp_status === 'confirmed').length;
  document.getElementById('b-pending').textContent   = brideGuests.filter(g => g.rsvp_status === 'pending').length;
  document.getElementById('b-pax').textContent       = brideGuests.filter(g => g.rsvp_status === 'confirmed').reduce((s,g) => s + (g.pax_count||0), 0);

  document.getElementById('g-confirmed').textContent = groomGuests.filter(g => g.rsvp_status === 'confirmed').length;
  document.getElementById('g-pending').textContent   = groomGuests.filter(g => g.rsvp_status === 'pending').length;
  document.getElementById('g-pax').textContent       = groomGuests.filter(g => g.rsvp_status === 'confirmed').reduce((s,g) => s + (g.pax_count||0), 0);
}

// ── Filters ───────────────────────────────────────────────
function applyFilters() {
  const side   = document.getElementById('filter-side').value;
  const status = document.getElementById('filter-status').value;
  const search = document.getElementById('filter-search').value.toLowerCase().trim();

  let filtered = allGuests;
  if (side)   filtered = filtered.filter(g => g.side === side);
  if (status) filtered = filtered.filter(g => g.rsvp_status === status);
  if (search) filtered = filtered.filter(g => g.name.toLowerCase().includes(search));

  renderTable(filtered);
}

// ── Render table ──────────────────────────────────────────
function renderTable(guests) {
  const tbody = document.getElementById('guest-tbody');
  const noResults = document.getElementById('no-results');

  if (guests.length === 0) {
    tbody.innerHTML = '';
    noResults.classList.remove('hidden');
    return;
  }
  noResults.classList.add('hidden');

  // Build the base URL for invite links
  const baseUrl = window.location.href.replace('admin.html', 'index.html');

  tbody.innerHTML = guests.map(g => {
    const inviteUrl = `${baseUrl}?token=${g.token}`;
    return `
    <tr data-id="${g.id}">
      <td><strong>${escHtml(g.name)}</strong></td>
      <td><span class="chip chip-${g.side}">${g.side}</span></td>
      <td style="text-align:center;">${g.max_pax}</td>
      <td><span class="badge badge-${g.rsvp_status}">${g.rsvp_status}</span></td>
      <td style="text-align:center;">${g.pax_count ?? '—'}</td>
      <td>
        <input
          class="table-input"
          type="number"
          min="1"
          value="${g.table_number ?? ''}"
          placeholder="—"
          onchange="saveTableNumber('${g.id}', this.value)"
        />
      </td>
      <td style="max-width:160px; font-size:.8rem; color:var(--muted);">
        ${g.dietary_notes ? escHtml(g.dietary_notes) : '—'}
      </td>
      <td>
        <button class="copy-link-btn" onclick="copyLink('${inviteUrl}')">Copy link</button>
      </td>
      <td style="white-space:nowrap;">
        <button class="act-btn danger" onclick="deleteGuest('${g.id}', '${escHtml(g.name)}')">Delete</button>
      </td>
    </tr>`;
  }).join('');
}

// ── Save table number ─────────────────────────────────────
async function saveTableNumber(id, val) {
  const num = val === '' ? null : parseInt(val, 10);
  const { error } = await db.from('guests').update({ table_number: num }).eq('id', id);
  if (error) alert('Failed to save table number.');
  else {
    const guest = allGuests.find(g => g.id === id);
    if (guest) guest.table_number = num;
  }
}

// ── Copy invite link ──────────────────────────────────────
function copyLink(url) {
  navigator.clipboard.writeText(url).then(() => {
    alert('Invite link copied!\n\n' + url);
  }).catch(() => {
    prompt('Copy this link:', url);
  });
}

// ── Add guest modal ───────────────────────────────────────
function openAddGuest() {
  document.getElementById('new-name').value = '';
  document.getElementById('new-side').value = 'bride';
  document.getElementById('new-pax').value  = '2';
  document.getElementById('modal-error').classList.add('hidden');
  document.getElementById('modal-overlay').classList.remove('hidden');
}

function closeModal(event) {
  if (!event || event.target === document.getElementById('modal-overlay')) {
    document.getElementById('modal-overlay').classList.add('hidden');
  }
}

async function addGuest() {
  const name = document.getElementById('new-name').value.trim();
  const side = document.getElementById('new-side').value;
  const pax  = parseInt(document.getElementById('new-pax').value, 10);

  if (!name) {
    document.getElementById('modal-error').textContent = 'Please enter a name.';
    document.getElementById('modal-error').classList.remove('hidden');
    return;
  }

  const { data, error } = await db.from('guests').insert([{ name, side, max_pax: pax }]).select().single();
  if (error) {
    document.getElementById('modal-error').textContent = 'Failed to add guest: ' + error.message;
    document.getElementById('modal-error').classList.remove('hidden');
    return;
  }

  allGuests.push(data);
  closeModal();
  updateSummary();
  applyFilters();
}

// ── Delete guest ──────────────────────────────────────────
async function deleteGuest(id, name) {
  if (!confirm(`Delete "${name}"? This will also remove their RSVP data.`)) return;
  const { error } = await db.from('guests').delete().eq('id', id);
  if (error) { alert('Failed to delete.'); return; }
  allGuests = allGuests.filter(g => g.id !== id);
  updateSummary();
  applyFilters();
}

// ── Export CSV ────────────────────────────────────────────
async function exportCSV() {
  // Fetch attendees too
  const { data: attendees } = await db.from('attendees').select('*');
  const attendeeMap = {};
  (attendees || []).forEach(a => {
    if (!attendeeMap[a.guest_id]) attendeeMap[a.guest_id] = [];
    attendeeMap[a.guest_id].push(a.name);
  });

  const rows = [
    ['Family Name', 'Side', 'Status', 'Pax Confirmed', 'Table', 'Attendee Names', 'Dietary Notes', 'Responded At']
  ];

  allGuests.forEach(g => {
    rows.push([
      g.name,
      g.side,
      g.rsvp_status,
      g.pax_count ?? '',
      g.table_number ?? '',
      (attendeeMap[g.id] || []).join(' | '),
      g.dietary_notes ?? '',
      g.responded_at ? new Date(g.responded_at).toLocaleString('en-MY') : '',
    ]);
  });

  const csv = rows.map(r => r.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = `wedding-rsvp-${new Date().toISOString().slice(0,10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

// ── Upload guest list ─────────────────────────────────────
let parsedRows = [];   // validated rows ready to import

function openUpload() {
  resetUpload();
  document.getElementById('upload-overlay').classList.remove('hidden');

  // Drag & drop
  const zone = document.getElementById('drop-zone');
  zone.addEventListener('dragover',  e => { e.preventDefault(); zone.classList.add('dragover'); });
  zone.addEventListener('dragleave', () => zone.classList.remove('dragover'));
  zone.addEventListener('drop', e => {
    e.preventDefault();
    zone.classList.remove('dragover');
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  });
}

function closeUpload(event) {
  if (!event || event.target === document.getElementById('upload-overlay')) {
    document.getElementById('upload-overlay').classList.add('hidden');
  }
}

function resetUpload() {
  parsedRows = [];
  document.getElementById('file-input').value        = '';
  document.getElementById('upload-preview').classList.add('hidden');
  document.getElementById('upload-error').classList.add('hidden');
  document.getElementById('import-btn').disabled     = true;
  document.getElementById('preview-warn').classList.add('hidden');
}

function handleFileSelect(event) {
  const file = event.target.files[0];
  if (file) processFile(file);
}

function processFile(file) {
  document.getElementById('upload-error').classList.add('hidden');
  const reader = new FileReader();
  reader.onload = e => {
    try {
      const workbook = XLSX.read(e.target.result, { type: 'array' });
      const sheet    = workbook.Sheets[workbook.SheetNames[0]];
      const raw      = XLSX.utils.sheet_to_json(sheet, { defval: '' });
      validateAndPreview(raw);
    } catch (err) {
      showUploadError('Could not read file. Make sure it is a valid .csv or .xlsx.');
    }
  };
  reader.readAsArrayBuffer(file);
}

function validateAndPreview(raw) {
  if (!raw.length) { showUploadError('The file is empty.'); return; }

  // Normalise header names (case-insensitive, trim whitespace)
  const normalise = obj => {
    const out = {};
    Object.keys(obj).forEach(k => { out[k.toLowerCase().trim()] = String(obj[k]).trim(); });
    return out;
  };

  const rows = raw.map(normalise);

  // Check required columns exist
  const first = rows[0];
  if (!('name' in first) || !('side' in first) || !('max_pax' in first)) {
    showUploadError('Missing columns. Required: name, side, max_pax. Download the template to see the correct format.');
    return;
  }

  parsedRows = [];
  let warnCount = 0;
  const tbody = document.getElementById('preview-tbody');
  tbody.innerHTML = '';

  rows.forEach((r, i) => {
    const name    = r['name'];
    const side    = r['side'].toLowerCase();
    const paxRaw  = r['max_pax'];
    const pax     = parseInt(paxRaw, 10);

    const validSide = ['bride', 'groom'].includes(side);
    const validPax  = pax === 2 || pax === 4;
    const validName = name.length > 0;
    const valid     = validName && validSide && validPax;

    if (!valid) warnCount++;
    if (valid) parsedRows.push({ name, side, max_pax: pax });

    const issues = [];
    if (!validName) issues.push('empty name');
    if (!validSide) issues.push(`side must be "bride" or "groom"`);
    if (!validPax)  issues.push(`max_pax must be 2 or 4`);

    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td style="color:var(--muted)">${i + 1}</td>
      <td>${escHtml(name) || '<em style="color:var(--muted)">empty</em>'}</td>
      <td>${escHtml(r['side'])}</td>
      <td>${escHtml(paxRaw)}</td>
      <td style="font-size:.8rem;">
        ${valid
          ? '<span style="color:#1a7340;">✓ OK</span>'
          : `<span style="color:#c0392b;">✗ ${issues.join(', ')}</span>`}
      </td>`;
    tbody.appendChild(tr);
  });

  document.getElementById('preview-count').textContent = rows.length;
  document.getElementById('upload-preview').classList.remove('hidden');

  if (warnCount > 0) {
    document.getElementById('preview-warn').classList.remove('hidden');
    document.getElementById('preview-warn-msg').textContent =
      `${warnCount} row${warnCount > 1 ? 's' : ''} will be skipped (invalid data)`;
  } else {
    document.getElementById('preview-warn').classList.add('hidden');
  }

  document.getElementById('import-btn').disabled = parsedRows.length === 0;
  if (parsedRows.length === 0) showUploadError('No valid rows to import. Fix the file and try again.');
}

async function importGuests() {
  if (!parsedRows.length) return;

  const btn = document.getElementById('import-btn');
  btn.disabled    = true;
  btn.textContent = `Importing ${parsedRows.length} guests…`;

  const { data, error } = await db.from('guests').insert(parsedRows).select();
  if (error) {
    showUploadError('Import failed: ' + error.message);
    btn.disabled    = false;
    btn.textContent = 'Import Guests';
    return;
  }

  allGuests.push(...data);
  closeUpload();
  updateSummary();
  applyFilters();
  alert(`✅ Successfully imported ${data.length} guests!`);
}

function downloadTemplate() {
  const rows = [
    ['name', 'side', 'max_pax'],
    ['Ahmad & Family', 'groom', 4],
    ['Priya Devi', 'bride', 2],
    ['Tan Wei Ming', 'bride', 4],
  ];
  const ws = XLSX.utils.aoa_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Guests');
  XLSX.writeFile(wb, 'wedding-guest-template.xlsx');
}

function showUploadError(msg) {
  const el = document.getElementById('upload-error');
  el.textContent = msg;
  el.classList.remove('hidden');
}

// ── Util ──────────────────────────────────────────────────
function escHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
