function showPage(pageId) {
  document.querySelectorAll("main").forEach(page => page.classList.add("hidden"));
  document.getElementById(pageId).classList.remove("hidden");
}

function goToHome() { showPage("home-page"); }
function goToProfile() { showPage("profile-page"); }
function goToTrend() { showPage("trend-page"); loadReels(); }

document.getElementById("login-form")?.addEventListener("submit", function (e) {
  e.preventDefault();
  const email = this.querySelector('input[type="email"]').value;
  const password = this.querySelector('input[type="password"]').value;

  fetch("/api/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password })
  })
  .then(res => res.json())
  .then(data => {
    if (data.success) showPage("home-page");
    else alert(data.message);
  });
});

document.getElementById("register-form")?.addEventListener("submit", function (e) {
  e.preventDefault();
  const email = this.querySelector('input[type="email"]').value;
  const password = this.querySelector('input[type="password"]').value;

  fetch("/api/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password })
  })
  .then(res => res.json())
  .then(data => {
    alert(data.message);
    if (data.success) showPage("login-page");
  });
});

document.getElementById('upload-form')?.addEventListener('submit', function (e) {
  e.preventDefault();
  const formData = new FormData(this);
  fetch('/api/upload', {
    method: 'POST',
    body: formData
  })
  .then(res => res.json())
  .then(data => {
    alert(data.message);
    loadReels();
  })
  .catch(() => alert('Upload failed'));
});

function loadReels() {
  fetch('/api/reels')
    .then(res => res.json())
    .then(reels => {
      const container = document.getElementById('reels-container');
      container.innerHTML = "";
      reels.forEach(reel => {
        container.innerHTML += \`
        <div class="reel">
          <video controls width="100%">
            <source src="/uploads/reels/\${reel.filename}" type="video/mp4">
          </video>
          <p>\${reel.title}</p>
        </div>\`;
      });
    });
}
