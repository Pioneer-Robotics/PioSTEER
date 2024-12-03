function updateCards() {
    const cardContainer = document.getElementById("cardContainer"); // A div to hold the cards
    cardContainer.innerHTML = ""; // Clear existing cards
  
    window.splinePaths.forEach((path, index) => {
      const card = document.createElement("div");
      card.className = "card";
      card.id = `spline-card-${index}`;
  
      // Card content
      const cardHeader = document.createElement("h3");
      cardHeader.textContent = `Path ${index + 1}: ${window.selectedSpline}`;
      card.appendChild(cardHeader);
  
      // Control points
      const controlPointsList = document.createElement("ul");
      controlPointsList.className = "control-points-list";
      window.controlPoints.forEach(([x, y]) => {
        const point = document.createElement("li");
        point.textContent = `(${x.toFixed(2)}, ${y.toFixed(2)})`;
        controlPointsList.appendChild(point);
      });
      card.appendChild(controlPointsList);
  
      // Tangents (for Hermite splines)
      if (window.selectedSpline === "hermite") {
        const tangentDetails = document.createElement("p");
        const t1 = [
          document.getElementById("hermiteTangent1X").value,
          document.getElementById("hermiteTangent1Y").value,
        ];
        const t2 = [
          document.getElementById("hermiteTangent2X").value,
          document.getElementById("hermiteTangent2Y").value,
        ];
        tangentDetails.textContent = `Tangents: T1(${t1.join(", ")}), T2(${t2.join(
          ", "
        )})`;
        card.appendChild(tangentDetails);
      }
  
      // Delete button
      const deleteButton = document.createElement("button");
      deleteButton.className = "delete-button";
      deleteButton.textContent = "Delete Path";
      deleteButton.addEventListener("click", () => deletePath(index));
      card.appendChild(deleteButton);
  
      cardContainer.appendChild(card);
    });
  }
  
  function deletePath(index) {
    // Remove the path and its associated card
    window.splinePaths.splice(index, 1);
    updateCards();
    drawCanvas();
  }
  