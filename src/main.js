import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import "./style.css";

const sceneRoot = document.querySelector("#scene");
const ruleNumber = document.querySelector("#rule-number");
const ruleTitle = document.querySelector("#rule-title");
const ruleCopy = document.querySelector("#rule-copy");
const subtitle = document.querySelector("#subtitle");
const messageLabel = document.querySelector("#message-label");
const messageText = document.querySelector("#message-text");
const choiceForm = document.querySelector("#choice-form");
let answerInput = document.querySelector("#answer-input");
const suggestions = document.querySelector("#suggestions");
const chatLog = document.querySelector("#chat-log");
const resetButton = document.querySelector("#reset-button");
const progressDots = [...document.querySelectorAll("[data-rule-dot]")];

const colors = {
  sky: 0xbfe6e5,
  wall: 0xf5d7b5,
  floor: 0xd99f78,
  wood: 0x936244,
  table: 0xd58b5f,
  ceramic: 0xfff2d7,
  shirtBlue: 0x71aeb0,
  shirtYellow: 0xf4bd62,
  shirtGreen: 0x8bb78b0,
  skin: 0xf3c2a6,
  hair: 0x5d463a,
};

const topics = [
  {
    id: "food",
    title: "长辈把一块菜夹进你的碗里。",
    copy: "你已经吃饱了，但所有人的目光都落在这双筷子上。试着输入你想说的话。",
    placeholder: "例如：谢谢，我吃饱了",
    suggestions: ["谢谢，我吃饱了", "不要了，谢谢"],
    evaluate(answer) {
      const refuses = /不要|不用|吃不下|够了|饱了|不想吃/.test(answer);
      return refuses
        ? {
            label: "一点点坚持",
            message: "你说了“不要”。姑妈笑着说“就一块”，然后又夹了一块。",
            npc: "多吃点嘛，女孩子不要太克制。",
            anomaly: 1,
          }
        : {
            label: "先让饭局继续",
            message: "你说了“谢谢”。那块菜安稳地停在碗里，大家继续聊别的话题。",
            npc: "这才对嘛，多吃一点才有精神。",
            anomaly: 0.3,
          };
    },
  },
  {
    id: "work",
    title: "大家问起你现在做什么工作。",
    copy: "“还是要找个稳定的。”话题已经替你准备好了答案。你可以说出真正的工作。",
    placeholder: "例如：我在做独立设计",
    suggestions: ["我在考公", "我是一名老师"],
    evaluate(answer) {
      const conventional = /考公|考编|公务员|事业单位|编制|老师|教师|医生|护士|国企|银行|稳定/.test(answer);
      return conventional
        ? {
            label: "被允许的答案",
            message: "你给出了一个大家听得懂的答案。桌边的气氛立刻变得轻松。",
            npc: "稳定一点好，至少不用让家里担心。",
            anomaly: 0.4,
          }
        : {
            label: "答案变窄了",
            message: "你说出自己的工作。空气停了一秒，旁边的人开始交换眼神。",
            npc: "自由职业啊……那以后怎么办？还是得考虑稳定。",
            gossip: "“她这个工作，听起来好像不太稳定。”",
            anomaly: 1.4,
          };
    },
  },
  {
    id: "marriage",
    title: "话题自然地转到了婚恋。",
    copy: "“有对象了吗？”“什么时候结婚？”你可以输入一个高情商回答，也可以说出真实想法。",
    placeholder: "例如：还在了解，顺其自然",
    suggestions: ["还在考虑", "正在了解，顺其自然"],
    evaluate(answer) {
      const softAnswer = /考虑|了解|顺其自然|还没有|再看看|以后再说|正在谈|在谈/.test(answer);
      return softAnswer
        ? {
            label: "把自己放回安全区",
            message: "你用了一个大家熟悉的回答。问题暂时被放过，饭桌重新热闹起来。",
            npc: "嗯，慢慢来，合适最重要。",
            anomaly: 0.5,
          }
        : {
            label: "不被允许的答案",
            message: "你说出了真实想法。没有人直接反驳，但每个人都开始替你解释。",
            npc: "你现在还年轻，别把话说得太绝对。",
            gossip: "“她是不是想得太多了？”",
            anomaly: 1.7,
          };
    },
  },
];

let currentTopic = 0;
let totalPressure = 0;
let finished = false;
const personPlaceholders = {};

const scene = new THREE.Scene();
scene.background = new THREE.Color(colors.sky);

const camera = new THREE.PerspectiveCamera(64, window.innerWidth / window.innerHeight, 0.1, 100);
camera.position.set(0, 2.05, 6.6);

const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
sceneRoot.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.target.set(0, 1.52, -2.05);
controls.enableDamping = true;
controls.dampingFactor = 0.08;
controls.enablePan = false;
controls.minDistance = 4.2;
controls.maxDistance = 6.4;
controls.minAzimuthAngle = -Math.PI * 0.24;
controls.maxAzimuthAngle = Math.PI * 0.24;
controls.minPolarAngle = Math.PI * 0.34;
controls.maxPolarAngle = Math.PI * 0.49;

const room = new THREE.Group();
scene.add(room);

function mat(color, roughness = 0.78) {
  return new THREE.MeshStandardMaterial({ color, roughness });
}

function box(name, size, position, color, options = {}) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(...size), mat(color, options.roughness));
  mesh.name = name;
  mesh.position.set(...position);
  mesh.castShadow = options.castShadow ?? true;
  mesh.receiveShadow = options.receiveShadow ?? true;
  room.add(mesh);
  return mesh;
}

function cylinder(name, radius, height, position, color, options = {}) {
  const mesh = new THREE.Mesh(
    new THREE.CylinderGeometry(radius, radius * 0.94, height, 16),
    mat(color, options.roughness),
  );
  mesh.name = name;
  mesh.position.set(...position);
  mesh.castShadow = options.castShadow ?? true;
  mesh.receiveShadow = options.receiveShadow ?? true;
  room.add(mesh);
  return mesh;
}

function createPerson(name, position, shirt, rotation = 0) {
  const person = new THREE.Group();
  person.name = name;
  person.position.set(...position);
  person.rotation.y = rotation;

  const body = new THREE.Mesh(new THREE.BoxGeometry(0.82, 0.98, 0.58), mat(shirt));
  body.position.y = 1.22;
  body.scale.set(1, 1, 0.86);
  body.castShadow = true;

  const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.14, 0.18, 12), mat(colors.skin));
  neck.position.y = 1.82;
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.38, 18, 14), mat(colors.skin));
  head.position.y = 2.16;
  head.scale.set(0.94, 1.04, 0.92);

  const hair = new THREE.Mesh(new THREE.SphereGeometry(0.4, 18, 14), mat(colors.hair));
  hair.position.set(0, 2.34, -0.04);
  hair.scale.set(1.03, 0.68, 0.96);

  const eyeMaterial = mat(0x35455b, 0.45);
  const leftEye = new THREE.Mesh(new THREE.SphereGeometry(0.035, 10, 8), eyeMaterial);
  const rightEye = leftEye.clone();
  leftEye.position.set(-0.13, 2.19, 0.34);
  rightEye.position.set(0.13, 2.19, 0.34);
  const nose = new THREE.Mesh(new THREE.ConeGeometry(0.035, 0.1, 8), mat(0xd99578));
  nose.position.set(0, 2.11, 0.38);
  nose.rotation.x = Math.PI * 0.5;
  const mouth = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.025, 0.025), mat(0xc46a69, 0.5));
  mouth.position.set(0, 2.01, 0.35);

  const armLeft = new THREE.Mesh(new THREE.CapsuleGeometry(0.1, 0.64, 4, 8), mat(colors.skin));
  const armRight = armLeft.clone();
  armLeft.position.set(-0.49, 1.45, 0.1);
  armRight.position.set(0.49, 1.45, 0.1);
  armLeft.rotation.z = -Math.PI * 0.22;
  armRight.rotation.z = Math.PI * 0.22;

  const handLeft = new THREE.Mesh(new THREE.SphereGeometry(0.12, 12, 8), mat(colors.skin));
  const handRight = handLeft.clone();
  handLeft.position.set(-0.6, 1.16, 0.18);
  handRight.position.set(0.6, 1.16, 0.18);

  const legLeft = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.72, 0.3), mat(colors.hair));
  const legRight = legLeft.clone();
  legLeft.position.set(-0.2, 0.45, 0);
  legRight.position.set(0.2, 0.45, 0);

  person.add(
    body,
    neck,
    head,
    hair,
    leftEye,
    rightEye,
    nose,
    mouth,
    armLeft,
    armRight,
    handLeft,
    handRight,
    legLeft,
    legRight,
  );
  room.add(person);
  return person;
}

function createSpeechBubble(position, color = 0xfffcf2) {
  const panel = new THREE.Mesh(new THREE.BoxGeometry(1.85, 0.5, 0.04), mat(color));
  panel.position.set(...position);
  room.add(panel);
  return panel;
}

function buildRoom() {
  box("floor", [14, 0.25, 12], [0, -0.15, 0], colors.floor, { roughness: 0.95 });
  box("back-wall", [14, 7, 0.2], [0, 3.25, -5.8], colors.wall);
  box("left-wall", [0.2, 7, 12], [-6.8, 3.25, 0], 0xf0c9a5);
  box("right-wall", [0.2, 7, 12], [6.8, 3.25, 0], 0xf5d7b5);

  box("table-top", [4.6, 0.28, 2.8], [0, 1.27, -0.55], colors.table, { roughness: 0.62 });
  for (const x of [-2.15, 2.15]) {
    for (const z of [-1.25, 0.15]) cylinder("table-leg", 0.23, 1.25, [x, 0.62, z - 0.55], colors.wood);
  }

  for (const x of [-1.7, 0, 1.7]) {
    cylinder("plate", 0.5, 0.08, [x, 1.42, -0.5], colors.ceramic, { roughness: 0.38 });
    cylinder("bowl", 0.28, 0.16, [x, 1.54, -0.5], colors.ceramic, { roughness: 0.32 });
    box("chopstick-a", [0.06, 0.05, 0.72], [x - 0.22, 1.59, -0.55], colors.wood, { roughness: 0.5 });
    box("chopstick-b", [0.06, 0.05, 0.72], [x - 0.08, 1.59, -0.55], colors.wood, { roughness: 0.5 });
  }

  personPlaceholders.aunt = createPerson("aunt", [-2.2, 0, -2.75], colors.shirtYellow, 0.1);
  personPlaceholders.mother = createPerson("mother", [2.1, 0, -2.75], colors.shirtGreen, -0.1);
  createPerson("cousin", [0, 0, -4.1], colors.shirtBlue, Math.PI);
  createSpeechBubble([-2.4, 3.05, -2.6]);
  createSpeechBubble([2.3, 3.05, -2.6]);

  box("sideboard", [3.4, 1.3, 0.8], [4.3, 0.65, -5.1], colors.wood);
  box("sideboard-top", [3.7, 0.12, 0.96], [4.3, 1.36, -5.1], colors.table);
  for (const x of [3.75, 4.3, 4.85]) cylinder("vase", 0.16, 0.58, [x, 1.7, -5.1], colors.ceramic);
}

buildRoom();

const ambientLight = new THREE.HemisphereLight(0xffffff, 0x9b6b59, 2.1);
scene.add(ambientLight);

const keyLight = new THREE.DirectionalLight(0xfff5d4, 3.5);
keyLight.position.set(-4, 8, 5);
keyLight.castShadow = true;
keyLight.shadow.mapSize.set(1024, 1024);
scene.add(keyLight);

const fillLight = new THREE.PointLight(0xffb88f, 12, 18, 2);
fillLight.position.set(0, 4.2, 0);
scene.add(fillLight);

function loadAholoAunt() {
  const loader = new GLTFLoader();
  loader.load(
    "/assets/aholo/aunt.glb",
    (gltf) => {
      const model = gltf.scene;
      const bounds = new THREE.Box3().setFromObject(model);
      const size = bounds.getSize(new THREE.Vector3());
      const targetHeight = 2.55;
      const scale = targetHeight / Math.max(size.y, 0.001);
      model.scale.setScalar(scale);

      const scaledBounds = new THREE.Box3().setFromObject(model);
      const target = personPlaceholders.aunt;
      model.position.set(
        target.position.x,
        target.position.y - scaledBounds.min.y,
        target.position.z,
      );
      model.rotation.y = target.rotation.y;
      model.traverse((node) => {
        if (node.isMesh) {
          node.castShadow = true;
          node.receiveShadow = true;
        }
      });
      room.add(model);
      target.visible = false;
      setMessage("Aholo 角色已接入", "姑妈模型已经进入饭桌场景，可以继续调整比例和位置。");
    },
    undefined,
    () => {
      setMessage("占位角色", "Aholo 模型暂时没有加载成功，当前仍使用程序化角色。");
    },
  );
}

function loadAholoMother() {
  const loader = new GLTFLoader();
  loader.load(
    "/assets/aholo/mother.glb",
    (gltf) => {
      const model = gltf.scene;
      const bounds = new THREE.Box3().setFromObject(model);
      const size = bounds.getSize(new THREE.Vector3());
      const targetHeight = 2.55;
      const scale = targetHeight / Math.max(size.y, 0.001);
      model.scale.setScalar(scale);

      const scaledBounds = new THREE.Box3().setFromObject(model);
      const target = personPlaceholders.mother;
      model.position.set(
        target.position.x,
        target.position.y - scaledBounds.min.y,
        target.position.z,
      );
      model.rotation.y = target.rotation.y;
      model.traverse((node) => {
        if (node.isMesh) {
          node.castShadow = true;
          node.receiveShadow = true;
        }
      });
      room.add(model);
      target.visible = false;
      setMessage("妈妈角色已接入", "新的卡通妈妈角色已经进入饭桌场景。");
    },
    undefined,
    () => {
      setMessage("程序化妈妈", "妈妈模型暂时没有加载成功，当前仍使用程序化角色。");
    },
  );
}

function loadAholoTable() {
  const loader = new GLTFLoader();
  loader.load(
    "/assets/aholo/dining-table.glb",
    (gltf) => {
      const model = gltf.scene;
      const bounds = new THREE.Box3().setFromObject(model);
      const size = bounds.getSize(new THREE.Vector3());
      // The generated asset is tiny and has a shallow source height. Fit each
      // axis separately so the tabletop does not become as tall as the aunt.
      const targetWidth = 4.6;
      const targetHeight = 1.25;
      const targetDepth = 2.8;
      model.scale.set(
        targetWidth / Math.max(size.x, 0.001),
        targetHeight / Math.max(size.y, 0.001),
        targetDepth / Math.max(size.z, 0.001),
      );

      const scaledBounds = new THREE.Box3().setFromObject(model);
      model.position.set(
        -((scaledBounds.min.x + scaledBounds.max.x) / 2),
        1.42 - scaledBounds.max.y,
        -0.55 - ((scaledBounds.min.z + scaledBounds.max.z) / 2),
      );
      model.traverse((node) => {
        if (node.isMesh) {
          node.castShadow = true;
          node.receiveShadow = true;
        }
      });
      room.add(model);
      room.children
        .filter((child) => child.name === "table-top" || child.name === "table-leg")
        .forEach((child) => {
          child.visible = false;
        });
      setMessage("Aholo 资产已接入", "姑妈和餐桌都已替换为 Aholo 生成的 3D 资产。");
    },
    undefined,
    () => {
      setMessage("程序化餐桌", "餐桌模型暂时没有加载成功，当前仍使用程序化餐桌。");
    },
  );
}

function setMessage(label, text) {
  messageLabel.textContent = label;
  messageText.textContent = text;
}

function appendChat(text, player = false) {
  const line = document.createElement("div");
  line.className = `chat-line${player ? " chat-line--player" : ""}`;
  line.textContent = text;
  chatLog.appendChild(line);
  while (chatLog.children.length > 5) chatLog.firstElementChild.remove();
}

function updateProgress() {
  progressDots.forEach((dot, index) => {
    dot.classList.toggle("is-active", index === currentTopic && !finished);
    dot.classList.toggle("is-complete", index < currentTopic || finished);
  });
}

function updateTopic() {
  if (finished) return;
  const topic = topics[currentTopic];
  ruleNumber.textContent = String(currentTopic + 1);
  ruleTitle.textContent = topic.title;
  ruleCopy.textContent = topic.copy;
  answerInput.placeholder = topic.placeholder;
  answerInput.value = "";
  suggestions.innerHTML = topic.suggestions
    .map((suggestion) => `<button type="button" class="suggestion" data-suggestion="${suggestion}">${suggestion}</button>`)
    .join("");
  subtitle.textContent = currentTopic === 0
    ? "一场普通的家庭饭局，和一些“不太方便”的答案。"
    : "你可以继续说真话，也可以使用一个大家听得懂的答案。";
  updateProgress();
  answerInput.focus();
}

function addPressure(result) {
  totalPressure += Number(result.anomaly ?? result.pressure ?? 0);
  fillLight.color.setHex(totalPressure > 2.5 ? 0xffc06d : 0xffb88f);
  fillLight.intensity = 12 - Math.min(totalPressure * 1.4, 4);

  const bowls = room.children.filter((child) => child.name === "bowl");
  bowls.forEach((bowl, index) => {
    bowl.scale.y = 1 + Math.min(totalPressure * 0.06, 0.24) * (index + 1);
  });

  if (result.gossip) appendChat(result.gossip);
}

async function evaluateWithAI(topic, answer) {
  try {
    const response = await fetch("/api/respond", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ topic: topic.id, answer }),
    });
    if (!response.ok) return null;
    const result = await response.json();
    if (!result.npcLine || !result.observation) return null;
    return {
      label: result.label,
      message: result.observation,
      npc: result.npcLine,
      gossip: result.gossip,
      anomaly: result.pressure,
    };
  } catch {
    return null;
  }
}

function finish() {
  finished = true;
  updateProgress();
  ruleTitle.textContent = totalPressure > 2.8 ? "饭局结束了，答案还在继续。" : "饭局结束了，大家都满意了。";
  ruleCopy.textContent = totalPressure > 2.8
    ? "你没有做错什么，只是有些回答在这张桌子上还没有位置。"
    : "你暂时找到了安全的说法，但你知道那不一定是你真正想说的。";
  subtitle.textContent = "这不是一道选择题，而是一张越来越窄的答案纸。";
  choiceForm.innerHTML = '<button class="choice-button" type="submit">再体验一次</button>';
  suggestions.innerHTML = "";
  setMessage(
    totalPressure > 2.8 ? "看见" : "暂时安全",
    totalPressure > 2.8
      ? "你没有改变自己。你只是看见了，桌边的人如何一起缩小答案的范围。"
      : "你顺利结束了饭局，但“得体”的回答和真实的回答并不是一回事。",
  );
}

async function submitAnswer(answer) {
  const cleanAnswer = answer.trim();
  if (!cleanAnswer) {
    setMessage("提示", "先输入一句你真正想说的话。");
    answerInput.focus();
    return;
  }

  if (finished) {
    reset();
    return;
  }

  const topic = topics[currentTopic];
  choiceForm.querySelectorAll("input, button").forEach((element) => {
    element.disabled = true;
  });
  setMessage("正在听", "饭桌上的人停了一下，想想该怎么接这句话。");
  const result = (await evaluateWithAI(topic, cleanAnswer)) || topic.evaluate(cleanAnswer);
  choiceForm.querySelectorAll("input, button").forEach((element) => {
    element.disabled = false;
  });
  appendChat(cleanAnswer, true);
  appendChat(result.npc);
  setMessage(result.label, result.message);
  addPressure(result);

  if (currentTopic === topics.length - 1) {
    finish();
    return;
  }
  currentTopic += 1;
  updateTopic();
}

function reset() {
  currentTopic = 0;
  totalPressure = 0;
  finished = false;
  fillLight.color.setHex(0xffb88f);
  fillLight.intensity = 12;
  chatLog.innerHTML = "";
  choiceForm.innerHTML = `
    <label class="sr-only" for="answer-input">输入你的回答</label>
    <input id="answer-input" autocomplete="off" placeholder="例如：谢谢，我吃饱了" />
    <button class="choice-button" type="submit">回答</button>
  `;
  answerInput = choiceForm.querySelector("#answer-input");
  setMessage("观察", "你可以输入任何回答。这里没有“正确答案”，只有不同的后果。");
  updateTopic();
}

choiceForm.addEventListener("submit", (event) => {
  event.preventDefault();
  submitAnswer(answerInput.value);
});

suggestions.addEventListener("click", (event) => {
  const button = event.target.closest("[data-suggestion]");
  if (!button) return;
  answerInput.value = button.dataset.suggestion;
  answerInput.focus();
});

resetButton.addEventListener("click", reset);

window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

function animate() {
  requestAnimationFrame(animate);
  controls.update();
  renderer.render(scene, camera);
}

updateTopic();
loadAholoAunt();
loadAholoMother();
loadAholoTable();
animate();
