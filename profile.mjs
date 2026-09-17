// Single source of truth for the generated assets in ./assets.
// Edit here, then run `node scripts/build.mjs`.

export const profile = {
  name: 'Oscar Arenas',
  monogram: 'OA',
  eyebrow: 'Senior Software Engineer',
  focus: 'Next.js · Node · TypeScript · AI/LLM',
  tagline: ['14+ years shipping web products for global brands —', 'now building AI‑augmented experiences.'],
  // Line breaks for the stacked mobile hero (<= 600px viewports).
  taglineMobile: ['14+ years shipping web products for', 'global brands — now building', 'AI‑augmented experiences.'],
  availability: 'Available for new opportunities',
  location: 'Bogotá, Colombia',
  remote: 'Open to remote · LATAM / US / EU',
  remoteShort: 'Remote · LATAM / US / EU',
  site: 'resume-oscarenas.web.app',
};

// `linesShort` is used on the narrow (mobile) cards.
export const stats = [
  { value: '14+', lines: ['years shipping web', 'products for global brands'], linesShort: ['years shipping', 'web products'] },
  { value: '90', lines: ['product squads adopted', 'my component libraries'], linesShort: ['product squads on', 'my component libraries'] },
  { value: '12', lines: ['engineers mentored on TS,', 'a11y & Core Web Vitals'], linesShort: ['engineers mentored', 'on TS, a11y & CWV'] },
  { value: '251h', lines: ['certified learning in 2025', 'across 13 credentials'], linesShort: ['certified learning', 'in 2025 · 13 credentials'] },
];

// Core stack — the highlighted first row of the board, with hands-on years.
// Mirrors the "Core stack" block of the resume site.
export const core = [
  { name: 'React', meta: '10+ yrs' },
  { name: 'TypeScript', meta: '7+ yrs' },
  { name: 'Node.js', meta: '7+ yrs' },
  { name: 'Next.js', meta: '5+ yrs' },
  { name: 'Design systems', meta: '5+ yrs' },
  { name: 'Accessibility', meta: '5+ yrs' },
  { name: 'Web performance', meta: '2+ yrs' },
  { name: 'LLM integration', meta: 'since 2024' },
];

// Grouped like the skills section of the resume site. `legacy` groups render
// as muted, dashed chips: honest about the past without competing with the present.
export const stack = [
  {
    label: 'Frontend',
    color: '#3b63ff',
    items: ['React', 'Next.js', 'Astro', 'Vue', 'Angular', 'React Native', 'TypeScript', 'JavaScript (ES202x)', 'HTML5 & CSS3', 'Tailwind CSS', 'SCSS', 'CSS‑in‑JS'],
  },
  {
    label: 'State & data',
    color: '#0ea5e9',
    items: ['Redux', 'Zustand', 'Context API', 'MobX', 'Vuex', 'GraphQL (Apollo)', 'REST APIs'],
  },
  {
    label: 'Backend & data',
    color: '#22c55e',
    items: ['Node.js', 'Express', 'WebSockets', 'PostgreSQL', 'MySQL', 'MongoDB', 'Supabase'],
  },
  {
    label: 'AI & LLM',
    color: '#a855f7',
    items: [
      'OpenAI & Anthropic APIs',
      'Prompt engineering',
      'Structured outputs',
      'LLM product flows',
      'WebMCP / MCP',
      'AI‑assisted coding',
      'Midjourney',
      'DALL·E',
    ],
  },
  {
    label: 'Quality & craft',
    color: '#f43f5e',
    items: [
      'Jest',
      'React Testing Library',
      'Cypress',
      'Playwright',
      'ESLint / Prettier',
      'WCAG 2.2',
      'Core Web Vitals',
      'Micro‑frontends',
      'PWA & Service Workers',
      'OWASP Top 10',
    ],
  },
  {
    label: 'Platform & DevOps',
    color: '#f59e0b',
    items: ['Vercel', 'Firebase', 'AWS', 'Google Cloud', 'Azure', 'Docker', 'GitHub Actions', 'CI/CD', 'Linux'],
  },
  {
    label: 'Design & tooling',
    color: '#06b6d4',
    items: ['Figma', 'Design tokens', 'Storybook', 'Prototyping', 'Jira'],
  },
  {
    label: 'Earlier & adjacent',
    color: '#8f909c',
    legacy: true,
    items: ['jQuery', 'Polymer', 'PHP', 'C / C++', 'Embedded systems & IoT', 'MQTT'],
  },
];

// Buttons rendered as SVGs so they match the rest of the system in both themes.
// `variant`: primary | secondary
export const buttons = [
  { id: 'resume', label: 'View resume', icon: 'arrow', variant: 'primary' },
  { id: 'cv', label: 'Download CV', icon: 'download', variant: 'secondary' },
  { id: 'linkedin', label: 'LinkedIn', icon: 'linkedin', variant: 'secondary' },
  { id: 'email', label: 'Email me', icon: 'mail', variant: 'secondary' },
  { id: 'email-primary', label: 'Email me', icon: 'mail', variant: 'primary' },
];
