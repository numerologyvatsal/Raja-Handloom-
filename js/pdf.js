// PDF bill: draws the bill, builds the PDF file, then saves or shares it.
// (Part of Raja Handloom memo app - plain JavaScript, no build step)

// Build a PDF file from page images (JPEG), one image per page.
function makePdfFile(jp, w, h, pw, ph) {
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
    var p = 3 + i2 * 3, c = p + 1, im = p + 2, cs2 = "q " + pw + " 0 0 " + ph + " 0 0 cm /Im0 Do Q";
    obj(p, "<</Type/Page/Parent 2 0 R/MediaBox[0 0 " + pw + " " + ph + "]/Resources<</XObject<</Im0 "
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
  // The PDF page is always A4. "half" draws a smaller bill in the upper half of the page,
  // "a4" uses the whole page.
  var half = S.paper == "half";
  var W = 794, PH = 1123, sc = 3, P = 40;
  var U = half ? 561 : PH;                // height of the page that is used
  var pageW = 595.28, pageH = 841.89;     // A4 size in PDF points
  var colQty = 470, colRate = 580;        // right edge of the Qty and Rate columns
  // Sizes and heights of every part of the bill (px)
  var Ly = half ? {
    lh: 60, logoY: 12, shopY: 44, shopSize: 26, addrY: 66, addrSize: 13, contactY: 86,
    titleY: 112, titleSize: 14, rule1: 122, billY: 144, billSize: 16, dateSize: 13,
    custY: 166, custSize: 16, subY: 186, subSize: 13, rule2: 198,
    headY: 218, headSize: 13, rule3: 226, rowsY: 230, rowH: 26, rowSize: 13, rowBase: 18, sepOff: 3,
    footH: 70, footRule: 6, totalY: 30, totalSize: 18, amtSize: 22, thanksY: 58, thanksSize: 13
  } : {
    lh: 84, logoY: 22, shopY: 62, shopSize: 34, addrY: 88, addrSize: 14, contactY: 110,
    titleY: 138, titleSize: 16, rule1: 150, billY: 180, billSize: 18, dateSize: 15,
    custY: 210, custSize: 18, subY: 236, subSize: 15, rule2: 252,
    headY: 282, headSize: 15, rule3: 290, rowsY: 294, rowH: 34, rowSize: 15, rowBase: 22, sepOff: 4,
    footH: 130, footRule: 10, totalY: 45, totalSize: 22, amtSize: 26, thanksY: 100, thanksSize: 16
  };
  var RH = Ly.rowH, pos = [], y = Ly.rowsY;
  var fmt = function(v) {
    return (Math.round(v * 100) / 100).toLocaleString("en-IN");
  };
  // Work out where every row goes; a row that does not fit moves to the next page
  b.items.forEach(function() {
    if (y % PH + RH > U - 60) y = (Math.floor(y / PH) + 1) * PH + 40;
    pos.push(y);
    y += RH;
  });
  if (y % PH + Ly.footH > U - 30) y = (Math.floor(y / PH) + 1) * PH + 40;
  var n = Math.ceil((y + Ly.footH) / PH), c = document.createElement("canvas");
  c.width = W * sc;
  c.height = n * PH * sc;
  var x = c.getContext("2d");
  x.scale(sc, sc);
  x.fillStyle = "#fff";
  x.fillRect(0, 0, W, n * PH);
  var F = "'Noto Sans Gujarati','Shruti',system-ui,-apple-system,'Segoe UI',Roboto,sans-serif";
  // Write text. mw2 (optional) = maximum width, the letters shrink to fit.
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
  // Draw a thin grey line
  function L(py) {
    x.fillStyle = "#ccc";
    x.fillRect(P, py, W - 2 * P, 1);
  }
  // Top: logo on the left, shop name and details next to it
  var lg = LG.complete && LG.naturalWidth > 0 && logoCanBeDrawn();
  var lw = lg ? Ly.lh * LG.naturalWidth / LG.naturalHeight : 0;
  var textLeft = lg ? P + lw + 16 : P, hx = (textLeft + W - P) / 2, mw = W - P - textLeft;
  if (lg) x.drawImage(LG, P, Ly.logoY, lw, Ly.lh);
  T(S.shop, hx, Ly.shopY, Ly.shopSize, "bold", "center", mw);
  if (S.addr) T(S.addr, hx, Ly.addrY, Ly.addrSize, "", "center", mw);
  var ct = [];
  if (S.sph) ct.push("Mobile: " + S.sph);
  if (S.sgst) ct.push("GSTIN: " + S.sgst);
  if (ct.length) T(ct.join("    |    "), hx, Ly.contactY, Ly.addrSize, "", "center", mw);
  T("Bill / Memo", W / 2, Ly.titleY, Ly.titleSize, "bold", "center");
  L(Ly.rule1);
  // Bill number, date and customer
  T("Bill No: " + billNumber(b), P, Ly.billY, Ly.billSize, "bold");
  T(b.date, W - P, Ly.billY, Ly.dateSize, "", "right");
  T("Customer: " + (b.cust || "-"), P, Ly.custY, Ly.custSize);
  if (b.ph) T("Mobile: " + b.ph, P, Ly.subY, Ly.subSize);
  if (b.gst) T("GST No: " + b.gst, W - P, Ly.subY, Ly.subSize, "", "right");
  L(Ly.rule2);
  // Table heading
  T("#", P, Ly.headY, Ly.headSize, "bold");
  T("Item", P + 30, Ly.headY, Ly.headSize, "bold");
  T("Qty", colQty, Ly.headY, Ly.headSize, "bold", "right");
  T("Rate", colRate, Ly.headY, Ly.headSize, "bold", "right");
  T("Amount", W - P, Ly.headY, Ly.headSize, "bold", "right");
  L(Ly.rule3);
  // One row for each item
  b.items.forEach(function(it, k) {
    var r = pos[k], by = r + Ly.rowBase;
    T(String(k + 1), P, by, Ly.rowSize);
    // long names: make the letters a little smaller first, then cut the end
    var nm = it.name, nameW = colQty - P - 30 - 60, nameSize = Ly.rowSize;
    x.font = nameSize + "px " + F;
    while (nameSize > 10 && x.measureText(nm).width > nameW) {
      nameSize--;
      x.font = nameSize + "px " + F;
    }
    while (nm.length > 1 && x.measureText(nm).width > nameW) nm = nm.slice(0, -1);
    if (nm != it.name) nm += "…";
    T(nm, P + 30, by, nameSize);
    T(String(it.qty), colQty, by, Ly.rowSize, "", "right");
    T(fmt(it.price), colRate, by, Ly.rowSize, "", "right");
    T(fmt(it.price * it.qty), W - P, by, Ly.rowSize, "", "right");
    L(r + RH - Ly.sepOff);
  });
  // Bottom: total and thank-you line
  var ty = y + Ly.footRule;
  L(ty);
  T("Total", colQty, ty + Ly.totalY, Ly.totalSize, "bold", "right");
  T("₹ " + fmt(b.total), W - P, ty + Ly.totalY, Ly.amtSize, "bold", "right");
  T("Thank you! Visit again.", W / 2, ty + Ly.thanksY, Ly.thanksSize, "", "center");
  // Cut the big picture into pages and turn each page into a JPEG
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
  return { blob: makePdfFile(jp, W * sc, PH * sc, pageW, pageH), name: "Bill-" + billNumber(b) + ".pdf" };
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
