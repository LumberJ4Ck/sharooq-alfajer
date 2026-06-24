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
