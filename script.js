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

  // 箱を作成
const g1 = new THREE.BoxGeometry(500, 500, 500);
const m1 = new THREE.MeshStandardMaterial({color: 0x000000});
const box1 = new THREE.Mesh(g1, m1);
box1.position.set(100, 50, -200)
scene.add(box1);

const g2 = new THREE.BoxGeometry(400, 500, 500);
const m2 = new THREE.MeshStandardMaterial({color: 0x0000FF});
const box2 = new THREE.Mesh(g2, m2);
scene.add(box2);

  // データの取得と繁栄
    window.addEventListener('commentUpdated', function(event) {
    const receivedComment = event.detail.comment;
    console.log('更新されたコメント:', receivedComment);
    if (receivedComment == 'red') {
      m2.color.set(0xFF0000);
    } else {
      m2.color.set(0x00FF00);
    }
  });

  // リアルタイムレンダリング
  tick();
  function tick() {
    controls.update();
    renderer.render(scene, camera);
    requestAnimationFrame(tick);
  }
}
