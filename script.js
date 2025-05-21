window.addEventListener("DOMContentLoaded", init);
let cameraAngle = 0;
const cameraRadius = 2000; // 必要ならお好みで調整
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
  { "name": "401", "text": "ROOM 401", "position": [-310, 75, 125], "sensData": null },
  { "name": "301", "text": "ROOM 301", "position": [-310, -75, 40], "sensData": null },
  { "name": "3F", "text": "3F EV", "position": [-25, -75, 325], "sensData": null },
  { "name": "4F", "text": "4F EV", "position": [-25, 75, 325], "sensData": null },
  { "name": "403", "text": "ROOM 403", "position": [-310, 75, -80], "sensData": null },
  { "name": "B1F", "text": "B1F EV", "position": [-25, -525, 325], "sensData": null },
  { "name": "1F", "text": "1F EV", "position": [-25, -375, 325], "sensData": null }
];

var mode = "co2";  // どのセンサの値を使用するか(co2,temp,hum)
var boxs = [];
var scene;
var camera;
var renderer;
var controls;
var canvasElement;

function init() {
  console.log(mode);
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
  controls = new THREE.OrbitControls(camera, canvasElement);
  controls.maxPolarAngle = Math.PI * 0.5; // 下から見えないようにする
  controls.enableDamping = true;  // 滑らかな制御
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

  // 3Dモデルの読み込み
  const loader = new THREE.GLTFLoader();
  loader.load('R3.glb', function (gltf) {
    const model = gltf.scene;
    model.scale.set(500, 500, 500); // モデルのスケールを調整

    model.traverse((child) => {
      if (child.isMesh) {
        child.material = new THREE.MeshStandardMaterial({
          color: 0x9999ff,
          roughness: 0.4,
          metalness: 0.1,
        });
      }
    });

    scene.add(model);
  });
  // -------------------- 初期設定 -------------------- //

  // -------------------- データの取得(イベント) -------------------- //
  window.addEventListener('dataUpdated', function (event) {
    // 更新日時(lastUpdate)
    updateTime = event.detail.updateTime;
    updateTime = updateTime.toString();
    console.log(updateTime);
    updateTime = updateTime.replace("GMT+0900 (日本標準時)", "JST");
    updateTime = "    > Last updated: " + updateTime;
    document.getElementById('lastUpdate').textContent = updateTime;

    var data = event.detail.data; // airocoからのデータ
    boxs.length = 0;  // boxs[]をリセット
    for (var i = 0; i < parameters.length; i++) {
      // parametersにdataを保存
      parameters[i].sensData = data[parameters[i].name];
      // sensDataの取り出し
      const sensData = parameters[i].sensData;

      // 各オブジェクトの生成
      const [x, y, z] = parameters[i].position;
      const geometry = new THREE.BoxGeometry(125, 125, 125);
      const material = new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.9});
      const box = new THREE.Mesh(geometry, material);
      box.position.set(x, y, z);
      box.name = parameters[i].name;

      // 色の変更
      getColor(sensData);
      box.material.color.set(color);

      // boxの保存
      boxs.push(box);
      scene.add(box);
    }
    // 初回データ取得後にレンダリングを開始
    tick();
  }, );
  // -------------------- データの取得(イベント) -------------------- //
  setControll();
  rendering();

  // モード変更
  document.getElementById("btn_co2").addEventListener("click", function () { changeMode("co2") });
  document.getElementById("btn_temp").addEventListener("click", function () { changeMode("temp") });
  document.getElementById("btn_hum").addEventListener("click", function () { changeMode("hum") });
}

// リアルタイムレンダリング
function tick() {
// cameraAngle -= 0.003; // 回転速度
//   camera.position.x = Math.sin(cameraAngle) * cameraRadius;
//   camera.position.z = Math.cos(cameraAngle) * cameraRadius;
//   camera.lookAt(0, 0, 0); // 中心を向く

  controls.update();
  renderer.render(scene, camera);
  requestAnimationFrame(tick);
}

// モード変更
function changeMode(inMode) {
  // 凡例変更
  writeLegend(mode, inMode);  // 古いmode,新しいmode
  mode = inMode;
  // オブジェクトの色変更
  for (i = 0; i < parameters.length; i++) {
    const box = boxs[i];
    const param = parameters[i];
    getColor(param.sensData);
    box.material.color.set(color);
  }
}
// -------------------- 色指定 -------------------- //
function getColor(sensData) {
  switch (mode) {
    case "co2": color = colorByCo2(sensData.co2); break;
    case "temp": color = colorByTemp(sensData.temp); break;
    case "hum": color = colorByHum(sensData.hum); break;
  }

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
    if (clickFlg) {
      for (i = 0; i < parameters.length; i++) {
        if (selectedRoom == parameters[i].name) {
          // HTMLを編集
          document.getElementById('roomInfo_name').textContent = parameters[i].text;
          document.getElementById('roomInfo_co2').textContent = "CO2 conc. " + parameters[i].sensData.co2 + "ppm";
        }
      }
    }
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
      if (moveFlg) {  // クリックを検知
        clickFlg = true;
        selectedRoom = obj.name;
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
// -------------------- HTML編集 -------------------- //
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
  switch(newMode){
    case "co2": legendText = "[ CO2 concentration ]"; break;
    case "temp": legendText = "[    Temperature    ]"; break;
    case "hum": legendText = "[      Humidity     ]"; break;
  }
  document.getElementById('legend_text').textContent = legendText;
  // colorGradient
  var element = document.getElementById('colorGradient'); // 変更したいid
  oldClass = "colorGradient_" + oldMode;
  newClass = "colorGradient_" + newMode;
  element.classList.remove(oldClass); // クラス名の削除
  element.classList.add(newClass); // クラス名の追加
  console.log("newClass:" + newClass);
}
// -------------------- HTML編集 -------------------- //