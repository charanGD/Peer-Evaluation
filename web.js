// --- PASSWORD TOGGLE FUNCTIONALITY ---
const togglePasswordBtn = document.getElementById("togglePassword");
const passwordInput = document.getElementById("password");

togglePasswordBtn.addEventListener("click", () => {
  const isHidden = passwordInput.type === "password";

  // Toggle between password and text
  passwordInput.type = isHidden ? "text" : "password";

  // Optional: Change icon
  togglePasswordBtn.textContent = isHidden ? "⊘" : "👁";
});



// --- FORM SUBMISSION (Front-end only for now) ---
const form = document.getElementById("login-form");

form.addEventListener("submit", (e) => {
  e.preventDefault(); // prevent page reload for now

  const userType = document.getElementById("userType").value.trim();
  const regNo = document.getElementById("regNo").value.trim();
  const password = document.getElementById("password").value.trim();

  // Basic required validation
  if (!userType || !regNo || !password) {
    alert("Please fill in all fields!");
    return;
  }

  // For now just show a success alert
  // Later you can connect to backend using fetch()
  alert("Form submitted (front-end only). Backend not connected yet.");
});
