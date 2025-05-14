var request = new XMLHttpRequest();
request.open('GET', 'https://airoco.necolico.jp/data-api/latest?id=CgETViZ2&subscription-key=6b8aa7133ece423c836c38af01c59880', true);
request.responseType = 'json';
request.send();
request.onload = function () {
  var sens_num = 1;
  var jsonData = this.response;
  var data = JSON.stringify(jsonData, null, ' ');
  jsons = JSON.parse(data);
  console.log(jsons);
  console.log(jsons[sens_num].co2);
  var co2Data = "none";
  var obj = document.getElementById("co2");
  if (jsons[sens_num].co2 >= 700) {
    co2Data = "red";
  } else {
    co2Data = "green";
  }

  // カスタムイベントを発行して co2Data の値を渡す
  window.dispatchEvent(new CustomEvent('commentUpdated', { detail: { comment: co2Data } }));
}
request.onerror = function () {
  console.log("データ取得エラー");
}