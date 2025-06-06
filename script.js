import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { Vector3 } from 'three';

window.addEventListener("DOMContentLoaded", init);
/* データのリスト
name: apiからのデータの主キー
text: HTML表示用のテキスト
position:
  positonsの座標 [x,y,z]
  x 正->エレベータホール側
  y 正->空側
  z 正->R3正面側（meijoって書いてある方）
sensData:
  apiから取ってきたデータ
  {name,co2,temp} (parameters[n].sensData.nameのように指定)
  name: キー
  co2: Co2濃度
  temp: 温度
*/
var parameters = [
  { "name": "401", "text": "ROOM 401", "position": [-340,  72, 100], "size": [150, 115, 175], "rotation": [0, 0.3, 0], "sensData": null },
  { "name": "403", "text": "ROOM 403", "position": [-400,  72, -95], "size": [150, 115, 175], "rotation": [0, 0.3, 0], "sensData": null },
  { "name": "301", "text": "ROOM 301", "position": [-363, -78,  28], "size": [150, 115, 315], "rotation": [0, 0.3, 0], "sensData": null },
  { "name": "4F",  "text": "4F EV",    "position": [-23,   72,  25], "size": [150, 115, 175], "rotation": [0, 0, 0], "sensData": null },
  { "name": "3F",  "text": "3F EV",    "position": [-23,  -78,  25], "size": [150, 115, 175], "rotation": [0, 0, 0], "sensData": null },
  { "name": "1F",  "text": "1F EV",    "position": [-23, -378,  25], "size": [150, 115, 175], "rotation": [0, 0, 0], "sensData": null },
  { "name": "B1F", "text": "B1F EV",   "position": [-23, -528,  25], "size": [150, 115, 175], "rotation": [0, 0, 0], "sensData": null },
];

var mode = "co2";  // どのセンサの値を使用するか(co2,temp,hum)
var boxs = [];
var scene;
var camera;
var renderer;
var controls;
var canvasElement;
let R3model;
let EVmodel;

function init() {
  let updateTime;
  // -------------------- 初期設定 -------------------- //
  // レンダラーを作成
  canvasElement = document.querySelector('#myCanvas');
  renderer = new THREE.WebGLRenderer({
    antialias: true,
    canvas: canvasElement,
  });

  // シーンを作成
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x111111);

  // 環境光源を作成
  const ambientLight = new THREE.AmbientLight(0xffffff);
  ambientLight.intensity = 5;
  scene.add(ambientLight);

  // 平行光源を作成
  const directionalLight = new THREE.DirectionalLight(0xffffff);
  directionalLight.intensity = 2;
  directionalLight.position.set(0, 3, 6); //x,y,zの位置を指定
  scene.add(directionalLight);

  // カメラを作成
  camera = new THREE.PerspectiveCamera(45, 1, 1, 10000);
  camera.position.set(0, 0, 2000); //カメラ位置

  // カメラコントローラーを作成
  controls = new OrbitControls(camera, canvasElement);
  controls.autoRotate = true; // 自動回転  
  controls.autoRotateSpeed = 2.0;
  controls.target = new Vector3(-167.5, -75, 200); // 回転の中心
  controls.enablePan = false; // パン(上下左右移動)を禁止
  controls.maxPolarAngle = Math.PI * 0.5; // 鉛直方向の回転を禁止
  controls.minPolarAngle = Math.PI * 0.5;
  controls.maxDistance = 2000;  // 遠ざかることのできる距離
  controls.minDistance = 1000 // 近づくことのできる距離
  controls.enableDamping = true;  // マウス制御時の滑らかな制御
  controls.dampingFactor = 0.2;

  resize();
  window.addEventListener('resize', resize);
  new ResizeObserver(resize).observe(canvasElement); // レイアウト変化

  function resize() {
    // Canvas の “見た目サイズ” を取得
    const { width, height } = canvasElement.getBoundingClientRect();

    if (canvasElement.width === width && canvasElement.height === height) return;

    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(width, height, false); // ← 第3引数falseでCSSサイズ優先

    camera.aspect = width / height;
    camera.updateProjectionMatrix();
  }

  // R3モデルの読み込み
  const R3loader = new GLTFLoader();
  R3loader.load('R3_v3.glb', function (gltf) {
    R3model = gltf.scene;
    R3model.scale.set(500, 500, 500); // モデルのスケールを調整
    R3model.name = "R3";

    R3model.traverse((child) => {
      if (child.isMesh) {
        child.material = new THREE.MeshStandardMaterial({
          color: 0x9999ff,
          roughness: 0.4,
          metalness: 0.1,
          transparent: true,
          opacity: 0.8,
        });
      }
    })
    scene.add(R3model);
  });

  // EVモデルの読み込み
  const evloader = new GLTFLoader();
  evloader.load('EV.glb', function (gltf) {
    EVmodel = gltf.scene;
    EVmodel.scale.set(500, 500, 500); // モデルのスケールを調整
    EVmodel.name = "EV";

    EVmodel.traverse((child) => {
      if (child.isMesh) {
        child.material = new THREE.MeshStandardMaterial({
          color: 0x9999ff,
          roughness: 0.4,
          metalness: 0.1,
          transparent: true,
          opacity: 0.8,
        });
      }
    });
    scene.add(EVmodel);
  });

  setControll();
  rendering();
  tick();

  // -------------------- 初期設定 -------------------- //

  // -------------------- データの取得(イベント) -------------------- //
  window.addEventListener('dataUpdated', function (event) {
    // 更新日時(lastUpdate)
    updateTime = event.detail.updateTime;
    updateTime = updateTime.toString();
    updateTime = updateTime.replace("GMT+0900 (日本標準時)", "JST");
    updateTime = "    > Last updated: " + updateTime;
    document.getElementById('lastUpdate').textContent = updateTime;

    var data = event.detail.data; // airocoからのデータ
    boxs.length = 0;  // boxs[]をリセット
    for (let i = 0; i < parameters.length; i++) {
      // parametersにdataを保存
      parameters[i].sensData = data[parameters[i].name];
      // sensDataの取り出し
      const sensData = parameters[i].sensData;

      // 各オブジェクトの生成
      const [x, y, z] = parameters[i].position;
      const [sx, sy, sz] = parameters[i].size;
      const [rx, ry, rz] = parameters[i].rotation;
      const geometry = new THREE.BoxGeometry(sx, sy, sz);
      const material = new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.9 });
      const box = new THREE.Mesh(geometry, material);
      box.position.set(x, y, z);
      box.rotation.set(rx, ry, rz);
      box.name = parameters[i].name;

      // 色の変更
      box.material.color.set(getColor(sensData));

      // boxの保存
      boxs.push(box);
      scene.add(box);
    }
  }, );
  // -------------------- データの取得(イベント) -------------------- //

  // モード変更
  document.getElementById("btn_co2").addEventListener("click", function () { changeMode("co2") });
  document.getElementById("btn_temp").addEventListener("click", function () { changeMode("temp") });
  document.getElementById("btn_hum").addEventListener("click", function () { changeMode("hum") });
  document.getElementById('btn_co2').classList.add('selected');
}

// -------------------- リアルタイムレンダリング (メインループ) -------------------- //
let timeEV = 0; // EVモデル用のアニメーション時間
const speedEV = 0.01; // EVモデルの移動速度

function tick() {
  requestAnimationFrame(tick);

  // EVアニメーション
  if (EVmodel) {
    EVmodel.position.y = Math.sin(timeEV) * 300 + 300;
    timeEV += speedEV;
  }

  controls.update();
  renderer.render(scene, camera); //sceneを更新
}
// -------------------- リアルタイムレンダリング (メインループ) -------------------- //

// -------------------- モード変更 -------------------- //
function changeMode(inMode) {
  // 凡例変更
  writeLegend(mode, inMode);  // 古いmode,新しいmode
  mode = inMode;
  //選択しているボタンの枠を強調
  document.querySelectorAll('#buttonContainer button')
          .forEach(btn => btn.classList.remove('selected'));
  document.getElementById('btn_'+inMode).classList.add('selected');
  // オブジェクトの色変更
  for (let i = 0; i < parameters.length; i++) {
    const box = boxs[i];
    const param = parameters[i];
    box.material.color.set(getColor(param.sensData));
  }
}
// -------------------- モード変更 -------------------- //

// -------------------- 色指定 -------------------- //
function getColor(sensData) {
  let color;
  switch (mode) {
    case "co2": color = colorByCo2(sensData.co2); break;
    case "temp": color = colorByTemp(sensData.temp); break;
    case "hum": color = colorByHum(sensData.hum); break;
  }
  return color;

  // co2から色を決定
  function colorByCo2(co2) {
    if (co2 < 500) color = 0x00FF00;
    else if (co2 < 550) color = 0x44FF00;
    else if (co2 < 600) color = 0x88FF00;
    else if (co2 < 650) color = 0xAAFF00;
    else if (co2 < 700) color = 0xDDFF00;
    else if (co2 < 750) color = 0xFFFF00;
    else if (co2 < 800) color = 0xFFDD00;
    else if (co2 < 850) color = 0xFFBB00;
    else if (co2 < 900) color = 0xFF9900;
    else if (co2 < 950) color = 0xFF7700;
    else color = 0xFF4400;
    return color;
  }

  // tempから色を決定
  function colorByTemp(temp) {
    if (temp < 15) color = 0x6600FF;
    else if (temp < 16) color = 0x0066FF;
    else if (temp < 17) color = 0x00AAFF;
    else if (temp < 18) color = 0x00FFFF;
    else if (temp < 19) color = 0x00FFFF;
    else if (temp < 20) color = 0x00FFB3;
    else if (temp < 21) color = 0x00FF80;
    else if (temp < 22) color = 0x00FF4D;
    else if (temp < 23) color = 0x33FF00;
    else if (temp < 24) color = 0x80FF00;
    else if (temp < 25) color = 0xCCFF00;
    else if (temp < 26) color = 0xFFFF00;
    else if (temp < 27) color = 0xFFFF00;
    else if (temp < 28) color = 0xFFD700;
    else if (temp < 29) color = 0xFFA500;
    else if (temp < 30) color = 0xFF8000;
    else color = 0xFF0000;
    return color;
  }

  // humから色を決定
  function colorByHum(hum) {
    if (hum < 35) color = 0xFFA500;
    else if (hum < 40) color = 0xFFD700;
    else if (hum < 42.5) color = 0xFFFF00;
    else if (hum < 45) color = 0xFFFF00;
    else if (hum < 47.5) color = 0xCCFF00;
    else if (hum < 50) color = 0x80FF00;
    else if (hum < 52.5) color = 0x33FF00;
    else if (hum < 55) color = 0x00FF4D;
    else if (hum < 57.5) color = 0x00FF80;
    else if (hum < 60) color = 0x00FFCC;
    else if (hum < 62.5) color = 0x00FFFF;
    else if (hum < 65) color = 0x00AAFF;
    else if (hum < 67.5) color = 0x00AAFF;
    else if (hum < 70) color = 0x3366FF;
    else color = 0x6600FF;
    return color;
  }
}
// -------------------- 色指定 -------------------- //

// -------------------- マウス操作 -------------------- //
let mouse;
let raycaster;
let clickFlg = false;
let moveFlg = false;
let selectedRoom = null;  // クリックしたオブジェクトのname

function setControll() {
  mouse = new THREE.Vector2();

  //レイキャストを生成
  raycaster = new THREE.Raycaster();
  canvasElement.addEventListener('mousemove', handleMouseMove);

  //マウスイベントを登録
  canvasElement.addEventListener('click', handleClick);

  function handleMouseMove(event) {
    moveFlg = true;
    const element = event.currentTarget;
    const rect = element.getBoundingClientRect(); // Canvas の絶対的な位置とサイズを取得
    const x = event.clientX - rect.left; // Canvas 左端からの相対的な X 座標
    const y = event.clientY - rect.top;  // Canvas 上端からの相対的な Y 座標
    const w = rect.width;
    const h = rect.height;
    mouse.x = (x / w) * 2 - 1;
    mouse.y = -(y / h) * 2 + 1;
  }

  function handleClick(event) { // クリック時の動作
    if (clickFlg) {}
  }
}

function rendering() {
  requestAnimationFrame(rendering);

  //マウス位置からまっすぐに伸びる光線ベクトルを生成
  raycaster.setFromCamera(mouse, camera);

  //光線と交差したオブジェクトを取得
  const intersects = raycaster.intersectObjects(scene.children, false);

  //光線と交差したオブジェクトがある場合
  if (intersects.length > 0) {
    //交差したオブジェクトを取得
    const obj = intersects[0].object;

    const isParameterName = parameters.some(param => param.name === obj.name);

    if (isParameterName) {
      if (moveFlg) {  // オブジェクト上のカーソルを検知
        clickFlg = true;
        selectedRoom = obj.name;
        // roomInfo更新
        for (let i = 0; i < parameters.length; i++) {
          if (selectedRoom == parameters[i].name) {
            writeRoomInfo(parameters[i]);
            boxs[i].scale.set(1.1, 1.1, 1.1); // 拡大
          } else {
            boxs[i].scale.set(1, 1, 1); // 拡大リセット
          }
        }
      }
    } else {
      clickFlg = false;
    }
  } else {
    clickFlg = false;
  }

  renderer.render(scene, camera);
}
// -------------------- マウス操作 -------------------- //

/ -------------------- HTML編集 -------------------- //
// 更新日時(lastUpdate)
function writeLastUpdate(event) {
    updateTime = event.detail.updateTime;
    updateTime = updateTime.toString();
    updateTime = updateTime.replace("GMT+0900 (日本標準時)", "JST");
    updateTime = "    > Last updated: " + updateTime;
    document.getElementById('lastUpdate').textContent = updateTime;
    
}
// センサ情報(roomInfo)
function writeRoomInfo(param) {
  document.getElementById('roomInfo_name').textContent = param.text;
  document.getElementById('roomInfo_co2').textContent = "CO₂ conc.    " + param.sensData.co2 + "ppm";
  document.getElementById('roomInfo_temp').textContent = "Temperature. " + param.sensData.temp + "℃";
  document.getElementById('roomInfo_hum').textContent = "Humidity.    " + param.sensData.hum + "%";
}
// 凡例(legend)
function writeLegend(oldMode, newMode) {
  // legend_text
  let legendText;
  switch(newMode){
    case "co2": legendText = "[ CO2 concentration ]"; break;
    case "temp": legendText = "[    Temperature    ]"; break;
    case "hum": legendText = "[      Humidity     ]"; break;
  }
  document.getElementById('legend_text').textContent = legendText;
  // colorGradient
  var element = document.getElementById('colorGradient'); // 変更したいid
  let oldClass = "colorGradient_" + oldMode;
  let newClass = "colorGradient_" + newMode;
  element.classList.remove(oldClass); // クラス名の削除
  element.classList.add(newClass); // クラス名の追加
}
// -------------------- HTML編集 -------------------- //

const reloadBtn  = document.getElementById('reloadBtn');
const reloadIcon = document.getElementById('reloadIcon');
reloadBtn.addEventListener('click', () => {
  reloadIcon.classList.add('rotate');          // 回り始め
  setTimeout(() => window.location.reload(true), 100);
});