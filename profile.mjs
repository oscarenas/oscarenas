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

export const stats = [
  { value: '14+', lines: ['years shipping web', 'products for global brands'] },
  { value: '90', lines: ['product squads adopted', 'my component libraries'] },
  { value: '12', lines: ['engineers mentored on TS,', 'a11y & Core Web Vitals'] },
  { value: '251h', lines: ['certified learning in 2025', 'across 13 credentials'] },
];

export const stack = [
  {
    label: 'Frontend',
    color: '#3b63ff',
    items: ['Next.js', 'React', 'TypeScript', 'Astro', 'Vue', 'Angular', 'Tailwind CSS', 'React Native'],
  },
  {
    label: 'Backend & data',
    color: '#22c55e',
    items: ['Node.js', 'Express', 'Fastify', 'GraphQL', 'WebSockets', 'PostgreSQL', 'MongoDB', 'Supabase'],
  },
  {
    label: 'AI / LLM',
    color: '#a855f7',
    items: [
      'OpenAI API',
      'Anthropic API',
      'Claude',
      'Prompt engineering',
      'Structured outputs',
      'LLM product flows',
      'MCP / WebMCP',
      'AI‑assisted coding',
    ],
  },
  {
    label: 'Cloud & delivery',
    color: '#f59e0b',
    items: ['AWS', 'Google Cloud', 'Azure', 'Firebase', 'Vercel', 'Docker', 'GitHub Actions', 'CI/CD'],
  },
  {
    label: 'Quality & craft',
    color: '#f43f5e',
    items: [
      'Jest',
      'Testing Library',
      'Cypress',
      'Playwright',
      'WCAG 2.2',
      'Core Web Vitals',
      'Design systems',
      'Micro‑frontends',
      'PWA',
      'OWASP Top 10',
    ],
  },
  {
    label: 'Design & hardware',
    color: '#06b6d4',
    items: ['Figma', 'Design tokens', 'UI/UX foundations', 'C / C++', 'Embedded / IoT', 'MQTT'],
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
