// ================================
// QA Test Case Generator - script.js
// ================================

const requirementEl = document.getElementById("requirement");
const generateBtn = document.getElementById("generateBtn");
const clearBtn = document.getElementById("clearBtn");

const copyBtn = document.getElementById("copyBtn");
const downloadBtn = document.getElementById("downloadBtn");

const loadingEl = document.getElementById("loading");
const errorBox = document.getElementById("errorBox");

const tableBody = document.getElementById("tableBody");

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
// API CALL
// ================================
async function generateTestCases() {

    const requirement = requirementEl.value.trim();

    if (!requirement) {
        showError("Please enter a requirement first.");
        return;
    }

    clearError();
    showLoading(true);

    // Automatically use the correct backend
    const API_URL =
        (window.location.hostname === "127.0.0.1" ||
         window.location.hostname === "localhost") &&
        window.location.port === "5500"
            ? "http://localhost:3000/generate"
            : `${window.location.origin}/generate`;

    try {

        const response = await fetch(API_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                requirement
            })
        });

        // Read response safely
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

    } catch (err) {

        console.error(err);

        showError(err.message || "Something went wrong!");

    } finally {

        showLoading(false);

    }
}

// ================================
// Render Table
// ================================
function renderTable(testCases) {

    tableBody.innerHTML = "";

    if (!testCases.length) {

        tableBody.innerHTML = `
            <tr>
                <td colspan="7" class="empty">
                    No Test Cases Found
                </td>
            </tr>
        `;

        return;
    }

    testCases.forEach((tc, index) => {

        const row = document.createElement("tr");

        row.innerHTML = `
            <td>${tc.id || index + 1}</td>
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

// ================================
// Loading
// ================================
function showLoading(show) {

    loadingEl.classList.toggle("hidden", !show);

    generateBtn.disabled = show;

}

// ================================
// Error
// ================================
function showError(msg) {

    errorBox.textContent = msg;

    errorBox.classList.remove("hidden");

}

function clearError() {

    errorBox.textContent = "";

    errorBox.classList.add("hidden");

}

// ================================
// Clear
// ================================
clearBtn.addEventListener("click", () => {

    requirementEl.value = "";

    tableBody.innerHTML = `
        <tr>
            <td colspan="7" class="empty">
                No Test Cases Generated
            </td>
        </tr>
    `;

    clearError();

});

// ================================
// Generate
// ================================
generateBtn.addEventListener("click", generateTestCases);

requirementEl.addEventListener("keydown", (e) => {

    if (e.ctrlKey && e.key === "Enter") {

        generateTestCases();

    }

});

// ================================
// Copy
// ================================
copyBtn.addEventListener("click", async () => {

    let text = "";

    const headers = document.querySelectorAll("#resultTable thead th");

    text += Array.from(headers)
        .map(h => h.innerText.trim())
        .join("\t") + "\n";

    document.querySelectorAll("#tableBody tr").forEach(row => {

        const cols = row.querySelectorAll("td");

        text += Array.from(cols)
            .map(col => col.innerText.trim())
            .join("\t") + "\n";

    });

    try {

        await navigator.clipboard.writeText(text);

        showToast("Test cases copied successfully!");

    } catch {

        showToast("Failed to copy test cases.", "error");

    }

});

// ================================
// Download CSV
// ================================
downloadBtn.addEventListener("click", () => {

    const headers = [
        "ID",
        "Title",
        "Module",
        "Priority",
        "Preconditions",
        "Steps",
        "Expected Result"
    ];

    const csv = [];

    csv.push(headers.join(","));

    document.querySelectorAll("#tableBody tr").forEach(row => {

        const cols = row.querySelectorAll("td");

        if (cols.length === 7) {

            const rowData = Array.from(cols).map(col =>
                `"${col.innerText.replace(/"/g, '""')}"`
            );

            csv.push(rowData.join(","));

        }

    });

    const blob = new Blob([csv.join("\n")], {
        type: "text/csv;charset=utf-8;"
    });

    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");

    link.href = url;
    link.download = "QA_Test_Cases.csv";

    document.body.appendChild(link);

    link.click();

    document.body.removeChild(link);

    URL.revokeObjectURL(url);

    showToast("Test cases downloaded successfully!");

});
