const body = document.body;
const intro = document.getElementById('intro');
const envelope = document.getElementById('envelope');
const openInvite = document.getElementById('openInvite');
const skipIntro = document.getElementById('skipIntro');

function finishIntro() {
  intro.classList.add('is-open');
  body.classList.remove('locked');
  setTimeout(() => intro.remove(), 850);
}

openInvite.addEventListener('click', () => {
  envelope.classList.add('open');
  setTimeout(finishIntro, 1250);
});
skipIntro.addEventListener('click', finishIntro);

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

const dialog = document.getElementById('rsvpDialog');
document.getElementById('demoRsvp').addEventListener('click', () => dialog.showModal());
document.getElementById('closeDialog').addEventListener('click', () => dialog.close());

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
