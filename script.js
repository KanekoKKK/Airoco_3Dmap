window.addEventListener("DOMContentLoaded", init);

/* データのリスト
name: apiからのデータの主キー
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
  { "name": "401", "position": [-310, 75, 125], "sensData": null },
  { "name": "301", "position": [-310, -75, 40], "sensData": null },
  { "name": "3F", "position": [-25, -75, 325], "sensData": null },
  { "name": "4F", "position": [-25, 75, 325], "sensData": null },
  { "name": "403", "position": [-310, 75, -80], "sensData": null },
  { "name": "B1F", "position": [-25, -375, 325], "sensData": null },
  { "name": "1F", "position": [-25, -525, 325], "sensData": null }
];

var boxs = [];
var scene;
var camera;
var renderer;
var controls;
var canvasElement;

function init() {
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
    model.scale.set(500, 500, 500);

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

  // データの取得(イベント)
  window.addEventListener('dataUpdated', function (event) {
    var data = event.detail.data; // airocoからのデータ
    boxs.length = 0;  // boxs[]をリセット
    for (var i = 0; i < parameters.length; i++) {
      // parametersにdataを保存
      parameters[i].sensData = data[parameters[i].name];
      // sensDataの取り出し
      const sensData = parameters[i].sensData;

      //各CO2濃度表示オブジェクトの座標指定
      const [x, y, z] = parameters[i].position;
      const geometry = new THREE.BoxGeometry(125, 125, 125);
      const material = new THREE.MeshBasicMaterial({ color: 0xff0000, transparent: true, opacity: 0.5 });
      const box = new THREE.Mesh(geometry, material);
      box.position.set(x, y, z);

      // Co2から色を指定
      let color = 0xff0000;
      if (sensData.co2 < 500) color = 0x00FF00;
      else if (sensData.co2 < 550) color = 0x44FF00;
      else if (sensData.co2 < 600) color = 0x88FF00;
      else if (sensData.co2 < 650) color = 0xAAFF00;
      else if (sensData.co2 < 700) color = 0xDDFF00;
      else if (sensData.co2 < 750) color = 0xFFFF00;
      else if (sensData.co2 < 800) color = 0xFFDD00;
      else if (sensData.co2 < 850) color = 0xFFBB00;
      else if (sensData.co2 < 900) color = 0xFF9900;
      else if (sensData.co2 < 950) color = 0xFF7700;
      else if (sensData.co2 < 1000) color = 0xFF4400;
      else color = 0xFF0000;
      box.material.color.set(color);
      console.log(color);

      // boxの保存
      boxs.push(box);
      scene.add(box);
    }
    // 初回データ取得後にレンダリングを開始
    tick();
  }, );
}

// リアルタイムレンダリング
function tick() {
  controls.update();
  renderer.render(scene, camera);
  requestAnimationFrame(tick);
}
