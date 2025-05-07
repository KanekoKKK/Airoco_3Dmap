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

  // リアルタイムレンダリング
  tick();
  function tick() {
    controls.update();
    renderer.render(scene, camera);
    requestAnimationFrame(tick);
  }
}