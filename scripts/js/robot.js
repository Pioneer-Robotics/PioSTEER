export function animateRobot() {
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

export function drawRobot([x, y]) {
    ctx.strokeStyle = "green";
    ctx.lineWidth = 4;
    ctx.strokeRect(
      (x / imgWidth) * canvas.width - robotSize / 2,
      (y / imgHeight) * canvas.height - robotSize / 2,
      robotSize,
      robotSize,
    );
  }