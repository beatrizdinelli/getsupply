import { useEffect } from 'react';
import { siteMeta } from '@/lib/site-meta';

type PageMeta = {
  title?: string;
  description?: string;
  robots?: string;
};

function setContent(selector: string, value: string) {
  document.querySelector(selector)?.setAttribute('content', value);
}

function applyTitle(title: string) {
  document.title = title;
  setContent('meta[property="og:title"]', title);
  setContent('meta[name="twitter:title"]', title);
}

function applyDescription(description: string) {
  setContent('meta[name="description"]', description);
  setContent('meta[property="og:description"]', description);
  setContent('meta[name="twitter:description"]', description);
}

export function usePageMeta({ title, description, robots }: PageMeta) {
  useEffect(() => {
    if (title) applyTitle(title);
    if (description) applyDescription(description);
    if (robots) setContent('meta[name="robots"]', robots);

    return () => {
      if (title) applyTitle(siteMeta.title);
      if (description) applyDescription(siteMeta.description);
      if (robots) setContent('meta[name="robots"]', siteMeta.robots);
    };
  }, [title, description, robots]);
}
