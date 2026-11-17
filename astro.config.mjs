import { defineConfig } from 'astro/config';

const site = process.env.SITE_URL || 'https://beautiful-meringue-d997c1.netlify.app';

export default defineConfig({
  site,
  output: 'static',
  trailingSlash: 'always',
  devToolbar: { enabled: false },
});
