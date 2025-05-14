window.addEventListener("DOMContentLoaded", init);
function init() {
  // レンダラーを作成
  const canvasElement = document.querySelector('#myCanvas');
  const renderer = new THREE.WebGLRenderer({
    antialias: true,
    canvas: canvasElement,
  });

  // サイズ指定
  const width = 745;
  const height = 540;
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(width, height);

  // シーンを作成
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x87B8C0);

  // 環境光源を作成
  const ambientLight = new THREE.AmbientLight(0xffffff);
  ambientLight.intensity = 2;
  scene.add(ambientLight);

  // 平行光源を作成
  const directionalLight = new THREE.DirectionalLight(0xffffff);
  directionalLight.intensity = 2;
  directionalLight.position.set(0, 3, 6); //x,y,zの位置を指定
  scene.add(directionalLight);

  // カメラを作成
  const camera = new THREE.PerspectiveCamera(45, width / height, 1, 10000);
  camera.position.set(0, 0, 1500);

  // カメラコントローラーを作成
  const controls = new THREE.OrbitControls(camera, canvasElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.2;

  // 3Dモデルの読み込み
  /*
  const loader = new THREE.GLTFLoader();
  let model = null;
  loader.load(
    //3Dモデルファイルのパスを指定
    'model.glb',
    function (glb) {
      model = glb.scene;
      model.name = "model_castle";
      model.scale.set(1.0, 1.0, 1.0);
      model.position.set(0, 0, 0);
      scene.add(glb.scene);
    },
    function (error) {
      console.log(error);
    }
  );
  */

  var boxs = [];
  var data_num = [1, 2, 4, 5, 7, 8, 9]
  
  // データの取得(Co2Data[])
  window.addEventListener('dataUpdated', function (event) {
    for(var i = 0; i < 7; i++){
    const Co2Data = event.detail.data;
    if (Co2Data[data_num[i]] >= 600) {
      boxs[i].material.color.set(0xFF0000);
    } else {
      boxs[i].material.color.set(0x00FF00);
    }
  }
  });

  // 箱を作成
  for (var i = 0; i < 7; i++) {
    const geometry = new THREE.BoxGeometry(100, 100, 100);  // 大きさ
    const material = new THREE.MeshStandardMaterial({ color: new THREE.Color(0x000000) });  // 色
    const box = new THREE.Mesh(geometry, material); // 箱
    box.position.set(-500 +i*120,50,-200);
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
