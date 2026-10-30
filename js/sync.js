// Syncing between phones (Claude link database or Firebase).
// (Part of Raja Handloom memo app - plain JavaScript, no build step)

// Small Firebase (Firestore) client with the same methods as the Claude database.
function firestoreDb(cfg) {
  var B = "https://firestore.googleapis.com/v1/projects/"
    + encodeURIComponent(cfg.pid)
    + "/databases/(default)/documents", K = "key=" + encodeURIComponent(cfg.key);
  function wrapDoc(raw) {
    return { id: raw.name.split("/").pop(), exists: true, data: function() {
      return JSON.parse(raw.fields.j.stringValue);
    } };
  }
  function bad(r) {
    throw new Error("Cloud error " + r.status + (r.status == 403 ? " (check Firestore rules and API key)" : ""));
  }
  function ref(path) {
    return {
      get: async function() {
        var r = await fetch(B + "/" + path + "?" + K);
        if (r.status == 404) return { exists: false };
        if (!r.ok) bad(r);
        return wrapDoc(await r.json());
      },
      set: async function(o) {
        var r = await fetch(B + "/" + path + "?" + K, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ fields: { j: { stringValue: JSON.stringify(o) } } }) });
        if (!r.ok) bad(r);
      },
      delete: async function() {
        var r = await fetch(B + "/" + path + "?" + K, { method: "DELETE" });
        if (!r.ok && r.status != 404) bad(r);
      }
    };
  }
  return { doc: ref, collection: function(c) {
    return {
      doc: function(docId) {
        return ref(c + "/" + docId);
      },
      get: async function() {
        var out = [], t = "";
        do {
          var r = await fetch(B + "/" + c + "?pageSize=300&" + K + (t ? "&pageToken=" + encodeURIComponent(t) : ""));
          if (!r.ok) bad(r);
          var j = await r.json();
          (j.documents || []).forEach(function(raw) {
            out.push(wrapDoc(raw));
          });
          t = j.nextPageToken || "";
        } while (t);
        return { docs: out };
      }
    };
  } };
}

// Cloud sync settings card (only outside the Claude link).
function cloudCard() {
  if (window.claude) return "";
  var c = S.cloud || {};
  return '<div class="card" style="margin-top:10px"><h3 style="margin-top:0">Cloud sync (Firebase)</h3><input id="fpid" placeholder="Firebase Project ID" value="'
    + escapeHtml(c.pid || "")
    + '" style="margin-bottom:8px"><input id="fkey" placeholder="Firebase Web API key" value="'
    + escapeHtml(c.key || "")
    + '" style="margin-bottom:8px"><button class="btn w" onclick="saveCloudSettings()">Save and test sync</button><div class="mu" style="margin-top:6px">Use the same details on every phone. Setup steps are in README.md.</div></div>';
}

// Save the Firebase details and run a sync.
function saveCloudSettings() {
  S.cloud = { pid: byId("fpid").value.trim(), key: byId("fkey").value.trim() };
  save();
  sync();
}

// Short text that changes whenever the photos of an item change (used by sync).
function photoSignature(p) {
  return (p.imgs || []).map(function(u) {
    return u.length + u.slice(-12);
  }).join("|");
}

var syncing = false;

// Sync with the other phones. Main phone: sends products, designs and photos, receives bills. Other phones: the opposite.
async function sync(auto) {
  if (syncing) return;
  var db = null;
  try {
    if (window.claude && claude.use) db = await claude.use("db");
    else if (S.cloud && S.cloud.pid && S.cloud.key) db = firestoreDb(S.cloud);
  } catch (e) {
  }
  if (!db) {
    if (!auto) showMessage("Sync is not set up yet. Go to Manage, Cloud sync, and enter your Firebase details (or use the online Claude link).");
    return;
  }
  syncing = true;
  var syncButton = byId("sy");
  syncButton.textContent = "⟳ Syncing...";
  var r = { sent: 0, got: 0, cat: 0, trim: 0, err: "" };
  try {
    for (var i = 0; i < S.hist.length; i++) {
      var b = S.hist[i];
      if (!b.sy) {
        var o = Object.assign({}, b, { sy: true, dev: b.dev || S.dev.name || "Phone" });
        await db.collection("bills").doc(String(b.id)).set(o);
        b.sy = true;
        b.dev = o.dev;
        r.sent++;
      }
    }
    if (S.dev.main) {
      for (var n = 0; n < S.dels.length; n++) await db.collection("bills").doc(String(S.dels[n])).delete();
      var dd = S.dels;
      S.dels = [];
      var billsSnapshot = await db.collection("bills").get(), have = {};
      S.hist.forEach(function(h) {
        have[h.id] = 1;
      });
      billsSnapshot.docs.forEach(function(x) {
        var v = x.data();
        if (v && !have[v.id] && dd.indexOf(v.id) < 0) {
          S.hist.push(v);
          r.got++;
        }
      });
      S.hist.sort(function(a, c) {
        return c.id - a.id;
      });
      var productList = [], sg = {};
      for (var k = 0; k < S.prods.length; k++) {
        var p = S.prods[k], sv2 = photoSignature(p);
        sg[p.id] = sv2;
        if (sv2 !== (S.psig[p.id] || "")) {
          var im = (p.imgs || []).slice();
          while (im.length > 1 && JSON.stringify(im).length > 240000) {
            im.pop();
            r.trim++;
          }
          await db.collection("prodimgs").doc(String(p.id)).set({ imgs: im });
          S.psig[p.id] = sv2;
        }
        productList.push({ id: p.id, name: p.name, price: p.price, cat: p.cat, sub: p.sub, n: (p.imgs || []).length });
      }
      var dz = [];
      for (var z = 0; z < S.dzn.length; z++) {
        var it = S.dzn[z], designSig = designSignature(it);
        dz.push({ id: it.id, sg: designSig });
        if (designSig !== (S.dsig[it.id] || "")) {
          var c3 = Object.assign({}, it, { imgs: (it.imgs || []).slice() });
          while (c3.imgs.length > 1 && JSON.stringify(c3).length > 240000) {
            c3.imgs.pop();
            r.trim++;
          }
          await db.collection("designs").doc(String(it.id)).set(c3);
          S.dsig[it.id] = designSig;
        }
      }
      await db.doc("sync/catalog").set({ shop: S.shop, addr: S.addr, sph: S.sph, sgst: S.sgst, cats: S.cats, prods: productList, psig: sg, dsg: S.dsg, dz });
      r.cat = 1;
    } else {
      var cd = await db.doc("sync/catalog").get();
      if (cd.exists) {
        var v2 = cd.data(), old = {};
        S.prods.forEach(function(oldProd) {
          old[oldProd.id] = oldProd;
        });
        var newProds = [];
        for (var j = 0; j < v2.prods.length; j++) {
          var remoteProd = v2.prods[j], localProd = old[remoteProd.id], imgs = [];
          if (localProd && photoSignature(localProd) === v2.psig[remoteProd.id]) imgs = localProd.imgs || [];
          else if (remoteProd.n > 0) {
            var g = await db.doc("prodimgs/" + remoteProd.id).get();
            imgs = g.exists ? g.data().imgs || [] : [];
          }
          newProds.push({ id: remoteProd.id, name: remoteProd.name, price: remoteProd.price, cat: remoteProd.cat, sub: remoteProd.sub, imgs });
        }
        S.prods = newProds;
        S.cats = v2.cats;
        S.shop = v2.shop;
        S.addr = v2.addr || "";
        S.sph = v2.sph || "";
        S.sgst = v2.sgst || "";
        var oz = {};
        S.dzn.forEach(function(d3) {
          oz[d3.id] = d3;
        });
        var nz = [], dl2 = v2.dz || [];
        for (var y = 0; y < dl2.length; y++) {
          var ox = oz[dl2[y].id];
          if (ox && designSignature(ox) === dl2[y].sg) nz.push(ox);
          else {
            var gz = await db.doc("designs/" + dl2[y].id).get();
            if (gz.exists) nz.push(gz.data());
          }
        }
        S.dzn = nz;
        S.dsg = v2.dsg || [];
        r.cat = 1;
      }
    }
    S.last = (/* @__PURE__ */ new Date()).toLocaleString("en-IN");
    save();
  } catch (e) {
    r.err = e && e.message || "unknown error";
  }
  syncing = false;
  syncButton.textContent = "⟳ Sync";
  byId("shop").value = S.shop;
  draw();
  if (r.err) {
    if (!auto) showMessage("Sync failed: " + r.err + ". Check internet and try again.");
  } else if (!auto) {
    showMessage(S.dev.main ? "Done. Received "
      + r.got
      + " bills from other phones, sent "
      + r.sent
      + " of yours. Products, photos and shop details sent to the other phones."
      + (r.trim ? " Some products had too many photos; extra photos were not sent." : "") : "Done. Sent "
      + r.sent
      + " bills to the main phone. "
      + (r.cat ? "Products and photos updated from the main phone." : "The main phone has not synced its products yet."));
  }
}
