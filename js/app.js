// Home screen, screen switching and app start-up.
// (Part of Raja Handloom memo app - plain JavaScript, no build step)

byId("shop").onchange = function() {
  S.shop = this.value;
  save();
};

// Open Designs (1), Memo / Bill (2) or Backup / Restore (3) from the home screen.
function openSection(n) {
  mode = n == 1 ? "design" : n == 2 ? "memo" : "backup";
  if (n == 2) tab = "shop";
  dtab = "view";
  draw();
}

// Draw whichever screen is open.
function draw() {
  if (mode == "home") drawHome();
  else if (mode == "design") drawDz();
  else if (mode == "backup") drawBackup();
  else drawMemo();
}

// Draw the home screen: two big buttons and a small Backup / Restore button.
function drawHome() {
  byId("shop").value = S.shop;
  byId("nav").innerHTML = "";
  var c = 'class="card" style="flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;cursor:pointer"';
  byId("app").innerHTML = '<div style="display:flex;flex-direction:column;gap:12px;height:calc(100vh - 130px);min-height:380px"><div '
    + c
    + ' onclick="openSection(1)"><div style="font-size:72px">🎨</div><div class="pn" style="font-size:26px;margin-top:10px">Designs</div><div class="mu">Show designs to customers</div></div><div '
    + c
    + ' onclick="openSection(2)"><div style="font-size:72px">🧾</div><div class="pn" style="font-size:26px;margin-top:10px">Memo / Bill</div><div class="mu">Make bills</div></div><div class="card" style="text-align:center;cursor:pointer;padding:14px" onclick="openSection(3)"><b>💾 Backup / Restore</b><div class="mu">Copy everything to another phone</div></div></div>';
}

// Switch tab inside Designs (or go back home).
function designGoTo(t) {
  if (t == "home") mode = "home";
  else dtab = t;
  draw();
}

draw();

if ("serviceWorker" in navigator && location.protocol.indexOf("http") == 0) navigator.serviceWorker.register("sw.js");
