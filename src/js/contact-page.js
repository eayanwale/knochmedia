/*
  contact-page.js — /contact.html runtime (KNOCH-014)
  =====================================================
  Three-step qualified inquiry form. Responsibilities:

  1. Tile selectors — service type and budget tiles act as a custom
     radio group. Only one is selected per group; the underlying
     hidden <input> mirrors the selected value so form submission
     captures it.
  2. ?type= URL pre-fill — wedding / brand / sport / portrait param
     selects the corresponding service tile on init. Plumbed from
     KNOCH-012's project page CTAs (which will eventually pass
     project.category as ?type=).
  3. Conditional partner field — show/hide the "Partner's name" field
     in step 2 based on whether wedding was selected in step 1.
  4. Step navigation — Continue / Back buttons advance/retreat through
     the three step panels with a GSAP slide transition (current
     translateX-40 + fade out, next translateX 40→0 + fade in,
     0.5s overlap).
  5. Validation — service type required to leave step 1; name + email
     (with basic format check) required to leave step 2. Inline
     error messages below the offending field.
  6. Submission — preventDefault, build summary into step 3's <dl>,
     advance to step 3. Real form-handler endpoint (Formspree /
     Netlify Forms) is left as a placeholder action on the <form>
     so deployment-time configuration drops in without code changes.
*/

import { gsap } from 'gsap';

const STEP_TRANSITION_S = 0.5;

const SOURCE_LABELS = {
  instagram: 'Instagram',
  google:    'Google',
  referral:  'Referral',
  other:     'Other',
};

const SERVICE_LABELS = {
  wedding:  'Wedding',
  brand:    'Brand / Commercial',
  sport:    'Sports / Event',
  portrait: 'Portrait / Family',
};

const BUDGET_LABELS = {
  '1-3k': '$1–3k',
  '3-5k': '$3–5k',
  '5-8k': '$5–8k',
  '8k+':  '$8k+',
};

export function initContactPage() {
  const form = document.querySelector('.contact-form');
  if (!form) return;

  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  /* KNOCH-041: mobile takes the same instant-swap path as
     prefers-reduced-motion. The GSAP slide transition combined with
     position: absolute step panels caused two issues on mobile - the
     min-height: 820px form-col was sometimes shorter than the active
     step's actual rendered content, leaving the sidebar overlapping
     the form; and inline GSAP transforms persisted between transitions
     with the panels off-screen. Mobile CSS now uses position: relative
     for active step + display: none for inactive, so the form-col
     sizes to its real content. */
  const isMobile       = window.matchMedia('(max-width: 800px)').matches;
  const skipMotion     = prefersReduced || isMobile;

  /* ── Element refs ─────────────────────────────────────── */

  const steps        = Array.from(form.querySelectorAll('.contact-step'));
  const tiles        = Array.from(form.querySelectorAll('.contact-tile'));
  const stepCurrent  = form.querySelector('.contact-step-current');
  const dots         = Array.from(form.querySelectorAll('.contact-dot'));
  const continueBtns = Array.from(form.querySelectorAll('[data-action="next"]'));
  const backBtns     = Array.from(form.querySelectorAll('[data-action="back"]'));
  const partnerField = form.querySelector('[data-show-when-wedding]');
  const summary      = form.querySelector('.contact-summary');

  let activeStep = 1;

  /* ── 1. Tile selection ────────────────────────────────── */

  /* Tiles act as radio buttons within their group (data-field). Click
     selects the tile; previously-selected tile in the same group
     deselects. The hidden <input name="<field>"> mirrors the selected
     value so the form submission carries it. */
  tiles.forEach(tile => {
    tile.addEventListener('click', () => selectTile(tile));
    tile.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        selectTile(tile);
      }
    });
  });

  function selectTile(tile) {
    const field = tile.dataset.field;
    const value = tile.dataset.value;
    /* Deselect siblings in the same group */
    tiles
      .filter(t => t.dataset.field === field)
      .forEach(t => {
        const isThisOne = t === tile;
        t.classList.toggle('is-selected', isThisOne);
        t.setAttribute('aria-checked', isThisOne ? 'true' : 'false');
      });
    /* Mirror value into the hidden input so form submission captures it */
    const hiddenInput = form.querySelector(`input[type="hidden"][name="${field}"]`);
    if (hiddenInput) hiddenInput.value = value;

    /* Service-type-specific UI updates */
    if (field === 'serviceType') {
      togglePartnerField(value === 'wedding');
      updateContinueEnabled();
    }
  }

  /* ── 2. ?type= URL param pre-fill ─────────────────────── */

  const urlType = new URLSearchParams(window.location.search).get('type');
  if (urlType && SERVICE_LABELS[urlType]) {
    const preTile = form.querySelector(
      `.contact-tile[data-field="serviceType"][data-value="${urlType}"]`
    );
    if (preTile) selectTile(preTile);
  }

  /* ── 3. Conditional partner field ─────────────────────── */

  function togglePartnerField(show) {
    if (!partnerField) return;
    partnerField.classList.toggle('is-shown', show);
    /* Clear the input when hiding so a stale value from a previous
       selection doesn't slip through on submit. */
    if (!show) {
      const input = partnerField.querySelector('input');
      if (input) input.value = '';
    }
  }

  /* ── 4. Continue button enabled state ─────────────────── */

  function updateContinueEnabled() {
    const serviceInput = form.querySelector('input[name="serviceType"]');
    const hasService   = !!serviceInput?.value;
    /* Continue button on step 1 requires a selected service type */
    continueBtns.forEach(btn => {
      btn.disabled = !hasService;
    });
  }

  /* ── 5. Step navigation ───────────────────────────────── */

  continueBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      if (validateStep(activeStep)) goToStep(activeStep + 1);
    });
  });

  backBtns.forEach(btn => {
    btn.addEventListener('click', () => goToStep(activeStep - 1));
  });

  function goToStep(target) {
    if (target < 1 || target > steps.length) return;
    if (target === activeStep) return;

    const direction = target > activeStep ? 1 : -1;
    const current = steps[activeStep - 1];
    const next    = steps[target - 1];

    /* Update progress indicator immediately so it leads the transition */
    if (stepCurrent) stepCurrent.textContent = String(target);
    dots.forEach((d, i) => d.classList.toggle('is-active', i === target - 1));

    /* KNOCH-021: announce the transition to screen readers via the
       visually-hidden aria-live region. Pull the step title's text
       (stripped of italic markup) so the announcement matches the
       visible heading — e.g. "Step 2 of 3 — Let's connect." */
    const announce = form.querySelector('[data-step-announce]');
    if (announce) {
      const heading = next.querySelector('.contact-step-title');
      const headingText = heading?.textContent.trim() ?? '';
      announce.textContent = `Step ${target} of ${steps.length}${headingText ? ' — ' + headingText : ''}`;
    }

    if (skipMotion) {
      /* Instant swap — set classes, no GSAP. Clear any inline styles
         GSAP might have set on the panel previously so they don't
         interfere with the CSS-driven mobile layout (which makes
         active step position: relative + inactive display: none). */
      current.classList.remove('is-active');
      current.style.cssText = '';
      next.classList.add('is-active');
      next.style.cssText = '';
      activeStep = target;
      _focusFirstField(next);
      return;
    }

    /* Animated swap — current slides out, next slides in */
    gsap.to(current, {
      opacity: 0,
      x: -40 * direction,
      duration: STEP_TRANSITION_S,
      ease: 'power2.in',
      onComplete: () => {
        current.classList.remove('is-active');
        /* Reset transform/visibility so re-entering this step starts
           fresh from the off-state */
        current.style.visibility = 'hidden';
        current.style.transform = '';
      },
    });

    /* Set incoming state explicitly before the tween so the
       direction-aware off-position is correct (incoming from right
       when going forward, from left when going back). */
    next.classList.add('is-active');
    next.style.visibility = 'visible';
    gsap.fromTo(next,
      { opacity: 0, x: 40 * direction },
      {
        opacity: 1,
        x: 0,
        duration: STEP_TRANSITION_S,
        ease: 'power2.out',
        delay: STEP_TRANSITION_S * 0.4,
        clearProps: 'transform',
        onComplete: () => _focusFirstField(next),
      }
    );

    activeStep = target;
  }

  /* Focus the first focusable input/button inside a step on entry —
     keyboard users get continuity, screen readers re-announce. */
  function _focusFirstField(stepEl) {
    const focusable = stepEl.querySelector(
      'input:not([type="hidden"]):not([disabled]), textarea, button:not([disabled])'
    );
    if (focusable) focusable.focus({ preventScroll: true });
  }

  /* ── 6. Validation per step ───────────────────────────── */

  function validateStep(step) {
    clearErrors();
    if (step === 1) {
      const serviceInput = form.querySelector('input[name="serviceType"]');
      if (!serviceInput?.value) {
        showError(form.querySelector('.contact-tiles[role="radiogroup"]'),
                  'Pick a service type to continue.');
        return false;
      }
      return true;
    }
    if (step === 2) {
      const name  = form.querySelector('input[name="name"]');
      const email = form.querySelector('input[name="email"]');
      let ok = true;
      if (!name?.value.trim()) {
        showError(name, 'Your name, please.');
        ok = false;
      }
      if (!email?.value.trim()) {
        showError(email, 'Email address, please.');
        ok = false;
      } else if (!/.+@.+\..+/.test(email.value)) {
        showError(email, 'That email address looks off — double-check?');
        ok = false;
      }
      return ok;
    }
    return true;
  }

  function showError(target, message) {
    if (!target) return;
    const error = document.createElement('span');
    error.className = 'contact-error';
    error.textContent = message;
    /* Insert directly after the field/group */
    const parent = target.closest('.contact-field') || target.parentElement;
    parent.appendChild(error);
  }

  function clearErrors() {
    form.querySelectorAll('.contact-error').forEach(el => el.remove());
  }

  /* ── 7. Form submission (KNOCH-039 — Formspree) ──────────

     Real submission flow:
       1. preventDefault (form's action would otherwise navigate away)
       2. validate step 2 (name + email — service type already
          validated to leave step 1)
       3. build the step-3 summary from FormData
       4. flip the submit button into a loading state (disabled +
          "SENDING…")
       5. POST to Formspree's endpoint with Accept: application/json
          so it returns JSON instead of redirecting to its own
          thank-you page (we keep visitors on our step-3 panel)
       6. on { ok: true } → goToStep(3) reveals the confirmation
          panel with the summary already built
       7. on non-OK or network error → restore the submit button +
          inline error message near it that points at hello@knoch.media
          as the fallback. Form data is preserved (the visitor never
          left step 2). */

  /* AbortController-driven 10s timeout — Formspree's API is fast,
     but a hung connection shouldn't leave the visitor staring at a
     spinning button forever. */
  const SUBMIT_TIMEOUT_MS = 10_000;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!validateStep(2)) return;

    /* Build summary into step 3's <dl> so the visitor sees what was sent */
    const data = new FormData(form);
    if (summary) {
      const rows = [];
      const service = data.get('serviceType');
      if (service)             rows.push(['Service',  SERVICE_LABELS[service] || service]);
      if (data.get('date'))    rows.push(['Date',     data.get('date')]);
      if (data.get('location')) rows.push(['Location', data.get('location')]);
      const budget = data.get('budget');
      if (budget)              rows.push(['Budget',   BUDGET_LABELS[budget] || budget]);
      if (data.get('name'))    rows.push(['Name',     data.get('name')]);
      const partner = data.get('partner');
      if (partner)             rows.push(['Partner',  partner]);
      if (data.get('email'))   rows.push(['Email',    data.get('email')]);
      const phone = data.get('phone');
      if (phone)               rows.push(['Phone',    phone]);
      const source = data.get('source');
      if (source)              rows.push(['Source',   SOURCE_LABELS[source] || source]);
      summary.innerHTML = rows.map(([k, v]) => `<dt>${k}</dt><dd>${v}</dd>`).join('');
    }

    const submitBtn = form.querySelector('button[type="submit"]');
    const originalLabel = submitBtn?.textContent;

    /* Loading state — disable + label swap. The .is-sending class
       can be styled later if a spinner is desired; for now the
       text + disabled attribute is the visible signal. */
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.classList.add('is-sending');
      submitBtn.textContent = 'SENDING…';
    }
    clearErrors();

    /* Wrap fetch in an AbortController so a hung connection times out
       at SUBMIT_TIMEOUT_MS rather than leaving the button spinning. */
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), SUBMIT_TIMEOUT_MS);

    try {
      const res = await fetch(form.action, {
        method:  'POST',
        body:    data,
        headers: { Accept: 'application/json' },
        signal:  controller.signal,
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        /* Success — Formspree accepted. Step 3 confirmation panel was
           already populated above; goToStep handles the visual swap. */
        goToStep(3);
      } else {
        /* Formspree returned a non-OK status. Try to surface the first
           field-level error if its body has one; otherwise generic. */
        let detail = '';
        try {
          const body = await res.json();
          if (Array.isArray(body.errors) && body.errors[0]?.message) {
            detail = ` (${body.errors[0].message})`;
          }
        } catch { /* response wasn't JSON — ignore */ }
        showSubmitError(`Couldn't deliver right now${detail}. Try again, or email hello@knoch.media directly.`);
        restoreSubmitButton(submitBtn, originalLabel);
      }
    } catch (err) {
      clearTimeout(timeoutId);
      const msg = err.name === 'AbortError'
        ? "Request timed out. Try again, or email hello@knoch.media directly."
        : "Couldn't deliver right now. Try again, or email hello@knoch.media directly.";
      showSubmitError(msg);
      restoreSubmitButton(submitBtn, originalLabel);
    }
  });

  /* Helpers — kept inside initContactPage so they can close over the
     form reference and reuse showError's per-field rendering. */
  function showSubmitError(message) {
    const submitBtn = form.querySelector('button[type="submit"]');
    if (!submitBtn) return;
    /* Wrap the button in its containing field so showError's
       insertion logic places the error near it. */
    const field = submitBtn.closest('.contact-actions') || submitBtn.parentElement;
    /* Drop any prior submit-error before adding the new one. */
    field.querySelectorAll('.contact-error--submit').forEach(el => el.remove());
    const error = document.createElement('span');
    error.className = 'contact-error contact-error--submit';
    error.setAttribute('role', 'alert');
    error.textContent = message;
    field.appendChild(error);
  }

  function restoreSubmitButton(btn, label) {
    if (!btn) return;
    btn.disabled = false;
    btn.classList.remove('is-sending');
    if (label) btn.textContent = label;
  }

  /* ── 8. Initial state + entry animations ──────────────── */

  /* First step is set to .is-active by default in HTML; ensure the
     transform / opacity are clean so the visitor doesn't see the
     step-2/3 off-state styles on chapter-1 paint. */
  const first = steps[0];
  if (first) {
    first.style.opacity = '1';
    first.style.visibility = 'visible';
    first.style.transform = 'translateX(0)';
  }
  updateContinueEnabled();

  /* Page entry — banner drops in from above, then hero meta / title /
     sub stagger up, then the form column + sidebar blocks fade up
     together. Skipped on prefers-reduced-motion (the gsap.from calls
     would still set the off-state). */
  if (!skipMotion) {
    const banner   = document.querySelector('.contact-banner');
    const heroMeta = document.querySelector('.contact-hero-meta');
    const heroTitle = document.querySelector('.contact-hero-title');
    const heroSub  = document.querySelector('.contact-hero-sub');
    const formCol  = document.querySelector('.contact-form-col');
    const sideBlocks = document.querySelectorAll('.contact-sidebar-block');

    const tl = gsap.timeline({ defaults: { ease: 'expo.out' } });

    if (banner) {
      tl.from(banner, {
        yPercent: -100,
        duration: 0.9,
        ease: 'power3.out',
      }, 0);
    }
    if (heroMeta) {
      tl.from(heroMeta, { opacity: 0, y: 20, duration: 0.8 }, 0.4);
    }
    if (heroTitle) {
      tl.from(heroTitle, { opacity: 0, y: 40, duration: 1.0 }, 0.55);
    }
    if (heroSub) {
      tl.from(heroSub, { opacity: 0, y: 16, duration: 0.7 }, 0.85);
    }
    if (formCol) {
      tl.from(formCol, { opacity: 0, y: 30, duration: 1.0 }, 1.0);
    }
    if (sideBlocks.length) {
      tl.from(sideBlocks, {
        opacity: 0,
        y: 30,
        duration: 0.9,
        stagger: 0.12,
      }, 1.1);
    }
  }
}
