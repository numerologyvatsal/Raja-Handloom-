// Backup and restore: save chosen items to one file, then load that file on another phone.
// (Part of Raja Handloom memo app - plain JavaScript, no build step)

// Which items are ticked on the Backup screen.
var backupPick = { designs: true, products: true, shop: true, bills: true };

// The backup file the user chose, waiting for them to tick what to restore.
var pendingBackup = null;

// Names shown next to the tick boxes: [key, title, explanation]
var BACKUP_ITEMS = [
  ["designs", "Designs", "all designs with their segments, categories, sub-categories and photos"],
  ["products", "Products", "categories, sub-categories, products, prices and photos"],
  ["shop", "Shop details", "shop name, address, mobile and GST no."],
  ["bills", "Bills", "all bills made on this phone"]
];

// The data of the ticked items. Returns null if nothing is ticked.
function backupParts() {
  var parts = {}, p = backupPick;
  if (p.designs) parts.designs = { dsg: S.dsg, dzn: S.dzn };
  if (p.products) parts.products = { cats: S.cats, prods: S.prods };
  if (p.shop) parts.shop = { shop: S.shop, addr: S.addr, sph: S.sph, sgst: S.sgst };
  if (p.bills) parts.bills = S.hist;
  return Object.keys(parts).length ? parts : null;
}

// Build the file to save or share. Returns null if nothing is ticked.
function backupFile() {
  var parts = backupParts();
  if (!parts) {
    showMessage("Tick at least one item to back up.");
    return null;
  }
  var d = new Date();
  var two = function(n) { return n < 10 ? "0" + n : "" + n; };
  var obj = {
    app: "raja-handloom-backup",
    version: 2,
    from: S.dev.name || "",
    date: d.toLocaleString("en-IN"),
    parts: parts
  };
  return {
    blob: new Blob([JSON.stringify(obj)], { type: "application/json" }),
    name: "RajaHandloom-" + Object.keys(parts).join("-") + "-" + d.getFullYear() + "-" + two(d.getMonth() + 1) + "-" + two(d.getDate()) + ".json"
  };
}

// Save the file on this phone (it goes to the Downloads folder).
function saveBackup() {
  var f = backupFile();
  if (!f) return;
  saveFile(f.blob, f.name);
  S.lastBackup = new Date().toLocaleString("en-IN");
  save();
  draw();
}

// Send the file with WhatsApp or any other app. Saves it instead if sharing is not possible.
function shareBackup() {
  var f = backupFile(), file;
  if (!f) return;
  try {
    // "text/plain" is accepted by every share menu; the file name still ends with .json
    file = new File([f.blob], f.name, { type: "text/plain" });
  } catch (e) {
    return saveFile(f.blob, f.name);
  }
  if (navigator.canShare && navigator.canShare({ files: [file] })) {
    navigator.share({ files: [file], title: "Raja Handloom" }).catch(function(e) {
      if (!e || e.name != "AbortError") saveFile(f.blob, f.name);
    });
  } else {
    saveFile(f.blob, f.name);
  }
}

// Let the user pick a backup file from the phone.
function chooseRestoreFile() {
  var input = document.createElement("input");
  input.type = "file";
  input.onchange = function() {
    if (!input.files[0]) return;
    var reader = new FileReader();
    reader.onload = function() { readBackupText(reader.result); };
    reader.readAsText(input.files[0]);
  };
  input.click();
}

// Turn any backup file (also files from older versions) into its list of parts.
function backupPartsOf(b) {
  if (b.app == "raja-handloom-backup" && b.parts) return b.parts;
  if (b.app == "raja-handloom-backup" && b.data) {
    var d = b.data;
    return {
      designs: { dsg: d.dsg || [], dzn: d.dzn || [] },
      products: { cats: d.cats || [], prods: d.prods || [] },
      shop: { shop: d.shop, addr: d.addr, sph: d.sph, sgst: d.sgst },
      bills: d.hist || []
    };
  }
  if (b.app == "raja-handloom-bills" && b.bills) return { bills: b.bills };
  return null;
}

// Read the chosen file and show what is inside it.
function readBackupText(text) {
  var b, parts;
  try {
    b = JSON.parse(text);
    parts = backupPartsOf(b);
  } catch (e) {
    parts = null;
  }
  if (!parts) return showMessage("This is not a Raja Handloom backup file.");
  pendingBackup = { from: b.from || "", date: b.date || "", parts: parts };
  askRestore();
}

// Short description of each item found in the file.
function restoreDetail(key, v) {
  if (key == "designs") return (v.dzn || []).length + " designs in " + (v.dsg || []).length + " segments";
  if (key == "products") return (v.prods || []).length + " products in " + (v.cats || []).length + " categories";
  if (key == "shop") return v.shop || "shop name and details";
  return v.length + " bills (new bills are added, your own bills are kept)";
}

// Pop-up: tick what to restore from the file.
function askRestore() {
  var pb = pendingBackup;
  var rows = BACKUP_ITEMS.filter(function(it) { return pb.parts[it[0]]; }).map(function(it) {
    return '<label style="display:flex;gap:8px;align-items:flex-start;margin:8px 0">'
      + '<input type="checkbox" id="rs_' + it[0] + '" checked style="width:auto;margin-top:3px">'
      + "<span><b>" + it[1] + "</b><div class=\"mu\">" + escapeHtml(restoreDetail(it[0], pb.parts[it[0]])) + "</div></span></label>";
  }).join("");
  byId("md").innerHTML = '<div class="modal" onclick="if(event.target==this)closeModal()"><div class="sheet">'
    + '<h3 style="margin-top:0">Restore from file</h3>'
    + '<div class="mu">Backup' + (pb.from ? " from " + escapeHtml(pb.from) : "") + (pb.date ? " (" + escapeHtml(pb.date) + ")" : "") + "</div>"
    + rows
    + '<div class="mu" style="margin:6px 0 10px">Ticked items on this phone become the same as in the file. Anything removed in the file is removed here too.</div>'
    + '<button class="btn w" onclick="applyBackup()">Restore ticked items</button>'
    + '<button class="btn g w" style="margin-top:8px" onclick="closeModal()">Cancel</button>'
    + "</div></div>";
}

// Add bills that are not already here (matched by id). Returns how many were added.
function mergeBills(list) {
  var have = {}, added = 0;
  S.hist.forEach(function(h) { have[h.id] = 1; });
  list.forEach(function(b) {
    if (!have[b.id]) {
      S.hist.push(b);
      added++;
    }
  });
  S.hist.sort(function(a, b) { return b.id - a.id; });
  return added;
}

// Copy the ticked items from the file into this phone.
function applyBackup() {
  if (!pendingBackup) return;
  var parts = pendingBackup.parts, done = [];
  var ticked = function(key) {
    var box = byId("rs_" + key);
    return parts[key] && box && box.checked;
  };
  if (!BACKUP_ITEMS.some(function(it) { return ticked(it[0]); })) return;
  if (ticked("designs")) {
    S.dsg = parts.designs.dsg || [];
    S.dzn = parts.designs.dzn || [];
    dfs = 0; dfc = 0; dfb = 0;
    done.push("Designs");
  }
  if (ticked("products")) {
    S.cats = parts.products.cats || [];
    S.prods = parts.products.prods || [];
    syncDesigns();
    S.cart = [];
    fc = 0; fs = 0;
    done.push("Products");
  }
  if (ticked("shop")) {
    var s = parts.shop;
    S.shop = s.shop || S.shop;
    S.addr = s.addr || "";
    S.sph = s.sph || "";
    S.sgst = s.sgst || "";
    done.push("Shop details");
  }
  if (ticked("bills")) done.push("Bills (" + mergeBills(parts.bills) + " new)");
  pendingBackup = null;
  save();
  mode = "home";
  byId("shop").value = S.shop;
  draw();
  showMessage("Restored: " + done.join(", ") + ".");
}

// Draw the Backup / Restore screen.
function drawBackup() {
  byId("shop").value = S.shop;
  byId("nav").innerHTML = '<button onclick="goTo(\'home\')">🏠</button>';
  var boxes = BACKUP_ITEMS.map(function(it) {
    return '<label style="display:flex;gap:8px;align-items:flex-start;margin:8px 0">'
      + '<input type="checkbox" style="width:auto;margin-top:3px"' + (backupPick[it[0]] ? " checked" : "")
      + ' onchange="backupPick.' + it[0] + '=this.checked">'
      + "<span><b>" + it[1] + "</b><div class=\"mu\">" + it[2] + "</div></span></label>";
  }).join("");
  byId("app").innerHTML = '<div class="card"><h3 style="margin-top:0">Backup</h3>'
    + '<div class="mu">Tick what you want to put in the file:</div>'
    + boxes
    + '<div class="row"><button class="btn" onclick="saveBackup()">Save file</button>'
    + '<button class="btn g" onclick="shareBackup()">Share (WhatsApp)</button></div>'
    + '<div class="mu">Last backup: ' + escapeHtml(S.lastBackup || "never") + "</div></div>"
    + '<div class="card" style="margin-top:10px"><h3 style="margin-top:0">Restore</h3>'
    + '<div class="mu" style="margin-bottom:8px">Choose a backup file made on another phone. You can then tick which items to restore.</div>'
    + '<button class="btn w" onclick="chooseRestoreFile()">Choose backup file</button></div>';
}
