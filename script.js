const body = document.body;
const intro = document.getElementById('intro');
const envelope = document.getElementById('envelope');
const openInvite = document.getElementById('openInvite');

function finishIntro() {
  intro.classList.add('is-open');
  body.classList.remove('locked');
  setTimeout(() => intro.remove(), 850);
}

openInvite.addEventListener('click', () => {
  envelope.classList.add('open');
  setTimeout(finishIntro, 1250);
});

const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) entry.target.classList.add('visible');
  });
}, { threshold: 0.12 });
document.querySelectorAll('.reveal').forEach(el => observer.observe(el));

const menuButton = document.querySelector('.menu-toggle');
const nav = document.getElementById('siteNav');
menuButton.addEventListener('click', () => {
  const open = nav.classList.toggle('open');
  menuButton.setAttribute('aria-expanded', String(open));
});
nav.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
  nav.classList.remove('open');
  menuButton.setAttribute('aria-expanded', 'false');
}));

// ===== RSVP =====
const dialog = document.getElementById('rsvpDialog');
const rsvpApp = document.getElementById('rsvpApp');
const RSVP_DEADLINE = new Date('2026-09-18T23:59:59-05:00');
const RSVP_API_BASE = 'https://hrwedding-rsvp.hrwedding2026-a3c.workers.dev';
const localDemo = location.protocol === 'file:' || location.hostname === 'localhost' || location.hostname === '127.0.0.1';
let rsvpState = null;

const esc = (value = '') => String(value).replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));

function searchScreen(message = '') {
  rsvpState = null;
  const closed = new Date() > RSVP_DEADLINE;
  rsvpApp.innerHTML = `
    <div class="rsvp-screen rsvp-search-screen">
      <p class="kicker">Kindly respond</p>
      <h2>Find Your Invitation</h2>
      ${closed ? `
        <p class="rsvp-intro">Online RSVPs closed on September 18, 2026. Please contact Huyen or Ryan directly if you need to make or change your response.</p>
      ` : `
        <p class="rsvp-intro">Please enter your name <strong>exactly as it appears on your invitation envelope</strong> to find your invitation.</p>
        <form id="rsvpSearchForm" class="rsvp-search-form">
          <label for="rsvpSearchName">Name on invitation envelope</label>
          <input id="rsvpSearchName" name="name" type="text" autocomplete="name" placeholder="First & Last Name" required />
          ${message ? `<p class="rsvp-message rsvp-error">${esc(message)}</p>` : ''}
          <button class="button" type="submit">Find My Invitation</button>
        </form>
      `}
    </div>`;
  if (!closed) document.getElementById('rsvpSearchForm').addEventListener('submit', handleSearch);
}

async function api(path, options = {}) {
  if (localDemo) return demoApi(path, options);
  const response = await fetch(`${RSVP_API_BASE}${path}`, {
    headers: {'Content-Type':'application/json', ...(options.headers || {})},
    ...options
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.message || 'We couldn’t find that name. Please double-check the name exactly as it appears on your invitation envelope.');
  return payload;
}

async function demoApi(path, options) {
  await new Promise(r => setTimeout(r, 250));
  if (path === '/lookup') {
    const name = JSON.parse(options.body || '{}').name || '';
    if (!['demo guest','demo'].includes(name.trim().toLowerCase())) {
      const err = new Error('We couldn’t find that name. Please double-check the name exactly as it appears on your invitation envelope.');
      throw err;
    }
    return {invitation:{token:'demo',displayName:'Demo Guest',reservedSeats:3,guest1Prefill:'Demo Guest',specialType:null},rsvp:null};
  }
  if (path === '/submit') return {ok:true};
  throw new Error('Demo endpoint unavailable.');
}

async function handleSearch(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const name = new FormData(form).get('name').trim();
  const button = form.querySelector('button');
  button.disabled = true;
  button.textContent = 'Searching…';
  try {
    const result = await api('/lookup', {method:'POST', body:JSON.stringify({name})});
    if (result.multiple) {
      searchScreen('We found more than one invitation under that exact name. Please contact Huyen or Ryan so we can help you find the correct one.');
      return;
    }
    openInvitation(result.invitation, result.rsvp);
  } catch (error) {
    searchScreen(error.message);
    const input = document.getElementById('rsvpSearchName');
    if (input) { input.value = name; input.focus(); }
  }
}

function openInvitation(invitation, existing) {
  const seats = invitation.reservedSeats;
  if (invitation.specialType === 'vendor_no_seat') {
    rsvpState = {
      invitation,
      guests:[{seatNumber:0, attending: existing?.guests?.[0]?.attending ?? null, fullName: invitation.guest1Prefill || invitation.displayName, dietary:''}],
      note: existing?.note || ''
    };
    renderSpecialInvitation(Boolean(existing));
    return;
  }

  const prior = existing?.guests || [];
  const guests = Array.from({length: seats}, (_, i) => {
    const saved = prior.find(g => g.seatNumber === i + 1);
    return {
      seatNumber:i + 1,
      attending: saved ? Boolean(saved.attending) : null,
      fullName: saved?.fullName || (i === 0 ? (invitation.guest1Prefill || '') : ''),
      dietary: saved?.dietary || ''
    };
  });
  rsvpState = { invitation, guests, note: existing?.note || '' };
  renderGuestResponses(Boolean(existing));
}

function seatWord(n) { return n === 1 ? 'seat' : 'seats'; }

function renderGuestResponses(isEdit = false) {
  const {invitation, guests} = rsvpState;
  rsvpApp.innerHTML = `
    <div class="rsvp-screen">
      <button class="rsvp-text-button" id="backToSearch" type="button">← Search another name</button>
      <p class="kicker">Your invitation</p>
      <h2>${esc(invitation.displayName)}</h2>
      ${isEdit ? '<p class="rsvp-status">We found your previous RSVP. You may update it below through September 18.</p>' : ''}
      <div class="reserved-seats">
        <span>We have reserved</span>
        <strong>${invitation.reservedSeats}</strong>
        <span>${seatWord(invitation.reservedSeats)} in your honor.</span>
      </div>
      <p class="rsvp-intro">Please respond for each guest below.</p>
      <div class="guest-list">
        ${guests.map(guestCard).join('')}
      </div>
      <div class="rsvp-notes-wrap">
        <label for="householdNote">Anything else we should know? <span>Optional</span></label>
        <textarea id="householdNote" rows="3" placeholder="Accessibility needs, high chair, or another helpful note">${esc(rsvpState.note)}</textarea>
      </div>
      <p class="rsvp-message rsvp-error" id="rsvpValidation" hidden></p>
      <button class="button" id="reviewRsvp" type="button">Review Your RSVP</button>
    </div>`;

  document.getElementById('backToSearch').addEventListener('click', () => searchScreen());
  document.querySelectorAll('[data-attendance]').forEach(input => input.addEventListener('change', handleAttendance));
  document.querySelectorAll('[data-name]').forEach(input => input.addEventListener('input', syncInputs));
  document.querySelectorAll('[data-dietary]').forEach(input => input.addEventListener('input', syncInputs));
  document.getElementById('householdNote').addEventListener('input', e => rsvpState.note = e.target.value);
  document.getElementById('reviewRsvp').addEventListener('click', reviewRsvp);
}

function guestCard(guest) {
  const yes = guest.attending === true;
  const no = guest.attending === false;
  return `
    <section class="guest-card" data-seat="${guest.seatNumber}">
      <div class="guest-card-heading"><span>Guest ${guest.seatNumber}</span></div>
      <p>Will this guest be joining us?</p>
      <div class="attendance-options">
        <label><input type="radio" name="attendance-${guest.seatNumber}" value="yes" data-attendance="${guest.seatNumber}" ${yes?'checked':''}><span>Joyfully Accepts</span></label>
        <label><input type="radio" name="attendance-${guest.seatNumber}" value="no" data-attendance="${guest.seatNumber}" ${no?'checked':''}><span>Regretfully Declines</span></label>
      </div>
      <div class="guest-details ${yes?'is-visible':''}" id="guestDetails-${guest.seatNumber}">
        <label>Full Name
          <input type="text" data-name="${guest.seatNumber}" value="${esc(guest.fullName)}" placeholder="Guest's full name" ${yes?'required':''}>
        </label>
        <label>Dietary Restrictions or Allergies <span>Optional</span>
          <input type="text" data-dietary="${guest.seatNumber}" value="${esc(guest.dietary)}" placeholder="None">
        </label>
      </div>
    </section>`;
}

function handleAttendance(event) {
  const seat = Number(event.target.dataset.attendance);
  const guest = rsvpState.guests.find(g => g.seatNumber === seat);
  guest.attending = event.target.value === 'yes';
  const details = document.getElementById(`guestDetails-${seat}`);
  details.classList.toggle('is-visible', guest.attending);
  const nameInput = details.querySelector('[data-name]');
  nameInput.required = guest.attending;
  if (!guest.attending) {
    guest.fullName = '';
    guest.dietary = '';
    nameInput.value = '';
    details.querySelector('[data-dietary]').value = '';
  } else if (seat === 1 && !guest.fullName && rsvpState.invitation.guest1Prefill) {
    guest.fullName = rsvpState.invitation.guest1Prefill;
    nameInput.value = guest.fullName;
  }
}

function syncInputs(event) {
  const seat = Number(event.target.dataset.name || event.target.dataset.dietary);
  const guest = rsvpState.guests.find(g => g.seatNumber === seat);
  if (event.target.dataset.name) guest.fullName = event.target.value;
  if (event.target.dataset.dietary) guest.dietary = event.target.value;
}

function validateRsvp() {
  for (const guest of rsvpState.guests) {
    if (guest.attending === null) return `Please choose an attendance response for Guest ${guest.seatNumber}.`;
    if (guest.attending && !guest.fullName.trim()) return `Please enter the full name for Guest ${guest.seatNumber}.`;
  }
  return '';
}

function reviewRsvp() {
  const error = validateRsvp();
  const el = document.getElementById('rsvpValidation');
  if (error) { el.textContent = error; el.hidden = false; el.scrollIntoView({behavior:'smooth',block:'center'}); return; }
  renderReview();
}

function renderReview() {
  const attending = rsvpState.guests.filter(g => g.attending).length;
  const total = rsvpState.guests.length;
  rsvpApp.innerHTML = `
    <div class="rsvp-screen rsvp-review">
      <p class="kicker">Almost there</p>
      <h2>Review Your RSVP</h2>
      <p class="rsvp-intro"><strong>${attending} of ${total}</strong> ${total === 1 ? 'guest' : 'guests'} attending</p>
      <div class="review-list">
        ${rsvpState.guests.map(g => `
          <div class="review-row">
            <span class="review-seat">Guest ${g.seatNumber}</span>
            <strong>${g.attending ? esc(g.fullName.trim()) : 'Regretfully Declined'}</strong>
            ${g.attending && g.dietary.trim() ? `<small>Dietary: ${esc(g.dietary.trim())}</small>` : ''}
          </div>`).join('')}
      </div>
      ${rsvpState.note.trim() ? `<div class="review-note"><span>Note</span><p>${esc(rsvpState.note.trim())}</p></div>` : ''}
      <div class="rsvp-actions">
        <button class="rsvp-text-button" id="editRsvp" type="button">← Edit RSVP</button>
        <button class="button" id="submitRsvp" type="button">Submit RSVP</button>
      </div>
      <p class="rsvp-message rsvp-error" id="submitError" hidden></p>
    </div>`;
  document.getElementById('editRsvp').addEventListener('click', () => renderGuestResponses(true));
  document.getElementById('submitRsvp').addEventListener('click', submitRsvp);
}

async function submitRsvp() {
  const button = document.getElementById('submitRsvp');
  button.disabled = true;
  button.textContent = 'Submitting…';
  try {
    await api('/submit', {method:'POST', body:JSON.stringify({
      token:rsvpState.invitation.token,
      note:rsvpState.note.trim(),
      guests:rsvpState.guests.map(g => ({seatNumber:g.seatNumber, attending:g.attending, fullName:g.attending?g.fullName.trim():'', dietary:g.attending?g.dietary.trim():''}))
    })});
    renderConfirmation(rsvpState.guests.some(g => g.attending));
  } catch (error) {
    const el = document.getElementById('submitError');
    el.textContent = error.message;
    el.hidden = false;
    button.disabled = false;
    button.textContent = 'Submit RSVP';
  }
}

function renderConfirmation(anyAttending) {
  rsvpApp.innerHTML = `
    <div class="rsvp-screen rsvp-confirmation">
      <div class="confirmation-mark">♡</div>
      <p class="kicker">RSVP received</p>
      <h2>${anyAttending ? 'We Can’t Wait to Celebrate With You!' : 'You’ll Be Missed!'}</h2>
      <p class="rsvp-intro">${anyAttending
        ? 'Your RSVP has been received. Thank you for responding — we look forward to celebrating together.'
        : 'Thank you for letting us know. While we’re sorry you won’t be able to join us, we’re grateful to celebrate this special season with you from afar.'}</p>
      <button class="button" id="doneRsvp" type="button">Done</button>
    </div>`;
  document.getElementById('doneRsvp').addEventListener('click', () => dialog.close());
}

function renderSpecialInvitation(isEdit = false) {
  const response = rsvpState.guests[0];
  rsvpApp.innerHTML = `
    <div class="rsvp-screen">
      <button class="rsvp-text-button" id="backToSearch" type="button">← Search another name</button>
      <p class="kicker">Your invitation</p>
      <h2>${esc(rsvpState.invitation.displayName)}</h2>
      ${isEdit ? '<p class="rsvp-status">We found your previous response. You may update it below through September 18.</p>' : ''}
      <p class="rsvp-intro">We’re so glad you’re part of our wedding day. Please let us know if you’ll be joining us.</p>
      <section class="guest-card special-card">
        <div class="attendance-options">
          <label><input type="radio" name="specialAttendance" value="yes" ${response.attending===true?'checked':''}><span>Joyfully Accepts</span></label>
          <label><input type="radio" name="specialAttendance" value="no" ${response.attending===false?'checked':''}><span>Regretfully Declines</span></label>
        </div>
      </section>
      <div class="rsvp-notes-wrap"><label for="householdNote">Anything else we should know? <span>Optional</span></label><textarea id="householdNote" rows="3">${esc(rsvpState.note)}</textarea></div>
      <p class="rsvp-message rsvp-error" id="rsvpValidation" hidden></p>
      <button class="button" id="specialSubmit" type="button">Submit RSVP</button>
    </div>`;
  document.getElementById('backToSearch').addEventListener('click', () => searchScreen());
  document.querySelectorAll('input[name="specialAttendance"]').forEach(el => el.addEventListener('change', e => response.attending = e.target.value === 'yes'));
  document.getElementById('householdNote').addEventListener('input', e => rsvpState.note = e.target.value);
  document.getElementById('specialSubmit').addEventListener('click', async () => {
    if (response.attending === null) { const e=document.getElementById('rsvpValidation'); e.textContent='Please choose an attendance response.'; e.hidden=false; return; }
    const btn=document.getElementById('specialSubmit'); btn.disabled=true; btn.textContent='Submitting…';
    try {
      await api('/submit', {method:'POST',body:JSON.stringify({token:rsvpState.invitation.token,note:rsvpState.note.trim(),guests:[{seatNumber:0,attending:response.attending,fullName:response.fullName,dietary:''}]})});
      renderConfirmation(response.attending);
    } catch(err) { const e=document.getElementById('rsvpValidation'); e.textContent=err.message; e.hidden=false; btn.disabled=false; btn.textContent='Submit RSVP'; }
  });
}

document.getElementById('openRsvp').addEventListener('click', () => { searchScreen(); dialog.showModal(); });
document.getElementById('closeDialog').addEventListener('click', () => dialog.close());
dialog.addEventListener('click', (event) => {
  if (event.target === dialog) dialog.close();
});


const weddingDate = new Date("2026-10-24T14:00:00-05:00");
function updateCountdown() {
  const remaining = weddingDate.getTime() - Date.now();
  const vals = remaining <= 0 ? [0,0,0,0] : [
    Math.floor(remaining / 86400000),
    Math.floor((remaining % 86400000) / 3600000),
    Math.floor((remaining % 3600000) / 60000),
    Math.floor((remaining % 60000) / 1000)
  ];
  document.getElementById("countDays").textContent = String(vals[0]).padStart(3,"0");
  document.getElementById("countHours").textContent = String(vals[1]).padStart(2,"0");
  document.getElementById("countMinutes").textContent = String(vals[2]).padStart(2,"0");
  document.getElementById("countSeconds").textContent = String(vals[3]).padStart(2,"0");
}
updateCountdown();
setInterval(updateCountdown,1000);
