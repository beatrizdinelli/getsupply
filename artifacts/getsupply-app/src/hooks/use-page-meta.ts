import { useEffect } from 'react';

type PageMeta = {
  title?: string;
  description?: string;
  robots?: string;
};

function setContent(selector: string, value: string) {
  const el = document.querySelector(selector);
  if (!el) return () => {};
  const previous = el.getAttribute('content');
  el.setAttribute('content', value);
  return () => {
    if (previous !== null) el.setAttribute('content', previous);
  };
}

export function usePageMeta({ title, description, robots }: PageMeta) {
  useEffect(() => {
    const restores: Array<() => void> = [];

    if (title) {
      const previous = document.title;
      document.title = title;
      restores.push(() => {
        document.title = previous;
      });
      restores.push(setContent('meta[property="og:title"]', title));
      restores.push(setContent('meta[name="twitter:title"]', title));
    }
    if (description) {
      restores.push(setContent('meta[name="description"]', description));
      restores.push(setContent('meta[property="og:description"]', description));
      restores.push(setContent('meta[name="twitter:description"]', description));
    }
    if (robots) restores.push(setContent('meta[name="robots"]', robots));

    return () => restores.forEach((restore) => restore());
  }, [title, description, robots]);
}
