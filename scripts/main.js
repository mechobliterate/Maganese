import {
  FaceLandmarker,
  FilesetResolver,
} from "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/vision_bundle.js";

const elements = {
  panelContent: document.getElementById("panel-content"),
  btnToggleUI: document.getElementById("btn-toggle-ui"),
  panelHeader: document.getElementById("panel-header"),
  video: document.getElementById("video"),
  rawXDisp: document.getElementById("raw-x"),
  rawYDisp: document.getElementById("raw-y"),
  rawZDisp: document.getElementById("raw-z"),
  rangeMove: document.getElementById("range-move"),
  rangeDepth: document.getElementById("range-depth"),
  rangeZSens: document.getElementById("range-z-sens"),
  rangeHoleDepth: document.getElementById("range-hole-depth"),
  rangeHoleScale: document.getElementById("range-hole-scale"),
  rangeCubeXY: document.getElementById("range-cube-xy"),
  rangeCubeZ: document.getElementById("range-cube-z"),
  rangeLightInt: document.getElementById("range-light-int"),
  selectMode: document.getElementById("select-mode"),
  valMove: document.getElementById("val-move"),
  valDepth: document.getElementById("val-depth"),
  valZSens: document.getElementById("val-z-sens"),
  valHoleDepth: document.getElementById("val-hole-depth"),
  valHoleScale: document.getElementById("val-hole-scale"),
  valLightInt: document.getElementById("val-light-int"),
  valCubeXY: document.getElementById("val-cube-xy"),
  valCubeZ: document.getElementById("val-cube-z"),
  btnCalibrate: document.getElementById("btn-calibrate"),
  btnShadow: document.getElementById("btn-shadow"),
  btnRandomLight: document.getElementById("btn-random-light"),
  btnToggleFrame: document.getElementById("btn-toggle-frame"),
  inputFile: document.getElementById("input-file"),
  btnFullscreen: document.getElementById("btn-fullscreen"),
};

let state = {
  offset: { x: 0.5, y: 0.5 },
  currentRaw: { x: 0.5, y: 0.5, z: 0.0 },
  smoothedZ: 0.0,
  shadowsEnabled: true,
  frameEnabled: true,
};

const toggleUI = () => {
  elements.panelContent.classList.toggle("collapsed");
  elements.btnToggleUI.innerText = elements.panelContent.classList.contains(
    "collapsed",
  )
    ? "+"
    : "−";
};

elements.btnToggleUI.onclick = (e) => {
  e.stopPropagation();
  toggleUI();
};

elements.panelHeader.addEventListener("dblclick", toggleUI);

const tabs = document.querySelectorAll(".tab-btn");
const contents = document.querySelectorAll(".tab-content");

tabs.forEach((tab) => {
  tab.onclick = () => {
    tabs.forEach((t) => t.classList.remove("active"));
    contents.forEach((c) => c.classList.remove("active"));
    tab.classList.add("active");
    document.getElementById(tab.dataset.tab).classList.add("active");
  };
});

// Fullscreen functionality
const toggleFullscreen = () => {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen().catch((err) => {
      console.error("Error attempting to enable fullscreen:", err);
    });
  } else {
    if (document.exitFullscreen) {
      document.exitFullscreen();
    }
  }
};

elements.btnFullscreen.onclick = toggleFullscreen;

// Update fullscreen button icon when fullscreen state changes
document.addEventListener("fullscreenchange", () => {
  const svg = elements.btnFullscreen.querySelector("svg");
  if (document.fullscreenElement) {
    // Exit fullscreen icon
    svg.innerHTML =
      '<path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3" stroke="currentColor" stroke-width="2" fill="none"/>';
  } else {
    // Enter fullscreen icon
    svg.innerHTML =
      '<path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" stroke="currentColor" stroke-width="2" fill="none"/>';
  }
});

const canvas = document.getElementById("three-canvas");
const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: true,
  alpha: true,
});

renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.2;

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
  45,
  window.innerWidth / window.innerHeight,
  0.1,
  100,
);

const uiCanvas = document.createElement("canvas");
const uiCtx = uiCanvas.getContext("2d");
const uiTexture = new THREE.CanvasTexture(uiCanvas);
uiTexture.colorSpace = THREE.SRGBColorSpace;

function updateUIFrameTexture() {
  const tex = currentTexture.image;
  if (!tex) return;

  uiCanvas.width = tex.width;
  uiCanvas.height = tex.height;
  const w = uiCanvas.width;
  const h = uiCanvas.height;

  uiCtx.clearRect(0, 0, w, h);
  uiCtx.drawImage(tex, 0, 0);

  const aspect = window.innerWidth / window.innerHeight;
  let sw, sh;

  if (elements.selectMode.value === "CUBE") {
    const size = parseFloat(elements.rangeCubeXY.value);
    sw = (size / (aspect * 2)) * w;
    sh = (size / 2) * h;
  } else {
    const scale = parseFloat(elements.rangeHoleScale.value);
    sw = w * scale;
    sh = h * scale;
  }

  const x = (w - sw) / 2;
  const y = (h - sh) / 2;

  const titleH = Math.max(22, h / 45);
  const menuH = Math.max(20, h / 50);
  const borderWidth = Math.max(4, w / 400);
  const radius = 8;
  const startX = x - borderWidth;
  const totalW = sw + borderWidth * 2;

  uiCtx.save();

  uiCtx.globalAlpha = 0.88;
  const glassGrad = uiCtx.createLinearGradient(
    startX,
    y - titleH - menuH,
    startX,
    y + sh,
  );
  glassGrad.addColorStop(0, "rgba(255, 255, 255, 0.25)");
  glassGrad.addColorStop(1, "rgba(255, 255, 255, 0.1)");
  uiCtx.fillStyle = glassGrad;
  uiCtx.beginPath();
  uiCtx.roundRect(
    startX,
    y - titleH - menuH,
    totalW,
    sh + titleH + menuH + borderWidth,
    radius,
  );
  uiCtx.fill();
  uiCtx.strokeStyle = "rgba(255, 255, 255, 0.3)";
  uiCtx.lineWidth = 0.8;
  uiCtx.stroke();

  uiCtx.globalAlpha = 1.0;
  uiCtx.fillStyle = "white";
  uiCtx.font = `500 ${titleH * 0.55}px sans-serif`;
  uiCtx.textAlign = "left";
  uiCtx.fillText("Photo.app", startX + 12, y - menuH - titleH / 2 + 5);

  uiCtx.fillStyle = "rgba(255, 255, 255, 0.75)";
  uiCtx.fillRect(x, y - menuH, sw, menuH);
  uiCtx.fillStyle = "#333";
  uiCtx.font = `${menuH * 0.6}px sans-serif`;

  const menus = ["File", "Edit", "View", "Help"];
  let curX = x + 12;
  menus.forEach((m) => {
    uiCtx.fillText(m, curX, y - menuH / 2 + 5);
    curX += uiCtx.measureText(m).width + 15;
  });

  const btnW = titleH * 1.0;
  const btnH = titleH * 0.7;
  const btnY = y - menuH - titleH + (titleH - btnH) / 2;

  const drawSmallBtn = (bx, bg, icon) => {
    uiCtx.fillStyle = bg;
    uiCtx.beginPath();
    uiCtx.roundRect(bx, btnY, btnW, btnH, 3);
    uiCtx.fill();
    uiCtx.strokeStyle = "white";
    uiCtx.lineWidth = 1.2;
    icon(bx, btnY, btnW, btnH);
  };

  const cX = startX + totalW - btnW - 8;
  const mX = cX - btnW - 4;
  const miX = mX - btnW - 4;

  drawSmallBtn(cX, "rgba(230, 80, 80, 0.9)", (bx, by, bw, bh) => {
    const p = 6;
    uiCtx.beginPath();
    uiCtx.moveTo(bx + p, by + p);
    uiCtx.lineTo(bx + bw - p, by + bh - p);
    uiCtx.moveTo(bx + bw - p, by + p);
    uiCtx.lineTo(bx + p, by + bh - p);
    uiCtx.stroke();
  });

  drawSmallBtn(mX, "rgba(255, 255, 255, 0.1)", (bx, by, bw, bh) => {
    uiCtx.strokeRect(bx + 6, by + 5, bw - 12, bh - 10);
  });

  drawSmallBtn(miX, "rgba(255, 255, 255, 0.1)", (bx, by, bw, bh) => {
    uiCtx.beginPath();
    uiCtx.moveTo(bx + 6, by + bh - 5);
    uiCtx.lineTo(bx + bw - 6, by + bh - 5);
    uiCtx.stroke();
  });

  uiCtx.restore();
  uiTexture.needsUpdate = true;
}

const textureLoader = new THREE.TextureLoader();
let currentTexture = textureLoader.load("assets/images/default.jpg", (tex) => {
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = renderer.capabilities.getMaxAnisotropy();
  updateUIFrameTexture();
});

const spotLight = new THREE.SpotLight(0xffffff, 150);
spotLight.castShadow = true;
spotLight.angle = Math.PI / 6;
spotLight.penumbra = 0.1;
spotLight.decay = 1.5;
spotLight.distance = 60;
spotLight.shadow.mapSize.set(4096, 4096);
spotLight.shadow.bias = -0.0001;
spotLight.shadow.normalBias = 0.02;
scene.add(spotLight);

const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
scene.add(ambientLight);

const createMat = (tex) =>
  new THREE.MeshStandardMaterial({
    map: tex,
    roughness: 0.8,
    metalness: 0.1,
    side: THREE.DoubleSide,
    transparent: true,
  });

let uiMat = createMat(uiTexture);
let commonMat = createMat(currentTexture);

let wall = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), uiMat);
wall.receiveShadow = true;
wall.castShadow = true;
scene.add(wall);

const cubeGroup = new THREE.Group();
const cubePlanes = ["front", "top", "bottom", "left", "right"].reduce(
  (acc, side) => {
    const p = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), commonMat);
    p.castShadow = true;
    p.receiveShadow = true;
    cubeGroup.add(p);
    acc[side] = p;
    return acc;
  },
  {},
);
scene.add(cubeGroup);

const holeGroup = new THREE.Group();
const holePlanes = ["back", "top", "bottom", "left", "right"].reduce(
  (acc, side) => {
    const p = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), commonMat);
    p.castShadow = true;
    p.receiveShadow = true;
    holeGroup.add(p);
    acc[side] = p;
    return acc;
  },
  {},
);
scene.add(holeGroup);

function updateUV() {
  const aspect = window.innerWidth / window.innerHeight;
  const wScale = aspect * 2;

  const updateObjUV = (mesh) => {
    if (!mesh.visible) return;
    const uv = mesh.geometry.attributes.uv;
    const pos = mesh.geometry.attributes.position;
    mesh.updateMatrixWorld();

    for (let i = 0; i < pos.count; i++) {
      const v = new THREE.Vector3().fromBufferAttribute(pos, i);
      mesh.localToWorld(v);
      uv.setXY(i, v.x / wScale + 0.5, v.y / 2 + 0.5);
    }
    uv.needsUpdate = true;
  };

  updateObjUV(wall);
  if (cubeGroup.visible) Object.values(cubePlanes).forEach(updateObjUV);
  if (holeGroup.visible) Object.values(holePlanes).forEach(updateObjUV);
}

function applyMode() {
  const mode = elements.selectMode.value;
  const aspect = window.innerWidth / window.innerHeight;

  document.getElementById("cube-params").style.display =
    mode === "CUBE" ? "block" : "none";
  document.getElementById("hole-params").style.display =
    mode === "HOLE" ? "block" : "none";

  if (mode === "CUBE") {
    wall.castShadow = false;
    wall.geometry.dispose();
    wall.geometry = new THREE.PlaneGeometry(aspect * 2, 2);
    cubeGroup.visible = true;
    holeGroup.visible = false;

    const sXY = parseFloat(elements.rangeCubeXY.value);
    const sZ = parseFloat(elements.rangeCubeZ.value);

    cubePlanes.front.scale.set(sXY, sXY, 1);
    cubePlanes.front.position.set(0, 0, sZ);

    cubePlanes.top.rotation.x = -Math.PI / 2;
    cubePlanes.top.scale.set(sXY, sZ, 1);
    cubePlanes.top.position.set(0, sXY / 2, sZ / 2);

    cubePlanes.bottom.rotation.x = Math.PI / 2;
    cubePlanes.bottom.scale.set(sXY, sZ, 1);
    cubePlanes.bottom.position.set(0, -sXY / 2, sZ / 2);

    cubePlanes.left.rotation.y = -Math.PI / 2;
    cubePlanes.left.scale.set(sZ, sXY, 1);
    cubePlanes.left.position.set(-sXY / 2, 0, sZ / 2);

    cubePlanes.right.rotation.y = Math.PI / 2;
    cubePlanes.right.scale.set(sZ, sXY, 1);
    cubePlanes.right.position.set(sXY / 2, 0, sZ / 2);

    spotLight.position.set(5, 5, 10);
    spotLight.lookAt(0, 0, 0);
  } else {
    wall.castShadow = true;
    const hS = parseFloat(elements.rangeHoleScale.value);
    const d = parseFloat(elements.rangeHoleDepth.value);

    wall.geometry.dispose();
    const shape = new THREE.Shape();
    const w = aspect * 2;
    const h = 2;

    shape.moveTo(-w / 2, -h / 2);
    shape.lineTo(w / 2, -h / 2);
    shape.lineTo(w / 2, h / 2);
    shape.lineTo(-w / 2, h / 2);

    const hole = new THREE.Path();
    const hw = (w * hS) / 2;
    const hh = (h * hS) / 2;
    hole.moveTo(-hw, -hh);
    hole.lineTo(-hw, hh);
    hole.lineTo(hw, hh);
    hole.lineTo(hw, -hh);
    shape.holes.push(hole);

    wall.geometry = new THREE.ShapeGeometry(shape);
    cubeGroup.visible = false;
    holeGroup.visible = true;

    const whw = w * hS;
    const whh = h * hS;

    holePlanes.back.scale.set(whw, whh, 1);
    holePlanes.back.position.set(0, 0, -d);

    holePlanes.top.rotation.x = Math.PI / 2;
    holePlanes.top.scale.set(whw, d, 1);
    holePlanes.top.position.set(0, whh / 2, -d / 2);

    holePlanes.bottom.rotation.x = -Math.PI / 2;
    holePlanes.bottom.scale.set(whw, d, 1);
    holePlanes.bottom.position.set(0, -whh / 2, -d / 2);

    holePlanes.left.rotation.y = Math.PI / 2;
    holePlanes.left.scale.set(d, whh, 1);
    holePlanes.left.position.set(-whw / 2, 0, -d / 2);

    holePlanes.right.rotation.y = -Math.PI / 2;
    holePlanes.right.scale.set(d, whh, 1);
    holePlanes.right.position.set(whw / 2, 0, -d / 2);

    spotLight.position.set(8, 8, 12);
    spotLight.lookAt(0, 0, -d / 2);
  }

  updateUIFrameTexture();
  updateUV();
}

elements.btnToggleFrame.onclick = () => {
  state.frameEnabled = !state.frameEnabled;
  wall.material = state.frameEnabled ? uiMat : commonMat;
  elements.btnToggleFrame.innerText = `Frame: ${state.frameEnabled ? "On" : "Off"}`;
};

elements.btnShadow.onclick = () => {
  state.shadowsEnabled = !state.shadowsEnabled;
  renderer.shadowMap.enabled = state.shadowsEnabled;

  const MaterialClass = state.shadowsEnabled
    ? THREE.MeshStandardMaterial
    : THREE.MeshBasicMaterial;

  wall.material = new MaterialClass({
    map: state.frameEnabled ? uiTexture : currentTexture,
    side: THREE.DoubleSide,
    transparent: true,
  });

  [...Object.values(cubePlanes), ...Object.values(holePlanes)].forEach((m) => {
    m.material = new MaterialClass({
      map: currentTexture,
      side: THREE.DoubleSide,
    });

    if (state.shadowsEnabled) {
      m.material.roughness = 0.8;
      m.material.metalness = 0.1;
    }
  });

  spotLight.visible = state.shadowsEnabled;
  ambientLight.intensity = state.shadowsEnabled ? 0.4 : 1.0;
  elements.btnShadow.innerText = `Light: ${state.shadowsEnabled ? "On" : "Off"}`;

  if (state.frameEnabled) uiMat = wall.material;
  else commonMat = wall.material;
};

const updateValues = () => {
  elements.valMove.innerText = elements.rangeMove.value;
  elements.valDepth.innerText = elements.rangeDepth.value;
  elements.valZSens.innerText = elements.rangeZSens.value;
  elements.valHoleDepth.innerText = elements.rangeHoleDepth.value;
  elements.valHoleScale.innerText = elements.rangeHoleScale.value;
  elements.valCubeXY.innerText = elements.rangeCubeXY.value;
  elements.valCubeZ.innerText = elements.rangeCubeZ.value;
  elements.valLightInt.innerText = elements.rangeLightInt.value;
  spotLight.intensity = parseFloat(elements.rangeLightInt.value);
  applyMode();
};

[
  elements.rangeMove,
  elements.rangeDepth,
  elements.rangeZSens,
  elements.rangeHoleDepth,
  elements.rangeHoleScale,
  elements.rangeCubeXY,
  elements.rangeCubeZ,
  elements.rangeLightInt,
].forEach((r) => {
  r.oninput = updateValues;
});

elements.selectMode.onchange = applyMode;

elements.inputFile.onchange = (e) => {
  const file = e.target.files[0];
  if (file) {
    textureLoader.load(URL.createObjectURL(file), (tex) => {
      tex.colorSpace = THREE.SRGBColorSpace;
      currentTexture = tex;
      commonMat.map = tex;
      applyMode();
    });
  }
};

elements.btnRandomLight.onclick = () => {
  spotLight.position.set(
    (Math.random() - 0.5) * 20,
    (Math.random() - 0.5) * 20,
    5 + Math.random() * 15,
  );
  spotLight.lookAt(
    0,
    0,
    elements.selectMode.value === "HOLE"
      ? -parseFloat(elements.rangeHoleDepth.value) / 2
      : 0,
  );
};

elements.btnCalibrate.onclick = () => {
  state.offset.x = state.currentRaw.x;
  state.offset.y = state.currentRaw.y;
};

window.addEventListener("resize", () => {
  renderer.setSize(window.innerWidth, window.innerHeight);
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  applyMode();
});

async function main() {
  const vision = await FilesetResolver.forVisionTasks(
    "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm",
  );

  const faceLandmarker = await FaceLandmarker.createFromOptions(vision, {
    baseOptions: {
      modelAssetPath:
        "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task",
      delegate: "GPU",
    },
    runningMode: "VIDEO",
    numFaces: 1,
  });

  const stream = await navigator.mediaDevices.getUserMedia({
    video: { facingMode: "user" },
  });

  elements.video.srcObject = stream;
  await elements.video.play();

  function loop() {
    const result = faceLandmarker.detectForVideo(
      elements.video,
      performance.now(),
    );

    if (result.faceLandmarks?.[0]) {
      const nose = result.faceLandmarks[0][1];
      state.currentRaw = nose;

      elements.rawXDisp.textContent = nose.x.toFixed(2);
      elements.rawYDisp.textContent = nose.y.toFixed(2);
      elements.rawZDisp.textContent = (nose.z * 10).toFixed(2);

      const hX =
        (nose.x - state.offset.x) * -2 * parseFloat(elements.rangeMove.value);
      const hY =
        (nose.y - state.offset.y) * -2 * parseFloat(elements.rangeMove.value);

      state.smoothedZ += (nose.z - state.smoothedZ) * 0.2;
      const hZ =
        parseFloat(elements.rangeDepth.value) +
        state.smoothedZ * parseFloat(elements.rangeZSens.value);

      camera.position.set(hX, hY, Math.max(0.2, hZ));

      const aspect = window.innerWidth / window.innerHeight;
      const nOverZ = camera.near / Math.max(0.2, hZ);

      camera.projectionMatrix.makePerspective(
        nOverZ * (-aspect - hX),
        nOverZ * (aspect - hX),
        nOverZ * (1 - hY),
        nOverZ * (-1 - hY),
        camera.near,
        camera.far,
      );
    }

    renderer.render(scene, camera);
    requestAnimationFrame(loop);
  }

  applyMode();
  loop();
}

main();
