// TODO:カメラの初期位置変える
// ユーザがモデルを操作していないとき、モデルを回したい

window.addEventListener("DOMContentLoaded", init);
function init() {
  // レンダラーを作成
  const canvasElement = document.querySelector('#myCanvas');
  const renderer = new THREE.WebGLRenderer({
    antialias: true,
    canvas: canvasElement,
  });


  // シーンを作成
  const scene = new THREE.Scene();
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
  const camera = new THREE.PerspectiveCamera(45, 1, 1, 10000);
  camera.position.set(0, 0, 2000); //カメラ位置

  // カメラコントローラーを作成
  const controls = new THREE.OrbitControls(camera, canvasElement);
  controls.maxPolarAngle = Math.PI * 0.5; // 下から見えないようにする
  controls.enableDamping = true;  // 滑らかな制御
  controls.dampingFactor = 0.2;


  resize();                                
  window.addEventListener('resize', resize); 
  new ResizeObserver(resize).observe(canvasElement); // ③ レイアウト変化

  function resize () {
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

  var boxs = [];
  var data_num = [1, 2, 4, 5, 7, 8, 9]

  // データの取得と色変更(Co2Data[])
  window.addEventListener('dataUpdated', function (event) {
    for (var i = 0; i < 7; i++) {
      const Co2Data = event.detail.data;
      if (Co2Data[data_num[i]] < 500) {
        boxs[i].material.color.set(0x00FF00);
      } else if (Co2Data[data_num[i]] < 550) {
        boxs[i].material.color.set(0x44FF00);
      } else if (Co2Data[data_num[i]] < 600) {
        boxs[i].material.color.set(0x88FF00);
      } else if (Co2Data[data_num[i]] < 650) {
        boxs[i].material.color.set(0xAAFF00);
      } else if (Co2Data[data_num[i]] < 700) {
        boxs[i].material.color.set(0xDDFF00);
      } else if (Co2Data[data_num[i]] < 750) {
        boxs[i].material.color.set(0xFFFF00);
      } else if (Co2Data[data_num[i]] < 800) {
        boxs[i].material.color.set(0xFFDD00);
      } else if (Co2Data[data_num[i]] < 850) {
        boxs[i].material.color.set(0xFFBB00);
      } else if (Co2Data[data_num[i]] < 900) {
        boxs[i].material.color.set(0xFF9900);
      } else if (Co2Data[data_num[i]] < 950) {
        boxs[i].material.color.set(0xFF7700);
      } else if (Co2Data[data_num[i]] < 1000) {
        boxs[i].material.color.set(0xFF4400);
      } else {
        boxs[i].material.color.set(0xFF0000);
      }
    }
  });

/* positonsの座標 [x,y,z]
  x 正->エレベータホール側
  y 正->空側
  z 正->R3正面側（meijoって書いてある方）
*/

//各CO2濃度表示オブジェクトの座標指定
const positions = [
  [-310, 75, 125],  //401
  [-310, -75, 40], //301
  [-25, -75, 325],  //3F-E
  [-25, 75, 325],  //4F-E
  [-310, 75, -80], //403
  [-25, -375, 325],  //B1F-E
  [-25, -525, 325],  //1F-E
];

for (let i = 0; i < positions.length; i++) {
  const [x, y, z] = positions[i];
  const geometry = new THREE.BoxGeometry(125, 125, 125);
  const material = new THREE.MeshBasicMaterial({ color: 0xff0000, transparent: true, opacity: 0.5 });
  const box = new THREE.Mesh(geometry, material);
  box.position.set(x, y, z);
  boxs.push(box);
  scene.add(box);
}

  // リアルタイムレンダリング
  tick();
  function tick() {
    controls.update();
    renderer.render(scene, camera);
    requestAnimationFrame(tick);
  }
}
