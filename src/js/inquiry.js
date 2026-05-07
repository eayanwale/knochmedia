/**
 * inquiry.js — 4-step qualified inquiry form with aperture iris transitions.
 * KNOCH-030: Signature feature — camera aperture clip-path between steps.
 *
 * Steps:
 *   01 — Event Type (Wedding / Portrait / Commercial / Other)
 *   02 — Date & Vision (preferred date + describe your vision)
 *   03 — Budget Range (Under $2k / $2k–$5k / $5k–$10k / $10k+)
 *   04 — Contact Details (name, email, phone)
 *
 * Each transition uses clip-path: circle() animating from 0% (closed
 * aperture) to 75% (open). Film counter progress indicator (01/04)
 * matches the hero loader's aesthetic.
 *
 * Pattern: guard → reduced-motion check → build DOM → bind events → scroll reveal.
 */

import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { bindCharHover } from './char-hover.js';

gsap.registerPlugin(ScrollTrigger);

const STEPS = [
  {
    id: 'event-type',
    heading: 'What are we <em>capturing?</em>',
    type: 'radio',
    name: 'eventType',
    options: ['Wedding', 'Portrait / Family', 'Brand / Commercial', 'Sports / Event'],
  },
  {
    id: 'vision',
    heading: 'Tell me about your <em>vision.</em>',
    type: 'fields',
    fields: [
      { name: 'date', label: 'Date', inputType: 'date' },
      { name: 'location', label: 'Location', inputType: 'text', placeholder: 'Annapolis, MD' },
      { name: 'vision', label: 'A short note — what\u2019s the feeling you\u2019re after?', inputType: 'textarea', placeholder: 'Outdoor ceremony, candid moments, want it to feel like a film not a slideshow\u2026' },
    ],
  },
  {
    id: 'budget',
    heading: 'What\u2019s the <em>investment?</em>',
    type: 'radio',
    name: 'budget',
    options: ['$1\u2013$3k', '$3\u2013$5k', '$5\u2013$8k', '$8k+'],
  },
  {
    id: 'contact',
    heading: 'Let\u2019s <em>connect.</em>',
    type: 'fields',
    fields: [
      { name: 'name', label: 'Full name', inputType: 'text', placeholder: '' },
      { name: 'email', label: 'Email address', inputType: 'email', placeholder: '' },
      { name: 'phone', label: 'Phone (optional)', inputType: 'tel', placeholder: '' },
    ],
  },
];

export function initInquiry() {
  const section = document.getElementById('cta');
  if (!section) return;

  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  /* KNOCH-041: mobile takes the same path as prefers-reduced-motion - skip
     the scroll-tied reveal and the GSAP step transitions. */
  const isMobile       = window.matchMedia('(max-width: 800px)').matches;

  // ── Build form DOM ──────────────────────────────────────────────────────

  // Wrapper for two-column layout (form left, sidebar right)
  const wrapper = document.createElement('div');
  wrapper.className = 'inquiry-wrapper';

  const form = document.createElement('form');
  form.className = 'inquiry';
  form.setAttribute('novalidate', '');
  form.setAttribute('aria-label', 'Qualified inquiry form');

  // Section title + assurance text (above progress)
  const intro = document.createElement('div');
  intro.className = 'inquiry-intro';
  intro.innerHTML = `
    <h2 class="inquiry-title headline-hover">Tell me about your <em>day.</em></h2>
    <p class="inquiry-assurance">Every inquiry gets a personal reply within 24 hours — usually faster. No bots, no auto-responders.</p>
  `;
  form.appendChild(intro);

  // Bind char-hover effect to the title (runs after DOM insertion)
  bindCharHover(intro.querySelector('.headline-hover'));

  // Progress bar (film counter aesthetic)
  const progress = document.createElement('div');
  progress.className = 'inquiry-progress';
  progress.innerHTML = `
    <span class="inquiry-step-label">Step 1 of 4</span>
    <div class="inquiry-progress-bar" role="progressbar" aria-valuenow="25" aria-valuemin="0" aria-valuemax="100">
      <div class="inquiry-progress-fill" style="width: 25%"></div>
    </div>
    <span class="inquiry-counter" aria-live="polite" aria-atomic="true">01 / 04</span>
  `;
  form.appendChild(progress);

  // Steps container
  const stepsContainer = document.createElement('div');
  stepsContainer.className = 'inquiry-steps';

  STEPS.forEach((step, i) => {
    const panel = _buildStepPanel(step, i);
    stepsContainer.appendChild(panel);
  });

  form.appendChild(stepsContainer);

  // Navigation buttons
  const nav = document.createElement('div');
  nav.className = 'inquiry-nav';
  nav.innerHTML = `
    <button type="button" class="inquiry-btn inquiry-btn--back" disabled aria-label="Go to previous step">\u2190 Back</button>
    <button type="button" class="inquiry-btn inquiry-btn--primary inquiry-btn--next" aria-label="Go to next step">Continue \u2192</button>
  `;
  form.appendChild(nav);

  wrapper.appendChild(form);

  // ── Right sidebar ───────────────────────────────────────────────────────
  const sidebar = document.createElement('aside');
  sidebar.className = 'inquiry-sidebar';
  sidebar.setAttribute('aria-label', 'Contact alternatives and process info');
  sidebar.innerHTML = `
    <div class="inquiry-sidebar-block">
      <span class="inquiry-sidebar-tag">— Or skip the form</span>
      <h3 class="inquiry-sidebar-heading">Book a 15-min call</h3>
      <p class="inquiry-sidebar-desc">Sometimes a real conversation tells us more than a form ever could.</p>
      <a href="https://calendly.com/knochmedia" target="_blank" rel="noopener" class="inquiry-sidebar-link">Pick a time on my calendar \u2192</a>
    </div>

    <div class="inquiry-sidebar-block inquiry-sidebar-steps">
      <span class="inquiry-sidebar-tag">What happens next</span>
      <ol class="inquiry-next-steps">
        <li><span class="inquiry-next-num">01</span><span>I reply within 24 hrs with availability and a sample gallery for your event type.</span></li>
        <li><span class="inquiry-next-num">02</span><span>If we\u2019re a fit, we hop on a 15-min call to talk vision and logistics.</span></li>
        <li><span class="inquiry-next-num">03</span><span>A custom proposal lands in your inbox within 48 hrs of the call.</span></li>
      </ol>
    </div>

    <div class="inquiry-sidebar-block inquiry-sidebar-contact">
      <p>Direct line \u00b7 <strong>240.714.6933</strong></p>
      <p>Email \u00b7 <strong>enoch@knochmedia.com</strong></p>
    </div>
  `;
  wrapper.appendChild(sidebar);

  section.appendChild(wrapper);

  // ── State management ────────────────────────────────────────────────────

  let current = 0;
  const panels = form.querySelectorAll('.inquiry-step');
  const counter = form.querySelector('.inquiry-counter');
  const stepLabel = form.querySelector('.inquiry-step-label');
  const fill = form.querySelector('.inquiry-progress-fill');
  const progressBar = form.querySelector('.inquiry-progress-bar');
  const backBtn = form.querySelector('.inquiry-btn--back');
  const nextBtn = form.querySelector('.inquiry-btn--next');
  const formData = {};

  // Activate first step
  panels[0].classList.add('active');

  // ── Step navigation ─────────────────────────────────────────────────────

  function goToStep(idx) {
    if (idx < 0 || idx >= STEPS.length) return;

    const prev = panels[current];
    const next = panels[idx];

    if (!prefersReduced && !isMobile) {
      // Aperture iris close on current step
      gsap.to(prev, {
        clipPath: 'circle(0% at 50% 50%)',
        opacity: 0,
        duration: 0.5,
        ease: 'power2.in',
        onComplete: () => {
          prev.classList.remove('active');
          prev.style.position = 'absolute';

          // Aperture iris open on next step
          next.style.position = 'relative';
          next.classList.add('active');
          gsap.fromTo(next,
            { clipPath: 'circle(0% at 50% 50%)', opacity: 0 },
            { clipPath: 'circle(75% at 50% 50%)', opacity: 1, duration: 0.6, ease: 'power2.out' }
          );
        },
      });
    } else {
      /* KNOCH-041: mobile + reduced-motion path - instant swap, no
         clipPath dance. Reset any inline styles GSAP might have left
         behind from a previous transition (clipPath, opacity, position)
         so the panel renders cleanly. */
      prev.classList.remove('active');
      prev.style.cssText = '';
      next.classList.add('active');
      next.style.cssText = '';
    }

    current = idx;

    // Update progress indicators
    const stepNum = String(idx + 1).padStart(2, '0');
    counter.textContent = `${stepNum} / 04`;
    stepLabel.textContent = `Step ${idx + 1} of 4`;
    const percent = ((idx + 1) / STEPS.length) * 100;
    fill.style.width = `${percent}%`;
    progressBar.setAttribute('aria-valuenow', percent);

    // Button states
    backBtn.disabled = idx === 0;
    nextBtn.textContent = idx === STEPS.length - 1 ? 'Submit' : 'Continue \u2192';
    nextBtn.setAttribute('aria-label', idx === STEPS.length - 1 ? 'Submit inquiry' : 'Go to next step');
  }

  backBtn.addEventListener('click', () => goToStep(current - 1));

  nextBtn.addEventListener('click', () => {
    // Collect current step data
    _collectStepData(panels[current], STEPS[current], formData);

    if (current === STEPS.length - 1) {
      _handleSubmit(form, formData, prefersReduced);
    } else {
      goToStep(current + 1);
    }
  });

  // ── Scroll-triggered reveal ─────────────────────────────────────────────

  if (!prefersReduced && !isMobile) {
    gsap.from(wrapper, {
      opacity: 0,
      y: 40,
      duration: 1.2,
      ease: 'expo.out',
      scrollTrigger: {
        trigger: section,
        start: 'top 70%',
        toggleActions: 'play none none reverse',
      },
    });
  }
}

// ── Private helpers ─────────────────────────────────────────────────────────

function _buildStepPanel(step, index) {
  const panel = document.createElement('div');
  panel.className = 'inquiry-step';
  panel.dataset.step = index;
  panel.setAttribute('role', 'group');
  panel.setAttribute('aria-label', `Step ${index + 1} of 4`);

  const heading = document.createElement('h3');
  heading.className = 'inquiry-heading headline-hover';
  heading.innerHTML = step.heading;
  panel.appendChild(heading);
  bindCharHover(heading);

  if (step.type === 'radio') {
    const options = document.createElement('div');
    options.className = 'inquiry-options';
    options.setAttribute('role', 'radiogroup');
    options.setAttribute('aria-label', heading.textContent);

    step.options.forEach(opt => {
      const label = document.createElement('label');
      label.className = 'inquiry-option';
      label.innerHTML = `<input type="radio" name="${step.name}" value="${opt}"><span>${opt}</span>`;
      options.appendChild(label);
    });

    panel.appendChild(options);
  } else if (step.type === 'fields') {
    // Group date + location side-by-side in a row
    const inlineFields = step.fields.filter(f => f.name === 'date' || f.name === 'location');
    const otherFields = step.fields.filter(f => f.name !== 'date' && f.name !== 'location');

    if (inlineFields.length === 2) {
      const row = document.createElement('div');
      row.className = 'inquiry-field-row';
      inlineFields.forEach(f => {
        row.appendChild(_buildFieldElement(f));
      });
      panel.appendChild(row);
    } else {
      inlineFields.forEach(f => panel.appendChild(_buildFieldElement(f)));
    }

    otherFields.forEach(f => panel.appendChild(_buildFieldElement(f)));
  }

  return panel;
}

function _buildFieldElement(f) {
  const field = document.createElement('div');
  field.className = 'inquiry-field';

  const label = document.createElement('label');
  label.className = 'inquiry-field-label';
  label.textContent = f.label;

  if (f.inputType === 'textarea') {
    const id = `inquiry-${f.name}`;
    label.setAttribute('for', id);
    field.appendChild(label);

    const ta = document.createElement('textarea');
    ta.className = 'inquiry-textarea';
    ta.name = f.name;
    ta.id = id;
    if (f.placeholder) ta.placeholder = f.placeholder;
    field.appendChild(ta);
  } else {
    const id = `inquiry-${f.name}`;
    label.setAttribute('for', id);
    field.appendChild(label);

    const input = document.createElement('input');
    input.className = 'inquiry-input';
    input.type = f.inputType;
    input.name = f.name;
    input.id = id;
    if (f.placeholder) input.placeholder = f.placeholder;
    field.appendChild(input);
  }

  return field;
}

function _collectStepData(panel, stepConfig, data) {
  if (stepConfig.type === 'radio') {
    const checked = panel.querySelector('input[type="radio"]:checked');
    if (checked) data[stepConfig.name] = checked.value;
  } else if (stepConfig.type === 'fields') {
    panel.querySelectorAll('input, textarea').forEach(el => {
      if (el.value.trim()) data[el.name] = el.value.trim();
    });
  }
}

function _handleSubmit(form, data, prefersReduced) {
  console.log('[KNOCH-030] Inquiry submitted:', data);

  // TODO: POST to backend (Netlify Functions, Formspree, or Sanity webhook)
  // For now, show a branded confirmation with aperture reveal.

  const stepsContainer = form.querySelector('.inquiry-steps');
  const nav = form.querySelector('.inquiry-nav');

  const confirmation = document.createElement('div');
  confirmation.className = 'inquiry-step active inquiry-confirm';
  confirmation.style.position = 'relative';
  confirmation.style.clipPath = 'circle(75% at 50% 50%)';
  confirmation.style.opacity = '1';
  confirmation.style.pointerEvents = 'auto';
  confirmation.innerHTML = `
    <h3 class="inquiry-heading">Thank you. We\u2019ll be in <em>touch.</em></h3>
    <p>Expect a response within 24\u201348 hours.</p>
  `;

  if (!prefersReduced && !isMobile) {
    gsap.to(stepsContainer, {
      clipPath: 'circle(0% at 50% 50%)',
      opacity: 0,
      duration: 0.5,
      ease: 'power2.in',
      onComplete: () => {
        stepsContainer.innerHTML = '';
        stepsContainer.appendChild(confirmation);
        gsap.fromTo(stepsContainer,
          { clipPath: 'circle(0% at 50% 50%)', opacity: 0 },
          { clipPath: 'circle(75% at 50% 50%)', opacity: 1, duration: 0.7, ease: 'power2.out' }
        );
      },
    });
  } else {
    /* KNOCH-041: mobile + reduced-motion - instant swap, no iris.
       Clear inline styles in case a prior transition left them set. */
    stepsContainer.style.cssText = '';
    stepsContainer.innerHTML = '';
    stepsContainer.appendChild(confirmation);
  }

  // Hide nav buttons
  if (nav) nav.style.display = 'none';

  // Update progress to full
  const fill = form.querySelector('.inquiry-progress-fill');
  const counter = form.querySelector('.inquiry-counter');
  if (fill) fill.style.width = '100%';
  if (counter) counter.textContent = '\u2713';
}
