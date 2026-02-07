// src/utils/shapeUtils.js

// 1. Point Generators
export const getStarPoints = (spikes = 5, outerRadius = 50, innerRadius = 25) => {
  const points = [];
  const step = Math.PI / spikes;
  let angle = -Math.PI / 2;

  for (let i = 0; i < 2 * spikes; i++) {
    const r = (i % 2 === 0) ? outerRadius : innerRadius;
    const x = r * Math.cos(angle);
    const y = r * Math.sin(angle);
    points.push({ x, y });
    angle += step;
  }
  return points;
};

export const getPolygonPoints = (sides = 5, radius = 50) => {
  const points = [];
  const step = (Math.PI * 2) / sides;
  let angle = -Math.PI / 2;

  for (let i = 0; i < sides; i++) {
    const x = radius * Math.cos(angle);
    const y = radius * Math.sin(angle);
    points.push({ x, y });
    angle += step;
  }
  return points;
};

export const getTrianglePoints = (width, height) => {
  return [
    { x: 0, y: -height / 2 },
    { x: -width / 2, y: height / 2 },
    { x: width / 2, y: height / 2 }
  ];
};

// 2. Rounding Logic (Converts Points -> SVG Path Data with Arcs)
export const getRoundedPathFromPoints = (points, radius) => {
  if (!points || points.length === 0) return "";
  if (radius === 0) {
    return `M ${points.map(p => `${p.x},${p.y}`).join(' L ')} z`;
  }

  const len = points.length;
  let path = "";

  for (let i = 0; i < len; i++) {
    const p1 = points[i]; // Current Vertex
    const p0 = points[(i - 1 + len) % len]; // Previous Vertex
    const p2 = points[(i + 1) % len]; // Next Vertex

    // Vectors
    const v1 = { x: p0.x - p1.x, y: p0.y - p1.y };
    const v2 = { x: p2.x - p1.x, y: p2.y - p1.y };

    const len1 = Math.sqrt(v1.x * v1.x + v1.y * v1.y);
    const len2 = Math.sqrt(v2.x * v2.x + v2.y * v2.y);

    // Clamp radius to not exceed half the side length
    const r = Math.min(radius, len1 / 2, len2 / 2);

    // Normalize and scale to radius
    const u1 = { x: v1.x / len1 * r, y: v1.y / len1 * r };
    const u2 = { x: v2.x / len2 * r, y: v2.y / len2 * r };

    // Start of curve (on the incoming line)
    const startX = p1.x + u1.x;
    const startY = p1.y + u1.y;

    // End of curve (on the outgoing line)
    const endX = p1.x + u2.x;
    const endY = p1.y + u2.y;

    if (i === 0) {
      path += `M ${startX},${startY} `;
    } else {
      path += `L ${startX},${startY} `;
    }

    // Quadratic Bezier curve using Vertex (p1) as control point
    path += `Q ${p1.x},${p1.y} ${endX},${endY} `;
  }

  path += "z"; // Close path
  return path;
};

export const getArrowPoints = (width, height) => {
  const headWidth = width * 0.4;
  const tailWidth = height * 0.4;
  // Arrow pointing right
  return [
    { x: -width/2, y: -tailWidth/2 },             // Tail top-left
    { x: width/2 - headWidth, y: -tailWidth/2 },  // Tail top-right (meet head)
    { x: width/2 - headWidth, y: -height/2 },     // Head top wing
    { x: width/2, y: 0 },                         // Tip
    { x: width/2 - headWidth, y: height/2 },      // Head bottom wing
    { x: width/2 - headWidth, y: tailWidth/2 },   // Tail bottom-right
    { x: -width/2, y: tailWidth/2 }               // Tail bottom-left
  ];
};

export const getDiamondPoints = (width, height) => {
  return [
    { x: 0, y: -height/2 }, // Top
    { x: width/2, y: 0 },   // Right
    { x: 0, y: height/2 },  // Bottom
    { x: -width/2, y: 0 }   // Left
  ];
};

export const getTrapezoidPoints = (width, height) => {
  const topWidth = width * 0.6;
  return [
    { x: -topWidth/2, y: -height/2 }, // Top-Left
    { x: topWidth/2, y: -height/2 },  // Top-Right
    { x: width/2, y: height/2 },      // Bottom-Right
    { x: -width/2, y: height/2 }      // Bottom-Left
  ];
};

export const getLightningPoints = (width, height) => {
  const w = width / 2;
  const h = height / 2;
  return [
    { x: w * 0.4, y: -h },        // 1. Top Right
    { x: -w * 0.2, y: -h * 0.1 }, // 2. Middle Left (Neck)
    { x: w * 0.4, y: -h * 0.1 },  // 3. Middle Right (Jut out)
    { x: -w * 0.3, y: h },        // 4. Bottom Tip
    { x: w * 0.1, y: h * 0.1 },   // 5. Middle Right (Neck Lower)
    { x: -w * 0.6, y: h * 0.1 }   // 6. Middle Left (Jut out Lower)
  ];
};

export const getHeartPath = (width, height) => {
  // SVG Path for a heart
  const w = width / 2;
  const h = height / 2;
  // This is a standard Bezier heart shape
  return `
    M 0 ${-h * 0.3}
    C 0 ${-h} ${-w} ${-h} ${-w} ${-h * 0.3}
    C ${-w} ${h * 0.2} ${-w * 0.5} ${h * 0.6} 0 ${h}
    C ${w * 0.5} ${h * 0.6} ${w} ${h * 0.2} ${w} ${-h * 0.3}
    C ${w} ${-h} 0 ${-h} 0 ${-h * 0.3}
    z
  `.replace(/\s+/g, ' ').trim();
};

export const getBubblePath = (width, height) => {
  const r = 10; // corner radius
  const w = width / 2;
  const h = height / 2;
  const tailSize = 20;
  
  // Rect with rounded corners and a tail at bottom-right
  return `
    M ${-w + r} ${-h}
    L ${w - r} ${-h}
    Q ${w} ${-h} ${w} ${-h + r}
    L ${w} ${h - r - tailSize}
    Q ${w} ${h - tailSize} ${w - r} ${h - tailSize}
    L ${w * 0.4} ${h - tailSize}
    L ${w * 0.2} ${h}
    L ${w * 0.1} ${h - tailSize}
    L ${-w + r} ${h - tailSize}
    Q ${-w} ${h - tailSize} ${-w} ${h - r - tailSize}
    L ${-w} ${-h + r}
    Q ${-w} ${-h} ${-w + r} ${-h}
    z
  `.replace(/\s+/g, ' ').trim();
};