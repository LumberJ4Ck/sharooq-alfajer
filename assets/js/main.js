/* ============================================================
   Sharooq Al-Fajer : main.js
   Nav toggle · scroll effects · reveal animations · form handling
   ============================================================ */
(function () {
  "use strict";

  const header    = document.getElementById("header");
  const nav        = document.getElementById("nav");
  const navToggle = document.getElementById("navToggle");
  const navLinks  = Array.from(document.querySelectorAll(".nav-link"));

  /* ---------- Mobile nav ---------- */
  function closeNav() {
    nav.classList.remove("open");
    navToggle.classList.remove("open");
    navToggle.setAttribute("aria-expanded", "false");
  }

  navToggle.addEventListener("click", function () {
    const open = nav.classList.toggle("open");
    navToggle.classList.toggle("open", open);
    navToggle.setAttribute("aria-expanded", String(open));
  });

  // Close the menu after tapping a link (mobile)
  nav.addEventListener("click", function (e) {
    if (e.target.closest("a")) closeNav();
  });

  /* ---------- Header shadow on scroll ---------- */
  function onScroll() {
    header.classList.toggle("scrolled", window.scrollY > 20);
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ---------- Active link highlight ---------- */
  const sections = navLinks
    .map(function (link) {
      const id = link.getAttribute("href");
      return id && id.startsWith("#") ? document.querySelector(id) : null;
    })
    .filter(Boolean);

  if ("IntersectionObserver" in window && sections.length) {
    const spy = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            const id = "#" + entry.target.id;
            navLinks.forEach(function (l) {
              l.classList.toggle("active", l.getAttribute("href") === id);
            });
          }
        });
      },
      { rootMargin: "-45% 0px -50% 0px", threshold: 0 }
    );
    sections.forEach(function (s) { spy.observe(s); });
  }

  /* ---------- Reveal on scroll ---------- */
  const revealEls = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window && revealEls.length) {
    const revealObs = new IntersectionObserver(
      function (entries, obs) {
        entries.forEach(function (entry, i) {
          if (entry.isIntersecting) {
            // small stagger for groups
            setTimeout(function () { entry.target.classList.add("visible"); }, i * 70);
            obs.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12 }
    );
    revealEls.forEach(function (el) { revealObs.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add("visible"); });
  }

  /* ---------- Service photo galleries ---------- */
  const lightbox = document.getElementById("lightbox");
  const mediaLinks = document.querySelectorAll(".card-media[data-gallery]");
  const CAMERA_SVG =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
    '<path d="M4 8h3l2-3h6l2 3h3v11H4z"/><circle cx="12" cy="13" r="3.5"/></svg>';

  function readGallery(id) {
    const box = document.getElementById("gallery-" + id);
    if (!box) return null;
    const items = Array.from(box.querySelectorAll("a")).map(function (a) {
      return { src: a.getAttribute("href"), thumb: a.dataset.thumb || a.getAttribute("href"), caption: a.textContent.trim() };
    });
    return { title: box.dataset.title || "", items: items };
  }

  // Photo-count chip on each card, kept in sync with the gallery list
  mediaLinks.forEach(function (link) {
    const g = readGallery(link.dataset.gallery);
    const chip = link.querySelector(".card-media-count");
    if (!g || !chip) return;
    const n = g.items.length;
    chip.innerHTML = CAMERA_SVG + n + (n === 1 ? " Photo" : " Photos");
    link.setAttribute("aria-label", "View " + g.title + " photos (" + n + ")");
  });

  if (lightbox && typeof lightbox.showModal === "function") {
    const lbImg     = lightbox.querySelector(".lb-img");
    const lbTitle   = lightbox.querySelector(".lb-title");
    const lbText    = lightbox.querySelector(".lb-text");
    const lbCount   = lightbox.querySelector(".lb-count");
    const lbThumbs  = lightbox.querySelector(".lb-thumbs");
    const lbStage   = lightbox.querySelector(".lb-stage");
    let gallery = null;
    let index = 0;
    let opener = null;

    function show(i) {
      const n = gallery.items.length;
      index = (i + n) % n;
      const item = gallery.items[index];

      function loaded() {
        lbImg.classList.remove("loading");
        lbStage.classList.remove("is-loading");
      }
      lbImg.classList.add("loading");
      lbStage.classList.add("is-loading");
      lbImg.onload = loaded;
      lbImg.onerror = loaded;
      lbImg.src = item.src;
      lbImg.alt = item.caption;
      if (lbImg.complete && lbImg.naturalWidth) loaded();

      lbText.textContent = item.caption;
      lbCount.textContent = (index + 1) + " / " + n;
      lbThumbs.querySelectorAll(".lb-thumb").forEach(function (t, k) {
        t.setAttribute("aria-current", k === index ? "true" : "false");
      });

      // Preload neighbours for instant next/prev
      [index + 1, index - 1].forEach(function (k) {
        const pre = gallery.items[(k + n) % n];
        if (pre) (new Image()).src = pre.src;
      });
    }

    function openGallery(id, link) {
      gallery = readGallery(id);
      if (!gallery || !gallery.items.length) return false;
      opener = link;

      lbTitle.textContent = gallery.title;
      lightbox.classList.toggle("single", gallery.items.length < 2);
      lbThumbs.innerHTML = "";
      gallery.items.forEach(function (item, k) {
        const b = document.createElement("button");
        b.type = "button";
        b.className = "lb-thumb";
        b.setAttribute("aria-label", "Photo " + (k + 1) + ": " + item.caption);
        b.innerHTML = '<img src="' + item.thumb + '" alt="" loading="lazy" />';
        b.addEventListener("click", function () { show(k); });
        lbThumbs.appendChild(b);
      });

      show(0);
      document.documentElement.style.overflow = "hidden";
      lightbox.showModal();
      return true;
    }

    mediaLinks.forEach(function (link) {
      link.addEventListener("click", function (e) {
        if (e.ctrlKey || e.metaKey || e.shiftKey || e.button !== 0) return; // allow "open in new tab"
        if (openGallery(link.dataset.gallery, link)) e.preventDefault();
      });
    });

    lightbox.querySelector(".lb-close").addEventListener("click", function () { lightbox.close(); });
    lightbox.querySelector(".lb-prev").addEventListener("click", function () { show(index - 1); });
    lightbox.querySelector(".lb-next").addEventListener("click", function () { show(index + 1); });

    // Click on the dark area around the photo closes the gallery
    lbStage.addEventListener("click", function (e) {
      if (e.target === lbStage) lightbox.close();
    });

    lightbox.addEventListener("keydown", function (e) {
      if (!gallery || gallery.items.length < 2) return;
      if (e.key === "ArrowRight") { e.preventDefault(); show(index + 1); }
      if (e.key === "ArrowLeft")  { e.preventDefault(); show(index - 1); }
    });

    // Swipe on touch screens
    let touchX = null;
    lbStage.addEventListener("touchstart", function (e) { touchX = e.touches[0].clientX; }, { passive: true });
    lbStage.addEventListener("touchend", function (e) {
      if (touchX === null || !gallery || gallery.items.length < 2) return;
      const dx = e.changedTouches[0].clientX - touchX;
      touchX = null;
      if (Math.abs(dx) > 45) show(index + (dx < 0 ? 1 : -1));
    });

    lightbox.addEventListener("close", function () {
      if (lightbox.open) return; // re-opened before this queued event fired
      document.documentElement.style.overflow = "";
      if (opener) opener.focus({ preventScroll: true });
    });
  }

  /* ---------- Footer year ---------- */
  const yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ---------- Contact form (Formspree AJAX) ---------- */
  const form     = document.getElementById("contactForm");
  const statusEl = document.getElementById("formStatus");
  const submitBtn = document.getElementById("submitBtn");

  function setStatus(msg, type) {
    statusEl.textContent = msg;
    statusEl.className = "form-status" + (type ? " " + type : "");
  }

  if (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();

      const action = form.getAttribute("action") || "";

      // Formspree not configured yet, so give clear guidance instead of failing silently.
      if (action.indexOf("YOUR_FORM_ID") !== -1) {
        setStatus(
          "Form not yet connected. Add your Formspree form ID in index.html (see README) to start receiving messages.",
          "info"
        );
        return;
      }

      if (!form.checkValidity()) {
        form.reportValidity();
        return;
      }

      const data = new FormData(form);
      submitBtn.disabled = true;
      const original = submitBtn.textContent;
      submitBtn.textContent = "Sending…";
      setStatus("", "");

      fetch(action, {
        method: "POST",
        body: data,
        headers: { Accept: "application/json" }
      })
        .then(function (response) {
          if (response.ok) {
            form.reset();
            setStatus("Thank you! Your message has been sent. We'll get back to you shortly.", "success");
          } else {
            return response.json().then(function (d) {
              const msg = d && d.errors
                ? d.errors.map(function (er) { return er.message; }).join(", ")
                : "Something went wrong. Please try again or email us directly.";
              setStatus(msg, "error");
            });
          }
        })
        .catch(function () {
          setStatus("Network error. Please try again or email info@sharooq-alfajer.com.", "error");
        })
        .finally(function () {
          submitBtn.disabled = false;
          submitBtn.textContent = original;
        });
    });
  }
})();
