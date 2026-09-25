import { renderToString } from 'react-dom/server';
import { Router } from 'wouter';
import Fornecedores, { fornecedoresMeta } from '@/pages/fornecedores';
import { siteMeta } from '@/lib/site-meta';

export { siteMeta };

export const pages = [
  {
    path: '/fornecedores',
    file: 'fornecedores.html',
    meta: fornecedoresMeta,
    html: () =>
      renderToString(
        <Router ssrPath="/fornecedores">
          <Fornecedores />
        </Router>,
      ),
  },
];
