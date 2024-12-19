export function drawCanvas(ctx, canvas, fieldImage, controlPoints, splinePaths, imgWidth, imgHeight) {
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

function scaleToCanvas([x, y], canvas, imgWidth, imgHeight) {
  return [(x / imgWidth) * canvas.width, (y / imgHeight) * canvas.height];
}

export function startDragging(event) {
  const [x, y] = getCanvasCoordinates(event);
  draggedPointIndex = findNearestPoint(x, y);
  if (draggedPointIndex !== -1) {
    isDragging = true;
    event.preventDefault(); // Prevent default behavior
  }
}

export function drag(event) {
  if (isDragging) {
    const [x, y] = getCanvasCoordinates(event);
    controlPoints[draggedPointIndex] = [x, y];
    drawCanvas();
    event.preventDefault(); // Prevent default behavior
  }
}

export function stopDragging(event) {
  if (isDragging) {
    isDragging = false;
    regeneratePath();
    drawCanvas();
    event.preventDefault(); // Prevent default behavior
  }
}

export function addPoint(event) {
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

export function getRequiredPoints() {
  const isContinuous = document.getElementById("continuousPath").checked;
  return isContinuous && splinePaths.length > 0
    ? requiredPoints[selectedSpline] - 1
    : requiredPoints[selectedSpline];
}

export function getCanvasCoordinates(event) {
  const rect = canvas.getBoundingClientRect();
  const x = ((event.clientX - rect.left) / canvas.width) * imgWidth;
  const y = ((event.clientY - rect.top) / canvas.height) * imgHeight;
  return [x, y];
}

export function findNearestPoint(x, y) {
  const threshold = 10;
  for (let i = 0; i < controlPoints.length; i++) {
    const [px, py] = controlPoints[i];
    const distance = Math.sqrt((x - px) ** 2 + (y - py) ** 2);
    if (distance < threshold) return i;
  }
  return -1;
}

export function selectSpline(type) {
  selectedSpline = type;
  document.getElementById("instructions").innerText =
    `Select ${requiredPoints[type]} points for the ${type} path.`;
  controlPoints = [];
  drawCanvas();
  document.getElementById("hermiteTangents").style.display =
    type === "hermite" ? "block" : "none";
}

export function clearPoints() {
  controlPoints = [];
  splinePaths = [];
  drawCanvas();
  document.querySelector("#pathTable tbody").innerHTML = "";
}

export function exportPoints() {
  const data = JSON.stringify({ controlPoints, splinePaths });
  const blob = new Blob([data], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "points.json";
  a.click();
}