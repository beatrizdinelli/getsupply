import posthog from 'posthog-js';

const key = import.meta.env.VITE_POSTHOG_KEY as string | undefined;
const host =
  (import.meta.env.VITE_POSTHOG_HOST as string | undefined) ||
  'https://us.i.posthog.com';

export function initPostHog() {
  if (!key) {
    if (import.meta.env.DEV) {
      console.info('PostHog desativado: VITE_POSTHOG_KEY não definida.');
    }
    return;
  }

  posthog.init(key, {
    api_host: host,
    defaults: '2025-05-24',
    capture_pageview: 'history_change',
    person_profiles: 'identified_only',
    loaded: (ph) => {
      ph.register({ app: 'getsupply' });
      if (import.meta.env.DEV) ph.debug();
    },
  });
}
