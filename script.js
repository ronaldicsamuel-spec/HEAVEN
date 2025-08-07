
function goToProfile() {
  document.getElementById('home-page').classList.add('hidden');
  document.getElementById('profile-page').classList.remove('hidden');
}
function goToHome() {
  document.getElementById('profile-page').classList.add('hidden');
  document.getElementById('home-page').classList.remove('hidden');
}

// Mock login handler
document.addEventListener("DOMContentLoaded", () => {
  const form = document.querySelector("form");
  form.addEventListener("submit", function(e) {
    e.preventDefault();
    const email = document.querySelector('input[type="email"]').value;
    const password = document.querySelector('input[type="password"]').value;

    if (email && password) {
      document.getElementById("login-page").classList.add("hidden");
      document.getElementById("home-page").classList.remove("hidden");
    } else {
      alert("Please enter a valid email and password.");
    }
  });
});

function goToTrend() {
  document.getElementById('login-page')?.classList.add('hidden');
  document.getElementById('home-page').classList.add('hidden');
  document.getElementById('profile-page').classList.add('hidden');
  document.getElementById('trend-page').classList.remove('hidden');
}
