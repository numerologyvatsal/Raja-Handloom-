// Creating a bill, the bill number and the plain-text bill.
// (Part of Raja Handloom memo app - plain JavaScript, no build step)

// Turn the cart into a numbered bill, save it and show it.
function generateBill() {
  var b = { id: newId(), no: S.n++, pre: S.dev.pre || "", dev: S.dev.name || "", date: (/* @__PURE__ */ new Date()).toLocaleString("en-IN"), cust: S.cust, ph: S.ph, gst: S.gst, items: S.cart.slice(), total: cartTotal(S.cart) };
  S.hist.unshift(b);
  S.cart = [];
  S.cust = "";
  S.ph = "";
  S.gst = "";
  save();
  draw();
  showBill(b.id);
}

// The bill as plain text (for copying).
function billToText(b) {
  var t = S.shop + "\nBill #" + billNumber(b) + "  " + b.date + "\n";
  if (b.cust) t += "Customer: " + b.cust + (b.ph ? " (" + b.ph + ")" : "") + "\n";
  if (b.gst) t += "GST No: " + b.gst + "\n";
  t += "------------------------\n";
  b.items.forEach(function(i) {
    t += i.name + "\n  " + i.qty + " x " + i.price + " = " + i.qty * i.price + "\n";
  });
  return t + "------------------------\nTOTAL: Rs. " + b.total + "\nThank you!";
}

// Show a saved bill in a pop-up.
function showBill(i) {
  var b = S.hist.find(function(x) {
    return x.id == i;
  });
  if (!b) return;
  byId("md").innerHTML = '<div class="modal" onclick="if(event.target==this)closeModal()"><div class="sheet"><pre>'
    + escapeHtml(billToText(b))
    + '</pre><div class="row"><button class="btn" onclick="shareBillPdf('
    + i
    + ')">Share PDF</button><button class="btn g" onclick="downloadBillPdf('
    + i
    + ')">Download PDF</button></div><div class="row"><button class="btn g" onclick="copyBillText('
    + i
    + ')">Copy text</button><button class="btn g" onclick="closeModal()">Close</button></div></div></div>';
}

// Bill number with the phone prefix, e.g. M-12.
function billNumber(b) {
  return (b.pre ? b.pre + "-" : "") + b.no;
}

// Text of a bill, found by its id.
function billText(i) {
  return billToText(S.hist.find(function(x) {
    return x.id == i;
  }));
}

// Copy the bill text to the clipboard.
function copyBillText(i) {
  try {
    navigator.clipboard.writeText(billText(i)).then(function() {
      alert("Copied");
    }, function() {
      alert("Copy failed");
    });
  } catch (e) {
    alert("Copy not supported");
  }
}
