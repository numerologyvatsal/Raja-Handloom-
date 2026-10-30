// Pop-up windows (messages, confirm, rename) and the photo picker.
// (Part of Raja Handloom memo app - plain JavaScript, no build step)

// One <option> for a drop-down list.
function optionHtml(x) {
  return '<option value="' + x.id + '">' + escapeHtml(x.name) + "</option>";
}

// Show a simple message pop-up.
function showMessage(t) {
  byId("md").innerHTML = '<div class="modal" onclick="if(event.target==this)closeModal()"><div class="sheet"><p>'
    + escapeHtml(t)
    + '</p><button class="btn w" onclick="closeModal()">OK</button></div></div>';
}

// Close the pop-up window.
function closeModal() {
  byId("md").innerHTML = "";
}

// Let the user choose photos, shrink them, and pass each one to the callback.
function pickPhoto(cb) {
  var f = document.createElement("input");
  f.type = "file";
  f.accept = "image/*";
  f.multiple = true;
  f.onchange = function() {
    Array.prototype.forEach.call(f.files, function(file) {
      var r = new FileReader();
      r.onload = function() {
        var im = new Image();
        im.onload = function() {
          var M = 720, k = Math.min(1, M / Math.max(im.width, im.height)), c = document.createElement("canvas");
          c.width = Math.round(im.width * k);
          c.height = Math.round(im.height * k);
          c.getContext("2d").drawImage(im, 0, 0, c.width, c.height);
          cb(c.toDataURL("image/jpeg", 0.72));
        };
        im.src = r.result;
      };
      r.readAsDataURL(file);
    });
  };
  f.click();
}

// Ask "Are you sure?" and run the action only if the user agrees.
function confirmDelete(msg2, fn) {
  window.pendingAction = fn;
  byId("md").innerHTML = '<div class="modal"><div class="sheet"><p>'
    + escapeHtml(msg2)
    + '</p><div class="row"><button class="btn r" onclick="closeModal();pendingAction()">Delete</button><button class="btn g" onclick="closeModal()">Cancel</button></div></div></div>';
}

// Open the rename pop-up for a category, sub-category or product.
function openRename(t, a, b) {
  var o = t == "c" ? S.cats.find(function(x) {
    return x.id == a;
  }) : t == "s" ? S.cats.find(function(x) {
    return x.id == a;
  }).subs.find(function(x) {
    return x.id == b;
  }) : S.prods.find(function(x) {
    return x.id == a;
  });
  window.renameTarget = o;
  byId("md").innerHTML = '<div class="modal"><div class="sheet"><h3 style="margin-top:0">Edit name</h3><input id="en" value="'
    + escapeHtml(o.name)
    + '"><div class="row" style="margin-top:10px"><button class="btn" onclick="saveRename()">Save</button><button class="btn g" onclick="closeModal()">Cancel</button></div></div></div>';
}

// Save the new name from the rename pop-up.
function saveRename() {
  var n = byId("en").value.trim();
  if (!n) return;
  renameTarget.name = n;
  closeModal();
  save();
  draw();
}
