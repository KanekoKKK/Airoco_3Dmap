var request = new XMLHttpRequest();
request.open('GET', 'https://airoco.necolico.jp/data-api/latest?id=CgETViZ2&subscription-key=6b8aa7133ece423c836c38af01c59880', true);
request.responseType = 'json';
request.send();
request.onload = function () {
  var allData = this.response;   // Airocoの全てのデータ
  console.log(allData);
  var co2Data = {}; // Co2を取り出したデータ (sensorNumber をキーとするオブジェクト)
  var sens_num = ["440103264789636", "440103265321573", "440103265317641", "440103265869457", "440103264788998", "440103255555215", "440103265356385"]; // 監視したいセンサー番号

  for (var i = 0; i < allData.length; i++) {
    const sensor = allData[i];
    if (sens_num.includes(sensor.sensorNumber) && typeof sensor.co2 === 'number') {
      co2Data[i] = sensor.co2;
    }
  }
  console.log(co2Data);

  // カスタムイベントを発行して co2Data の値を渡す (オブジェクトとして渡す例)
  window.dispatchEvent(new CustomEvent('dataUpdated', { detail: { data: co2Data } }));
}
request.onerror = function () {
  console.log("データ取得エラー");
}