const form = document.querySelector('#discoveryForm');
const steps = [...document.querySelectorAll('.form-step')];
const navButtons = [...document.querySelectorAll('.step-link')];
const nextButton = document.querySelector('#nextButton');
const backButton = document.querySelector('#backButton');
const progressBar = document.querySelector('#progressBar');
const progressText = document.querySelector('#progressText');
const generatedBrief = document.querySelector('#generatedBrief');
const reviewGrid = document.querySelector('#reviewGrid');
const emailButton = document.querySelector('#emailBrief');
const submitNotice = document.querySelector('#submitNotice');
const draftStatus = document.querySelector('#draftStatus');
const toast = document.querySelector('#toast');
const STORAGE_KEY = 'brand-discovery-studio-draft-v1';
let currentStep = 0;
let saveTimer;
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const scaleLabels = {
  scale_minimal_expressive: ['Strongly minimal', 'Mostly minimal', 'Balanced', 'Mostly expressive', 'Strongly expressive'],
  scale_serious_playful: ['Strongly serious', 'Mostly serious', 'Balanced', 'Mostly playful', 'Strongly playful'],
  scale_traditional_modern: ['Strongly traditional', 'Mostly traditional', 'Balanced', 'Modern', 'Highly modern'],
  scale_professional_casual: ['Highly professional', 'Mostly professional', 'Balanced', 'Mostly casual', 'Highly casual'],
  scale_quiet_bold: ['Very quiet', 'Understated', 'Balanced', 'Bold', 'Very bold'],
  scale_technical_human: ['Highly technical', 'Mostly technical', 'Balanced', 'Human', 'Highly human'],
  scale_exclusive_approachable: ['Highly exclusive', 'Mostly exclusive', 'Balanced', 'Approachable', 'Highly approachable'],
  scale_warm_cool: ['Very warm', 'Mostly warm', 'Balanced', 'Mostly cool', 'Very cool']
};

function showToast(message) {
  toast.textContent = message;
  toast.classList.add('show');
  window.setTimeout(() => toast.classList.remove('show'), 2200);
}

function getValues() {
  const data = {};
  new FormData(form).forEach((value, key) => {
    if (key === 'website_confirm') return;
    if (Object.hasOwn(data, key)) data[key] = Array.isArray(data[key]) ? [...data[key], value] : [data[key], value];
    else data[key] = value;
  });
  Object.keys(scaleLabels).forEach((key) => {
    const el = form.elements[key];
    data[key] = scaleLabels[key][Number(el.value) - 1];
  });
  return data;
}

function value(data, key, fallback = 'Not specified') {
  const result = data[key];
  if (Array.isArray(result)) return result.length ? result.join(', ') : fallback;
  return result && String(result).trim() ? String(result).trim() : fallback;
}

function saveDraft() {
  const draft = {};
  [...form.elements].forEach((el) => {
    if (!el.name || el.name === 'website_confirm') return;
    if (el.type === 'checkbox' || el.type === 'radio') {
      if (!draft[el.name]) draft[el.name] = [];
      if (el.checked) draft[el.name].push(el.value);
    } else draft[el.name] = el.value;
  });
  localStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
  draftStatus.textContent = 'Draft saved locally';
}

function restoreDraft() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return;
  try {
    const draft = JSON.parse(raw);
    [...form.elements].forEach((el) => {
      if (!el.name || !(el.name in draft)) return;
      if (el.type === 'checkbox' || el.type === 'radio') el.checked = draft[el.name].includes(el.value);
      else el.value = draft[el.name];
    });
    updateRanges();
    draftStatus.textContent = 'Previous draft restored';
  } catch (_) {
    localStorage.removeItem(STORAGE_KEY);
  }
}

function updateRanges() {
  document.querySelectorAll('.spectrum input[type="range"]').forEach((input) => {
    const labels = scaleLabels[input.name];
    input.closest('.spectrum').querySelector('output').textContent = labels[Number(input.value) - 1];
  });
}

function validateCurrentStep() {
  const required = [...steps[currentStep].querySelectorAll('[required]')];
  const invalid = required.find((field) => !field.checkValidity());
  if (invalid) {
    invalid.reportValidity();
    invalid.focus();
    return false;
  }
  return true;
}

function goToStep(index, validate = false, shouldScroll = true) {
  if (validate && !validateCurrentStep()) return;
  currentStep = Math.max(0, Math.min(index, steps.length - 1));
  steps.forEach((step, i) => step.classList.toggle('active', i === currentStep));
  navButtons.forEach((button, i) => {
    button.classList.toggle('active', i === currentStep);
    button.classList.toggle('complete', i < currentStep);
  });
  progressBar.style.width = `${((currentStep + 1) / steps.length) * 100}%`;
  progressText.textContent = navButtons[currentStep].textContent.trim();
  backButton.style.visibility = currentStep === 0 ? 'hidden' : 'visible';
  nextButton.style.display = currentStep === steps.length - 1 ? 'none' : 'flex';
  if (currentStep === steps.length - 1) renderOutput();
  if (shouldScroll) {
    const formTop = document.querySelector('.app-shell').getBoundingClientRect().top + window.scrollY;
    window.scrollTo({ top: formTop, behavior: prefersReducedMotion ? 'auto' : 'smooth' });
  }
  if (window.gsap && !prefersReducedMotion) {
    window.gsap.fromTo(steps[currentStep], { opacity: 0, y: 18 }, { opacity: 1, y: 0, duration: .55, ease: 'power3.out' });
  }
  saveDraft();
}

function enterWorkshop() {
  document.querySelector('#workshop').scrollIntoView({ behavior: prefersReducedMotion ? 'auto' : 'smooth', block: 'start' });
}

function initPresentation() {
  document.querySelectorAll('[data-enter-workshop]').forEach((button) => button.addEventListener('click', enterWorkshop));

  const panels = [...document.querySelectorAll('.discovery-panel')];
  const activatePanel = (panel) => {
    panels.forEach((item) => item.classList.toggle('active', item === panel));
  };
  panels.forEach((panel) => {
    panel.addEventListener('click', () => activatePanel(panel));
    panel.addEventListener('focus', () => activatePanel(panel));
  });

  if (!window.gsap || prefersReducedMotion) {
    document.querySelectorAll('.manifesto-word').forEach((word) => { word.style.color = 'white'; });
    return;
  }

  window.gsap.registerPlugin(window.ScrollTrigger);
  window.gsap.timeline({ defaults: { ease: 'power3.out' } })
    .from('.capsule-nav', { y: -30, opacity: 0, duration: .75 })
    .from('.hero-kicker', { y: 18, opacity: 0, duration: .55 }, '-=.3')
    .from('.hero h1', { y: 45, opacity: 0, duration: 1 }, '-=.35')
    .from('.hero-footer', { y: 22, opacity: 0, duration: .65 }, '-=.55')
    .from('.hero-image', { y: 60, opacity: 0, scale: .96, duration: 1.15 }, '-=1');

  window.gsap.to('.hero-image img', {
    scale: 1,
    yPercent: 7,
    ease: 'none',
    scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true }
  });

  window.gsap.to('.orbit-one', {
    rotate: 85,
    yPercent: 30,
    ease: 'none',
    scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true }
  });

  window.gsap.to('.manifesto-word', {
    color: '#ffffff',
    stagger: .18,
    ease: 'none',
    scrollTrigger: { trigger: '.manifesto h2', start: 'top 78%', end: 'bottom 42%', scrub: .7 }
  });

  document.querySelectorAll('.process-card').forEach((card, index) => {
    window.gsap.fromTo(card, { scale: .94, y: 50 }, {
      scale: 1,
      y: 0,
      ease: 'none',
      scrollTrigger: { trigger: card, start: 'top 92%', end: 'top 55%', scrub: true }
    });
    if (index < 2) {
      window.gsap.to(card, {
        scale: .96 - index * .01,
        ease: 'none',
        scrollTrigger: { trigger: card, start: 'top 18%', end: 'bottom top', scrub: true }
      });
    }
  });

  document.querySelectorAll('.magnetic').forEach((button) => {
    button.addEventListener('pointermove', (event) => {
      const bounds = button.getBoundingClientRect();
      window.gsap.to(button, { x: (event.clientX - bounds.left - bounds.width / 2) * .13, y: (event.clientY - bounds.top - bounds.height / 2) * .13, duration: .3, ease: 'power2.out' });
    });
    button.addEventListener('pointerleave', () => window.gsap.to(button, { x: 0, y: 0, duration: .45, ease: 'elastic.out(1,.35)' }));
  });
}

function buildBrief() {
  const d = getValues();
  const references = [1, 2, 3]
    .map((n) => value(d, `reference_${n}_url`, ''))
    .map((url, i) => url ? `- ${url} — ${value(d, `reference_${i + 1}_reason`, 'No reason provided')}` : '')
    .filter(Boolean)
    .join('\n') || '- No visual references supplied';

  return `# Website Discovery Brief — ${value(d, 'client_name')}

## Instructions for Codex

Use this discovery brief as the source of truth for the website. First inspect the existing repository, framework, routes, components, and assets. Then create or update a DESIGN.md before changing interface code. Preserve working functionality. Do not invent client claims, testimonials, statistics, credentials, or brand history. Clearly label any assumptions and keep them easy to revise.

Build a responsive, accessible, production-quality website that reflects the client’s actual positioning rather than a generic template. Translate qualitative choices into a coherent token system for color, typography, spacing, radii, borders, shadows, imagery, and motion. Reuse suitable existing components and remove inconsistent styling only when it is safe to do so.

## 1. Project foundation

- Client: ${value(d, 'client_name')}
- Project: ${value(d, 'project_name')}
- Primary contact: ${value(d, 'contact_name')} (${value(d, 'contact_email')})
- Existing website: ${value(d, 'existing_website')}
- Business offer: ${value(d, 'business_offer')}
- Primary project goal: ${value(d, 'project_goal')}
- Primary audience: ${value(d, 'primary_audience')}
- Most important visitor action: ${value(d, 'primary_action')}

## 2. Brand positioning

- Brand stage: ${value(d, 'brand_stage')}
- Meaningful differentiator: ${value(d, 'differentiator')}
- Only-statement: ${value(d, 'only_statement')}
- Brand words: ${value(d, 'brand_words')}
- Desired emotional response: ${value(d, 'desired_feeling')}
- The brand must never feel: ${value(d, 'avoid_personality')}

## 3. Personality and voice

- Minimal ↔ expressive: ${value(d, 'scale_minimal_expressive')}
- Serious ↔ playful: ${value(d, 'scale_serious_playful')}
- Traditional ↔ modern: ${value(d, 'scale_traditional_modern')}
- Professional ↔ casual: ${value(d, 'scale_professional_casual')}
- Quiet ↔ bold: ${value(d, 'scale_quiet_bold')}
- Technical ↔ human: ${value(d, 'scale_technical_human')}
- Exclusive ↔ approachable: ${value(d, 'scale_exclusive_approachable')}
- Warm ↔ cool: ${value(d, 'scale_warm_cool')}
- Written voice: ${value(d, 'voice')}

## 4. Visual references

${references}

- Reference to avoid: ${value(d, 'avoid_reference_url')}
- Reason to avoid it: ${value(d, 'avoid_reference_reason')}
- Existing assets and non-negotiables: ${value(d, 'existing_assets')}

Use references for directional qualities only. Do not duplicate another brand’s protected identity, logo, proprietary illustrations, or exact page composition.

## 5. Visual system direction

- Existing brand colors: ${value(d, 'existing_colors')}
- Colors to avoid: ${value(d, 'avoid_colors')}
- Appearance: ${value(d, 'appearance')}
- Color energy: ${value(d, 'color_energy')}
- Existing fonts: ${value(d, 'existing_fonts')}
- Typography direction: ${value(d, 'typography_direction')}
- Icon direction: ${value(d, 'icon_style')}
- Imagery approach: ${value(d, 'imagery')}
- Image subjects and art direction: ${value(d, 'image_direction')}

## 6. Interface and experience

- Spacing and density: ${value(d, 'spacing')}
- Corner treatment: ${value(d, 'corner_style')}
- Visual depth: ${value(d, 'visual_depth')}
- Motion: ${value(d, 'motion_level')}
- Primary device strategy: ${value(d, 'primary_device')}
- Accessibility target: ${value(d, 'accessibility')}
- Required pages or product areas: ${value(d, 'required_pages')}
- Expected interface elements: ${value(d, 'components')}
- Technical, legal, platform, or accessibility requirements: ${value(d, 'requirements')}
- Client definition of success: ${value(d, 'success_definition')}

## 7. Required DESIGN.md output

Create a DESIGN.md in the project root containing:

1. Brand summary and intended emotional response
2. Audience, user goals, and business goals
3. Three to five practical design principles
4. Exact semantic color tokens with HEX or OKLCH values and accessible pairings
5. Font families, fallbacks, type scale, weights, line heights, and usage
6. Spacing, sizing, grid, container, and breakpoint rules
7. Radius, border, shadow, and surface rules
8. Iconography, photography, illustration, and graphic direction
9. Component rules for navigation, buttons, forms, cards, modals, tables, and feedback
10. Hover, focus, active, disabled, loading, empty, success, warning, and error states
11. Motion durations, easing, choreography, and reduced-motion behavior
12. Content voice and microcopy guidance
13. Accessibility requirements
14. Explicit anti-patterns and visual styles to avoid
15. Open decisions that still require client approval

## 8. Implementation expectations

- Begin with a brief repository audit and state the implementation approach.
- Build the primary conversion journey before secondary pages.
- Use real supplied copy and assets where available; clearly mark necessary placeholders.
- Ensure keyboard navigation, visible focus states, semantic HTML, sufficient contrast, and reduced-motion support.
- Test responsive layouts at mobile, tablet, laptop, and wide desktop widths.
- Check empty, error, loading, hover, and disabled states where applicable.
- Verify the finished implementation against DESIGN.md before handing it off.
`;
}

function renderOutput() {
  const d = getValues();
  const cards = [
    ['Client', value(d, 'client_name')],
    ['Direction', value(d, 'brand_words')],
    ['Primary goal', value(d, 'project_goal')],
    ['Audience', value(d, 'primary_audience')],
    ['Visual tone', `${value(d, 'color_energy')} · ${value(d, 'typography_direction')}`],
    ['Experience', `${value(d, 'spacing')} · ${value(d, 'motion_level')}`]
  ];
  reviewGrid.innerHTML = cards.map(([label, text]) => `<article class="review-item"><span>${escapeHtml(label)}</span><p>${escapeHtml(text)}</p></article>`).join('');
  generatedBrief.value = buildBrief();
}

function escapeHtml(text) {
  return String(text).replace(/[&<>'"]/g, (char) => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', "'":'&#39;', '"':'&quot;' }[char]));
}

async function copyBrief() {
  try {
    await navigator.clipboard.writeText(generatedBrief.value || buildBrief());
    showToast('Brief copied to clipboard');
  } catch (_) {
    generatedBrief.select();
    document.execCommand('copy');
    showToast('Brief copied to clipboard');
  }
}

function downloadBrief() {
  const name = value(getValues(), 'client_name', 'client').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  const blob = new Blob([generatedBrief.value || buildBrief()], { type: 'text/markdown;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${name || 'client'}-website-brief.md`;
  link.click();
  URL.revokeObjectURL(url);
  showToast('Markdown brief downloaded');
}

async function submitBrief(event) {
  event.preventDefault();
  if (form.elements.website_confirm.value) return;
  for (let i = 0; i < steps.length - 1; i++) {
    currentStep = i;
    if (!validateCurrentStep()) {
      goToStep(i);
      return;
    }
  }
  currentStep = steps.length - 1;
  renderOutput();
  const d = getValues();
  emailButton.disabled = true;
  emailButton.querySelector('span').textContent = 'Sending…';
  submitNotice.className = 'notice show info';
  submitNotice.textContent = 'Sending the completed discovery brief…';
  try {
    const response = await fetch('https://formsubmit.co/ajax/josiewiddiweb@gmail.com', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({
        _subject: `New brand discovery — ${value(d, 'client_name')}`,
        _template: 'table',
        _captcha: 'false',
        name: value(d, 'contact_name'),
        email: value(d, 'contact_email'),
        client: value(d, 'client_name'),
        project: value(d, 'project_name'),
        brand_words: value(d, 'brand_words'),
        project_goal: value(d, 'project_goal'),
        generated_codex_brief: generatedBrief.value
      })
    });
    const result = await response.json();
    if (!response.ok || result.success === 'false' || result.success === false) throw new Error(result.message || 'Email service rejected the submission.');
    const activation = /activat|confirm/i.test(result.message || '');
    submitNotice.className = `notice show ${activation ? 'info' : 'success'}`;
    submitNotice.textContent = activation
      ? 'The form is ready. Check josiewiddiweb@gmail.com and click the FormSubmit activation link once; this submission will be delivered after confirmation.'
      : 'Complete. The discovery brief has been emailed to josiewiddiweb@gmail.com.';
    localStorage.removeItem(STORAGE_KEY);
    showToast(activation ? 'Activation email sent' : 'Brief emailed successfully');
  } catch (error) {
    submitNotice.className = 'notice show error';
    submitNotice.textContent = `The brief was generated, but email delivery failed: ${error.message} Download the Markdown file so no work is lost.`;
  } finally {
    emailButton.disabled = false;
    emailButton.querySelector('span').textContent = 'Email completed brief';
  }
}

form.addEventListener('input', (event) => {
  if (event.target.matches('input[type="range"]')) updateRanges();
  draftStatus.textContent = 'Saving draft…';
  clearTimeout(saveTimer);
  saveTimer = setTimeout(saveDraft, 500);
});

document.querySelectorAll('.chip-grid[data-limit]').forEach((group) => {
  group.addEventListener('change', (event) => {
    const limit = Number(group.dataset.limit);
    const checked = [...group.querySelectorAll('input:checked')];
    if (checked.length > limit) {
      event.target.checked = false;
      showToast(`Choose up to ${limit}`);
    }
  });
});

nextButton.addEventListener('click', () => goToStep(currentStep + 1, true));
backButton.addEventListener('click', () => goToStep(currentStep - 1));
navButtons.forEach((button) => button.addEventListener('click', () => {
  const target = Number(button.dataset.step);
  if (target <= currentStep || validateCurrentStep()) goToStep(target);
}));
document.querySelector('#copyBrief').addEventListener('click', copyBrief);
document.querySelector('#downloadBrief').addEventListener('click', downloadBrief);
document.querySelector('#clearDraft').addEventListener('click', () => {
  if (!window.confirm('Clear every answer and start a new discovery session?')) return;
  localStorage.removeItem(STORAGE_KEY);
  form.reset();
  updateRanges();
  goToStep(0);
  showToast('New session started');
});
form.addEventListener('submit', submitBrief);

initPresentation();
restoreDraft();
updateRanges();
goToStep(0, false, false);
