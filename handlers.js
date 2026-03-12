/**
 * BUTTON CLICK HANDLERS
 *
 * Each button on the homepage has its own handler function below.
 * Replace the placeholder console.log with your own implementation.
 */

function onButton1Click() {
  window.location.href = "usd-try.html";
}

function onButton2Click() {
  fetch("https://api.open-meteo.com/v1/forecast?latitude=41.01&longitude=28.95&current=temperature_2m,windspeed_10m,relativehumidity_2m&timezone=auto")
    .then(res => res.json())
    .then(data => {
      const current = data.current;
      window.location.href = "weather.html" +
        "?temp=" + current.temperature_2m +
        "&wind=" + current.windspeed_10m +
        "&humidity=" + current.relativehumidity_2m;
    });
}

function onButton3Click() {
  window.location.href = 'joke.html';
}

function onButton4Click() {
  window.location.href = "player.html";
}

function onButton5Click() {
  window.location.href = "countries.html";
}

function onButton6Click() {
  fetch("https://catfact.ninja/fact")
    .then(function (response) {
      if (!response.ok) {
        throw new Error("Network response was not ok");
      }
      return response.json();
    })
    .then(function (data) {
      var catPage = window.open("", "_blank");
      catPage.document.write(
        '<!DOCTYPE html>' +
        '<html lang="en"><head><meta charset="UTF-8"/>' +
        '<meta name="viewport" content="width=device-width,initial-scale=1.0"/>' +
        '<title>Cat Fact</title>' +
        '<style>' +
        'body{margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;' +
        'background:linear-gradient(135deg,#fce4ec,#f3e5f5,#e8eaf6);font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;}' +
        '.container{text-align:center;max-width:560px;padding:48px 40px;background:#fff;border-radius:24px;' +
        'box-shadow:0 8px 40px rgba(0,0,0,0.1);}' +
        '.cat-emoji{font-size:5rem;margin-bottom:16px;animation:bounce 1.5s infinite;}' +
        '@keyframes bounce{0%,100%{transform:translateY(0)}50%{transform:translateY(-12px)}}' +
        'h1{font-size:1.75rem;color:#6d28d9;margin-bottom:24px;}' +
        '.fact-box{background:linear-gradient(135deg,#fef3c7,#fde68a);border-radius:16px;padding:24px 28px;' +
        'font-size:1.1rem;line-height:1.6;color:#78350f;border:2px dashed #f59e0b;}' +
        '.paws{margin-top:32px;font-size:1.5rem;letter-spacing:8px;opacity:0.5;}' +
        '.btn-back{margin-top:28px;display:inline-block;padding:12px 32px;background:#6d28d9;color:#fff;' +
        'border:none;border-radius:12px;font-size:1rem;cursor:pointer;text-decoration:none;transition:background 150ms;}' +
        '.btn-back:hover{background:#5b21b6;}' +
        '</style></head><body>' +
        '<div class="container">' +
        '<div class="cat-emoji">\ud83d\udc31</div>' +
        '<h1>Did You Know?</h1>' +
        '<div class="fact-box">' + data.fact + '</div>' +
        '<div class="paws">\ud83d\udc3e\ud83d\udc3e\ud83d\udc3e\ud83d\udc3e\ud83d\udc3e</div>' +
        '<button class="btn-back" onclick="window.close()">Close &amp; Go Back</button>' +
        '</div></body></html>'
      );
      catPage.document.close();
    })
    .catch(function (error) {
      alert("Failed to fetch cat fact: " + error.message);
    });
}

function onButton7Click() {
  console.log("Button 7 clicked! Opening Live Commodities dashboard...");
  window.open('commodities.html', '_blank');
}
