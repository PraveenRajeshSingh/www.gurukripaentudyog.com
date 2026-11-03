import { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://www.gurukripaentudyog.com';
  const routes = [
    '',
    '/products',
    '/about',
    '/services',
    '/contact',
    '/tracker',
    '/privacy',
    '/terms'
  ]; // /profile is intentionally excluded (private, noindex).

  return routes.map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: 'weekly',
    priority: route === '' ? 1.0 : 0.8
  }));
}
