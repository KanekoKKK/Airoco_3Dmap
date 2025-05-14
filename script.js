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
  const camera = new THREE.PerspectiveCamera(45, width / height, 1, 10000);
  camera.position.set(0, 0, 1500);

  // カメラコントローラーを作成
  const controls = new THREE.OrbitControls(camera, canvasElement);
  controls.maxPolarAngle = Math.PI * 0.5; // 下から見えないようにする
  controls.enableDamping = true;  // 滑らかな制御
  controls.dampingFactor = 0.2;


  // サイズ調整
  onResize();
  // リサイズイベント発生時に実行
  window.addEventListener('resize', onResize);
  function onResize() {
    // サイズを取得
    const width = window.innerWidth;
    const height = window.innerHeight;

    // レンダラーのサイズを調整する
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(width, height);

    // カメラのアスペクト比を正す
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
  }

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

  // 箱を作成
  for (var i = 0; i < 7; i++) {
    const geometry = new THREE.BoxGeometry(100, 100, 100);  // 大きさ
    const material = new THREE.MeshBasicMaterial({ color: new THREE.Color(0x00000), transparent: true, opacity: 0.5 });  // 色
    const box = new THREE.Mesh(geometry, material); // 箱
    box.position.set(-500 + i * 120, 50, -200);
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
