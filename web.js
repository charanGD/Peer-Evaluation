//git // Password toggle
const togglePassword = document.getElementById("togglePassword");
const passwordInput = document.getElementById("password");

togglePassword.addEventListener("click", () => {
  if (passwordInput.type === "password") {
    passwordInput.type = "text";
    togglePassword.textContent = "⊘";
  } else {
    passwordInput.type = "password";
    togglePassword.textContent = "👁";
  }
});

// Role-based text change
const userType = document.getElementById("userType");
const userId = document.getElementById("userId");
const infoText = document.getElementById("infoText");

userType.addEventListener("change", () => {
  if (userType.value === "student") {
    userId.placeholder = "Enter Register Number";
    infoText.textContent =
      "Enter Register Number and Password to access student panel.";
  } else if (userType.value === "staff") {
    userId.placeholder = "Enter Staff ID";
    infoText.textContent =
      "Enter Staff ID and Password to access staff panel.";
  } else {
    userId.placeholder = "Enter Admin ID";
    infoText.textContent =
      "Enter Admin ID and Password to access admin panel.";
  }

  userId.value = "";
});

// Submit (temporary)
document.getElementById("login-form").addEventListener("submit", (e) => {
  e.preventDefault();
  alert("Backend not connected");
});
