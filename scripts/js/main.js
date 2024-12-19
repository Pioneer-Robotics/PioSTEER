import * as Canvas from './canvas.js';
import * as Spline from './spline.js';
import * as Robot from './robot.js';
import * as Cards from './cards.js';

document.addEventListener("DOMContentLoaded", function () {
  // Canvas and Robot initialization
  const canvas = document.getElementById("canvas");
  const ctx = canvas.getContext("2d");
  
  const imgWidth = 4096, 
        imgHeight = 4096;

  const robotSize = 40.64 * 2; // Robot size in cm

  // Global variables
  let controlPoints = [];
  let selectedSpline = null;
  let splinePaths = [];
  let robotIndex = 0;
  let robotInterval;
  let isAnimating = false;

  // Image loading and drawing
  const fieldImage = new Image();
  fieldImage.src = "./scripts/js/static/IntoTheDeepField.png";

  // Draw the canvas when the image is loaded
  fieldImage.onload = () => {
    Canvas.drawCanvas(ctx, canvas, fieldImage, controlPoints, splinePaths, imgWidth, imgHeight);
  };

  // // Event listeners
  // setEventListeners();
  
  // // Set up dark mode toggle
  // setupDarkModeToggle();
  
  // // Functions for UI interactions
  // function setEventListeners() {
  //   // Canvas events
  //   canvas.addEventListener("mousedown", Canvas.startDragging);
  //   canvas.addEventListener("mousemove", Canvas.drag);
  //   canvas.addEventListener("mouseup", Canvas.stopDragging);
  //   canvas.addEventListener("click", Canvas.addPoint);

  //   // Button events
  //   document.getElementById("clearButton").addEventListener("click", Canvas.clearPoints);
  //   document.getElementById("exportButton").addEventListener("click", Canvas.exportPoints);
  //   document.getElementById("linearButton").addEventListener("click", () => Spline.selectSpline("linear"));
  //   document.getElementById("bezierButton").addEventListener("click", () => Spline.selectSpline("bezier"));
  //   document.getElementById("hermiteButton").addEventListener("click", () => Spline.selectSpline("hermite"));
  //   document.getElementById("animateButton").addEventListener("click", Robot.animateRobot);
    
  //   // File input event for importing JSON
  //   document.getElementById("jsonFileInput").addEventListener("change", handleFileImport);
  // }

  // // Dark Mode setup
  // function setupDarkModeToggle() {
  //   const toggle = document.getElementById("darkModeToggle");
  //   if (localStorage.getItem("dark-mode") === "enabled") {
  //     document.body.classList.add("dark-mode");
  //     toggle.checked = true;
  //   }

  //   toggle.addEventListener("change", () => {
  //     if (toggle.checked) {
  //       document.body.classList.add("dark-mode");
  //       localStorage.setItem("dark-mode", "enabled");
  //     } else {
  //       document.body.classList.remove("dark-mode");
  //       localStorage.setItem("dark-mode", "disabled");
  //     }
  //   });
  // }

  // // Function to handle file import for JSON data
  // function handleFileImport(e) {
  //   const file = e.target.files[0];
  //   if (!file) return;

  //   if (file.type !== "application/json") {
  //     alert("Please upload a JSON file only.");
  //     return;
  //   }

  //   if (file.size > 1024 * 1024) {
  //     alert("File size exceeds 1MB limit.");
  //     return;
  //   }

  //   const reader = new FileReader();
  //   reader.onload = function (e) {
  //     try {
  //       const jsonData = JSON.parse(e.target.result);
  //       if (jsonData.controlPoints && jsonData.splinePaths) {
  //         controlPoints = jsonData.controlPoints;
  //         splinePaths = jsonData.splinePaths;
  //         drawCanvas();
  //         updateTableFromImport();
  //       } else {
  //         throw new Error("Invalid JSON structure");
  //       }
  //     } catch (error) {
  //       alert("Error parsing JSON file: " + error.message);
  //     }
  //   };
  //   reader.readAsText(file);
  // }

  // // Make functions available globally
  // window.updatePoint = updatePoint;
  // window.deletePath = deletePath;
});