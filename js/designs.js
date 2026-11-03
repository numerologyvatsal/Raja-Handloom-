// Designs section: segments, categories, sub-categories and design photos.
// (Part of Raja Handloom memo app - plain JavaScript, no build step)

// Draw the Designs section (tabs + current screen).
function drawDz() {
  byId("shop").value = S.shop;
  byId("nav").innerHTML = [["home", "🏠"], ["view", "Designs"], ["add", "Add design"]].map(function(t) {
    return '<button class="'
      + (dtab == t[0] ? "on" : "")
      + `" onclick="designGoTo('`
      + t[0]
      + `')">`
      + t[1]
      + "</button>";
  }).join("");
  byId("app").innerHTML = dtab == "add" ? addDesignHtml() : designsHtml();
  if (dtab == "add") setTimeout(function() {
    fillDesignSelects(1);
  }, 0);
}

// The selected segment, category and sub-category in the Designs tab.
function selectedDesignNode() {
  var sg = S.dsg.find(function(x) {
    return x.id == dfs;
  }), ct = sg && sg.cats.find(function(x) {
    return x.id == dfc;
  }), sb = ct && ct.subs.find(function(x) {
    return x.id == dfb;
  });
  return { sg, ct, sb, cur: sb || ct || sg };
}

// HTML of the Designs tab: filters and design cards.
function designsHtml() {
  var N = selectedDesignNode();
  var h = '<input placeholder="Search designs..." value="'
    + escapeHtml(dq)
    + '" oninput="dq=this.value;refreshDesignList()" style="margin-bottom:8px">';
  h += '<div class="chips"><button class="chip '
    + (!dfs ? "on" : "")
    + '" onclick="dfs=0;dfc=0;dfb=0;draw()">All</button>'
    + S.dsg.map(function(s) {
    return '<button class="chip '
      + (dfs == s.id ? "on" : "")
      + '" onclick="dfs='
      + s.id
      + ';dfc=0;dfb=0;draw()">'
      + escapeHtml(s.name)
      + "</button>";
  }).join("")
    + "</div>";
  if (N.sg && N.sg.cats.length) h += '<div class="chips sub"><button class="chip '
    + (!dfc ? "on" : "")
    + '" onclick="dfc=0;dfb=0;draw()">All '
    + escapeHtml(N.sg.name)
    + "</button>"
    + N.sg.cats.map(function(c) {
    return '<button class="chip '
      + (dfc == c.id ? "on" : "")
      + '" onclick="dfc='
      + c.id
      + ';dfb=0;draw()">'
      + escapeHtml(c.name)
      + "</button>";
  }).join("")
    + "</div>";
  if (N.ct && N.ct.subs.length) h += '<div class="chips sub"><button class="chip '
    + (!dfb ? "on" : "")
    + '" onclick="dfb=0;draw()">All '
    + escapeHtml(N.ct.name)
    + "</button>"
    + N.ct.subs.map(function(b) {
    return '<button class="chip '
      + (dfb == b.id ? "on" : "")
      + '" onclick="dfb='
      + b.id
      + ';draw()">'
      + escapeHtml(b.name)
      + "</button>";
  }).join("")
    + "</div>";
  h += '<div class="card" style="margin-bottom:10px"><input id="dn" placeholder="New segment / category / sub-category name" style="margin-bottom:8px"><div class="row" style="margin:0"><button class="btn" onclick="addDesignNode(1)">+ Segment</button><button class="btn g" onclick="addDesignNode(2)">+ Category</button><button class="btn g" onclick="addDesignNode(3)">+ Sub</button></div>'
    + (N.cur ? '<div class="row" style="margin:8px 0 0"><button class="btn g" onclick="renameDesignNode()">Rename '
      + escapeHtml(N.cur.name)
      + '</button><button class="btn r" onclick="deleteDesignNode()">Delete</button></div>' : "")
    + "</div>";
  return h + '<div class="grid" id="dl">' + designListHtml() + "</div>";
}

// HTML of the design cards after filtering.
function designListHtml() {
  var l = S.dzn.filter(function(d) {
    return (!dfs || d.seg == dfs) && (!dfc || d.cat == dfc) && (!dfb || d.sub == dfb) && ((d.name || "") + " " + (d.note || "")).toLowerCase().indexOf(dq.toLowerCase()) > -1;
  });
  if (!l.length) return '<div class="empty" style="grid-column:1/-1">No designs here yet. Use Add design.</div>';
  return l.map(function(d) {
    var im = d.imgs || [];
    return '<div class="card" onclick="viewDesign('
      + d.id
      + ',0)" style="cursor:pointer;padding:8px">'
      + (im.length ? '<img src="'
        + im[0]
        + '" alt="" style="width:100%;aspect-ratio:1;object-fit:cover;border-radius:8px;display:block">' : '<div class="empty" style="aspect-ratio:1;display:flex;align-items:center;justify-content:center;padding:0">No photo</div>')
      + '<div class="pn" style="margin-top:6px">'
      + escapeHtml(d.name || "Design")
      + "</div>"
      + (im.length > 1 ? '<div class="mu">' + im.length + " photos</div>" : "")
      + "</div>";
  }).join("");
}

// Redraw only the design cards (used while typing in search).
function refreshDesignList() {
  var e = byId("dl");
  if (e) e.innerHTML = designListHtml();
}

// Add a segment (1), category (2) or sub-category (3).
function addDesignNode(l) {
  var n = byId("dn").value.trim();
  if (!n) return;
  var N = selectedDesignNode();
  if (l == 1) {
    var s = { id: newId(), name: n, cats: [] };
    S.dsg.push(s);
    dfs = s.id;
    dfc = 0;
    dfb = 0;
  } else if (l == 2) {
    if (!N.sg) return showMessage("Select a segment first");
    var c = { id: newId(), name: n, subs: [] };
    N.sg.cats.push(c);
    dfc = c.id;
    dfb = 0;
  } else {
    if (!N.ct) return showMessage("Select a category first");
    var b = { id: newId(), name: n };
    N.ct.subs.push(b);
    dfb = b.id;
  }
  save();
  draw();
}

// Open the rename pop-up for a segment, category or sub-category.
function openDesignNodeRename(o) {
  window.renameTarget = o;
  byId("md").innerHTML = '<div class="modal"><div class="sheet"><h3 style="margin-top:0">Edit name</h3><input id="en" value="'
    + escapeHtml(o.name)
    + '"><div class="row" style="margin-top:10px"><button class="btn" onclick="saveRename()">Save</button><button class="btn g" onclick="closeModal()">Cancel</button></div></div></div>';
}

// Rename the selected segment / category / sub-category.
function renameDesignNode() {
  var N = selectedDesignNode();
  if (N.cur) openDesignNodeRename(N.cur);
}

// Delete the selected segment / category / sub-category and its designs.
function deleteDesignNode() {
  var N = selectedDesignNode();
  if (!N.cur) return;
  confirmDelete("Are you sure you want to delete " + N.cur.name + "? Designs inside it will also be deleted.", function() {
    // designs that come from products: stop showing those products in Designs
    unlinkProducts(S.dzn.filter(function(d) {
      return N.sb ? d.sub == N.sb.id : N.ct ? d.cat == N.ct.id : d.seg == N.sg.id;
    }));
    if (N.sb) {
      N.ct.subs = N.ct.subs.filter(function(x) {
        return x.id != N.sb.id;
      });
      S.dzn = S.dzn.filter(function(d) {
        return d.sub != N.sb.id;
      });
      dfb = 0;
    } else if (N.ct) {
      N.sg.cats = N.sg.cats.filter(function(x) {
        return x.id != N.ct.id;
      });
      S.dzn = S.dzn.filter(function(d) {
        return d.cat != N.ct.id;
      });
      dfc = 0;
      dfb = 0;
    } else {
      S.dsg = S.dsg.filter(function(x) {
        return x.id != N.sg.id;
      });
      S.dzn = S.dzn.filter(function(d) {
        return d.seg != N.sg.id;
      });
      dfs = 0;
      dfc = 0;
      dfb = 0;
    }
    save();
    draw();
  });
}

// HTML of the Add design tab.
function addDesignHtml() {
  if (!S.dsg.length) return `<div class="card"><div class="empty">First add a segment in the Designs tab (for example Saree), then come back here.</div><button class="btn w" onclick="designGoTo('view')">Go to Designs</button></div>`;
  var sel = dfs || S.dsg[0].id;
  return '<div class="card"><h3 style="margin-top:0">Add design</h3><input id="dnm" placeholder="Design name or code" style="margin-bottom:8px"><select id="dsl" onchange="fillDesignSelects(1)" style="margin-bottom:8px">'
    + S.dsg.map(function(s) {
    return '<option value="'
      + s.id
      + '"'
      + (s.id == sel ? " selected" : "")
      + ">"
      + escapeHtml(s.name)
      + "</option>";
  }).join("")
    + '</select><div class="row"><select id="dcl" onchange="fillDesignSelects(2)"></select><select id="dbl"></select></div><input id="dnt" placeholder="Note (fabric, size, colour...)" style="margin-bottom:8px"><button class="btn g w" style="margin-bottom:8px" onclick="pickNewDesignPhoto()">📷 Add photos (<span id="dnpc">'
    + dnp.length
    + '</span>)</button><button class="btn w" onclick="saveDesign()">Save design</button></div>';
}

// Fill the category and sub-category drop-downs.
function fillDesignSelects(l) {
  var a = byId("dsl"), b = byId("dcl"), c = byId("dbl");
  if (!a) return;
  var sg = S.dsg.find(function(x) {
    return x.id == a.value;
  });
  if (l <= 1) b.innerHTML = '<option value="0">No category</option>' + (sg ? sg.cats.map(optionHtml).join("") : "");
  var ct = sg && sg.cats.find(function(x) {
    return x.id == b.value;
  });
  c.innerHTML = '<option value="0">No sub-category</option>' + (ct ? ct.subs.map(optionHtml).join("") : "");
}

// Choose photos for the design being added.
function pickNewDesignPhoto() {
  pickPhoto(function(u) {
    dnp.push(u);
    var e = byId("dnpc");
    if (e) e.textContent = dnp.length;
  });
}

// Save the new design.
function saveDesign() {
  var n = byId("dnm").value.trim();
  if (!n && !dnp.length) {
    showMessage("Enter a name or add a photo");
    return;
  }
  var it = { id: newId(), name: n, note: byId("dnt").value.trim(), seg: +byId("dsl").value, cat: +byId("dcl").value, sub: +byId("dbl").value, imgs: dnp.slice() };
  S.dzn.unshift(it);
  dnp = [];
  dfs = it.seg;
  dfc = it.cat;
  dfb = it.sub;
  dtab = "view";
  save();
  draw();
}

// Show a design large, with Prev / Next.
function viewDesign(id2, k) {
  var d = S.dzn.find(function(x) {
    return x.id == id2;
  });
  if (!d) return;
  var im = d.imgs || [];
  if (im.length) k = (k + im.length) % im.length;
  else k = 0;
  var sg = S.dsg.find(function(x) {
    return x.id == d.seg;
  }), ct = sg && sg.cats.find(function(x) {
    return x.id == d.cat;
  }), sb = ct && ct.subs.find(function(x) {
    return x.id == d.sub;
  });
  var path = [sg, ct, sb].filter(Boolean).map(function(x) {
    return x.name;
  }).join(" › ");
  byId("md").innerHTML = '<div class="modal" onclick="if(event.target==this)closeModal()"><div class="sheet" style="text-align:center">'
    + (im.length ? '<img src="' + im[k] + '" alt="" style="max-width:100%;max-height:60vh;border-radius:8px">' : "")
    + '<div style="margin:8px 0"><b>'
    + escapeHtml(d.name || "Design")
    + '</b><div class="mu">'
    + escapeHtml(path)
    + "</div>"
    + (d.note ? "<div>" + escapeHtml(d.note) + "</div>" : "")
    + (im.length > 1 ? '<div class="mu">' + (k + 1) + " / " + im.length + "</div>" : "")
    + "</div>"
    + (im.length > 1 ? '<div class="row"><button class="btn g" onclick="viewDesign('
      + id2
      + ","
      + (k - 1)
      + ')">‹ Prev</button><button class="btn g" onclick="viewDesign('
      + id2
      + ","
      + (k + 1)
      + ')">Next ›</button></div>' : "")
    + '<div class="row"><button class="btn g" onclick="editDesign('
    + id2
    + ')">Edit</button><button class="btn g" onclick="closeModal()">Close</button></div></div></div>';
}

// Save name and note typed in the edit pop-up.
function saveDesignFields(id2) {
  var d = S.dzn.find(function(x) {
    return x.id == id2;
  });
  if (!d) return;
  var e = byId("den");
  if (e) d.name = e.value.trim();
  var n = byId("dno");
  if (n) d.note = n.value.trim();
  save();
}

// Pop-up to edit a design (name, note, photos, delete).
function editDesign(id2) {
  var d = S.dzn.find(function(x) {
    return x.id == id2;
  });
  if (!d) return;
  if (d.pid) return editLinkedDesign(d);
  var im = d.imgs || [];
  byId("md").innerHTML = '<div class="modal" onclick="if(event.target==this){saveDesignFields('
    + id2
    + ');closeModal();draw()}"><div class="sheet"><h3 style="margin-top:0">Edit design</h3><input id="den" value="'
    + escapeHtml(d.name || "")
    + '" placeholder="Name or code" style="margin-bottom:8px"><input id="dno" value="'
    + escapeHtml(d.note || "")
    + '" placeholder="Note" style="margin-bottom:8px"><div class="grid" style="grid-template-columns:repeat(3,1fr)">'
    + (im.map(function(u, k) {
    return '<div style="position:relative"><img src="'
      + u
      + '" alt="" style="width:100%;aspect-ratio:1;object-fit:cover;border-radius:8px"><button class="btn r" style="position:absolute;top:4px;right:4px;padding:2px 8px" onclick="deleteDesignPhoto('
      + id2
      + ","
      + k
      + ')">✕</button></div>';
  }).join("") || '<div class="empty" style="grid-column:1/-1">No photos</div>')
    + '</div><div class="row" style="margin-top:12px"><button class="btn" onclick="addDesignPhoto('
    + id2
    + ')">+ Add photo</button><button class="btn g" onclick="saveDesignFields('
    + id2
    + ');closeModal();draw()">Save</button></div><button class="btn r w" style="margin-top:8px" onclick="deleteDesign('
    + id2
    + ')">Delete design</button></div></div>';
}

// Add a photo to a design.
function addDesignPhoto(id2) {
  saveDesignFields(id2);
  pickPhoto(function(u) {
    var d = S.dzn.find(function(x) {
      return x.id == id2;
    });
    (d.imgs = d.imgs || []).push(u);
    save();
    editDesign(id2);
  });
}

// Remove one photo of a design.
function deleteDesignPhoto(id2, k) {
  saveDesignFields(id2);
  var d = S.dzn.find(function(x) {
    return x.id == id2;
  });
  d.imgs.splice(k, 1);
  save();
  editDesign(id2);
}

// Delete a design (after confirming).
function deleteDesign(id2) {
  confirmDelete("Are you sure you want to delete this design?", function() {
    S.dzn = S.dzn.filter(function(x) {
      return x.id != id2;
    });
    save();
    draw();
  });
}

// Pop-up for a design that comes from a product: only the note can be changed here.
function editLinkedDesign(d) {
  byId("md").innerHTML = '<div class="modal" onclick="if(event.target==this){saveDesignFields(' + d.id + ');closeModal();draw()}"><div class="sheet">'
    + '<h3 style="margin-top:0">Edit design</h3><div><b>' + escapeHtml(d.name) + '</b></div>'
    + '<div class="mu" style="margin:6px 0 10px">This design comes from a product. Change its name, category and photos in Memo / Bill, Manage.</div>'
    + '<input id="dno" value="' + escapeHtml(d.note || "") + '" placeholder="Note" style="margin-bottom:10px">'
    + '<div class="row"><button class="btn" onclick="saveDesignFields(' + d.id + ');closeModal();draw()">Save</button>'
    + '<button class="btn r" onclick="stopShowingInDesigns(' + d.id + ')">Remove from Designs</button></div></div></div>';
}
