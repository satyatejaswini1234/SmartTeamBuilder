document.addEventListener("DOMContentLoaded", (event) => {
  const newProjectForm = document.getElementById("newProjectForm");
  const aiSuggestion = document.getElementById("aiSuggestion");
  const suggestionContent = document.getElementById("suggestionContent");
  const teamsListContent = document.getElementById("teamsListContent");
  const employeesListContent = document.getElementById("employeesListContent");
  const submitButton = document.getElementById("submitButton");
  const spinner = document.getElementById("spinner");
  const excelUploadForm = document.getElementById("excelUploadForm");
  const uploadStatus = document.getElementById("uploadStatus");
  const employeeSearch = document.getElementById("employeeSearch");
  const employeeSearchInput = document.getElementById("employeeSearchInput");
  const employeeSuggestions = document.getElementById("employeeSuggestions");
  // ... (keep existing JavaScript code)

  function showAlert(message, type = 'info') {
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type}`;
    alertDiv.textContent = message;

    // Insert the alert at the top of the container
    const container = document.querySelector('.container');
    container.insertBefore(alertDiv, container.firstChild);

    // Scroll to the top of the page
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // Trigger a reflow to enable the transition
    alertDiv.offsetHeight;

    // Make the alert visible
    alertDiv.style.opacity = '1';

    // Remove the alert after 5 seconds
    setTimeout(() => {
      alertDiv.style.opacity = '0';
      setTimeout(() => alertDiv.remove(), 300);
    }, 5000);
  }

// ... (keep other existing JavaScript code)
  async function fetchWorkData() {
    try {
      const response = await fetch("/employee_work_data");
      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Error fetching work data:", error);
      
    }
  }

  async function fetchEmployees(search = "", limit = 5) {
    try {
      const response = await fetch(
        `/employees?search=${search}&limit=${limit}`
      );
      const employees = await response.json();
      const workData = await fetchWorkData();

      employeesListContent.innerHTML = employees
        .map((emp) => {
          const employeeWorkData = workData.find(
            (data) => data.name === emp.name
          );
          return `
                    <li class="employee-card">
                        <div class="employee-info">
                            <h3>${emp.name} (ID: ${emp.employee_id})</h3>
                            <p>Role: ${emp.role}</p>
                            <p>Technical Skills: ${emp.technical_skills}</p>
                            <p>Years of Experience: ${emp.years_experience}</p>
                            <p>Personality Type: ${emp.personality_type}</p>
                            <p>Work Style: ${emp.work_style}</p>
                            <p>Communication Style: ${emp.communication_style}</p>
                            <p>Team Name: ${emp.team_name}</p>
                            <p>Previous Projects Assigned: ${emp.previous_worked_projects}</p>
                            <p>Previous Project Success Percentage: ${emp.previous_success_percentage}</p>
                            <button onclick="removeEmployee('${emp.employee_id}')">Remove Employee</button>
                        </div>
                        <div class="employee-chart">
                            <canvas id="chart-${emp.employee_id}"></canvas>
                        </div>
                    </li>
                `;
        })
        .join("");

      // Create charts for each employee
      employees.forEach((emp) => {
        const ctx = document
          .getElementById(`chart-${emp.employee_id}`)
          .getContext("2d");
        const employeeWorkData = workData.find(
          (data) => data.name === emp.name
        );
        new Chart(ctx, {
          type: "bar",
          data: {
            labels: ["Development", "Testing", "Documentation", "Meetings"],
            datasets: [
              {
                label: "Hours Spent",
                data: [
                  employeeWorkData.Development,
                  employeeWorkData.Testing,
                  employeeWorkData.Documentation,
                  employeeWorkData.Meetings,
                ],
                backgroundColor: [
                  "rgba(255, 99, 132, 0.2)",
                  "rgba(54, 162, 235, 0.2)",
                  "rgba(255, 206, 86, 0.2)",
                  "rgba(75, 192, 192, 0.2)",
                ],
                borderColor: [
                  "rgba(255, 99, 132, 1)",
                  "rgba(54, 162, 235, 1)",
                  "rgba(255, 206, 86, 1)",
                  "rgba(75, 192, 192, 1)",
                ],
                borderWidth: 1,
              },
            ],
          },
          options: {
            scales: {
              y: {
                beginAtZero: true,
              },
            },
            responsive: true,
            maintainAspectRatio: false,
          },
        });
      });
    } catch (error) {
      console.error("Error:", error);
    }
  }

  function convertMarkdownToPlainText(markdown) {
    // Remove bold/italic markers
    let text = markdown.replace(/(\*\*|__)(.*?)\1/g, "$2");
    text = text.replace(/(\*|_)(.*?)\1/g, "$2");

    // Remove links, keeping just the link text
    text = text.replace(/\[([^\]]+)\]\([^\)]+\)/g, "$1");

    // Convert headers to uppercase text
    text = text.replace(/#{1,6}\s+(.+)/g, (match, p1) => p1.toUpperCase());

    // Convert list items to plain text with a dash
    text = text.replace(/^[\*\-]\s+(.+)/gm, "- $1");

    // Remove code blocks, keeping the code
    text = text.replace(/```[\s\S]*?```/g, (match) =>
      match.replace(/```/g, "").trim()
    );

    // Remove inline code markers
    text = text.replace(/`([^`]+)`/g, "$1");

    // Convert blockquotes to plain text
    text = text.replace(/^\>\s+(.+)/gm, "$1");

    return text;
  }
  function structurePlainText(plainText) {
    const lines = plainText.split("\n");
    let formattedHtml = "";
    let inList = false;

    for (const line of lines) {
      const trimmedLine = line.trim();

      if (
        trimmedLine === "Team Suggestion:" ||
        trimmedLine === "Reasoning:" ||
        trimmedLine === "Team Dynamics:"
      ) {
        // Main headings
        if (inList) {
          formattedHtml += "</ul>";
          inList = false;
        }
        formattedHtml += `<h2><strong>${trimmedLine}</strong></h2>`;
      } else if (trimmedLine.match(/^\d+\./) || trimmedLine.startsWith("-")) {
        // List items (numbered or bullet points)
        if (!inList) {
          formattedHtml += "<ul>";
          inList = true;
        }
        formattedHtml += `<li>${trimmedLine}</li>`;
      } else if (trimmedLine.length > 0) {
        // Other content
        if (inList) {
          formattedHtml += "</ul>";
          inList = false;
        }
        formattedHtml += `<p>${trimmedLine}</p>`;
      }
    }

    // Close the list if it's still open
    if (inList) {
      formattedHtml += "</ul>";
    }

    return formattedHtml;
  }

  function setLoadingState(isLoading) {
    if (isLoading) {
      submitButton.disabled = true;
      submitButton.textContent = "Processing...";
      spinner.style.display = "block";
    } else {
      submitButton.disabled = false;
      submitButton.textContent = "Analyze and Assign Team";
      spinner.style.display = "none";
    }
  }

  newProjectForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    setLoadingState(true);
    const projectData = {
      project_name: document.getElementById("projectName").value,
      requirements: document.getElementById("requirements").value,
      deadline: document.getElementById("deadline").value,
    };

    try {
      const response = await fetch("/create_project", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(projectData),
      });

      const result = await response.json();

      aiSuggestion.classList.remove("hidden");
      const plainText = convertMarkdownToPlainText(result.ai_suggestion);
      const structuredHtml = structurePlainText(plainText);
      suggestionContent.innerHTML = structuredHtml;
    } catch (error) {
      console.error("Error:", error);
      suggestionContent.textContent =
        "An error occurred while processing your request. Please try again.";
    } finally {
      setLoadingState(false);
    }
  });

  excelUploadForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const formData = new FormData();
    const fileField = document.getElementById("excelFile");

    formData.append("file", fileField.files[0]);

    try {
      const response = await fetch("/upload_excel", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (response.ok) {
        showAlert(result.message, 'success');
        fetchEmployees();
      } else {
        showAlert(result.error, 'error');      }
    } catch (error) {
      console.error("Error:", error);
      showAlert("An error occurred during upload. Please try again.", 'error');
    }
  });

  async function fetchTeams() {
    try {
      const response = await fetch("/teams");
      const teams = await response.json();
      teamsListContent.innerHTML = teams
        .map((team) => `<li>${team.team_name} - ${team.department}</li>`)
        .join("");
    } catch (error) {
      console.error("Error:", error);
    }
  }

  window.removeEmployee = async function (employeeId) {
    if (confirm("Are you sure you want to remove this employee?")) {
      try {
        const response = await fetch(`/remove_employee/${employeeId}`, {
          method: "POST",
        });
        if (response.ok) {
          fetchEmployees();
        } else {
          console.error("Failed to remove employee");
        }
      } catch (error) {
        console.error("Error:", error);
      }
    }
  };
  async function fetchEmployeeSuggestions(search) {
    try {
      const response = await fetch(`/employee_suggestions?search=${search}`);
      const suggestions = await response.json();
      employeeSuggestions.innerHTML = suggestions
        .map(
          (suggestion) => `
                <option value="${suggestion}">
            `
        )
        .join("");
    } catch (error) {
      console.error("Error:", error);
    }
  }

  employeeSearchInput.addEventListener("input", (e) => {
    const searchValue = e.target.value;
    if (searchValue.length > 1) {
      fetchEmployeeSuggestions(searchValue);
    } else {
      employeeSuggestions.innerHTML = "";
    }
  });

  employeeSearch.addEventListener("submit", (e) => {
    e.preventDefault();
    fetchEmployees(employeeSearchInput.value);
  });

  
  fetchEmployees();
  fetchTeams();
});
