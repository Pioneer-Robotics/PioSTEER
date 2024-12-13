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
  fieldImage.src = "/PioSTEER/static/IntoTheDeepField.png";
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

  function drawCanvas() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(fieldImage, 0, 0, canvas.width, canvas.height);

    controlPoints.forEach(([x, y], index) => {
      ctx.fillStyle = index === draggedPointIndex ? "blue" : "red";
      ctx.fillRect(
        (x / imgWidth) * canvas.width - 4,
        (y / imgHeight) * canvas.height - 4,
        8,
        8,
      );
    });

    splinePaths.forEach((path) => {
      ctx.beginPath();
      ctx.moveTo(...scaleToCanvas(path[0]));
      for (let i = 1; i < path.length; i++) {
        ctx.lineTo(...scaleToCanvas(path[i]));
      }
      ctx.strokeStyle = "blue";
      ctx.lineWidth = 3;
      ctx.stroke();
    });
  }

  function scaleToCanvas([x, y]) {
    return [(x / imgWidth) * canvas.width, (y / imgHeight) * canvas.height];
  }

  function generateSpline() {
    let path;
    if (selectedSpline === "linear") path = linearSpline();
    else if (selectedSpline === "bezier") path = bezierSpline();
    else if (selectedSpline === "hermite") path = hermiteSpline();

    if (
      splinePaths.length > 0 &&
      document.getElementById("continuousPath").checked
    ) {
      path = path.slice(1); // Remove the first point as it's the same as the last point of the previous path
    }
    splinePaths.push(path);
    drawCanvas();
    updateTable();
  }

  function linearSpline() {
    const [p1, p2] = controlPoints.slice(-2);
    const points = [];
    for (let t = 0; t <= 1; t += 0.01) {
      const x = p1[0] + t * (p2[0] - p1[0]);
      const y = p1[1] + t * (p2[1] - p1[1]);
      points.push([x, y]);
    }
    return points;
  }

  function bezierSpline() {
    const [p0, p1, p2, p3] = controlPoints.slice(-4);
    const points = [];
    for (let t = 0; t <= 1; t += 0.01) {
      const x =
        Math.pow(1 - t, 3) * p0[0] +
        3 * Math.pow(1 - t, 2) * t * p1[0] +
        3 * (1 - t) * Math.pow(t, 2) * p2[0] +
        Math.pow(t, 3) * p3[0];
      const y =
        Math.pow(1 - t, 3) * p0[1] +
        3 * Math.pow(1 - t, 2) * t * p1[1] +
        3 * (1 - t) * Math.pow(t, 2) * p2[1] +
        Math.pow(t, 3) * p3[1];
      points.push([x, y]);
    }
    return points;
  }

  function hermiteSpline() {
    const [p0, p1] = controlPoints.slice(-2);
    const t0 = [
      document.getElementById("hermiteTangent1X").value,
      document.getElementById("hermiteTangent1Y").value,
    ];
    const t1 = [
      document.getElementById("hermiteTangent2X").value,
      document.getElementById("hermiteTangent2Y").value,
    ];
    const points = [];
    for (let t = 0; t <= 1; t += 0.01) {
      const h00 = 2 * t ** 3 - 3 * t ** 2 + 1;
      const h10 = t ** 3 - 2 * t ** 2 + t;
      const h01 = -2 * t ** 3 + 3 * t ** 2;
      const h11 = t ** 3 - t ** 2;
      const x = h00 * p0[0] + h10 * t0[0] + h01 * p1[0] + h11 * t1[0];
      const y = h00 * p0[1] + h10 * t0[1] + h01 * p1[1] + h11 * t1[1];
      points.push([x, y]);
    }
    return points;
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

  function animateRobot() {
    const animateButton = document.getElementById("animateButton");
    if (isAnimating) {
      clearInterval(robotInterval);
      isAnimating = false;
      animateButton.textContent = "Animate Robot";
      animateButton.classList.remove("running");
    } else {
      isAnimating = true;
      animateButton.textContent = "Stop Robot";
      animateButton.classList.add("running");
      robotIndex = 0;
      let velocity =
        parseFloat(document.getElementById("velocityInput").value) || 10;
      velocity *= 2;
      if (splinePaths.length === 0) return;

      let currentPathIndex = 0,
        currentPath = splinePaths[currentPathIndex];
      robotInterval = setInterval(() => {
        if (robotIndex >= currentPath.length) {
          currentPathIndex++;
          if (currentPathIndex >= splinePaths.length) {
            currentPathIndex = 0;
          }
          currentPath = splinePaths[currentPathIndex];
          robotIndex = 0;
        }
        drawCanvas();
        drawRobot(currentPath[robotIndex]);
        robotIndex++;
      }, 1000 / velocity);
    }
  }

  function drawRobot([x, y]) {
    ctx.strokeStyle = "green";
    ctx.lineWidth = 2;
    ctx.strokeRect(
      (x / imgWidth) * canvas.width - robotSize / 2,
      (y / imgHeight) * canvas.height - robotSize / 2,
      robotSize,
      robotSize,
    );
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

  // Make functions available globally
  window.updatePoint = updatePoint;
  window.deletePath = deletePath;
});
