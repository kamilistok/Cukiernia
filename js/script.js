/* script.js
   - toggle menu mobilnego
   - fade-in przy przewijaniu (IntersectionObserver)
   - płynne przewijanie z offsetem (sticky header)
   - poprawione zachowanie nagłówka przy scrollowaniu w górę
   - walidacja i wysyłka formularza kontaktowego do Formspree
*/

document.addEventListener('DOMContentLoaded', function () {
  // Rok w stopce
  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  // Fade-in przy przewijaniu
  const faders = document.querySelectorAll('.fade-in');
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });
  faders.forEach(el => observer.observe(el));

  // Toggle menu mobilnego
  const navToggle = document.querySelector('.nav-toggle');
  const mainNav = document.getElementById('main-nav');
  if (navToggle && mainNav) {
    navToggle.addEventListener('click', () => {
      const isOpen = navToggle.classList.toggle('open');
      mainNav.classList.toggle('open', isOpen);
      navToggle.setAttribute('aria-expanded', String(isOpen));
    });

    // Zamknij menu po kliknięciu linku (na urządzeniach mobilnych)
mainNav.addEventListener('click', (e) => {
  // zamykanie TYLKO na mobile
  if (window.innerWidth < 900) {
    if (e.target.tagName === 'A' && navToggle.classList.contains('open')) {
      navToggle.classList.remove('open');
      mainNav.classList.remove('open');
      navToggle.setAttribute('aria-expanded', 'false');
    }
  }
});

// Delayed close for desktop dropdowns to avoid pointer gap
(function () {
  const DESKTOP_BREAKPOINT = 900;
  const DELAY_MS = 220; // opóźnienie przed zamknięciem (możesz zmniejszyć/powiększyć)

  const submenuItems = document.querySelectorAll('.nav-item.has-submenu');
  const timers = new WeakMap();

  function isDesktop() {
    return window.innerWidth >= DESKTOP_BREAKPOINT;
  }

  submenuItems.forEach(item => {
    const link = item.querySelector('.menu-link');
    const submenu = item.querySelector('.submenu');

    if (!link || !submenu) return;

    // mouseenter: anuluj timer i otwórz
    item.addEventListener('mouseenter', () => {
      if (!isDesktop()) return;
      const t = timers.get(item);
      if (t) {
        clearTimeout(t);
        timers.delete(item);
      }
      item.classList.add('submenu-open');
      link.setAttribute('aria-expanded', 'true');
    });

    // mouseleave: ustaw timer na zamknięcie
    item.addEventListener('mouseleave', () => {
      if (!isDesktop()) return;
      const t = setTimeout(() => {
        item.classList.remove('submenu-open');
        link.setAttribute('aria-expanded', 'false');
        timers.delete(item);
      }, DELAY_MS);
      timers.set(item, t);
    });

    // Jeśli kursor wejdzie do samego submenu, anuluj timer (bezpieczne)
    submenu.addEventListener('mouseenter', () => {
      if (!isDesktop()) return;
      const t = timers.get(item);
      if (t) {
        clearTimeout(t);
        timers.delete(item);
      }
      item.classList.add('submenu-open');
      link.setAttribute('aria-expanded', 'true');
    });

    // opuszczenie submenu -> ten sam timer
    submenu.addEventListener('mouseleave', () => {
      if (!isDesktop()) return;
      const t = setTimeout(() => {
        item.classList.remove('submenu-open');
        link.setAttribute('aria-expanded', 'false');
        timers.delete(item);
      }, DELAY_MS);
      timers.set(item, t);
    });

    // keyboard accessibility: focus/blur już obsługujesz przez :focus-within w CSS,
    // ale upewnij się, że aria-expanded jest zsynchronizowane przy focusie:
    item.addEventListener('focusin', () => {
      link.setAttribute('aria-expanded', 'true');
      item.classList.add('submenu-open');
    });
    item.addEventListener('focusout', (e) => {
      // jeśli focus nadal wewnątrz elementu, nie zamykaj
      if (item.contains(document.activeElement)) return;
      link.setAttribute('aria-expanded', 'false');
      item.classList.remove('submenu-open');
    });
  });

  // Przy zmianie rozmiaru ekranu anuluj timery i usuń klasy (przejście mobile/desktop)
  window.addEventListener('resize', () => {
    submenuItems.forEach(item => {
      const t = timers.get(item);
      if (t) {
        clearTimeout(t);
        timers.delete(item);
      }
      // na mobile nie chcemy mieć desktopowej klasy
      if (!isDesktop()) {
        item.classList.remove('submenu-open');
        const link = item.querySelector('.menu-link');
        if (link) link.setAttribute('aria-expanded', 'false');
      }
    });
  });
})();

  }

  /* -------------------------------
     Płynne przewijanie z offsetem dla linków #anchor
     ------------------------------- */
  function getHeaderOffset() {
    const header = document.querySelector('.site-header');
    return header ? header.getBoundingClientRect().height + 8 : 0;
  }

  function scrollToHashTarget(hash, replaceHistory = false) {
    if (!hash) return;
    const id = hash.startsWith('#') ? hash.slice(1) : hash;
    const target = document.getElementById(id);
    if (!target) return;

    const offset = getHeaderOffset();
    const targetRect = target.getBoundingClientRect();
    const absoluteY = window.pageYOffset + targetRect.top - offset;

    window.scrollTo({ top: Math.max(absoluteY, 0), behavior: 'smooth' });

    setTimeout(() => {
      target.setAttribute('tabindex', '-1');
      target.focus({ preventScroll: true });
      target.removeAttribute('tabindex');
    }, 450);

    if (replaceHistory) history.replaceState(null, '', '#' + id);
    else history.pushState(null, '', '#' + id);
  }

  document.addEventListener('click', function (e) {
    const link = e.target.closest('a[href^="#"]');
    if (!link) return;
    const href = link.getAttribute('href');
    if (!href || href === '#' || href === '#!') return;
    e.preventDefault();

    if (navToggle && mainNav && navToggle.classList.contains('open')) {
      navToggle.classList.remove('open');
      mainNav.classList.remove('open');
      navToggle.setAttribute('aria-expanded', 'false');
    }

    scrollToHashTarget(href, false);
  });

  if (window.location.hash) {
    setTimeout(() => {
      scrollToHashTarget(window.location.hash, true);
    }, 80);
  }

  window.addEventListener('popstate', () => {
    if (window.location.hash) scrollToHashTarget(window.location.hash, true);
    else window.scrollTo({ top: 0, behavior: 'smooth' });
  });

// ───────────────────────────────────────────────
// NAGŁÓWEK – prosta, przewidywalna wersja
(function () {
  const header = document.querySelector('.site-header');
  if (!header) return;

  let lastScrollY = window.scrollY;

  const update = () => {
    const curr = window.scrollY;

    // cień po lekkim scrollu
    header.classList.toggle('scrolled', curr > 10);

    // Jesteśmy na samej górze → zawsze pokazany
    if (curr <= 0) {
      header.classList.remove('hidden');
    }
    // Scroll w dół i jesteśmy trochę niżej → chowaj
    else if (curr > lastScrollY && curr > 140) {
      header.classList.add('hidden');
    }
    // Scroll w górę → pokazuj
    else if (curr < lastScrollY) {
      header.classList.remove('hidden');
    }

    lastScrollY = curr;
  };

  let raf = null;
  const onScroll = () => {
    if (raf === null) {
      raf = requestAnimationFrame(() => {
        update();
        raf = null;
      });
    }
  };

  window.addEventListener('scroll', onScroll, { passive: true });

  // Początkowy stan
  update();
})();

  /* -------------------------------
     Formularz kontaktowy – walidacja i wysyłka
     ------------------------------- */
  const form = document.getElementById('contact-form');
  const emailInput = document.getElementById('email');
  const messageInput = document.getElementById('message');
  const messageEl = document.getElementById('form-message');

  function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i;
    return re.test(String(email).toLowerCase());
  }

  if (form && emailInput && messageInput && messageEl) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();

      const email = emailInput.value.trim();
      const message = messageInput.value.trim();
      messageEl.textContent = '';
      messageEl.style.color = '';

      if (!email) {
        messageEl.textContent = 'Proszę podać adres e-mail.';
        messageEl.style.color = '#c0392b';
        emailInput.focus();
        return;
      }
      if (!validateEmail(email)) {
        messageEl.textContent = 'Nieprawidłowy format adresu e-mail.';
        messageEl.style.color = '#c0392b';
        emailInput.focus();
        return;
      }
      if (!message) {
        messageEl.textContent = 'Proszę wpisać krótką wiadomość.';
        messageEl.style.color = '#c0392b';
        messageInput.focus();
        return;
      }

      messageEl.textContent = 'Wysyłanie...';
      messageEl.style.color = '#8B4B5A';

      const action = form.getAttribute('action');
      if (!action) {
        messageEl.textContent = 'Brak adresu formularza (atrybut action).';
        messageEl.style.color = '#c0392b';
        return;
      }

      const formData = new FormData(form);
      fetch(action, {
        method: 'POST',
        body: formData,
        headers: { 'Accept': 'application/json' }
      })
        .then(response => {
          if (response.ok) {
            messageEl.textContent = 'Dziękujemy! Wiadomość została wysłana.';
            messageEl.style.color = '#2d6a4f';
            form.reset();
          } else {
            return response.json().then(data => {
              throw new Error(data?.error || 'Błąd serwera');
            });
          }
        })
        .catch(err => {
          messageEl.textContent = 'Wystąpił błąd podczas wysyłania. Spróbuj ponownie później.';
          messageEl.style.color = '#c0392b';
          console.error('Form submit error:', err);
        });
    });
  }
});