document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");
  let deleteListenerAdded = false;

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();

      // Clear loading message
      activitiesList.innerHTML = "";

      // Helper to escape HTML in participant names/emails
      function escapeHTML(str) {
        return String(str)
          .replace(/&/g, "&amp;")
          .replace(/</g, "&lt;")
          .replace(/>/g, "&gt;")
          .replace(/"/g, "&quot;")
          .replace(/'/g, "&#039;");
      }

      // Populate activities list
      // Reset activity select options
      activitySelect.innerHTML = '<option value="">-- Select an activity --</option>';

      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft = details.max_participants - details.participants.length;

        // Build participants HTML (with delete buttons)
        let participantsHTML = "";
        if (details.participants && details.participants.length > 0) {
          const items = details.participants
            .map((p) => `
              <li class="participant-item">
                <span class="participant-email">${escapeHTML(p)}</span>
                <button class="delete-participant" data-activity="${escapeHTML(name)}" data-email="${escapeHTML(p)}" aria-label="Remove ${escapeHTML(p)}">✕</button>
              </li>`)
            .join("");
          participantsHTML = `
            <div class="participants" aria-live="polite">
              <h5>Participants</h5>
              <ul>${items}</ul>
            </div>
          `;
        } else {
          participantsHTML = `
            <div class="participants" aria-live="polite">
              <h5>Participants</h5>
              <p class="muted">No participants yet</p>
            </div>
          `;
        }

        activityCard.innerHTML = `
          <h4>${escapeHTML(name)}</h4>
          <p>${escapeHTML(details.description)}</p>
          <p><strong>Schedule:</strong> ${escapeHTML(details.schedule)}</p>
          <p><strong>Availability:</strong> ${spotsLeft} spots left</p>
          ${participantsHTML}
        `;

        activitiesList.appendChild(activityCard);

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });

      // Delegate click for delete buttons (add listener once)
      if (!deleteListenerAdded) {
        activitiesList.addEventListener("click", async (ev) => {
        const btn = ev.target.closest && ev.target.closest(".delete-participant");
        if (!btn) return;

        const email = btn.dataset.email;
        const activity = btn.dataset.activity;

        if (!confirm(`Unregister ${email} from ${activity}?`)) return;

        try {
          const res = await fetch(`/activities/${encodeURIComponent(activity)}/participant?email=${encodeURIComponent(email)}`, {
            method: "DELETE",
          });

          const result = await res.json();
          if (res.ok) {
            messageDiv.textContent = result.message || "Participant removed";
            messageDiv.className = "success";
            messageDiv.classList.remove("hidden");
            // Refresh list to show updated participants and availability
            fetchActivities();
          } else {
            messageDiv.textContent = result.detail || "Failed to remove participant";
            messageDiv.className = "error";
            messageDiv.classList.remove("hidden");
          }

          setTimeout(() => messageDiv.classList.add("hidden"), 4000);
        } catch (error) {
          messageDiv.textContent = "Failed to remove participant.";
          messageDiv.className = "error";
          messageDiv.classList.remove("hidden");
          console.error("Error removing participant:", error);
        }
        });
        deleteListenerAdded = true;
      }
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";
        signupForm.reset();
        // Refresh activities to show the new participant immediately
        fetchActivities();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to sign up. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error signing up:", error);
    }
  });

  // Initialize app
  fetchActivities();
});
