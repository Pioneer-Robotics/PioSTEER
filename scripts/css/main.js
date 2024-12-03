document.addEventListener("DOMContentLoaded", function () {
  const canvas = document.getElementById("canvas");
  const ctx = canvas.getContext("2d");
  const imgWidth = 4096,
    imgHeight = 4096;
  const robotSize = 40.64 * 2; // Robot size in cm

  let controlPoints = [];
  let selectedSpline = null;
  let splinePaths = [];
  let robotIndex = 0;
  let robotInterval;
  let isAnimating = false;

  const fieldImage = new Image();
  fieldImage.src = "static/IntoTheDeepField.png";
  fieldImage.onload = () => drawCanvas();

  const requiredPoints = {
    linear: 2,
    bezier: 4,
    hermite: 2,
  };

  canvas.addEventListener("mousedown", startDragging);
  canvas.addEventListener("mousemove", drag);
  canvas.addEventListener("mouseup", stopDragging);
  canvas.addEventListener("click", addPoint);

  document.getElementById("clearButton").addEventListener("click", clearPoints);
  document
    .getElementById("exportButton")
    .addEventListener("click", exportPoints);
  document
    .getElementById("linearButton")
    .addEventListener("click", () => selectSpline("linear"));
  document
    .getElementById("bezierButton")
    .addEventListener("click", () => selectSpline("bezier"));
  document
    .getElementById("hermiteButton")
    .addEventListener("click", () => selectSpline("hermite"));
  document
    .getElementById("animateButton")
    .addEventListener("click", animateRobot);

  let isDragging = false;
  let draggedPointIndex = -1;

  function startDragging(event) {
    const [x, y] = getCanvasCoordinates(event);
    draggedPointIndex = findNearestPoint(x, y);
    if (draggedPointIndex !== -1) {
      isDragging = true;
      event.preventDefault(); // Prevent default behavior
    }
  }

  function drag(event) {
    if (isDragging) {
      const [x, y] = getCanvasCoordinates(event);
      controlPoints[draggedPointIndex] = [x, y];
      drawCanvas();
      event.preventDefault(); // Prevent default behavior
    }
  }

  function stopDragging(event) {
    if (isDragging) {
      isDragging = false;
      regeneratePath();
      drawCanvas();
      event.preventDefault(); // Prevent default behavior
    }
  }

  function addPoint(event) {
    if (!selectedSpline || isDragging) return;

    const [x, y] = getCanvasCoordinates(event);
    const isContinuous = document.getElementById("continuousPath").checked;

    if (controlPoints.length < getRequiredPoints()) {
      if (
        isContinuous &&
        controlPoints.length === 0 &&
        splinePaths.length > 0
      ) {
        const lastPath = splinePaths[splinePaths.length - 1];
        const lastPoint = lastPath[lastPath.length - 1];
        controlPoints.push(lastPoint);
      }
      controlPoints.push([x, y]);
      drawCanvas();
      updateCards();
    }

    if (controlPoints.length === getRequiredPoints()) {
      generateSpline();
      controlPoints = []; // Clear control points after generating spline
    }
  }

  function getRequiredPoints() {
    const isContinuous = document.getElementById("continuousPath").checked;
    return isContinuous && splinePaths.length > 0
      ? requiredPoints[selectedSpline] - 1
      : requiredPoints[selectedSpline];
  }

  function getCanvasCoordinates(event) {
    const rect = canvas.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / canvas.width) * imgWidth;
    const y = ((event.clientY - rect.top) / canvas.height) * imgHeight;
    return [x, y];
  }

  function findNearestPoint(x, y) {
    const threshold = 10;
    for (let i = 0; i < controlPoints.length; i++) {
      const [px, py] = controlPoints[i];
      const distance = Math.sqrt((x - px) ** 2 + (y - py) ** 2);
      if (distance < threshold) return i;
    }
    return -1;
  }

  function selectSpline(type) {
    selectedSpline = type;
    document.getElementById("instructions").innerText =
      `Select ${requiredPoints[type]} points for the ${type} path.`;
    controlPoints = [];
    drawCanvas();
    document.getElementById("hermiteTangents").style.display =
      type === "hermite" ? "block" : "none";
  }


  function updateTable() {
    const tableBody = document.querySelector("#pathTable tbody");
    const newRow = tableBody.insertRow();
    newRow.insertCell(0).textContent = selectedSpline;
    for (let i = 0; i < 4; i++) {
      const point = controlPoints[i] || [0, 0];
      newRow.insertCell(2 * i + 1).innerHTML =
        `<input type="number" value="${point[0]}" onchange="updatePoint(${tableBody.rows.length - 1}, ${i}, 0, this.value)">`;
      newRow.insertCell(2 * i + 2).innerHTML =
        `<input type="number" value="${point[1]}" onchange="updatePoint(${tableBody.rows.length - 1}, ${i}, 1, this.value)">`;
    }
    if (selectedSpline === "hermite") {
      const t0 = [
        document.getElementById("hermiteTangent1X").value,
        document.getElementById("hermiteTangent1Y").value,
      ];
      const t1 = [
        document.getElementById("hermiteTangent2X").value,
        document.getElementById("hermiteTangent2Y").value,
      ];
      newRow.insertCell(9).innerHTML =
        `T1: (${t0[0]}, ${t0[1]}) T2: (${t1[0]}, ${t1[1]})`;
    }
    newRow.insertCell(selectedSpline === "hermite" ? 10 : 9).innerHTML =
      '<button onclick="deletePath(this)">Delete</button>';
  }

  function updatePoint(rowIndex, pointIndex, coordIndex, value) {
    const path = splinePaths[rowIndex];
    const type =
      document.querySelector("#pathTable tbody").rows[rowIndex].cells[0]
        .textContent;
    const requiredPointsCount = requiredPoints[type];

    if (pointIndex < requiredPointsCount) {
      controlPoints = path.slice(0, requiredPointsCount);
      controlPoints[pointIndex][coordIndex] = parseFloat(value);

      let newPath;
      if (type === "linear") newPath = linearSpline();
      else if (type === "bezier") newPath = bezierSpline();
      else if (type === "hermite") newPath = hermiteSpline();

      splinePaths[rowIndex] = newPath;
      drawCanvas();
    }
  }

  function deletePath(button) {
    const row = button.parentNode.parentNode;
    splinePaths.splice(row.rowIndex - 1, 1);
    row.parentNode.removeChild(row);
    drawCanvas();
  }

  function clearPoints() {
    controlPoints = [];
    splinePaths = [];
    drawCanvas();
    document.querySelector("#pathTable tbody").innerHTML = "";
  }

  function exportPoints() {
    const data = JSON.stringify({ controlPoints, splinePaths });
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "points.json";
    a.click();
  }

  document
    .getElementById("jsonFileInput")
    .addEventListener("change", function (e) {
      const file = e.target.files[0];
      if (!file) return;

      if (file.type !== "application/json") {
        alert("Please upload a JSON file only.");
        return;
      }

      if (file.size > 1024 * 1024) {
        alert("File size exceeds 1MB limit.");
        return;
      }

      const reader = new FileReader();
      reader.onload = function (e) {
        try {
          const jsonData = JSON.parse(e.target.result);
          if (jsonData.controlPoints && jsonData.splinePaths) {
            controlPoints = jsonData.controlPoints;
            splinePaths = jsonData.splinePaths;
            drawCanvas();
            updateTableFromImport();
          } else {
            throw new Error("Invalid JSON structure");
          }
        } catch (error) {
          alert("Error parsing JSON file: " + error.message);
        }
      };
      reader.readAsText(file);
    });

  function updateTableFromImport() {
    const tableBody = document.querySelector("#pathTable tbody");
    tableBody.innerHTML = "";
    splinePaths.forEach((path, index) => {
      const newRow = tableBody.insertRow();
      newRow.insertCell(0).textContent =
        index % 3 === 0 ? "linear" : index % 3 === 1 ? "bezier" : "hermite";
      for (let i = 0; i < 4; i++) {
        const point = path[i * 25] || [0, 0]; // Sample points from the path
        newRow.insertCell(2 * i + 1).innerHTML =
          `<input type="number" value="${point[0]}" onchange="updatePoint(${index}, ${i}, 0, this.value)">`;
        newRow.insertCell(2 * i + 2).innerHTML =
          `<input type="number" value="${point[1]}" onchange="updatePoint(${index}, ${i}, 1, this.value)">`;
      }
      newRow.insertCell(9).innerHTML =
        '<button onclick="deletePath(this)">Delete</button>';
    });
  }



  const toggle = document.getElementById("darkModeToggle");
  
    // Check localStorage for saved mode
    if (localStorage.getItem("dark-mode") === "enabled") {
      document.body.classList.add("dark-mode");
      toggle.checked = true;
    }
  
    // Add event listener for the toggle
    toggle.addEventListener("change", () => {
      if (toggle.checked) {
        document.body.classList.add("dark-mode");
        localStorage.setItem("dark-mode", "enabled");
      } else {
        document.body.classList.remove("dark-mode");
        localStorage.setItem("dark-mode", "disabled");
      }
    })

  

  // Make functions available globally
  window.updatePoint = updatePoint;
  window.deletePath = deletePath;
});
