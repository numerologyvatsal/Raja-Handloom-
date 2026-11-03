// Links products (Memo / Bill) with Designs: a product that has "Show in Designs" ticked
// gets a design that follows its name, photos and category automatically.
// (Part of Raja Handloom memo app - plain JavaScript, no build step)

// The design segment that belongs to a product category (created the first time it is needed).
function designSegmentFor(cat) {
  var seg = S.dsg.find(function(g) {
    return g.id == cat.dsg;
  });
  if (!seg) {
    // not linked yet: use a segment with the same name, or make a new one
    seg = S.dsg.find(function(g) {
      return g.name.toLowerCase() == cat.name.toLowerCase();
    });
    if (!seg) {
      seg = { id: newId(), name: cat.name, cats: [] };
      S.dsg.push(seg);
    }
    cat.dsg = seg.id;
    cat.dname = cat.name;
  } else if (cat.dname != cat.name) {
    // the product category was renamed, so rename the segment too
    seg.name = cat.name;
    cat.dname = cat.name;
  }
  return seg;
}

// The design category (inside a segment) that belongs to a product sub-category.
function designCategoryFor(seg, sub) {
  var dcat = seg.cats.find(function(c) {
    return c.id == sub.dcat;
  });
  if (!dcat) {
    dcat = seg.cats.find(function(c) {
      return c.name.toLowerCase() == sub.name.toLowerCase();
    });
    if (!dcat) {
      dcat = { id: newId(), name: sub.name, subs: [] };
      seg.cats.push(dcat);
    }
    sub.dcat = dcat.id;
    sub.dname = sub.name;
  } else if (sub.dname != sub.name) {
    dcat.name = sub.name;
    sub.dname = sub.name;
  }
  return dcat;
}

// Create or update the design of every product that has "Show in Designs" ticked.
function syncDesigns() {
  S.prods.forEach(function(p) {
    if (!p.inDesigns) return;
    var cat = S.cats.find(function(c) {
      return c.id == p.cat;
    });
    if (!cat) return;
    var seg = designSegmentFor(cat);
    var sub = cat.subs.find(function(s) {
      return s.id == p.sub;
    });
    var dcat = sub ? designCategoryFor(seg, sub) : null;
    var d = S.dzn.find(function(x) {
      return x.pid == p.id;
    });
    if (!d) {
      d = { id: newId(), pid: p.id, name: "", note: "", imgs: [] };
      S.dzn.unshift(d);
    }
    d.name = p.name;
    d.imgs = (p.imgs || []).slice();
    d.seg = seg.id;
    d.cat = dcat ? dcat.id : 0;
    d.sub = 0;
  });
  save();
}

// Delete the designs that belong to these product ids.
function removeDesignsOf(pids) {
  S.dzn = S.dzn.filter(function(d) {
    return !(d.pid && pids.indexOf(d.pid) > -1);
  });
}

// When linked designs are deleted in Designs, stop showing their products there.
function unlinkProducts(designs) {
  designs.forEach(function(d) {
    var p = d.pid && S.prods.find(function(x) {
      return x.id == d.pid;
    });
    if (p) p.inDesigns = false;
  });
}

// The "Show in Designs" tick box of a product.
function toggleProductDesign(id2, on) {
  var p = S.prods.find(function(x) {
    return x.id == id2;
  });
  if (!p) return;
  p.inDesigns = on;
  if (on) syncDesigns();
  else removeDesignsOf([id2]);
  save();
}

// Remove a linked design from Designs (the product stays in Memo / Bill).
function stopShowingInDesigns(designId) {
  var d = S.dzn.find(function(x) {
    return x.id == designId;
  });
  if (!d) return;
  confirmDelete("Remove this design from Designs? The product stays in Memo / Bill.", function() {
    unlinkProducts([d]);
    removeDesignsOf([d.pid]);
    save();
    draw();
  });
}
