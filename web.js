const togglePassword = document.getElementById("togglePassword");
const passwordInput = document.getElementById("password");
const userType = document.getElementById("userType");
const userId = document.getElementById("userId");
const infoText = document.getElementById("infoText");


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

// Login Submit
document.getElementById("login-form").addEventListener("submit", async (e) => {
  e.preventDefault();

  try {
    const response = await fetch("http://localhost:5000/api/users/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        userId: userId.value,
        password: passwordInput.value,
        role: userType.value
      })
    });

    const data = await response.json();

    if (!response.ok) {
      alert(data.message);
      return;
    }

    localStorage.setItem("token", data.token);
    localStorage.setItem("role", data.role);

    alert("Login successful 🔥");

    if (data.role === "admin") {
      window.location.href = "admin.html";
    } else if (data.role === "staff") {
      window.location.href = "staff.html";
    } else {
      window.location.href = "home.html";
    }

  } catch (error) {
    console.error(error);
    alert("Server error");
  }
});