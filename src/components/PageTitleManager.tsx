import { useEffect, useState } from 'react';
import { useLocation, useParams } from 'react-router';
import { SEO } from './SEO';

const seoMap: Record<string, { title: string, description: string, keywords: string }> = {
  '/': {
    title: "TRYAM | AI Powered Custom Apparel & Merch",
    description: "Design and order personalized merch with TRYAM's AI-powered custom clothing editor. Create unique T-shirts, hoodies, and more with artificial intelligence.",
    keywords: "AI apparel design, AI custom t-shirts, personalized merch online, AI powered custom clothing, design your own merch, AI fashion designer, TRYAM"
  },
  '/store': {
    title: "Catalog | AI Designed Custom Apparel | TRYAM",
    description: "Browse our catalog of premium t-shirts, hoodies, and tote bags ready for your unique AI-generated designs.",
    keywords: "AI custom apparel catalog, personalized merch store, print on demand India, custom t-shirts, AI merch designer"
  },
  '/design': {
    title: "AI Design Studio | Create Your Own Merch | TRYAM",
    description: "Use our advanced AI Design Studio to generate unique art and customize your apparel instantly.",
    keywords: "AI design studio, create custom merch, generate AI art for t-shirts, AI fashion customization"
  },
  '/templates': {
    title: "Templates | Trending AI Designs | TRYAM",
    description: "Explore trending AI-generated templates for your next custom merch creation.",
    keywords: "AI t-shirt templates, trending custom apparel designs, AI fashion inspiration"
  },
  '/about': {
    title: "About Us | Our Story | TRYAM",
    description: "Learn about TRYAM, the leading platform for AI-powered personalized custom apparel and merchandise.",
    keywords: "about TRYAM, AI personalized merch company, custom apparel startup"
  }
};

const defaultSEO = {
  title: "TRYAM | AI Powered Custom Apparel",
  description: "Personalize your wardrobe with cutting-edge AI design tools and premium quality printing.",
  keywords: "custom apparel, AI fashion, personalized merch, TRYAM"
};

export default function PageTitleManager() {
  const { pathname } = useLocation();
  const params = useParams();
  const [seoData, setSeoData] = useState(defaultSEO);

  useEffect(() => {
    let data = seoMap[pathname];

    // Handle dynamic product pages
    if (pathname.startsWith('/product/') && params.productId) {
      data = {
        title: `Design Custom ${params.productId.replace(/-/g, ' ')} with AI | TRYAM`,
        description: `Personalize this ${params.productId.replace(/-/g, ' ')} using our AI-powered design studio. High-quality print and fast delivery.`,
        keywords: `custom ${params.productId.replace(/-/g, ' ')}, AI design ${params.productId.replace(/-/g, ' ')}, personalized apparel, custom merch`
      };
    }
    // Handle admin routes
    else if (pathname.startsWith('/admin')) {
      data = { ...defaultSEO, title: `Admin Panel | Management` };
    }
    // Handle specific legal pages
    else if (pathname.startsWith('/legal/')) {
      const type = pathname.split('/').pop() || '';
      data = { ...defaultSEO, title: `${type.charAt(0).toUpperCase() + type.slice(1)} | Legal` };
    }
    // Handle design-specific subroutes
    else if (pathname.startsWith('/design')) {
      data = seoMap['/design'];
    }

    if (!data) {
      // Try to match partial dashboard routes
      const matchedKey = Object.keys(seoMap).find(key => pathname.startsWith(key) && key !== '/');
      data = matchedKey ? seoMap[matchedKey] : defaultSEO;
    }

    setSeoData(data);
  }, [pathname, params]);

  return <SEO title={seoData.title} description={seoData.description} keywords={seoData.keywords} />;
}
