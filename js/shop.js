// Memo / Bill section: shop, cart, history and manage screens.
// (Part of Raja Handloom memo app - plain JavaScript, no build step)

// Switch tab inside Memo / Bill (or go back to the home screen).
function goTo(t) {
  if (t == "home") {
    mode = "home";
    draw();
    return;
  }
  tab = t;
  draw();
}

// Draw the Memo / Bill section (tabs + current screen).
function drawMemo() {
  byId("shop").value = S.shop;
  var cc = S.cart.reduce(function(s, i) {
    return s + i.qty;
  }, 0);
  byId("nav").innerHTML = [["home", "🏠"], ["shop", "Shop"], ["cart", "Cart (" + cc + ")"], ["hist", "History"], ["manage", "Manage"]].map(function(t) {
    return '<button class="'
      + (tab == t[0] ? "on" : "")
      + `" onclick="goTo('`
      + t[0]
      + `')">`
      + t[1]
      + "</button>";
  }).join("");
  // one function per tab, each returns the HTML of that screen
  var screens = { shop: shopHtml, cart: cartHtml, hist: historyHtml, manage: manageHtml };
  byId("app").innerHTML = screens[tab]();
}

// HTML of the Shop tab: category chips and product cards.
function shopHtml() {
  var h = '<input placeholder="Search products..." value="'
    + escapeHtml(q)
    + '" oninput="q=this.value;refreshProductList()" style="margin-bottom:8px">';
  h += '<div class="chips"><button class="chip '
    + (!fc ? "on" : "")
    + '" onclick="fc=0;fs=0;draw()">All</button>'
    + S.cats.map(function(c2) {
    return '<button class="chip '
      + (fc == c2.id ? "on" : "")
      + '" onclick="fc='
      + c2.id
      + ';fs=0;draw()">'
      + escapeHtml(c2.name)
      + "</button>";
  }).join("")
    + "</div>";
  var c = S.cats.find(function(x) {
    return x.id == fc;
  });
  if (c && c.subs.length) h += '<div class="chips sub"><button class="chip '
    + (!fs ? "on" : "")
    + '" onclick="fs=0;draw()">All '
    + escapeHtml(c.name)
    + "</button>"
    + c.subs.map(function(s) {
    return '<button class="chip '
      + (fs == s.id ? "on" : "")
      + '" onclick="fs='
      + s.id
      + ';draw()">'
      + escapeHtml(s.name)
      + "</button>";
  }).join("")
    + "</div>";
  h += '<div class="card" style="margin-bottom:10px"><div class="row" style="margin:0"><input id="nc" placeholder="New category (e.g. Sarees)"><button class="btn" style="flex:0 0 auto" onclick="addCategory()">+ Category</button></div>';
  if (c) {
    h += '<div class="row" style="margin:8px 0 0"><input id="ns" placeholder="New sub-category in '
      + escapeHtml(c.name)
      + `"><button class="btn" style="flex:0 0 auto" onclick="addSubCategoryHere()">+ Sub</button></div><div class="row" style="margin:8px 0 0"><button class="btn g" onclick="openRename('c',`
      + c.id
      + ')">Rename category</button>'
      + (fs ? `<button class="btn g" onclick="openRename('s',`
        + c.id
        + ","
        + fs
        + ')">Rename sub-category</button>' : "")
      + '</div><div class="row" style="margin:8px 0 0"><button class="btn r" onclick="deleteCategory('
      + c.id
      + ')">Delete category</button>'
      + (fs ? '<button class="btn g" onclick="deleteSubCategory('
        + c.id
        + ","
        + fs
        + ')">Delete sub-category</button>' : "")
      + "</div>";
  }
  h += "</div>";
  return h + '<div class="grid" id="pl">' + productListHtml() + "</div>";
}

// HTML of the product cards after filtering.
function productListHtml() {
  var l = S.prods.filter(function(p) {
    return (!fc || p.cat == fc) && (!fs || p.sub == fs) && p.name.toLowerCase().indexOf(q.toLowerCase()) > -1;
  });
  if (!l.length) return '<div class="empty" style="grid-column:1/-1">No products. Add some in Manage.</div>';
  return l.map(function(p) {
    return '<div class="card">'
      + (p.imgs && p.imgs.length ? '<div style="position:relative"><img src="'
        + p.imgs[0]
        + '" alt="" onclick="viewProductPhoto('
        + p.id
        + ',0)" style="width:100%;aspect-ratio:1;object-fit:cover;border-radius:8px;margin-bottom:8px;cursor:pointer;display:block">'
        + (p.imgs.length > 1 ? '<span class="mu" style="position:absolute;right:6px;bottom:14px;background:rgba(0,0,0,.6);color:#fff;padding:1px 7px;border-radius:99px">1/'
          + p.imgs.length
          + "</span>" : "")
        + "</div>" : "")
      + '<div class="pn">'
      + escapeHtml(p.name)
      + '</div><div class="mu">'
      + escapeHtml(categoryName(p.cat))
      + '</div><div class="pr">'
      + money(p.price)
      + '</div><button class="btn w" onclick="addToCart('
      + p.id
      + ')">Add to cart</button></div>';
  }).join("");
}

// Redraw only the product cards (used while typing in search).
function refreshProductList() {
  byId("pl").innerHTML = productListHtml();
}

// Add a product to the cart (or +1 if already there).
function addToCart(i) {
  var p = S.prods.find(function(x) {
    return x.id == i;
  });
  var l = S.cart.find(function(x) {
    return x.pid == i;
  });
  if (l) l.qty++;
  else S.cart.push({ pid: i, name: p.name, price: p.price, qty: 1 });
  save();
  draw();
}

// HTML of the Cart tab.
function cartHtml() {
  var h = '<div class="card">';
  if (!S.cart.length) h += '<div class="empty">Your cart is empty</div>';
  S.cart.forEach(function(i, k) {
    h += '<div class="line"><div><div class="pn">'
      + escapeHtml(i.name)
      + '</div><div class="ctl"><span class="mu">Price ₹</span><input type="number" inputmode="decimal" value="'
      + i.price
      + '" onchange="changeCartPrice('
      + k
      + ',this.value)"><button onclick="changeCartQty('
      + k
      + ',-1)">−</button><input class="q" type="number" inputmode="numeric" value="'
      + i.qty
      + '" onchange="setCartQty('
      + k
      + ',this.value)"><button onclick="changeCartQty('
      + k
      + ',1)">+</button></div></div><div style="text-align:right"><b>'
      + money(i.price * i.qty)
      + '</b><br><button class="btn g" style="margin-top:6px;padding:4px 8px" onclick="removeCartItem('
      + k
      + ')">✕</button></div></div>';
  });
  h += '<h3>Quick custom item</h3><div class="row"><input id="cn" placeholder="Item name"><input id="cpz" type="number" inputmode="decimal" placeholder="Price"></div><button class="btn g w" onclick="addCustomItem()">+ Add custom item</button></div>';
  if (S.cart.length) {
    h += '<div class="card" style="margin-top:10px"><div class="tot"><span>Total</span><span>'
      + money(cartTotal(S.cart))
      + '</span></div><div class="row"><input placeholder="Customer name" value="'
      + escapeHtml(S.cust)
      + '" onchange="S.cust=this.value;save()"><input placeholder="Mobile no." type="tel" value="'
      + escapeHtml(S.ph)
      + '" onchange="S.ph=this.value;save()"></div><div class="row"><input placeholder="Customer GST no. (optional)" value="'
      + escapeHtml(S.gst)
      + '" onchange="S.gst=this.value.toUpperCase();save()"></div><button class="btn w" onclick="generateBill()">Generate bill</button></div>';
  }
  return h;
}

// Change the price of a cart line.
function changeCartPrice(k, v) {
  S.cart[k].price = Math.max(0, +v || 0);
  save();
  draw();
}

// Set the quantity of a cart line by typing.
function setCartQty(k, v) {
  S.cart[k].qty = Math.max(1, Math.floor(+v) || 1);
  save();
  draw();
}

// Add or remove one from the quantity of a cart line.
function changeCartQty(k, d2) {
  S.cart[k].qty = Math.max(1, S.cart[k].qty + d2);
  save();
  draw();
}

// Remove a line from the cart (after confirming).
function removeCartItem(k) {
  confirmDelete("Are you sure you want to remove this item from the cart?", function() {
    S.cart.splice(k, 1);
    save();
    draw();
  });
}

// Add an item that is not in the product list.
function addCustomItem() {
  var n = byId("cn").value.trim();
  if (!n) return;
  S.cart.push({ pid: 0, name: n, price: +byId("cpz").value || 0, qty: 1 });
  save();
  draw();
}

// Summary: how many bills each phone made.
function billsByPhoneHtml() {
  var c = {};
  S.hist.forEach(function(b) {
    var k = b.dev || S.dev.name || "This phone";
    c[k] = c[k] || { n: 0, t: 0 };
    c[k].n++;
    c[k].t += b.total;
  });
  return '<div class="card" style="margin-bottom:10px"><b>Bills by phone</b>'
    + Object.keys(c).map(function(k) {
    return '<div class="row" style="margin:6px 0 0"><span>'
      + escapeHtml(k)
      + '</span><span style="text-align:right">'
      + c[k].n
      + " bills · "
      + money(c[k].t)
      + "</span></div>";
  }).join("")
    + "</div>";
}

// Choose photos for the product being added.
function pickNewProductPhoto() {
  pickPhoto(function(u) {
    np.push(u);
    var e = byId("npc");
    if (e) e.textContent = np.length;
  });
}

// Pop-up to see, add or remove photos of a product.
function openProductPhotos(id2) {
  var p = S.prods.find(function(x) {
    return x.id == id2;
  });
  var im = p.imgs || [];
  byId("md").innerHTML = '<div class="modal" onclick="if(event.target==this){closeModal();draw()}"><div class="sheet"><h3 style="margin-top:0">Photos: '
    + escapeHtml(p.name)
    + '</h3><div class="grid" style="grid-template-columns:repeat(3,1fr)">'
    + (im.map(function(u, k) {
    return '<div style="position:relative"><img src="'
      + u
      + '" alt="" style="width:100%;aspect-ratio:1;object-fit:cover;border-radius:8px"><button class="btn r" style="position:absolute;top:4px;right:4px;padding:2px 8px" onclick="deleteProductPhoto('
      + id2
      + ","
      + k
      + ')">✕</button></div>';
  }).join("") || '<div class="empty" style="grid-column:1/-1">No photos yet</div>')
    + '</div><div class="row" style="margin-top:12px"><button class="btn" onclick="addProductPhoto('
    + id2
    + ')">+ Add photo</button><button class="btn g" onclick="closeModal();draw()">Done</button></div></div></div>';
}

// Add a photo to an existing product.
function addProductPhoto(id2) {
  pickPhoto(function(u) {
    var p = S.prods.find(function(x) {
      return x.id == id2;
    });
    (p.imgs = p.imgs || []).push(u);
    save();
    openProductPhotos(id2);
  });
}

// Remove one photo of a product.
function deleteProductPhoto(id2, k) {
  var p = S.prods.find(function(x) {
    return x.id == id2;
  });
  p.imgs.splice(k, 1);
  save();
  openProductPhotos(id2);
}

// Show a product photo large, with Prev / Next.
function viewProductPhoto(id2, k) {
  var p = S.prods.find(function(x) {
    return x.id == id2;
  });
  var im = p.imgs || [];
  if (!im.length) return;
  k = (k + im.length) % im.length;
  byId("md").innerHTML = '<div class="modal" onclick="if(event.target==this)closeModal()"><div class="sheet" style="text-align:center"><img src="'
    + im[k]
    + '" alt="" style="max-width:100%;max-height:60vh;border-radius:8px"><div style="margin:8px 0"><b>'
    + escapeHtml(p.name)
    + "</b> · "
    + money(p.price)
    + (im.length > 1 ? '<div class="mu">' + (k + 1) + " / " + im.length + "</div>" : "")
    + "</div>"
    + (im.length > 1 ? '<div class="row"><button class="btn g" onclick="viewProductPhoto('
      + id2
      + ","
      + (k - 1)
      + ')">‹ Prev</button><button class="btn g" onclick="viewProductPhoto('
      + id2
      + ","
      + (k + 1)
      + ')">Next ›</button></div>' : "")
    + '<div class="row"><button class="btn" onclick="addToCart('
    + id2
    + ');closeModal()">Add to cart</button><button class="btn g" onclick="closeModal()">Close</button></div></div></div>';
}

// HTML of the History tab.
function historyHtml() {
  if (!S.hist.length) return '<div class="empty">No bills yet</div>';
  return billsByPhoneHtml() + S.hist.map(function(b) {
    return '<div class="card" style="margin-bottom:8px"><div class="row" style="margin:0"><div><b>Bill #'
      + escapeHtml(billNumber(b))
      + "</b> "
      + (b.cust ? "· " + escapeHtml(b.cust) : "")
      + '<div class="mu">'
      + escapeHtml(b.date)
      + " · "
      + b.items.length
      + " items"
      + (b.dev ? " · " + escapeHtml(b.dev) : "")
      + '</div></div><div style="text-align:right;flex:0 0 auto"><b>'
      + money(b.total)
      + '</b></div></div><div class="row" style="margin:8px 0 0"><button class="btn g" onclick="showBill('
      + b.id
      + ')">View / Share</button><button class="btn g" onclick="deleteBill('
      + b.id
      + ')">Delete</button></div></div>';
  }).join("");
}

// Delete a bill from history (after confirming).
function deleteBill(i) {
  confirmDelete("Are you sure you want to delete this bill?", function() {
    if (S.dev.main) S.dels.push(i);
    S.hist = S.hist.filter(function(x) {
      return x.id != i;
    });
    save();
    draw();
  });
}

// Category options for a drop-down list.
function categoryOptionsHtml() {
  return S.cats.map(function(c) {
    return '<option value="' + c.id + '">' + escapeHtml(c.name) + "</option>";
  }).join("");
}

// HTML of the Manage tab.
function manageHtml() {
  var h = '<div class="card"><h3 style="margin-top:0">This phone</h3><div class="row"><input placeholder="Phone name (e.g. Main, Rahul)" value="'
    + escapeHtml(S.dev.name)
    + '" onchange="S.dev.name=this.value;save()"><input placeholder="Bill prefix (e.g. M)" value="'
    + escapeHtml(S.dev.pre)
    + '" onchange="S.dev.pre=this.value.toUpperCase();save()" style="max-width:130px"></div><label style="display:flex;gap:8px;align-items:center;margin:6px 0"><input type="checkbox" style="width:auto" '
    + (S.dev.main ? "checked" : "")
    + ' onchange="S.dev.main=this.checked;save();draw()"> This is the MAIN phone</label><div class="mu">'
    + (S.dev.main ? "Main phone: sends products, photos and shop details to the other phones, and receives all their bills." : "Other phone: receives products, photos and shop details from the main phone, and sends its bills to it. Change products only on the main phone.")
    + '</div><div class="mu" style="margin-top:4px">Last sync: '
    + escapeHtml(S.last || "never")
    + "</div></div>"
    + cloudCard()
    + '<div class="card" style="margin-top:10px"><h3 style="margin-top:0">Shop details (printed on bill)</h3><input placeholder="Address" value="'
    + escapeHtml(S.addr)
    + '" onchange="S.addr=this.value;save()" style="margin-bottom:8px"><div class="row"><input placeholder="Mobile no." type="tel" value="'
    + escapeHtml(S.sph)
    + '" onchange="S.sph=this.value;save()"><input placeholder="Shop GST no." value="'
    + escapeHtml(S.sgst)
    + '" onchange="S.sgst=this.value.toUpperCase();save()"></div></div><div class="card" style="margin-top:10px"><h3 style="margin-top:0">Add category</h3><div class="row"><input id="nc" placeholder="Category name"><button class="btn" style="flex:0 0 auto" onclick="addCategory()">Add</button></div>';
  h += '<h3>Add sub-category</h3><div class="row"><select id="sc">'
    + categoryOptionsHtml()
    + '</select><input id="ns" placeholder="Sub-category name"></div><button class="btn w" onclick="addSubCategory()">Add sub-category</button></div>';
  h += '<div class="card" style="margin-top:10px"><h3 style="margin-top:0">Add product</h3><input id="pnm" placeholder="Product name" style="margin-bottom:8px"><button class="btn g w" style="margin-bottom:8px" onclick="pickNewProductPhoto()">📷 Add design photos (<span id="npc">'
    + np.length
    + '</span>)</button><div class="row"><select id="pc" onchange="fillSubCategorySelect()">'
    + categoryOptionsHtml()
    + '</select><select id="psb"></select></div><div class="row"><input id="ppr" type="number" inputmode="decimal" placeholder="Price"><button class="btn" style="flex:0 0 auto" onclick="addProduct()">Add</button></div></div>';
  h += '<div class="card" style="margin-top:10px"><h3 style="margin-top:0">Categories</h3>'
    + S.cats.map(function(c) {
    return '<div class="line"><div><b>'
      + escapeHtml(c.name)
      + '</b><div class="mu">'
      + (c.subs.map(function(s) {
      return escapeHtml(s.name)
        + ` <a href="#" onclick="openRename('s',`
        + c.id
        + ","
        + s.id
        + ');return false">✎</a> <a href="#" onclick="deleteSubCategory('
        + c.id
        + ","
        + s.id
        + ');return false">✕</a>';
    }).join(", ") || "no sub-categories")
      + `</div></div><div><button class="btn g" onclick="openRename('c',`
      + c.id
      + ')">Edit</button> <button class="btn g" onclick="deleteCategory('
      + c.id
      + ')">Delete</button></div></div>';
  }).join("")
    + "</div>";
  h += '<div class="card" style="margin-top:10px"><h3 style="margin-top:0">Products</h3>'
    + (S.prods.map(function(p) {
    return '<div class="line"><div><b>'
      + escapeHtml(p.name)
      + '</b><div class="mu">'
      + escapeHtml(categoryName(p.cat))
      + '</div></div><div><input type="number" style="width:84px" value="'
      + p.price
      + '" onchange="updateProductPrice('
      + p.id
      + ',this.value)"> <button class="btn g" onclick="openProductPhotos('
      + p.id
      + ')">📷'
      + ((p.imgs || []).length || "")
      + `</button> <button class="btn g" onclick="openRename('p',`
      + p.id
      + ')">✎</button> <button class="btn g" onclick="deleteProduct('
      + p.id
      + ')">✕</button></div></div>';
  }).join("") || '<div class="empty">No products</div>')
    + "</div>";
  setTimeout(fillSubCategorySelect, 0);
  return h;
}

// Fill the sub-category drop-down for the chosen category.
function fillSubCategorySelect() {
  var s = byId("pc");
  if (!s) return;
  var c = S.cats.find(function(x) {
    return x.id == s.value;
  });
  byId("psb").innerHTML = '<option value="0">No sub-category</option>' + (c ? c.subs.map(function(x) {
    return '<option value="' + x.id + '">' + escapeHtml(x.name) + "</option>";
  }).join("") : "");
}

// Add a new category.
function addCategory() {
  var n = byId("nc").value.trim();
  if (!n) return;
  S.cats.push({ id: newId(), name: n, subs: [] });
  save();
  draw();
}

// Add a sub-category from the Manage tab.
function addSubCategory() {
  var n = byId("ns").value.trim(), c = S.cats.find(function(x) {
    return x.id == byId("sc").value;
  });
  if (!n || !c) return;
  c.subs.push({ id: newId(), name: n });
  save();
  draw();
}

// Add a new product with its price and photos.
function addProduct() {
  var n = byId("pnm").value.trim(), pr = +byId("ppr").value;
  if (!n || !byId("pc").value) return;
  S.prods.push({ id: newId(), name: n, price: pr || 0, cat: +byId("pc").value, sub: +byId("psb").value, imgs: np.slice() });
  np = [];
  save();
  draw();
}

// Change a product price.
function updateProductPrice(i, v) {
  S.prods.find(function(x) {
    return x.id == i;
  }).price = +v || 0;
  save();
}

// Delete a product (after confirming).
function deleteProduct(i) {
  confirmDelete("Are you sure you want to delete this product?", function() {
    S.prods = S.prods.filter(function(x) {
      return x.id != i;
    });
    save();
    draw();
  });
}

// Delete a category and its products (after confirming).
function deleteCategory(i) {
  confirmDelete("Are you sure you want to delete this category and all its products?", function() {
    S.cats = S.cats.filter(function(x) {
      return x.id != i;
    });
    S.prods = S.prods.filter(function(x) {
      return x.cat != i;
    });
    fc = 0;
    fs = 0;
    save();
    draw();
  });
}

// Add a sub-category from the Shop tab.
function addSubCategoryHere() {
  var n = byId("ns").value.trim(), c = S.cats.find(function(x) {
    return x.id == fc;
  });
  if (!n || !c) return;
  var s = { id: newId(), name: n };
  c.subs.push(s);
  fs = s.id;
  save();
  draw();
}

// Delete a sub-category (after confirming).
function deleteSubCategory(c, s) {
  confirmDelete("Are you sure you want to delete this sub-category?", function() {
    if (fs == s) fs = 0;
    var cc = S.cats.find(function(x) {
      return x.id == c;
    });
    cc.subs = cc.subs.filter(function(x) {
      return x.id != s;
    });
    S.prods.forEach(function(p) {
      if (p.sub == s) p.sub = 0;
    });
    save();
    draw();
  });
}
