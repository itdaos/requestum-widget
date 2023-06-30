import "./style.css";

let isDrawing = false;
let isDraggingStart = false;
let isDraggingEnd = false;
let isDraggingCurvePoint = false;
let activeLineIndex = -1;
const lines = [];
const curvePointRadius = 4;
const clickThreshold = 10;

const canvas = document.getElementById("canvas");
const context = canvas.getContext("2d");
const imageContainer = document.getElementById("imageContainer");

const squareSize = 8;

imageContainer.addEventListener("mousedown", handleMouseDown);
imageContainer.addEventListener("mousemove", handleMouseMove);
imageContainer.addEventListener("mouseup", handleMouseUp);

const mainImage = document.getElementById("mainImage");
canvas.width = mainImage.clientWidth;
canvas.height = mainImage.clientHeight;

function handleMouseDown(event) {
  event.preventDefault();
  const { offsetX, offsetY } = getCoordinates(event);

  activeLineIndex = -1;
  isDraggingStart = false;
  isDraggingEnd = false;
  isDraggingCurvePoint = false;

  for (let i = 0; i < lines.length; i++) {
    const { startPoint, endPoint, curvePoint } = lines[i];

    const startSquareBound = getSquareBounds(startPoint);
    const endSquareBound = getSquareBounds(endPoint);

    if (isPointInBounds({ x: offsetX, y: offsetY }, startSquareBound)) {
      activeLineIndex = i;
      isDraggingStart = true;
      break;
    } else if (isPointInBounds({ x: offsetX, y: offsetY }, endSquareBound)) {
      activeLineIndex = i;
      isDraggingEnd = true;
      break;
    } else {
      const distance = calculateDistance(
        { x: offsetX, y: offsetY },
        curvePoint
      );
      if (distance <= clickThreshold) {
        activeLineIndex = i;
        isDraggingCurvePoint = true;
        break;
      }
    }
  }

  if (activeLineIndex === -1) {
    isDrawing = true;
    const startPoint = { x: offsetX, y: offsetY };
    const endPoint = { x: offsetX, y: offsetY };
    const curvePoint = {
      x: (startPoint.x + endPoint.x) / 2,
      y: (startPoint.y + endPoint.y) / 2,
    };
    lines.push({ startPoint, endPoint, curvePoint });
    activeLineIndex = lines.length - 1;
    console.log(startPoint, endPoint);
  }
}

function handleMouseMove(event) {
  const { offsetX, offsetY } = getCoordinates(event);

  if (isDraggingStart && activeLineIndex !== -1) {
    lines[activeLineIndex].startPoint = { x: offsetX, y: offsetY };
    redrawCurve();
  } else if (isDraggingEnd && activeLineIndex !== -1) {
    lines[activeLineIndex].endPoint = { x: offsetX, y: offsetY };
    redrawCurve();
  } else if (isDraggingCurvePoint && activeLineIndex !== -1) {
    lines[activeLineIndex].curvePoint = { x: offsetX, y: offsetY };
    redrawCurve();
  } else if (isDrawing && activeLineIndex !== -1) {
    const currLine = lines[activeLineIndex];
    currLine.curvePoint = {
      x: (offsetX + currLine.startPoint.x) / 2,
      y: (offsetY + currLine.startPoint.y) / 2,
    };
    currLine.endPoint = { x: offsetX, y: offsetY };
    redrawCurve();
  }
}

function handleMouseUp() {
  isDrawing = false;
  isDraggingStart = false;
  isDraggingEnd = false;
  isDraggingCurvePoint = false;
  activeLineIndex = -1;
}

function redrawCurve() {
  context.clearRect(0, 0, canvas.width, canvas.height);

  for (let i = 0; i < lines.length; i++) {
    const { startPoint, endPoint, curvePoint } = lines[i];

    context.beginPath();
    context.moveTo(startPoint.x, startPoint.y);

    const projCurvePoint = calculateProjection(
      curvePoint.x,
      curvePoint.y,
      -endPoint.y + startPoint.y,
      endPoint.x - startPoint.x,
      endPoint.x,
      endPoint.y
    );

    const middlePoint = {
      x: (startPoint.x + endPoint.x) / 2,
      y: (startPoint.y + endPoint.y) / 2,
    };

    context.quadraticCurveTo(
      projCurvePoint.x + 2 * (curvePoint.x - projCurvePoint.x),
      projCurvePoint.y + 2 * (curvePoint.y - projCurvePoint.y),
      // middlePoint.x + 2 * (curvePoint.x - middlePoint.x),
      // middlePoint.y + 2 * (curvePoint.y - middlePoint.y),
      endPoint.x,
      endPoint.y
    );
    context.strokeStyle = "#fafafa"; // Customize the curve color
    context.lineWidth = 2; // Customize the curve width
    context.stroke();

    drawSquare(startPoint);
    drawSquare(endPoint);
    drawCurvePoint(curvePoint);
  }
}

function drawSquare(point) {
  const squareBounds = getSquareBounds(point);
  context.strokeStyle = "red"; // Customize the square color
  context.strokeRect(
    squareBounds.left,
    squareBounds.top,
    squareBounds.width,
    squareBounds.height
  );
}

function getSquareBounds(point) {
  return {
    left: point.x - squareSize / 2,
    top: point.y - squareSize / 2,
    width: squareSize,
    height: squareSize,
  };
}

function isPointInBounds(point, bounds) {
  return (
    point.x >= bounds.left &&
    point.x <= bounds.left + bounds.width &&
    point.y >= bounds.top &&
    point.y <= bounds.top + bounds.height
  );
}

function getCoordinates(event) {
  const rect = canvas.getBoundingClientRect();
  return {
    offsetX: event.clientX - rect.left,
    offsetY: event.clientY - rect.top,
  };
}

function calculateDistance(point1, point2) {
  const dx = point2.x - point1.x;
  const dy = point2.y - point1.y;
  return Math.sqrt(dx * dx + dy * dy);
}

function drawCurvePoint(point) {
  context.beginPath();
  context.arc(point.x, point.y, curvePointRadius, 0, 2 * Math.PI);
  context.strokeStyle = "red"; // Customize the curve point border color
  context.lineWidth = 1;
  context.stroke();
}

// Function to calculate the projection of a point (x, y) on a line defined by normal vector (A, B) and a point that goes through (pointX, pointY)
function calculateProjection(x, y, A, B, pointX, pointY) {
  // Calculate the squared length of the normal vector
  const normalVectorLengthSquared = A * A + B * B;
  const C = -(A * pointX + B * pointY);

  // Calculate the projection of the point on the line
  const projectedPoint = {
    x: (B * (B * x - A * y) - A * C) / normalVectorLengthSquared,
    y: (A * (-B * x + A * y) - B * C) / normalVectorLengthSquared,
  };

  return projectedPoint;
}
