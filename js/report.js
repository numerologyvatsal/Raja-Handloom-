// Sales report: total sale of a day or a month, and how many of each item were sold.
// (Part of Raja Handloom memo app - plain JavaScript, no build step)

var rview = "day";   // report type: day or month
var rday = "";       // chosen date as yyyy-mm-dd (empty = today)
var rmonth = "";     // chosen month as yyyy-mm (empty = this month)

// Date of a bill as yyyy-mm-dd. The bill id is the time the bill was made (in milliseconds).
function dateKey(ms) {
  var d = new Date(ms);
  var two = function(n) { return n < 10 ? "0" + n : "" + n; };
  return d.getFullYear() + "-" + two(d.getMonth() + 1) + "-" + two(d.getDate());
}

// Today's date as yyyy-mm-dd.
function todayKey() {
  return dateKey(Date.now());
}

// Bills made on a date ("2026-10-30") or in a month ("2026-10").
function billsFor(prefix) {
  return S.hist.filter(function(b) {
    return dateKey(b.id).indexOf(prefix) == 0;
  });
}

// Count the bills, add up the money and count how many of each item were sold.
function summarize(list) {
  var total = 0, pieces = 0, items = Object.create(null);
  list.forEach(function(b) {
    total += b.total;
    b.items.forEach(function(it) {
      var row = items[it.name] || (items[it.name] = { name: it.name, qty: 0, amount: 0 });
      row.qty += it.qty;
      row.amount += it.price * it.qty;
      pieces += it.qty;
    });
  });
  var rows = Object.keys(items).map(function(k) {
    return items[k];
  });
  rows.sort(function(a, b) {
    return b.qty - a.qty;
  });
  return { count: list.length, total: total, pieces: pieces, items: rows };
}

// "30 Oct 2026" from "2026-10-30".
function niceDate(key) {
  var p = key.split("-");
  return new Date(+p[0], +p[1] - 1, +p[2]).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

// "October 2026" from "2026-10".
function niceMonth(key) {
  var p = key.split("-");
  return new Date(+p[0], +p[1] - 1, 1).toLocaleDateString("en-IN", { month: "long", year: "numeric" });
}

// One table row with three columns (the values are already safe HTML).
function reportRow(a, b, c) {
  return '<div style="display:flex;gap:8px;padding:7px 0;border-bottom:1px solid var(--bd)">'
    + '<span style="flex:1;min-width:0">' + a + "</span>"
    + '<span style="flex:0 0 64px;text-align:right">' + b + "</span>"
    + '<span style="flex:0 0 90px;text-align:right">' + c + "</span></div>";
}

// Small card with a label, the total and the number of bills.
function summaryCard(label, s) {
  return '<div class="card" style="text-align:center"><div class="mu">' + label + "</div>"
    + '<div class="pr" style="margin:4px 0">' + money(s.total) + "</div>"
    + '<div class="mu">' + s.count + " bills</div></div>";
}

// Total, items sold and (for a month) day by day figures of one period.
function periodHtml(title, s, extra) {
  var h = '<div class="card" style="margin-bottom:10px"><div class="mu">' + escapeHtml(title) + "</div>"
    + '<div class="tot" style="padding:6px 0"><span>Total sale</span><span>' + money(s.total) + "</span></div>"
    + '<div class="mu">' + s.count + " bills · " + s.pieces + " pieces sold</div></div>";
  if (!s.count) return h + '<div class="empty">No bills in this period</div>';
  h += '<div class="card" style="margin-bottom:10px"><b>Items sold</b>' + reportRow("<b>Item</b>", "<b>Qty</b>", "<b>Amount</b>");
  s.items.forEach(function(r) {
    h += reportRow(escapeHtml(r.name), r.qty, money(r.amount));
  });
  return h + "</div>" + extra;
}

// Sale of each day in a month.
function dayByDayHtml(list) {
  var days = {};
  list.forEach(function(b) {
    var k = dateKey(b.id);
    var d = days[k] || (days[k] = { count: 0, total: 0 });
    d.count++;
    d.total += b.total;
  });
  var h = '<div class="card"><b>Day by day</b>' + reportRow("<b>Date</b>", "<b>Bills</b>", "<b>Amount</b>");
  Object.keys(days).sort().reverse().forEach(function(k) {
    h += reportRow(niceDate(k), days[k].count, money(days[k].total));
  });
  return h + "</div>";
}

// HTML of the Report tab.
function reportHtml() {
  var today = todayKey(), month = today.slice(0, 7);
  var day = rday || today, mon = rmonth || month;
  var h = '<div class="grid" style="grid-template-columns:1fr 1fr;margin-bottom:10px">'
    + summaryCard("Today", summarize(billsFor(today)))
    + summaryCard("This month", summarize(billsFor(month))) + "</div>";
  h += '<div class="chips"><button class="chip ' + (rview == "day" ? "on" : "") + '" onclick="rview=\'day\';draw()">Day</button>'
    + '<button class="chip ' + (rview == "month" ? "on" : "") + '" onclick="rview=\'month\';draw()">Month</button></div>';
  if (rview == "day") {
    h += '<input type="date" value="' + day + '" onchange="rday=this.value;draw()" style="margin-bottom:10px">';
    h += periodHtml(niceDate(day), summarize(billsFor(day)), "");
  } else {
    var list = billsFor(mon);
    h += '<input type="month" value="' + mon + '" onchange="rmonth=this.value;draw()" style="margin-bottom:10px">';
    h += periodHtml(niceMonth(mon), summarize(list), list.length ? dayByDayHtml(list) : "");
  }
  return h;
}
