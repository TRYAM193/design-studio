import React from 'react';
import { Helmet } from 'react-helmet-async';

interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string;
  type?: string;
  image?: string;
  url?: string;
}

export function SEO({ 
  title = "TRYAM | AI Powered Custom Apparel & Merch", 
  description = "Design and order personalized merch with TRYAM's AI-powered custom clothing editor. Create unique T-shirts, hoodies, and more with artificial intelligence.", 
  keywords = "AI apparel design, AI custom t-shirts, personalized merch online, AI powered custom clothing, design your own merch, AI fashion designer", 
  type = "website",
  image = "https://tryam193.in/assets/Logo_web_icon.png",
  url = "https://tryam193.in/"
}: SEOProps) {
  return (
    <Helmet>
      {/* Primary SEO */}
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />

      {/* Open Graph / Facebook */}
      <meta property="og:type" content={type} />
      <meta property="og:url" content={url} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image} />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:url" content={url} />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />
    </Helmet>
  );
}
