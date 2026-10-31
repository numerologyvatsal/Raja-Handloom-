// Application data, saved settings and small helper functions.
// (Part of Raja Handloom memo app - plain JavaScript, no build step)

// All app data lives in this one object (saved in the browser with save()).
var S = {
  shop: "Raja Handloom",   // shop name shown on bills
  n: 1,                    // next bill number
  // categories (with sub-categories) used for products
  cats: [
    { id: 1, name: "Sarees", subs: [
      { id: 11, name: "Cotton Saree" },
      { id: 12, name: "Silk Saree" },
      { id: 13, name: "Patola" }
    ] },
    { id: 2, name: "Dupattas", subs: [
      { id: 21, name: "Cotton Dupatta" },
      { id: 22, name: "Bandhani" }
    ] },
    { id: 3, name: "Home Linen", subs: [
      { id: 31, name: "Bedsheets" },
      { id: 32, name: "Towels" }
    ] }
  ],
  // sample products (delete them in Manage and add your own)
  prods: [
    { id: 1, name: "Handloom Cotton Saree", price: 1200, cat: 1, sub: 11 },
    { id: 2, name: "Pure Silk Saree", price: 4500, cat: 1, sub: 12 },
    { id: 3, name: "Bandhani Dupatta", price: 650, cat: 2, sub: 22 },
    { id: 4, name: "Cotton Bedsheet Double", price: 900, cat: 3, sub: 31 }
  ],
  cart: [],      // items of the bill being made
  hist: [],      // saved bills
  cust: "",      // customer name for the current bill
  ph: "",        // customer mobile no.
  gst: "",       // customer GST no.
  addr: "",      // shop address (printed on bill)
  sph: "",       // shop mobile no. (printed on bill)
  sgst: ""       // shop GST no. (printed on bill)
};

// Which screen / filter is selected right now
var tab = "shop";    // Memo / Bill tab: shop, cart, hist, manage
var fc = 0;          // selected category id in the Shop tab (0 = all)
var fs = 0;          // selected sub-category id in the Shop tab
var q = "";          // search text in the Shop tab
var np = [];         // photos chosen for the product being added
var mode = "home";   // home, design or memo
var dtab = "view";   // Designs tab: view or add
var dfs = 0;         // selected segment id in Designs
var dfc = 0;         // selected category id in Designs
var dfb = 0;         // selected sub-category id in Designs
var dq = "";         // search text in Designs
var hq = "";         // search text in the bill History
var dnp = [];        // photos chosen for the design being added


var LG = new Image();

LG.src = "images/logo.png";

document.getElementById("hl").src = LG.src;

try {
  var saved = localStorage.getItem("memo_v2");
  if (saved) S = JSON.parse(saved);
} catch (e) {
}

if (S.shop == "Handloom Store") S.shop = "Raja Handloom";

["gst", "addr", "sph", "sgst"].forEach(function(k) {
  if (S[k] == null) S[k] = "";
});

// Settings added in later versions (older saved data may not have them)
if (!S.dev) S.dev = { name: "", pre: "" };

if (!S.dsg) S.dsg = [];

if (!S.dzn) S.dzn = [];

// Old versions had phone-to-phone sync; remove its leftovers
["dels", "last", "psig", "dsig", "cloud"].forEach(function(k) {
  delete S[k];
});

// Save all data in this browser.
function save() {
  try {
    localStorage.setItem("memo_v2", JSON.stringify(S));
  } catch (e) {
    alert("Storage is full. Please delete some photos or old bills.");
  }
}

// Short form of document.getElementById.
function byId(i) {
  return document.getElementById(i);
}

// Make text safe to show inside HTML.
function escapeHtml(s) {
  return String(s).replace(/[&<>"]/g, function(c) {
    return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c];
  });
}

// Create a new unique id number.
function newId() {
  return Date.now() + Math.floor(Math.random() * 1000);
}

// Format a number as rupees.
function money(n) {
  return "₹" + (Math.round(n * 100) / 100).toLocaleString("en-IN");
}

// Total amount of a list of items (price x qty).
function cartTotal(a) {
  return a.reduce(function(s, i) {
    return s + i.price * i.qty;
  }, 0);
}

// Name of a category from its id.
function categoryName(i) {
  var c = S.cats.find(function(x) {
    return x.id == i;
  });
  return c ? c.name : "-";
}
