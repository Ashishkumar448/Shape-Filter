const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
const patternContainer = document.getElementById("pattern-container");
patternContainer.appendChild(svg);

const controls = {
  points: document.getElementById("points"),
  chaos: document.getElementById("chaos"),
  rotation: document.getElementById("rotation"),
  hue: document.getElementById("hue"),
  saturation: document.getElementById("saturation"),
  lightness: document.getElementById("lightness"),
  roundness: document.getElementById("roundness"),
  strokeWidth: document.getElementById("stroke-width"),
  fill: document.getElementById("fill")
};

const shuffleButton = document.getElementById("shuffle");

let fixedPoints = [];
let baseRotation = 0;

function generatePoints(numPoints, chaos, radius, centerX, centerY) {
  const points = [];
  for (let i = 0; i < numPoints; i++) {
    const angle = (i / numPoints) * Math.PI * 2;
    const x = centerX + Math.cos(angle) * radius * (1 + (Math.random() - 0.5) * chaos);
    const y = centerY + Math.sin(angle) * radius * (1 + (Math.random() - 0.5) * chaos);
    points.push([x, y]);
  }
  return points;
}

function rotatePoint(x, y, centerX, centerY, angle) {
  const radians = (angle * Math.PI) / 180;
  const cos = Math.cos(radians);
  const sin = Math.sin(radians);
  const nx = (cos * (x - centerX)) + (sin * (y - centerY)) + centerX;
  const ny = (cos * (y - centerY)) - (sin * (x - centerX)) + centerY;
  return [nx, ny];
}

function updatePattern() {
  const width = patternContainer.clientWidth;
  const height = patternContainer.clientHeight;
  const centerX = width / 2;
  const centerY = height / 2;
  const radius = Math.min(width, height) * 0.4;

  svg.setAttribute("width", width);
  svg.setAttribute("height", height);
  svg.innerHTML = "";

  const dotGrid = document.createElementNS("http://www.w3.org/2000/svg", "pattern");
  dotGrid.setAttribute("id", "dotGrid");
  dotGrid.setAttribute("width", "20");
  dotGrid.setAttribute("height", "20");
  dotGrid.setAttribute("patternUnits", "userSpaceOnUse");

  const dot = document.createElementNS("http://www.w3.org/2000/svg", "circle");
  dot.setAttribute("cx", "10");
  dot.setAttribute("cy", "10");
  dot.setAttribute("r", "1");
  dot.setAttribute("fill", "#ccc");

  dotGrid.appendChild(dot);
  svg.appendChild(dotGrid);

  const background = document.createElementNS("http://www.w3.org/2000/svg", "rect");
  background.setAttribute("width", "100%");
  background.setAttribute("height", "100%");
  background.setAttribute("fill", "url(#dotGrid)");
  svg.appendChild(background);

  const numPoints = parseInt(controls.points.value);
  const chaos = parseInt(controls.chaos.value) / 100;
  const rotation = parseInt(controls.rotation.value);
  const hue = parseInt(controls.hue.value);
  const saturation = parseInt(controls.saturation.value);
  const lightness = parseInt(controls.lightness.value);
  const roundness = parseInt(controls.roundness.value) / 100;
  const strokeWidth = parseInt(controls.strokeWidth.value);
  const fill = controls.fill.checked;

  if (fixedPoints.length !== numPoints || controls.chaos.dataset.lastValue !== controls.chaos.value) {
    fixedPoints = generatePoints(numPoints, chaos, radius, centerX, centerY);
    controls.chaos.dataset.lastValue = controls.chaos.value;
    baseRotation = rotation;
  }

  const rotatedPoints = fixedPoints.map(point => 
    rotatePoint(point[0], point[1], centerX, centerY, rotation - baseRotation)
  );

  const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
  let d = `M ${rotatedPoints[0][0]} ${rotatedPoints[0][1]}`;

  for (let i = 1; i <= numPoints; i++) {
    const current = rotatedPoints[i % numPoints];
    const next = rotatedPoints[(i + 1) % numPoints];
    const prev = rotatedPoints[(i - 1 + numPoints) % numPoints];

    if (roundness > 0) {
      const dx1 = current[0] - prev[0];
      const dy1 = current[1] - prev[1];
      const dx2 = next[0] - current[0];
      const dy2 = next[1] - current[1];

      const len1 = Math.sqrt(dx1 * dx1 + dy1 * dy1);
      const len2 = Math.sqrt(dx2 * dx2 + dy2 * dy2);

      const controlLen = Math.min(len1, len2) * roundness;

      const control1X = current[0] - dx1 * controlLen / len1;
      const control1Y = current[1] - dy1 * controlLen / len1;
      const control2X = current[0] + dx2 * controlLen / len2;
      const control2Y = current[1] + dy2 * controlLen / len2;

      d += ` C ${control1X} ${control1Y}, ${control2X} ${control2Y}, ${next[0]} ${next[1]}`;
    } else {
      d += ` L ${current[0]} ${current[1]}`;
    }
  }

  path.setAttribute("d", d);
  path.setAttribute("stroke", `hsl(${hue}, ${saturation}%, ${lightness}%)`);
  path.setAttribute("stroke-width", strokeWidth * 3);
  path.setAttribute("fill", fill ? `hsl(${hue}, ${saturation}%, ${lightness}%)` : "none");
  path.style.transition = "all 0.3s ease";

  svg.appendChild(path);
}

function shuffleControls() {
  Object.values(controls).forEach(control => {
    if (control.type === "range") {
      control.value = Math.floor(Math.random() * (parseInt(control.max) - parseInt(control.min) + 1)) + parseInt(control.min);
    } else if (control.type === "checkbox") {
      control.checked = Math.random() > 0.5;
    }
  });
  fixedPoints = []; // Reset fixed points when shuffling
  baseRotation = parseInt(controls.rotation.value);
  updatePattern();
}

Object.values(controls).forEach(control => {
  control.addEventListener("input", updatePattern);
});

shuffleButton.addEventListener("click", shuffleControls);

window.addEventListener("resize", updatePattern);

updatePattern();