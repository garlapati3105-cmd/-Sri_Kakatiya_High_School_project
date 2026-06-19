// ============================================================
//  Sri Kakatiya High School – main.js
//  Handles: sticky nav, hamburger, counters, scroll animations,
//           active nav highlighting, form feedback
// ============================================================

document.addEventListener('DOMContentLoaded', function () {

  /* ──────────────────────────────────────────
     1. Sticky header – add .scrolled on scroll
  ────────────────────────────────────────── */
  const header = document.getElementById('site-header');
  const onScroll = () => {
    if (window.scrollY > 40) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll(); // run once on load

  /* ──────────────────────────────────────────
     2. Hamburger menu toggle
  ────────────────────────────────────────── */
  const hamburger = document.getElementById('hamburger');
  const navLinks  = document.getElementById('nav-links');

  if (hamburger && navLinks) {
    hamburger.addEventListener('click', function () {
      const isOpen = navLinks.classList.toggle('show');
      hamburger.classList.toggle('open', isOpen);
      hamburger.setAttribute('aria-expanded', String(isOpen));
    });

    // Close on outside click
    document.addEventListener('click', function (e) {
      if (!header.contains(e.target)) {
        navLinks.classList.remove('show');
        hamburger.classList.remove('open');
        hamburger.setAttribute('aria-expanded', 'false');
      }
    });
  }

  /* ──────────────────────────────────────────
     3. Smooth scroll + close mobile menu on nav click
  ────────────────────────────────────────── */
  document.querySelectorAll('a[href^="#"]').forEach(link => {
    link.addEventListener('click', function (e) {
      const id = this.getAttribute('href').slice(1);
      const target = document.getElementById(id);
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        if (navLinks) {
          navLinks.classList.remove('show');
          hamburger && hamburger.classList.remove('open');
          hamburger && hamburger.setAttribute('aria-expanded', 'false');
        }
      }
    });
  });

  /* ──────────────────────────────────────────
     4. Active nav link on scroll (Intersection Observer)
  ────────────────────────────────────────── */
  const sections = document.querySelectorAll('section[id]');
  const navItems = document.querySelectorAll('.nav-links a[href^="#"]');

  const activateNav = (id) => {
    navItems.forEach(a => {
      a.classList.toggle('active', a.getAttribute('href') === '#' + id);
    });
  };

  const sectionObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        activateNav(entry.target.id);
      }
    });
  }, { threshold: 0.35 });

  sections.forEach(s => sectionObserver.observe(s));

  /* ──────────────────────────────────────────
     5. Counter animation (triggered on viewport entry)
  ────────────────────────────────────────── */
  const counters = document.querySelectorAll('.counter');
  let countersStarted = false;

  const animateCounters = () => {
    if (countersStarted) return;
    countersStarted = true;

    counters.forEach(counter => {
      const target = +counter.getAttribute('data-target');
      const duration = 1800; // ms
      const step = Math.ceil(target / (duration / 16));
      let current = 0;

      const tick = () => {
        current = Math.min(current + step, target);
        counter.textContent = current;
        if (current < target) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    });
  };

  const statsSection = document.getElementById('statistics');
  if (statsSection) {
    const counterObserver = new IntersectionObserver((entries, obs) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          animateCounters();
          obs.disconnect();
        }
      });
    }, { threshold: 0.4 });
    counterObserver.observe(statsSection);
  }

  /* ──────────────────────────────────────────
     6. Fade-in / slide-in animations on scroll
  ────────────────────────────────────────── */
  const animatedEls = document.querySelectorAll('.fade-in, .fade-in-left, .fade-in-right');

  const fadeObserver = new IntersectionObserver((entries, obs) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        obs.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });

  animatedEls.forEach(el => fadeObserver.observe(el));

  /* ──────────────────────────────────────────
     7. Enquiry form – simple client-side feedback
  ────────────────────────────────────────── */
  const form   = document.getElementById('enquiry-form');
  const submit = document.getElementById('form-submit-btn');

  if (form && submit) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();

      // Basic validation
      const required = form.querySelectorAll('[required]');
      let valid = true;
      required.forEach(field => {
        if (!field.value.trim()) {
          field.style.borderColor = '#e53e3e';
          valid = false;
        } else {
          field.style.borderColor = '';
        }
      });

      if (!valid) {
        submit.textContent = '⚠️ Please fill all required fields';
        setTimeout(() => { submit.textContent = 'Send Enquiry ✦'; }, 3000);
        return;
      }

      // Simulate submission success
      submit.textContent = '⏳ Sending...';
      submit.disabled = true;

      setTimeout(() => {
        // Persist message record in local database if available
        if (window.skhs_db) {
          try {
            const parentName = document.getElementById('parent-name').value.trim();
            const phone = document.getElementById('phone-number').value.trim();
            const email = document.getElementById('email-address').value.trim();
            const studentName = document.getElementById('student-name').value.trim();
            const targetClass = document.getElementById('class-applying').value;
            const msg = document.getElementById('message').value.trim();

            const msgId = "MSG-" + Math.floor(100000 + Math.random() * 900000);
            window.skhs_db.insert('messages', {
              messageId: msgId,
              parentName,
              phone,
              email,
              studentName,
              targetClass,
              message: msg,
              status: 'Pending',
              createdAt: Date.now()
            });
          } catch (err) {
            console.error("Error saving enquiry message:", err);
          }
        }

        submit.textContent = '✅ Enquiry Sent! We\'ll contact you soon.';
        submit.style.background = 'linear-gradient(135deg,#22c55e,#16a34a)';
        form.reset();
        setTimeout(() => {
          submit.textContent = 'Send Enquiry ✦';
          submit.style.background = '';
          submit.disabled = false;
        }, 4000);
      }, 1200);
    });

    // Clear red borders on input
    form.querySelectorAll('input, select, textarea').forEach(field => {
      field.addEventListener('input', () => { field.style.borderColor = ''; });
    });
  }

});
