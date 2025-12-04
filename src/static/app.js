document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");
  const activityCount = document.getElementById("activity-count");

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();

      // Update activity count
      activityCount.textContent = `(${Object.keys(activities).length})`;

      // Clear loading / previous content
      activitiesList.innerHTML = "";
      // reset select but keep placeholder
      activitySelect.innerHTML = '<option value="">-- Select an activity --</option>';

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const spotsLeft = Math.max(0, details.max_participants - details.participants.length);
        // Card element
        const card = document.createElement("div");
        card.className = "activity-card";

        // progress percentage
        const used = details.participants.length;
        const percent = Math.min(100, Math.round((used / details.max_participants) * 100));

        // inner HTML for card (description, schedule, meta, progress, participants)
        card.innerHTML = `
          <div class="meta-row">
            <div class="badge">${details.schedule}</div>
            <div class="badge" style="opacity:0.7">${details.participants.length} signed</div>
            ${spotsLeft === 0 ? '<div class="badge full">Full</div>' : `<div style="margin-left:auto; color:var(--muted); font-weight:600">${spotsLeft} left</div>`}
          </div>
          <h4>${name}</h4>
          <p>${details.description}</p>
          <div style="margin-top:10px">
            <div class="progress" aria-hidden="true"><span style="width:${percent}%"></span></div>
            <div style="font-size:0.85rem; color:var(--muted); margin-top:6px;">${used}/${details.max_participants} participants</div>
          </div>
          <details class="participants">
            <summary>View participants</summary>
            <div style="margin-top:8px;">
              ${details.participants.map(p => `<div style="font-size:0.85rem; color:#374151; padding:4px 0;">${p}</div>`).join("")}
            </div>
          </details>
        `;

        activitiesList.appendChild(card);

        // Add option to select dropdown, disabled if full
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name + (spotsLeft === 0 ? " — Full" : "");
        if (spotsLeft === 0) option.disabled = true;
        activitySelect.appendChild(option);
      });
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // helper to show messages (type: 'success' | 'error' | 'info')
  function showMessage(text, type = "info") {
    messageDiv.textContent = text;
    messageDiv.classList.remove("hidden", "success", "error", "info");
    messageDiv.classList.add(type);
    // hide after 5s
    setTimeout(() => messageDiv.classList.add("hidden"), 5000);
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value.trim();
    const activity = document.getElementById("activity").value;

    if (!email || !activity) {
      showMessage("Please provide an email and choose an activity.", "error");
      return;
    }

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        showMessage(result.message || "Signed up successfully!", "success");
        signupForm.reset();
        // refresh activities to show updated counts and disable options if full
        fetchActivities();
      } else {
        showMessage(result.detail || "An error occurred", "error");
      }
    } catch (error) {
      showMessage("Failed to sign up. Please try again.", "error");
      console.error("Error signing up:", error);
    }
  });

  // Initialize app
  fetchActivities();
});
