/**
 * BUTTON CLICK HANDLERS
 *
 * Each button on the homepage has its own handler function below.
 * Replace the placeholder console.log with your own implementation.
 */

function onButton1Click() {
  console.log("Button 1 clicked -- implement me!");
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
  console.log("Button 3 clicked -- implement me!");
}

function onButton4Click() {
  console.log("Button 4 clicked -- implement me!");
}

function onButton5Click() {
  console.log("Button 5 clicked -- implement me!");
}

function onButton6Click() {
  console.log("Button 6 clicked -- implement me!");
}

function onButton7Click() {
  console.log("Button 7 clicked -- implement me!");
}
