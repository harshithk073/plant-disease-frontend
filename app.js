// ================================
// CONFIG
// ================================
const API_URL = "https://plant-disease-api-1-yr2p.onrender.com/predict";

// ================================
// ELEMENT REFERENCES
// ================================
const dropZone = document.getElementById("drop-zone");
const imageInput = document.getElementById("image-input");
const browseBtn = document.getElementById("browse-btn");
const analyzeBtn = document.getElementById("analyze-btn");

const previewImage = document.getElementById("preview-image");
const previewPlaceholder = document.getElementById("preview-placeholder");

const statusBadge = document.getElementById("status-badge");
const resultClass = document.getElementById("result-class");
const resultCrop = document.getElementById("result-crop");
const resultDisease = document.getElementById("result-disease");
const resultConfidence = document.getElementById("result-confidence");
const resultSeverity = document.getElementById("result-severity");
const resultRecommendation = document.getElementById("result-recommendation");

let selectedFile = null;

// ================================
// FILE SELECTION HANDLERS
// ================================
browseBtn.addEventListener("click", () => {
  imageInput.click();
});

imageInput.addEventListener("change", () => {
  if (imageInput.files.length > 0) {
    handleFile(imageInput.files[0]);
  }
});

dropZone.addEventListener("dragover", (e) => {
  e.preventDefault();
  dropZone.classList.add("dragover");
});

dropZone.addEventListener("dragleave", () => {
  dropZone.classList.remove("dragover");
});

dropZone.addEventListener("drop", (e) => {
  e.preventDefault();
  dropZone.classList.remove("dragover");

  if (e.dataTransfer.files.length > 0) {
    handleFile(e.dataTransfer.files[0]);
  }
});

// ================================
// FILE PREVIEW
// ================================
function handleFile(file) {
  if (!file.type.startsWith("image/")) {
    alert("Please upload a valid image file.");
    return;
  }

  selectedFile = file;

  const reader = new FileReader();
  reader.onload = () => {
    previewImage.src = reader.result;
    previewImage.style.display = "block";
    previewPlaceholder.style.display = "none";
  };
  reader.readAsDataURL(file);

  analyzeBtn.disabled = false;
  setStatus("ready", "Image ready for analysis");
}

// ================================
// STATUS BADGE
// ================================
function setStatus(type, text) {
  statusBadge.className = `status-badge ${type}`;
  statusBadge.textContent = text;
}

// ================================
// ANALYZE BUTTON
// ================================
analyzeBtn.addEventListener("click", async () => {
  if (!selectedFile) return;

  setStatus("loading", "Analyzing image with CNN...");
  analyzeBtn.disabled = true;

  try {
    const formData = new FormData();
    formData.append("file", selectedFile);

    const response = await fetch(API_URL, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      throw new Error("Prediction failed");
    }

    const data = await response.json();

    displayResults(data.disease, data.confidence);
    setStatus("ready", "Prediction successful");
  } catch (err) {
    console.error(err);
    setStatus("error", "Prediction failed");
    resultRecommendation.textContent =
      "An error occurred while analyzing the image. Please try again.";
  } finally {
    analyzeBtn.disabled = false;
  }
});

// ================================
// DISPLAY RESULTS
// ================================
function displayResults(className, confidence) {
  resultClass.textContent = className;
  resultConfidence.textContent = `${(confidence * 100).toFixed(2)} %`;

  // Split: Apple___healthy → Apple | healthy
  if (className.includes("___")) {
    const [crop, disease] = className.split("___");
    resultCrop.textContent = crop.replace(/_/g, " ");
    resultDisease.textContent = disease.replace(/_/g, " ");
  } else {
    resultCrop.textContent = "Unknown";
    resultDisease.textContent = className;
  }

  // Simple severity heuristic
  if (className.toLowerCase().includes("healthy")) {
    resultSeverity.textContent = "None";
    resultRecommendation.textContent =
      "The leaf appears healthy. Maintain regular care and monitoring.";
  } else {
    resultSeverity.textContent = "Moderate";
    resultRecommendation.textContent =
      "Disease detected. Consider isolating the plant and applying appropriate treatment.";
  }
}
