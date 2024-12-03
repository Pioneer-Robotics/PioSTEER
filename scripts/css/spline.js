function generateSpline() {
    let path;
    if (window.selectedSpline === "linear") path = linearSpline();
    else if (window.selectedSpline === "bezier") path = bezierSpline();
    else if (window.selectedSpline === "hermite") path = hermiteSpline();
  
    if (
      window.splinePaths.length > 0 &&
      document.getElementById("continuousPath").checked
    ) {
      path = path.slice(1); // Remove the first point
    }
    window.splinePaths.push(path);
    drawCanvas();
    updateTable();
  }
  
  function linearSpline() {
    const [p1, p2] = window.controlPoints.slice(-2);
    const points = [];
    for (let t = 0; t <= 1; t += 0.01) {
      const x = p1[0] + t * (p2[0] - p1[0]);
      const y = p1[1] + t * (p2[1] - p1[1]);
      points.push([x, y]);
    }
    return points;
  }
  
  function bezierSpline() {
    const [p0, p1, p2, p3] = window.controlPoints.slice(-4);
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
  