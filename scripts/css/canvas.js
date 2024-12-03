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



