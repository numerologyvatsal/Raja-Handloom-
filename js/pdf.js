// PDF bill: draws the bill, builds the PDF file, then saves or shares it.
// (Part of Raja Handloom memo app - plain JavaScript, no build step)

// Build a PDF file from page images (JPEG), one image per page.
function makePdfFile(jp, w, h) {
  var enc = new TextEncoder(), parts = [], len = 0, offs = [], np2 = jp.length, kids = [];
  function put(a) {
    if (typeof a == "string") a = enc.encode(a);
    parts.push(a);
    len += a.length;
  }
  function obj(n2, body) {
    offs[n2] = len;
    put(n2 + " 0 obj\n" + body + "\nendobj\n");
  }
  put("%PDF-1.4\n");
  for (var i = 0; i < np2; i++) kids.push(3 + i * 3 + " 0 R");
  obj(1, "<</Type/Catalog/Pages 2 0 R>>");
  obj(2, "<</Type/Pages/Kids[" + kids.join(" ") + "]/Count " + np2 + ">>");
  jp.forEach(function(j, i2) {
    var p = 3 + i2 * 3, c = p + 1, im = p + 2, cs2 = "q 595.28 0 0 841.89 0 0 cm /Im0 Do Q";
    obj(p, "<</Type/Page/Parent 2 0 R/MediaBox[0 0 595.28 841.89]/Resources<</XObject<</Im0 "
      + im
      + " 0 R>>>>/Contents "
      + c
      + " 0 R>>");
    obj(c, "<</Length " + cs2.length + ">>\nstream\n" + cs2 + "\nendstream");
    offs[im] = len;
    put(im
      + " 0 obj\n<</Type/XObject/Subtype/Image/Width "
      + w
      + "/Height "
      + h
      + "/ColorSpace/DeviceRGB/BitsPerComponent 8/Filter/DCTDecode/Length "
      + j.length
      + ">>\nstream\n");
    put(j);
    put("\nendstream\nendobj\n");
  });
  var n = 3 + np2 * 3, xr = len, x = "xref\n0 " + n + "\n0000000000 65535 f \n";
  for (var k = 1; k < n; k++) x += ("0000000000" + offs[k]).slice(-10) + " 00000 n \n";
  put(x + "trailer\n<</Size " + n + "/Root 1 0 R>>\nstartxref\n" + xr + "\n%%EOF");
  var out = new Uint8Array(len), o = 0;
  parts.forEach(function(p) {
    out.set(p, o);
    o += p.length;
  });
  return new Blob([out], { type: "application/pdf" });
}

// Save a file with an ordinary download link.
function downloadBlob(data, fn) {
  var a = document.createElement("a");
  a.href = URL.createObjectURL(data);
  a.download = fn;
  document.body.appendChild(a);
  a.click();
  a.remove();
}

// Save a file (uses the Claude downloads feature when available).
function saveFile(data, fn) {
  if (window.claude && claude.use) {
    claude.use("downloads").then(function(d2) {
      if (!d2) return downloadBlob(data, fn);
      return d2.save({ filename: fn, data });
    }).catch(function(e) {
      if (!e || e.code != "declined") alert("Could not save the file");
    });
    return;
  }
  downloadBlob(data, fn);
}

// Draw the bill on a canvas (A4 pages) and turn it into a PDF.
function buildBillPdf(i) {
  var b = S.hist.find(function(x2) {
    return x2.id == i;
  });
  if (!b) return;
  var W = 794, PH = 1123, sc = 3, P = 40, RH = 34, pos = [], y = 294;
  var fmt = function(v) {
    return (Math.round(v * 100) / 100).toLocaleString("en-IN");
  };
  b.items.forEach(function() {
    if (y % PH + RH > PH - 60) y = (Math.floor(y / PH) + 1) * PH + 40;
    pos.push(y);
    y += RH;
  });
  if (y % PH + 130 > PH - 30) y = (Math.floor(y / PH) + 1) * PH + 40;
  var n = Math.ceil((y + 130) / PH), c = document.createElement("canvas");
  c.width = W * sc;
  c.height = n * PH * sc;
  var x = c.getContext("2d");
  x.scale(sc, sc);
  x.fillStyle = "#fff";
  x.fillRect(0, 0, W, n * PH);
  var F = "'Noto Sans Gujarati','Shruti',system-ui,-apple-system,'Segoe UI',Roboto,sans-serif";
  function T(s, px, py, sz, w, al, mw2) {
    x.fillStyle = "#111";
    x.font = (w || "") + " " + sz + "px " + F;
    if (mw2) {
      while (sz > 9 && x.measureText(s).width > mw2) {
        sz--;
        x.font = (w || "") + " " + sz + "px " + F;
      }
    }
    x.textAlign = al || "left";
    x.fillText(s, px, py);
  }
  function L(py) {
    x.fillStyle = "#ccc";
    x.fillRect(P, py, W - 2 * P, 1);
  }
  var lg = LG.complete && LG.naturalWidth > 0 && logoCanBeDrawn(), hx = lg ? 457 : W / 2, mw = lg ? 560 : 714;
  if (lg) {
    var lh = 84, lw = lh * LG.naturalWidth / LG.naturalHeight;
    x.drawImage(LG, P, 22, lw, lh);
  }
  T(S.shop, hx, 62, 34, "bold", "center", mw);
  if (S.addr) T(S.addr, hx, 88, 14, "", "center", mw);
  var ct = [];
  if (S.sph) ct.push("Mobile: " + S.sph);
  if (S.sgst) ct.push("GSTIN: " + S.sgst);
  if (ct.length) T(ct.join("    |    "), hx, 110, 14, "", "center", mw);
  T("Bill / Memo", W / 2, 138, 16, "bold", "center");
  L(150);
  T("Bill No: " + billNumber(b), P, 180, 18, "bold");
  T(b.date, W - P, 180, 15, "", "right");
  T("Customer: " + (b.cust || "-"), P, 210, 18);
  if (b.ph) T("Mobile: " + b.ph, P, 236, 15);
  if (b.gst) T("GST No: " + b.gst, W - P, 236, 15, "", "right");
  L(252);
  T("#", P, 282, 15, "bold");
  T("Item", P + 30, 282, 15, "bold");
  T("Qty", 470, 282, 15, "bold", "right");
  T("Rate", 580, 282, 15, "bold", "right");
  T("Amount", W - P, 282, 15, "bold", "right");
  L(290);
  b.items.forEach(function(it, k) {
    var r = pos[k], by = r + 22;
    T(String(k + 1), P, by, 15);
    var nm = it.name;
    x.font = "15px " + F;
    while (nm.length > 1 && x.measureText(nm).width > 340) nm = nm.slice(0, -1);
    if (nm != it.name) nm += "…";
    T(nm, P + 30, by, 15);
    T(String(it.qty), 470, by, 15, "", "right");
    T(fmt(it.price), 580, by, 15, "", "right");
    T(fmt(it.price * it.qty), W - P, by, 15, "", "right");
    L(r + RH - 4);
  });
  var ty = y + 10;
  L(ty);
  T("Total", 470, ty + 45, 22, "bold", "right");
  T("₹ " + fmt(b.total), W - P, ty + 45, 26, "bold", "right");
  T("Thank you! Visit again.", W / 2, ty + 100, 16, "", "center");
  var jp = [];
  for (var p = 0; p < n; p++) {
    var t = document.createElement("canvas");
    t.width = W * sc;
    t.height = PH * sc;
    t.getContext("2d").drawImage(c, 0, p * PH * sc, W * sc, PH * sc, 0, 0, W * sc, PH * sc);
    var bin = atob(t.toDataURL("image/jpeg", 0.92).split(",")[1]), a = new Uint8Array(bin.length);
    for (var q2 = 0; q2 < bin.length; q2++) a[q2] = bin.charCodeAt(q2);
    jp.push(a);
  }
  return { blob: makePdfFile(jp, W * sc, PH * sc), name: "Bill-" + billNumber(b) + ".pdf" };
}

// Download the bill as a PDF.
function downloadBillPdf(i) {
  var r = buildBillPdf(i);
  if (r) saveFile(r.blob, r.name);
}

// Share the bill PDF (WhatsApp etc.); downloads it if sharing is not possible.
function shareBillPdf(i) {
  var r = buildBillPdf(i);
  if (!r) return;
  var f;
  try {
    f = new File([r.blob], r.name, { type: "application/pdf" });
  } catch (e) {
    return saveFile(r.blob, r.name);
  }
  if (navigator.canShare && navigator.canShare({ files: [f] })) {
    navigator.share({ files: [f], title: S.shop + " Bill" }).catch(function(e) {
      if (!e || e.name != "AbortError") saveFile(r.blob, r.name);
    });
  } else saveFile(r.blob, r.name);
}

// Can the logo be drawn on a canvas? (browsers block this when index.html is opened straight from a file)
function logoCanBeDrawn() {
  try {
    var c = document.createElement("canvas");
    c.width = c.height = 1;
    var g = c.getContext("2d");
    g.drawImage(LG, 0, 0, 1, 1);
    g.getImageData(0, 0, 1, 1);
    return true;
  } catch (e) {
    return false;
  }
}
