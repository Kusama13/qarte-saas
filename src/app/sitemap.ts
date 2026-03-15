import { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://getqarte.com';

  return [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 1,
      alternates: {
        languages: {
          fr: baseUrl,
          en: `${baseUrl}/en`,
        },
      },
    },
    {
      url: `${baseUrl}/pricing`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.9,
      alternates: {
        languages: {
          fr: `${baseUrl}/pricing`,
          en: `${baseUrl}/en/pricing`,
        },
      },
    },
    {
      url: `${baseUrl}/blog`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/contact`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.7,
      alternates: {
        languages: {
          fr: `${baseUrl}/contact`,
          en: `${baseUrl}/en/contact`,
        },
      },
    },
    {
      url: `${baseUrl}/pros`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.8,
      alternates: {
        languages: {
          fr: `${baseUrl}/pros`,
          en: `${baseUrl}/en/pros`,
        },
      },
    },
    {
      url: `${baseUrl}/auth/merchant/signup`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.9,
      alternates: {
        languages: {
          fr: `${baseUrl}/auth/merchant/signup`,
          en: `${baseUrl}/en/auth/merchant/signup`,
        },
      },
    },
    {
      url: `${baseUrl}/blog/fideliser-clientes-salon-coiffure`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/blog/programme-fidelite-onglerie-guide`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/blog/augmenter-recurrence-client-institut-beaute`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/boutique`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.7,
      alternates: {
        languages: {
          fr: `${baseUrl}/boutique`,
          en: `${baseUrl}/en/boutique`,
        },
      },
    },
    {
      url: `${baseUrl}/p/demo-onglerie`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.6,
      alternates: {
        languages: {
          fr: `${baseUrl}/p/demo-onglerie`,
          en: `${baseUrl}/en/p/demo-onglerie`,
        },
      },
    },
    {
      url: `${baseUrl}/p/demo-coiffure`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.6,
      alternates: {
        languages: {
          fr: `${baseUrl}/p/demo-coiffure`,
          en: `${baseUrl}/en/p/demo-coiffure`,
        },
      },
    },
    {
      url: `${baseUrl}/p/demo-tatouage`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.6,
      alternates: {
        languages: {
          fr: `${baseUrl}/p/demo-tatouage`,
          en: `${baseUrl}/en/p/demo-tatouage`,
        },
      },
    },
  ];
}
