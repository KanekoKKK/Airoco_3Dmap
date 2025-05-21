function loadSensorData() {
  var request = new XMLHttpRequest();
  request.open('GET', 'https://airoco.necolico.jp/data-api/latest?id=CgETViZ2&subscription-key=6b8aa7133ece423c836c38af01c59880', true);
  request.responseType = 'json';
  request.send();
  request.onload = function () {
    var allData = this.response;   // Airocoの全てのデータ
    console.log(allData);
    var sensorData = {}
    var sens_name = [
      "Ｒ３ー４０１",
      "Ｒ３ー３０１",
      "Ｒ３ー３Ｆ_ＥＨ",
      "Ｒ３ー４Ｆ_ＥＨ",
      "Ｒ３ー４０３",
      "Ｒ３ーB１Ｆ_ＥＨ",
      "Ｒ３ー１Ｆ_ＥＨ",
    ]
    var sens_key = [
      "401",
      "301",
      "3F",
      "4F",
      "403",
      "B1F",
      "1F",
    ]

    for (var i = 0; i < allData.length; i++) {
      const sensor = allData[i];
      const nameIndex = sens_name.indexOf(sensor.sensorName);

      if (nameIndex !== -1 && typeof sensor.co2 === 'number' && typeof sensor.temperature === 'number') {
        const key = sens_key[nameIndex];
        sensorData[key] = {
          co2: sensor.co2,
          temp: sensor.temperature,
          hum: sensor.relativeHumidity
        };
      }
    }
    console.log(sensorData);

    // 現在時刻を取得
    const currentTime = new Date();

    // カスタムイベントを発行して sensorData の値を渡す
    window.dispatchEvent(new CustomEvent('dataUpdated', { detail: { data: sensorData , updateTime: currentTime} }));
  }
  request.onerror = function () {
    console.log("データ取得エラー");
  }
}
window.addEventListener("DOMContentLoaded", function () {
  // ページロード時に一度データをロード
  loadSensorData();

  // 5分おきにデータをロード
  setInterval(loadSensorData, 300000);
});