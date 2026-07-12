const body = document.body;
const intro = document.getElementById('intro');
const envelope = document.getElementById('envelope');
const openInvite = document.getElementById('openInvite');
const skipIntro = document.getElementById('skipIntro');

function finishIntro() {
  intro.classList.add('is-open');
  body.classList.remove('locked');
  setTimeout(() => intro.remove(), 1000);
}

openInvite.addEventListener('click', () => {
  envelope.classList.add('open');
  setTimeout(finishIntro, 1450);
});
skipIntro.addEventListener('click', finishIntro);

const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) entry.target.classList.add('visible');
  });
}, { threshold: 0.15 });
document.querySelectorAll('.reveal').forEach(el => observer.observe(el));

const menuButton = document.querySelector('.menu-toggle');
const nav = document.getElementById('siteNav');
menuButton.addEventListener('click', () => {
  const open = nav.classList.toggle('open');
  menuButton.setAttribute('aria-expanded', open);
});
nav.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
  nav.classList.remove('open');
  menuButton.setAttribute('aria-expanded', 'false');
}));

const dialog = document.getElementById('rsvpDialog');
document.getElementById('demoRsvp').addEventListener('click', () => dialog.showModal());
document.getElementById('rsvpSeal').addEventListener('click', () => dialog.showModal());
document.getElementById('closeDialog').addEventListener('click', () => dialog.close());
dialog.addEventListener('click', (event) => {
  const rect = dialog.getBoundingClientRect();
  const outside = event.clientX < rect.left || event.clientX > rect.right ||
                  event.clientY < rect.top || event.clientY > rect.bottom;
  if (outside) dialog.close();
});


const weddingDate = new Date("2026-10-24T14:00:00-05:00");

function updateCountdown() {
  const now = new Date();
  const remaining = weddingDate.getTime() - now.getTime();

  if (remaining <= 0) {
    document.getElementById("countDays").textContent = "000";
    document.getElementById("countHours").textContent = "00";
    document.getElementById("countMinutes").textContent = "00";
    document.getElementById("countSeconds").textContent = "00";
    return;
  }

  const days = Math.floor(remaining / 86400000);
  const hours = Math.floor((remaining % 86400000) / 3600000);
  const minutes = Math.floor((remaining % 3600000) / 60000);
  const seconds = Math.floor((remaining % 60000) / 1000);

  document.getElementById("countDays").textContent = String(days).padStart(3, "0");
  document.getElementById("countHours").textContent = String(hours).padStart(2, "0");
  document.getElementById("countMinutes").textContent = String(minutes).padStart(2, "0");
  document.getElementById("countSeconds").textContent = String(seconds).padStart(2, "0");
}

updateCountdown();
setInterval(updateCountdown, 1000);


const galleryDialog = document.getElementById("galleryDialog");
const galleryItems = Array.from(document.querySelectorAll(".gallery-item"));
const galleryCounter = document.getElementById("galleryCounter");
const galleryImage = document.getElementById("galleryLightboxImage");
let activeGalleryIndex = 0;

function showGalleryItem(index) {
  activeGalleryIndex = (index + galleryItems.length) % galleryItems.length;
  galleryCounter.textContent = `${activeGalleryIndex + 1} / ${galleryItems.length}`;
  galleryImage.innerHTML = `<span>Engagement photo ${activeGalleryIndex + 1}</span>`;
}

galleryItems.forEach((item, index) => {
  item.addEventListener("click", () => {
    showGalleryItem(index);
    galleryDialog.showModal();
  });
});

document.getElementById("galleryPrev").addEventListener("click", () => showGalleryItem(activeGalleryIndex - 1));
document.getElementById("galleryNext").addEventListener("click", () => showGalleryItem(activeGalleryIndex + 1));
document.getElementById("closeGallery").addEventListener("click", () => galleryDialog.close());

galleryDialog.addEventListener("click", (event) => {
  const rect = galleryDialog.getBoundingClientRect();
  const outside = event.clientX < rect.left || event.clientX > rect.right ||
                  event.clientY < rect.top || event.clientY > rect.bottom;
  if (outside) galleryDialog.close();
});
