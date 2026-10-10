(function () {
  "use strict";

  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var finePointer = window.matchMedia("(pointer: fine)").matches;
  var wait = function (ms) { return new Promise(function (r) { setTimeout(r, reduce ? 0 : ms); }); };
  var fmt = function (n) { return n.toLocaleString("en-US"); };

  /* ---------------- nav ---------------- */
  var nav = $("#nav");
  var onScroll = function () { nav.classList.toggle("scrolled", window.scrollY > 30); };
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });
  $("#menuBtn").addEventListener("click", function () { nav.classList.toggle("open"); });
  $$("#navLinks a").forEach(function (a) { a.addEventListener("click", function () { nav.classList.remove("open"); }); });

  var navMap = {};
  $$("#navLinks a").forEach(function (a) { navMap[a.getAttribute("href").slice(1)] = a; });
  var secObs = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (e.isIntersecting && navMap[e.target.id]) {
        $$("#navLinks a").forEach(function (a) { a.classList.remove("active"); });
        navMap[e.target.id].classList.add("active");
      }
    });
  }, { rootMargin: "-45% 0px -50% 0px" });
  Object.keys(navMap).forEach(function (id) { var s = document.getElementById(id); if (s) secObs.observe(s); });

  /* ---------------- reveal + counters ---------------- */
  var countUp = function (el) {
    if (el.dataset.done) return;
    el.dataset.done = "1";
    var end = parseFloat(el.dataset.count);
    if (reduce || end === 0) { el.textContent = fmt(end); return; }
    var start = performance.now(), dur = 1400;
    var step = function (t) {
      var p = Math.min(1, (t - start) / dur);
      var v = Math.round(end * (1 - Math.pow(1 - p, 3)));
      el.textContent = fmt(v);
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };
  var revObs = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (!e.isIntersecting) return;
      e.target.classList.add("in");
      $$("[data-count]", e.target).forEach(countUp);
      if (e.target.hasAttribute("data-count")) countUp(e.target);
      revObs.unobserve(e.target);
    });
  }, { threshold: 0.12 });
  $$(".reveal").forEach(function (el) { revObs.observe(el); });
  $$("[data-count]").forEach(function (el) { if (!el.closest(".reveal")) revObs.observe(el); });

  /* ---------------- videos ---------------- */
  var heroVideo = $("#heroVideo");
  var workVideo = $("#workVideo");
  if (reduce) { heroVideo.removeAttribute("autoplay"); heroVideo.pause(); }
  var vidObs = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      var v = e.target;
      if (e.isIntersecting) {
        if (v.dataset.src && !v.src) { v.src = v.dataset.src; }
        if (!reduce) { var p = v.play(); if (p && p.catch) p.catch(function () {}); }
      } else { v.pause(); }
    });
  }, { threshold: 0.05 });
  vidObs.observe(heroVideo);
  vidObs.observe(workVideo);

  /* ---------------- hero 3D stack ---------------- */
  var stack = $("#stack");
  var hero = $(".hero");
  var tx = 0, ty = 0, cx = 0, cy = 0, t0 = performance.now();
  if (finePointer && !reduce) {
    hero.addEventListener("mousemove", function (e) {
      var r = hero.getBoundingClientRect();
      tx = (e.clientX - r.left) / r.width - 0.5;
      ty = (e.clientY - r.top) / r.height - 0.5;
    });
    hero.addEventListener("mouseleave", function () { tx = 0; ty = 0; });
  }
  var heroVisible = true;
  new IntersectionObserver(function (e) { heroVisible = e[0].isIntersecting; }).observe(hero);
  var animStack = function (t) {
    if (heroVisible && !reduce) {
      cx += (tx - cx) * 0.06; cy += (ty - cy) * 0.06;
      var idle = Math.sin((t - t0) / 2200) * 1.6;
      stack.style.transform = "rotateX(" + (16 - cy * 10 + idle * 0.5) + "deg) rotateY(" + (-24 + cx * 16) + "deg) rotateZ(3deg) translateY(" + idle * 3 + "px)";
    }
    requestAnimationFrame(animStack);
  };
  stack.style.transition = "none";
  requestAnimationFrame(animStack);

  /* ---------------- tilt cards ---------------- */
  if (finePointer && !reduce) {
    $$(".tilt").forEach(function (card) {
      card.addEventListener("mousemove", function (e) {
        var r = card.getBoundingClientRect();
        var x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
        card.style.transform = "perspective(1000px) rotateX(" + (-y * 6) + "deg) rotateY(" + (x * 8) + "deg) translateY(-4px)";
      });
      card.addEventListener("mouseleave", function () { card.style.transform = ""; });
    });
  }

  /* ---------------- brief tabs ---------------- */
  $$("#briefTabs .tab-btn").forEach(function (b) {
    b.addEventListener("click", function () {
      $$("#briefTabs .tab-btn").forEach(function (x) { x.classList.remove("active"); });
      $$(".req-panel").forEach(function (x) { x.classList.remove("active"); });
      b.classList.add("active");
      document.getElementById(b.dataset.tab).classList.add("active");
    });
  });

  /* ---------------- SEO pages + QA gate ---------------- */
  var PAGES = [
    {
      tab: "Start an LLC in Texas",
      url: "yourbrand.com/start-an-llc/texas/",
      crumb: "Start a business &nbsp;/&nbsp; LLC &nbsp;/&nbsp; Texas",
      h1: "Start your Texas LLC in 10 minutes, without the legal guesswork",
      vp: "File with the Texas Secretary of State, get your EIN and set up your operating agreement in one guided flow. Plain English, no hidden fees.",
      cta: "Start my Texas LLC", note: "Takes about 10 minutes",
      trust: ["<span class='stars'>&#9733;&#9733;&#9733;&#9733;&#9733;</span> <b>4.8</b> customer rating", "<b>$0</b> service fee + $300 state fee", "Filed in <b>1 business day</b>"],
      steps: [["Step 1", "Pick your name", "Instant availability check"], ["Step 2", "File Form 205", "We prepare it, you approve"], ["Step 3", "Get your EIN", "Free, straight from the IRS"]],
      kw: "how to start an llc in texas", fail: null
    },
    {
      tab: "Food truck business plan",
      url: "yourbrand.com/business-plans/food-truck/",
      crumb: "Plan &nbsp;/&nbsp; Business plans &nbsp;/&nbsp; Food truck",
      h1: "A food truck business plan lenders will actually read",
      vp: "Fill-in template with startup costs, permits, menu pricing and a 12-month cash flow. Built for first-time owners.",
      cta: "Get the free template", note: "Google Docs + Excel",
      trust: ["Used by <b>9,000+</b> new owners", "Reviewed by a <b>small business lender</b>", "<b>Free</b>, no card needed"],
      steps: [["Part 1", "Costs & permits", "Truck, kitchen, licenses"], ["Part 2", "Menu & pricing", "Food cost under 30%"], ["Part 3", "Cash flow", "12 months, pre-filled"]],
      kw: "food truck business plan template", fail: 7
    },
    {
      tab: "EIN for sole proprietors",
      url: "yourbrand.com/ein/sole-proprietor/",
      crumb: "Taxes &nbsp;/&nbsp; EIN &nbsp;/&nbsp; Sole proprietor",
      h1: "Get your EIN as a sole proprietor, free and in one sitting",
      vp: "Find out if you need one, apply directly with the IRS, and keep your Social Security number off your invoices.",
      cta: "Check if I need an EIN", note: "2-minute quiz",
      trust: ["<b>Free</b> from the IRS, always", "Step-by-step <b>screenshots</b>", "Updated <b>this month</b>"],
      steps: [["Step 1", "Do you need one?", "Quick yes/no check"], ["Step 2", "Apply online", "IRS form SS-4 walkthrough"], ["Step 3", "Use it right", "Bank, invoices, 1099s"]],
      kw: "how to get an ein as a sole proprietor", fail: null
    }
  ];
  var QA = [
    ["Title tag length", "58 chars"],
    ["Meta description", "151 chars"],
    ["One benefit-driven H1", "1 H1"],
    ["Primary keyword in H1, URL, intro", "3 / 3"],
    ["Value proposition above the fold", "yes"],
    ["Primary CTA visible", "above fold"],
    ["Trust elements", "3 found"],
    ["Schema: Article + FAQ + Breadcrumb", "valid"],
    ["Internal links to cluster hub", "4 links"],
    ["GA4 event on CTA click", "cta_click firing"],
    ["Indexable, self-canonical", "index"],
    ["Mobile layout + LCP", "LCP 1.7s"]
  ];
  var curPage = 0, fixed = {}, running = false;
  var picker = $("#pagePicker");
  PAGES.forEach(function (p, i) {
    var b = document.createElement("button");
    b.textContent = p.tab;
    if (i === 0) b.className = "active";
    b.addEventListener("click", function () {
      if (running) return;
      $$("button", picker).forEach(function (x) { x.classList.remove("active"); });
      b.classList.add("active");
      curPage = i; renderPage(); resetQA();
    });
    picker.appendChild(b);
  });
  var renderPage = function () {
    var p = PAGES[curPage];
    $("#spUrl").textContent = p.url;
    $("#spBody").innerHTML =
      "<div class='sp-nav'><span class='sp-logo'><i></i>Your Brand</span><nav><span>Start</span><span>Plan</span><span>Taxes</span><span>Pricing</span></nav></div>" +
      "<div class='sp-crumb'>" + p.crumb + "</div>" +
      "<h4>" + p.h1 + "</h4>" +
      "<p class='vp'>" + p.vp + "</p>" +
      "<div class='sp-cta'><a>" + p.cta + "</a><span>" + p.note + "</span></div>" +
      "<div class='sp-trust'>" + p.trust.map(function (t) { return "<span>" + t + "</span>"; }).join("") + "</div>" +
      "<div class='sp-steps'>" + p.steps.map(function (s) { return "<div><em>" + s[0] + "</em><b>" + s[1] + "</b>" + s[2] + "</div>"; }).join("") + "</div>";
  };
  var qaList = $("#qaList");
  var resetQA = function () {
    qaList.innerHTML = QA.map(function (q) {
      return "<div class='qa-item'><span class='st'></span><span>" + q[0] + "</span><span class='val'>-</span></div>";
    }).join("");
    var res = $("#qaResult"); res.className = "qa-result";
    $("#qaScore").textContent = "Ready";
    $("#qaNote").textContent = "Press Run QA to check this page.";
    $("#qaChip").textContent = "Not checked";
    $("#qaRun").textContent = fixed[curPage] === false ? "Apply fix & re-run" : "Run QA";
  };
  $$("#deviceSeg button").forEach(function (b) {
    b.addEventListener("click", function () {
      $$("#deviceSeg button").forEach(function (x) { x.classList.remove("active"); });
      b.classList.add("active");
      var d = $("#device"); d.classList.remove("tablet", "mobile");
      if (b.dataset.d !== "desktop") d.classList.add(b.dataset.d);
    });
  });
  $("#qaRun").addEventListener("click", async function () {
    if (running) return;
    running = true;
    var btn = this; btn.disabled = true;
    var p = PAGES[curPage];
    var willFail = p.fail !== null && fixed[curPage] !== false;
    if (p.fail !== null && fixed[curPage] === false) fixed[curPage] = true;
    resetQA();
    $("#qaScore").textContent = "Checking...";
    $("#qaNote").textContent = p.url;
    var items = $$(".qa-item", qaList), passed = 0;
    for (var i = 0; i < items.length; i++) {
      var st = $(".st", items[i]), val = $(".val", items[i]);
      st.className = "st run";
      await wait(170);
      if (willFail && i === p.fail) {
        st.className = "st bad"; items[i].classList.add("fail", "done"); val.textContent = "FAQ schema missing";
      } else {
        st.className = "st ok"; items[i].classList.add("done"); val.textContent = QA[i][1]; passed++;
      }
    }
    var res = $("#qaResult");
    if (willFail) {
      res.className = "qa-result block";
      $("#qaScore").textContent = passed + " / 12 passed. Blocked.";
      $("#qaNote").textContent = "Page held back. Template fixed, then re-checked before publish.";
      $("#qaChip").textContent = "Not published";
      fixed[curPage] = false;
      btn.textContent = "Apply fix & re-run";
    } else {
      res.className = "qa-result pass";
      $("#qaScore").textContent = "12 / 12 passed";
      $("#qaNote").textContent = "Primary keyword: " + p.kw;
      $("#qaChip").textContent = "Ready to publish";
      btn.textContent = "Run again";
    }
    btn.disabled = false; running = false;
  });
  renderPage(); resetQA();

  /* ---------------- keyword clusters (shared with 3D) ---------------- */
  var KW = [
    { name: "Start an LLC", color: "#22c39a", rows: [
      ["how to start an llc in texas", "Transactional", 6600, 18, "live"],
      ["llc filing fee by state", "Informational", 2900, 12, "live"],
      ["single member llc vs sole proprietorship", "Commercial", 1900, 15, "queue"],
      ["how long does it take to form an llc", "Informational", 1300, 9, "brief"]] },
    { name: "Business plans", color: "#5b8cff", rows: [
      ["food truck business plan template", "Commercial", 1600, 11, "live"],
      ["bakery business plan", "Commercial", 1300, 10, "queue"],
      ["lawn care business plan", "Commercial", 880, 6, "queue"],
      ["one page business plan example", "Informational", 1000, 14, "brief"]] },
    { name: "EIN & tax ID", color: "#f5b94a", rows: [
      ["how to get an ein as a sole proprietor", "Transactional", 1000, 8, "live"],
      ["do i need an ein for an llc", "Informational", 2400, 14, "live"],
      ["ein vs tin", "Informational", 1900, 12, "queue"]] },
    { name: "Business licenses", color: "#ff7a6b", rows: [
      ["do i need a business license to sell online", "Informational", 1600, 9, "live"],
      ["home business license california", "Transactional", 1000, 7, "queue"],
      ["sellers permit vs business license", "Informational", 720, 5, "brief"]] },
    { name: "Business banking", color: "#a58bff", rows: [
      ["documents needed to open a business bank account", "Informational", 1300, 10, "queue"],
      ["can i use my personal bank account for my llc", "Informational", 1000, 8, "brief"],
      ["business bank account for new llc", "Commercial", 1600, 21, "brief"]] }
  ];
  window.KW_DATA = KW;
  var intentPill = { Transactional: "g", Commercial: "b", Informational: "v" };
  var statusPill = { live: ["g", "Live"], queue: ["b", "This week"], brief: ["a", "Next week"] };
  var legend = $("#kwLegend");
  KW.forEach(function (c, i) {
    var b = document.createElement("button");
    b.innerHTML = "<i style='background:" + c.color + "'></i>" + c.name;
    b.addEventListener("click", function () { window.selectCluster(i); });
    legend.appendChild(b);
  });
  window.selectCluster = function (i) {
    $$("button", legend).forEach(function (b, j) { b.classList.toggle("active", i === j); });
    var c = KW[i];
    $("#kwTable tbody").innerHTML = c.rows.map(function (r) {
      return "<tr><td>" + r[0] + "</td><td><span class='pill " + intentPill[r[1]] + "'>" + r[1] + "</span></td><td class='num'>" + fmt(r[2]) + "</td><td class='num'>" + r[3] + "</td><td><span class='pill " + statusPill[r[4]][0] + "'>" + statusPill[r[4]][1] + "</span></td></tr>";
    }).join("");
    document.dispatchEvent(new CustomEvent("kw:select", { detail: i }));
  };
  window.selectCluster(0);

  /* ---------------- site health ---------------- */
  var ub = $("#uptimeBars");
  for (var d = 0; d < 30; d++) {
    var i_ = document.createElement("i");
    if (d === 11) i_.className = "warn";
    i_.title = d === 11 ? "Day " + (d + 1) + ": 4 min slow response, resolved" : "Day " + (d + 1) + ": 100%";
    ub.appendChild(i_);
  }
  var gauge = function (label, val, unit, ratio, note) {
    var r = 52, c = Math.PI * r, off = c * (1 - ratio);
    return "<div class='gauge'><svg viewBox='0 0 130 80'>" +
      "<path d='M13 70 A52 52 0 0 1 117 70' fill='none' stroke='rgba(148,170,205,.15)' stroke-width='10' stroke-linecap='round'/>" +
      "<path class='g-arc' d='M13 70 A52 52 0 0 1 117 70' fill='none' stroke='#22c39a' stroke-width='10' stroke-linecap='round' stroke-dasharray='" + c + "' stroke-dashoffset='" + c + "' data-off='" + off + "' style='transition:stroke-dashoffset 1.4s cubic-bezier(.2,.7,.2,1)'/>" +
      "</svg><b>" + val + "<small style='font-size:.7em;color:var(--muted)'>" + unit + "</small></b><span>" + label + "</span><em>" + note + "</em></div>";
  };
  $("#gauges").innerHTML =
    gauge("Largest Contentful Paint", "1.8", "s", 0.72, "good < 2.5s") +
    gauge("Interaction to Next Paint", "140", "ms", 0.7, "good < 200ms") +
    gauge("Cumulative Layout Shift", "0.03", "", 0.7, "good < 0.1");
  new IntersectionObserver(function (e, o) {
    if (!e[0].isIntersecting) return;
    $$(".g-arc").forEach(function (a) { a.style.strokeDashoffset = a.dataset.off; });
    $("#loadPin").style.left = (2.1 / 6 * 100) + "%";
    var v = 0, el = $("#loadVal");
    var iv = setInterval(function () { v = Math.min(2.1, v + 0.1); el.textContent = v.toFixed(1); if (v >= 2.1) clearInterval(iv); }, reduce ? 0 : 60);
    o.disconnect();
  }, { threshold: 0.3 }).observe($("#gauges"));

  var TESTS = [
    ["Login", "/login/", "1.2s"],
    ["Sign-up", "/register/", "1.6s"],
    ["Password reset (email received)", "/reset/", "18s"],
    ["Order buttons", "/pricing/", "0.8s"],
    ["Checkout (test card)", "/checkout/", "3.4s"],
    ["Contact form", "/contact/", "1.1s"],
    ["Newsletter form", "footer", "0.9s"]
  ];
  var tests = $("#tests");
  var renderTests = function (state) {
    tests.innerHTML = TESTS.map(function (t) {
      return "<div class='test'><span class='st " + (state || "ok") + "'></span><span>" + t[0] + "</span><span class='path mono'>" + t[1] + "</span><span class='ms'>" + (state ? "-" : t[2]) + "</span></div>";
    }).join("");
  };
  renderTests();
  $("#testRun").addEventListener("click", async function () {
    var btn = this; if (btn.disabled) return; btn.disabled = true; btn.textContent = "Running...";
    renderTests("idle");
    var rows = $$(".test", tests);
    for (var i = 0; i < rows.length; i++) {
      $(".st", rows[i]).className = "st run";
      await wait(320);
      $(".st", rows[i]).className = "st ok";
      $(".ms", rows[i]).textContent = TESTS[i][2];
    }
    btn.textContent = "7 / 7 passed"; await wait(1600); btn.textContent = "Run all tests"; btn.disabled = false;
  });

  /* ---------------- technical SEO ---------------- */
  var TOOLS = [
    ["Search Console", 24, [24, 15, 6, 0]],
    ["GA4", 6, [6, 4, 1, 0]],
    ["Ahrefs Site Audit", 112, [112, 64, 21, 0]],
    ["Screaming Frog", 87, [87, 49, 12, 0]]
  ];
  var spark = function (arr) {
    var max = arr[0], w = 200, h = 46, pts = arr.map(function (v, i) { return [i * (w / (arr.length - 1)), 4 + (h - 8) * (1 - v / max)]; });
    var d = pts.map(function (p, i) { return (i ? "L" : "M") + p[0].toFixed(1) + " " + p[1].toFixed(1); }).join(" ");
    return "<svg class='spark' viewBox='0 0 200 46' preserveAspectRatio='none'><path d='" + d + " L200 46 L0 46Z' fill='rgba(34,195,154,.12)'/><path d='" + d + "' fill='none' stroke='#22c39a' stroke-width='2.5'/></svg>";
  };
  $("#techGrid").innerHTML = TOOLS.map(function (t, i) {
    return "<div class='card tool-card reveal" + (i ? " d" + i : "") + " tilt'><div class='t'><b>" + t[0] + "</b><span class='from'>was " + t[1] + "</span></div><div class='big-num zero pop'>0</div><div class='sub'>open warnings, end of week 3</div>" + spark(t[2]) + "</div>";
  }).join("");
  $$("#techGrid .reveal").forEach(function (el) { revObs.observe(el); });
  if (finePointer && !reduce) {
    $$("#techGrid .tilt").forEach(function (card) {
      card.addEventListener("mousemove", function (e) {
        var r = card.getBoundingClientRect();
        var x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
        card.style.transform = "perspective(900px) rotateX(" + (-y * 8) + "deg) rotateY(" + (x * 10) + "deg) translateY(-4px)";
      });
      card.addEventListener("mouseleave", function () { card.style.transform = ""; });
    });
  }

  /* ---------------- links ---------------- */
  var KANBAN = [
    ["Prospects", 420, [["Accounting firm, startup resources page", 41, "Resource page"], ["Coworking space blog", 36, "Guest article"], ["Small business podcast show notes", 48, "Unlinked mention"]]],
    ["Contacted", 180, [["Regional small business news site", 52, "Guest article"], ["Bookkeeping software blog", 47, "Resource page"], ["University entrepreneurship center", 58, "Resource page"]]],
    ["Replied", 26, [["Marketing agency guide hub", 39, "Guest article"], ["Legal tech blog", 44, "Broken link"]]],
    ["Live", 14, [["Startup tools roundup (editorial)", 45, "Resource page"], ["Freelancer finance blog", 38, "Guest article"], ["Chamber of commerce member guide", 33, "Unlinked mention"]]]
  ];
  $("#kanban").innerHTML = KANBAN.map(function (c) {
    return "<div class='col'><div class='col-head'>" + c[0] + "<span>" + c[1] + "</span></div>" + c[2].map(function (l) {
      return "<div class='lcard'><div class='d'>" + l[0] + "</div><div class='m'><span class='dr'>DR " + l[1] + "</span><span>" + l[2] + "</span></div></div>";
    }).join("") + "</div>";
  }).join("");
  var AUDIT = [
    ["Accounting firm, startup resources page", 41, "LLC filing guide", "Resource page", "Sep 29", ["g", "Live, dofollow"]],
    ["Freelancer finance blog", 38, "how to get an EIN", "Guest article", "Oct 1", ["g", "Live, dofollow"]],
    ["Chamber of commerce member guide", 33, "Your Brand", "Unlinked mention", "Oct 2", ["g", "Live, dofollow"]],
    ["Startup tools roundup (editorial)", 45, "business plan template", "Resource page", "Oct 3", ["g", "Live, dofollow"]],
    ["Legal tech blog", 44, "Texas LLC", "Broken link", "Oct 6", ["g", "Live, dofollow"]],
    ["Coworking space blog", 36, "Your Brand", "Guest article", "Oct 8", ["a", "Changed to nofollow, asked to fix"]]
  ];
  $("#auditTable tbody").innerHTML = AUDIT.map(function (r) {
    return "<tr><td>" + r[0] + "</td><td class='num'>" + r[1] + "</td><td>" + r[2] + "</td><td>" + r[3] + "</td><td class='mono' style='font-size:.8rem'>" + r[4] + "</td><td><span class='pill " + r[5][0] + "'>" + r[5][1] + "</span></td></tr>";
  }).join("");

  /* ---------------- KPI dashboard ---------------- */
  var WEEKS = ["W1", "W2", "W3", "W4", "W5", "W6", "W7", "W8", "W9", "W10", "W11", "W12"];
  var M = {
    sessions: { label: "Organic sessions", base: 4200, act: [4180, 4230, 4150, 4240, 4520, 4870, 5310, 5940], tgt: [4480, 4760, 5030, 5300, 5570, 5840, 6110, 6380] },
    leads: { label: "Leads", base: 84, act: [83, 86, 82, 85, 92, 101, 110, 121], tgt: [90, 97, 104, 114, 120, 126, 133, 140] },
    regs: { label: "Registrations", base: 52, act: [51, 53, 50, 54, 57, 62, 67, 74], tgt: [55, 60, 65, 71, 75, 79, 83, 87] },
    purchases: { label: "Purchases", base: 18, act: [17, 18, 18, 19, 19, 22, 24, 27], tgt: [19, 21, 24, 27, 28, 30, 31, 33] }
  };
  M.cr = {
    label: "Conversion rate", base: 2.0, pct: true,
    act: M.leads.act.map(function (v, i) { return +(v / M.sessions.act[i] * 100).toFixed(2); }),
    tgt: [2.0, 2.0, 2.01, 2.0, 2.02, 2.03, 2.04, 2.05]
  };
  var keys = ["sessions", "leads", "regs", "purchases", "cr"];
  var cards = $("#kpiCards");
  cards.innerHTML = keys.map(function (k, i) {
    var m = M[k], a = m.act[7], t = m.tgt[3];
    var diff = Math.round((a - t) / t * 100);
    var txt = diff === 0 ? "on target" : (diff > 0 ? "+" : "") + diff + "% vs target";
    return "<button class='kpi-card" + (i ? "" : " active") + "' data-k='" + k + "'><small>" + m.label + " (W8)</small><b>" + (m.pct ? a.toFixed(2) + "%" : fmt(a)) + "</b><em" + (diff < 0 ? " class='neg'" : "") + ">" + txt + "</em></button>";
  }).join("");
  var chart = null;
  var dataFor = function (k) {
    var m = M[k];
    return {
      actual: m.act.concat([null, null, null, null]),
      target: [null, null, null, m.base].concat(m.tgt),
      base: WEEKS.map(function () { return m.base; })
    };
  };
  var buildChart = function () {
    if (!window.Chart) { setTimeout(buildChart, 150); return; }
    var ctx = $("#kpiChart").getContext("2d");
    var g = ctx.createLinearGradient(0, 0, 0, 340);
    g.addColorStop(0, "rgba(34,195,154,.35)"); g.addColorStop(1, "rgba(34,195,154,0)");
    var d = dataFor("sessions");
    Chart.defaults.font.family = "Inter, system-ui, sans-serif";
    Chart.defaults.color = "#7d8ba3";
    chart = new Chart(ctx, {
      type: "line",
      data: {
        labels: WEEKS,
        datasets: [
          { label: "Actual", data: d.actual, borderColor: "#22c39a", backgroundColor: g, fill: true, tension: 0.35, borderWidth: 3, pointRadius: 3, pointBackgroundColor: "#22c39a", spanGaps: false },
          { label: "Approved target", data: d.target, borderColor: "#5b8cff", borderWidth: 2, tension: 0.35, pointRadius: 0, fill: false },
          { label: "Baseline", data: d.base, borderColor: "#7d8ba3", borderDash: [6, 6], borderWidth: 1.5, pointRadius: 0, fill: false }
        ]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        animation: { duration: reduce ? 0 : 900, easing: "easeOutCubic" },
        interaction: { mode: "index", intersect: false },
        plugins: {
          legend: { display: false },
          tooltip: { backgroundColor: "#0f182b", borderColor: "rgba(148,170,205,.25)", borderWidth: 1, padding: 12, titleColor: "#eef3fb", bodyColor: "#b4c1d6" }
        },
        scales: {
          x: { grid: { color: "rgba(148,170,205,.07)" }, ticks: { font: { size: 11 } } },
          y: { grid: { color: "rgba(148,170,205,.07)" }, ticks: { font: { size: 11 } }, beginAtZero: false }
        }
      }
    });
  };
  new IntersectionObserver(function (e, o) { if (e[0].isIntersecting) { buildChart(); o.disconnect(); } }, { threshold: 0.2 }).observe($("#kpiChart"));
  $$(".kpi-card", cards).forEach(function (c) {
    c.addEventListener("click", function () {
      $$(".kpi-card", cards).forEach(function (x) { x.classList.remove("active"); });
      c.classList.add("active");
      if (!chart) return;
      var d = dataFor(c.dataset.k);
      chart.data.datasets[0].data = d.actual;
      chart.data.datasets[1].data = d.target;
      chart.data.datasets[2].data = d.base;
      chart.update();
    });
  });

  /* ---------------- launch kit ---------------- */
  var STEPS = [
    ["Intake", "Request logged, checklist opened", "#208 logged"],
    ["Domain connected", "Registrar access confirmed", "connected"],
    ["DNS verified", "A, CNAME and TXT match the server", "3 / 3 match"],
    ["SSL issued", "HTTPS forced, no mixed content", "valid, 90 days"],
    ["Staging build", "Customer reviews before go-live", "approved"],
    ["Published", "Pushed live, caches cleared", "live 2:14 PM"],
    ["Tested", "Layouts, forms, links on 3 devices", "12 checks passed"],
    ["Customer confirmed", "Completion message sent", "confirmed"]
  ];
  var ls = $("#launchSteps");
  var renderSteps = function (doneAll) {
    ls.innerHTML = STEPS.map(function (s, i) {
      return "<div class='stp" + (doneAll ? " ok" : "") + "'><span class='n'>" + (i + 1) + "</span><div><b>" + s[0] + "</b><span>" + s[1] + "</span></div><span class='res'>" + (doneAll ? s[2] : "pending") + "</span></div>";
    }).join("");
  };
  renderSteps(false);
  $("#launchRun").addEventListener("click", async function () {
    var btn = this; if (btn.disabled) return; btn.disabled = true; btn.textContent = "Checking...";
    renderSteps(false);
    $$("[data-rec]").forEach(function (p) { p.className = "pill a"; p.textContent = "Waiting"; });
    var rows = $$(".stp", ls), recs = $$("[data-rec]");
    for (var i = 0; i < rows.length; i++) {
      rows[i].classList.add("run");
      await wait(380);
      rows[i].classList.remove("run"); rows[i].classList.add("ok");
      $(".res", rows[i]).textContent = STEPS[i][2];
      if (i === 2) { for (var r = 0; r < 3; r++) { recs[r].className = "pill g"; recs[r].textContent = "Match"; } }
      if (i === 3) { recs[3].className = "pill g"; recs[3].textContent = "Valid"; }
    }
    btn.textContent = "Site launched"; await wait(1800); btn.textContent = "Run launch check"; btn.disabled = false;
  });

  /* ---------------- report tabs ---------------- */
  $$("#repTabs button").forEach(function (b) {
    b.addEventListener("click", function () {
      $$("#repTabs button").forEach(function (x) { x.classList.remove("active"); });
      b.classList.add("active");
      $$(".rep").forEach(function (r) { r.classList.remove("active"); });
      $("#rep-" + b.dataset.r).classList.add("active");
    });
  });
})();
