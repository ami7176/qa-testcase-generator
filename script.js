// ======================================================
// QA Test Case Generator
// script.js (Part 1)
// ======================================================

// ================================
// DOM Elements
// ================================

const requirementEl = document.getElementById("requirement");

const generateBtn = document.getElementById("generateBtn");

const clearBtn = document.getElementById("clearBtn");

const copyBtn = document.getElementById("copyBtn");

const downloadBtn = document.getElementById("downloadBtn");

const loadingEl = document.getElementById("loading");

const errorBox = document.getElementById("errorBox");

const tableBody = document.getElementById("tableBody");

const charCount = document.getElementById("charCount");

const selectedCount = document.getElementById("selectedCount");

const testTypeCheckboxes = document.querySelectorAll(
  ".test-card input[type='checkbox']",
);

const MAX_SELECTION = 4;

// ================================
// Character Counter
// ================================

function updateCharacterCount() {
  charCount.textContent = requirementEl.value.length;
}

requirementEl.addEventListener("input", updateCharacterCount);

updateCharacterCount();

// ================================
// Selected Test Types Counter
// ================================

function updateSelectedCounter() {
  const totalSelected = document.querySelectorAll(
    ".test-card input:checked",
  ).length;

  selectedCount.textContent = totalSelected;
}

// ================================
// Get Selected Test Types
// ================================

function getSelectedTestTypes() {
  return Array.from(document.querySelectorAll(".test-card input:checked")).map(
    (item) => item.value,
  );
}

// ================================
// Test Type Selection Logic
// ================================

testTypeCheckboxes.forEach((box) => {
  box.addEventListener("change", function () {
    const selected = getSelectedTestTypes();

    if (selected.length > MAX_SELECTION) {
      this.checked = false;

      showToast(
        `You can select maximum ${MAX_SELECTION} test types.`,

        "error",
      );

      return;
    }

    updateSelectedCounter();
  });
});

updateSelectedCounter();

// ================================
// Toast Notification
// ================================

function showToast(message, type = "success") {
  const toast = document.getElementById("toast");

  const toastMessage = document.getElementById("toastMessage");

  const toastIcon = toast.querySelector("i");

  toastMessage.textContent = message;

  if (type === "success") {
    toastIcon.className = "fa-solid fa-circle-check";

    toast.style.borderLeftColor = "#22c55e";

    toastIcon.style.color = "#22c55e";
  } else {
    toastIcon.className = "fa-solid fa-circle-xmark";

    toast.style.borderLeftColor = "#ef4444";

    toastIcon.style.color = "#ef4444";
  }

  toast.classList.add("show");

  setTimeout(() => {
    toast.classList.remove("show");
  }, 2500);
}

// ================================
// Helper Functions
// ================================

function showLoading(show) {
  loadingEl.classList.toggle(
    "hidden",

    !show,
  );

  generateBtn.disabled = show;
}

function showError(message) {
  errorBox.textContent = message;

  errorBox.classList.remove("hidden");
}

function clearError() {
  errorBox.textContent = "";

  errorBox.classList.add("hidden");
}

// ======================================================
// API Call
// ======================================================

async function generateTestCases() {
  const requirement = requirementEl.value.trim();

  if (!requirement) {
    showError("Please enter a requirement.");

    requirementEl.focus();

    return;
  }

  const testTypes = getSelectedTestTypes();

  if (testTypes.length === 0) {
    showError("Please select at least one Test Type.");

    showToast("Select at least one Test Type.", "error");

    return;
  }

  clearError();

  showLoading(true);

  console.log("Selected Test Types:", testTypes);

  // Localhost or Render
  const API_URL =
    (window.location.hostname === "127.0.0.1" ||
      window.location.hostname === "localhost") &&
    window.location.port === "5500"
      ? "http://localhost:3000/generate"
      : `${window.location.origin}/generate`;

  try {
    console.log("Requirement:", requirement);
    console.log("Selected Test Types:", testTypes);

    const response = await fetch(API_URL, {
      method: "POST",

      headers: {
        "Content-Type": "application/json",
      },

      body: JSON.stringify({
        requirement,

        testTypes,
      }),
    });

    const text = await response.text();

    if (!text) {
      throw new Error("Server returned an empty response.");
    }

    let data;

    try {
      data = JSON.parse(text);
    } catch {
      throw new Error("Invalid response received from server.");
    }

    if (!response.ok) {
      throw new Error(data.error || "Failed to generate test cases.");
    }

    renderTable(data.testCases || []);

    showToast(`${data.testCases.length} Test Cases Generated Successfully`);
  } catch (err) {
    console.error(err);

    showError(err.message || "Something went wrong.");

    showToast(
      "Failed to generate Test Cases",

      "error",
    );
  } finally {
    showLoading(false);
  }
}

// ======================================================
// Render Table
// ======================================================

function renderTable(testCases) {
  tableBody.innerHTML = "";

  if (!testCases.length) {
    tableBody.innerHTML = `

            <tr>

                <td colspan="8" class="empty">

                    No Test Cases Generated

                </td>

            </tr>

        `;

    return;
  }

  testCases.forEach((tc, index) => {
    console.log(tc);
    const row = document.createElement("tr");

    row.innerHTML = `

            <td>${tc.id || index + 1}</td>

            <td>${tc.type || "Functional"}</td>

            <td>${tc.title || ""}</td>

            <td>${tc.module || ""}</td>

            <td>${tc.priority || ""}</td>

            <td>${tc.preconditions || ""}</td>

            <td>${tc.steps || ""}</td>

            <td>${tc.expectedResult || ""}</td>

        `;

    tableBody.appendChild(row);
  });
}

// ======================================================
// Generate Button
// ======================================================

generateBtn.addEventListener(
  "click",

  generateTestCases,
);

// ======================================================
// Ctrl + Enter
// ======================================================

requirementEl.addEventListener(
  "keydown",

  function (e) {
    if (e.ctrlKey && e.key === "Enter") {
      generateTestCases();
    }
  },
);

// ======================================================
// Clear Button
// ======================================================

clearBtn.addEventListener(
  "click",

  () => {
    requirementEl.value = "";

    updateCharacterCount();

    clearError();

    testTypeCheckboxes.forEach((box) => {
      box.checked = false;
    });

    updateSelectedCounter();

    tableBody.innerHTML = `

            <tr>

                <td colspan="8" class="empty">

                    No Test Cases Generated

                </td>

            </tr>

        `;

    showToast("Cleared Successfully");
  },
);

// ======================================================
// COPY TEST CASES
// ======================================================

copyBtn.addEventListener("click", async () => {
  const rows = document.querySelectorAll("#tableBody tr");

  if (!rows.length || rows[0].querySelector(".empty")) {
    showToast(
      "No Test Cases Available",

      "error",
    );

    return;
  }

  let text = "";

  // Table Headers
  const headers = Array.from(
    document.querySelectorAll("#resultTable thead th"),
  ).map((h) => h.innerText.trim());

  text += headers.join("\t") + "\n";

  // Table Data
  rows.forEach((row) => {
    const cols = row.querySelectorAll("td");

    if (cols.length > 1) {
      text += Array.from(cols)

        .map((col) =>
          col.innerText

            .replace(/\n/g, " ")

            .trim(),
        )

        .join("\t");

      text += "\n";
    }
  });

  try {
    await navigator.clipboard.writeText(text);

    showToast("Test Cases Copied Successfully");
  } catch {
    showToast(
      "Copy Failed",

      "error",
    );
  }
});

// ======================================================
// DOWNLOAD CSV
// ======================================================

downloadBtn.addEventListener("click", () => {
  const rows = document.querySelectorAll("#tableBody tr");

  if (!rows.length || rows[0].querySelector(".empty")) {
    showToast(
      "No Test Cases Available",

      "error",
    );

    return;
  }

  const csv = [];

  // Header

  const headers = Array.from(
    document.querySelectorAll("#resultTable thead th"),
  ).map((h) => `"${h.innerText.trim()}"`);

  csv.push(headers.join(","));

  // Body

  rows.forEach((row) => {
    const cols = row.querySelectorAll("td");

    if (cols.length > 1) {
      csv.push(
        Array.from(cols)

          .map(
            (col) =>
              `"${col.innerText

                .replace(/"/g, '""')

                .replace(/\n/g, " ")

                .trim()}"`,
          )

          .join(","),
      );
    }
  });

  const blob = new Blob(
    [csv.join("\n")],

    {
      type: "text/csv;charset=utf-8;",
    },
  );

  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");

  const now = new Date();

  const fileName = `QA_Test_Cases_${now.getFullYear()}-${String(
    now.getMonth() + 1,
  ).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}_${String(
    now.getHours(),
  ).padStart(2, "0")}-${String(now.getMinutes()).padStart(2, "0")}.csv`;

  link.href = url;

  link.download = fileName;

  document.body.appendChild(link);

  link.click();

  document.body.removeChild(link);

  URL.revokeObjectURL(url);

  showToast("CSV Downloaded Successfully");
});

// ======================================================
// FUTURE HELPER FUNCTIONS
// ======================================================

// Total Test Cases

function getTotalTestCases() {
  return document.querySelectorAll("#tableBody tr").length;
}

// Total Selected Test Types

function getSelectedCount() {
  return document.querySelectorAll(".test-card input:checked").length;
}

// Current Date

function getCurrentDate() {
  return new Date().toLocaleDateString();
}

// Current Time

function getCurrentTime() {
  return new Date().toLocaleTimeString();
}

// ======================================================
// PAGE LOADED
// ======================================================

window.addEventListener(
  "load",

  () => {
    updateCharacterCount();

    updateSelectedCounter();

    clearError();

    console.log("QA Test Case Generator v2.0 Loaded");
  },
);
