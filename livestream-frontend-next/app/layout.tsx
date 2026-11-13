import type { Metadata, Viewport } from "next";
import Script from "next/script";
import "./globals.css";

export const viewport: Viewport = {
  themeColor: "#dc143c",
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  metadataBase: new URL("https://traigabaanhem.com"),
  title: "Trại Gà Ba Anh Em - Xổ Gà Trực Tiếp 18h30 Hàng Ngày | traigabaanhem.com",
  description:
    "Trại Gà Ba Anh Em - Kênh phát trực tiếp vần xổ gà đòn đỉnh cao lúc 18h30 hàng ngày tại Đắk Lắk. Kết nối đam mê chiến kê, giao lưu chia sẻ kỹ thuật toàn quốc.",
  keywords: [
    // 1. Tên thương hiệu chuẩn & có dấu
    "trại gà ba anh em",
    "trại gà ba anh",
    "trại gà 3 anh em",
    "trại gà 3 anh",
    "trại gà ba anhem",
    "trại gà 3 anhem",
    "trại gà anh em",
    "gà chọi ba anh em",
    "gà chọi 3 anh em",
    "gà chọi ba anh",
    "gà đòn ba anh em",
    "gà đòn 3 anh em",

    // 2. Tên thương hiệu không dấu
    "trai ga ba anh em",
    "trai ga ba anh",
    "trai ga 3 anh em",
    "trai ga 3 anh",
    "trai ga ba anhem",
    "trai ga 3 anhem",
    "trai ga anh em",
    "ga choi ba anh em",
    "ga choi 3 anh em",
    "ga choi ba anh",
    "ga don ba anh em",
    "ga don 3 anh em",

    // 3. Viết liền không dấu / Domain / Slugs
    "traigabaanhem",
    "traigabaanh",
    "traiga3anhem",
    "traiga3anh",
    "traigaanhem",
    "traigabaanhem.com",
    "www.traigabaanhem.com",
    "traiga ba anh em",
    "traiga 3 anh em",

    // 4. Hoạt động & Dịch vụ cốt lõi
    "xổ gà trực tiếp",
    "xo ga truc tiep",
    "trực tiếp xổ gà",
    "truc tiep xo ga",
    "vần xổ gà",
    "van xo ga",
    "vần gà trực tiếp",
    "van ga truc tiep",
    "xổ gà 18h30",
    "xo ga 18h30",
    "video xổ gà",
    "video xo ga",
    "giao lưu gà chọi",
    "giao luu ga choi",
    "đá gà đòn",
    "da ga don",

    // 5. Địa phương & Chủ trại
    "trại gà đắk lắk",
    "trai ga dak lak",
    "gà đòn đắk lắk",
    "ga don dak lak",
    "trại gà tây hòa đắk lắk",
    "trần văn thinh",
    "tran van thinh",
  ],
  authors: [{ name: "Trại Gà Ba Anh Em" }],
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "48x48" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/icon-192.png", sizes: "180x180" }],
  },
  manifest: "/site.webmanifest",
  openGraph: {
    title: "Trại Gà Ba Anh Em - Xổ Gà Trực Tiếp 18h30 Hàng Ngày",
    description:
      "Trại Gà Ba Anh Em - Nơi phát trực tiếp các trận vần xổ gà đòn đỉnh cao lúc 18h30 hàng ngày tại Đắk Lắk. Giao lưu kết nối đam mê chiến kê.",
    url: "https://traigabaanhem.com/",
    siteName: "Trại Gà Ba Anh Em",
    images: [
      {
        url: "https://res.cloudinary.com/duklfdbqf/image/upload/v1794206741/1793800833515_8768714213416063846_8768714213416063846_83c74c8a52840f6f317e330c1ec999f5-fotor-20261109134342_qlahyg.webp",
        width: 1200,
        height: 630,
        alt: "Trại Gà Ba Anh Em - Xổ Gà Trực Tiếp",
      },
    ],
    locale: "vi_VN",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Trại Gà Ba Anh Em - Xổ Gà Trực Tiếp 18h30 Hàng Ngày",
    description:
      "Trại Gà Ba Anh Em chuyên xổ gà trực tiếp 18h30 hàng ngày. Livestream vần xổ gà chọi chất lượng cao.",
    images: [
      "https://res.cloudinary.com/duklfdbqf/image/upload/v1794206741/1793800833515_8768714213416063846_8768714213416063846_83c74c8a52840f6f317e330c1ec999f5-fotor-20261109134342_qlahyg.webp",
    ],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  alternates: {
    canonical: "https://traigabaanhem.com/",
  },
  other: {
    "apple-mobile-web-app-capable": "yes",
    "apple-mobile-web-app-status-bar-style": "black-translucent",
    "apple-mobile-web-app-title": "Trại Gà Ba Anh Em",
  },
};

const jsonLdLocalBusiness = {
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  name: "Trại Gà Ba Anh Em",
  alternateName: [
    "Trai Ga Ba Anh",
    "Trại Gà Ba Anh",
    "Trai Ga Ba Anh Em",
    "Trại Gà 3 Anh",
    "Trai Ga 3 Anh",
    "Trại Gà 3 Anh Em",
    "trai ga 3 anh em",
    "trai ga anh em",
    "trại gà anh em",
    "trại gà ba anhem",
    "trai ga ba anhem",
    "traiga3anhem",
    "traigabaanhem",
    "Gà Chọi Ba Anh Em",
    "traigabaanhem.com",
  ],
  description:
    "Trại Gà Ba Anh Em - Kênh phát trực tiếp vần xổ gà đòn đỉnh cao lúc 18h30 hàng ngày tại Đắk Lắk. Kết nối đam mê chiến kê, giao lưu chia sẻ kỹ thuật toàn quốc.",
  image: [
    "https://res.cloudinary.com/duklfdbqf/image/upload/v1794206741/1793800833515_8768714213416063846_8768714213416063846_83c74c8a52840f6f317e330c1ec999f5-fotor-20261109134342_qlahyg.webp",
  ],
  url: "https://traigabaanhem.com/",
  logo: "https://res.cloudinary.com/duklfdbqf/image/upload/v1794206741/1793800833515_8768714213416063846_8768714213416063846_83c74c8a52840f6f317e330c1ec999f5-fotor-20261109134342_qlahyg.webp",
  priceRange: "$$",
  openingHours: "Mo-Su 18:30-20:30",
  hasMap: "https://maps.app.goo.gl/8vTyBLXugZdLrFSP8",
  sameAs: ["https://traigabaanhem.com/"],
};

const jsonLdVideo = {
  "@context": "https://schema.org",
  "@type": "VideoObject",
  name: "Trại Gà Ba Anh Em - Xổ Gà Trực Tiếp 18h30 Hàng Ngày",
  description:
    "Trại Gà Ba Anh Em - Xổ gà trực tiếp 18h30 hàng ngày. Livestream vần xổ gà chọi chất lượng cao.",
  thumbnailUrl:
    "https://res.cloudinary.com/duklfdbqf/image/upload/v1794207357/Gemini_Generated_Image_of30onof30onof30_pqgmxe.webp",
  uploadDate: "2026-11-09T18:30:00+07:00",
  contentUrl: "https://traigabaanhem.com/live",
  embedUrl: "https://traigabaanhem.com/",
  duration: "PT2H",
  liveBroadcastEvent: {
    "@type": "BroadcastEvent",
    isLiveBroadcast: true,
    startDate: "2026-11-09T18:30:00+07:00",
    endDate: "2026-11-09T20:30:00+07:00",
  },
  publisher: {
    "@type": "Organization",
    name: "Trại Gà Ba Anh Em",
    logo: {
      "@type": "ImageObject",
      url: "https://res.cloudinary.com/duklfdbqf/image/upload/v1794206741/1793800833515_8768714213416063846_8768714213416063846_83c74c8a52840f6f317e330c1ec999f5-fotor-20261109134342_qlahyg.webp",
    },
  },
};

const jsonLdWebSite = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "Trại Gà Ba Anh Em",
  alternateName: [
    "Trai Ga Ba Anh",
    "Trại Gà Ba Anh",
    "Trai Ga Ba Anh Em",
    "Trại Gà 3 Anh",
    "Trại Gà 3 Anh Em",
    "trai ga 3 anh em",
    "trai ga anh em",
    "trại gà ba anhem",
    "traigabaanhem.com",
  ],
  url: "https://traigabaanhem.com/",
};

const jsonLdOrganization = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "Trại Gà Ba Anh Em",
  alternateName: [
    "Trai Ga Ba Anh",
    "Trại Gà Ba Anh",
    "Trai Ga Ba Anh Em",
    "Trại Gà 3 Anh",
    "Trại Gà 3 Anh Em",
    "trai ga 3 anh em",
    "traiga3anhem",
    "traigabaanhem.com",
  ],
  url: "https://traigabaanhem.com/",
  logo: "https://res.cloudinary.com/duklfdbqf/image/upload/v1794206741/1793800833515_8768714213416063846_8768714213416063846_83c74c8a52840f6f317e330c1ec999f5-fotor-20261109134342_qlahyg.webp",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdLocalBusiness) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdVideo) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdWebSite) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdOrganization) }}
        />
      </head>
      <body>
        <Script
          id="fb-pixel"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              !function(f,b,e,v,n,t,s)
              {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
              n.callMethod.apply(n,arguments):n.queue.push(arguments)};
              if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
              n.queue=[];t=b.createElement(e);t.async=!0;
              t.src=v;s=b.getElementsByTagName(e)[0];
              s.parentNode.insertBefore(t,s)}(window,document,'script',
              'https://connect.facebook.net/en_US/fbevents.js');
              fbq('init', '1442792801387382');
              fbq('track', 'PageView');
            `,
          }}
        />
        <noscript>
          <img
            height="1"
            width="1"
            style={{ display: "none" }}
            src="https://www.facebook.com/tr?id=1442792801387382&ev=PageView&noscript=1"
            alt=""
          />
        </noscript>
        <main>{children}</main>
      </body>
    </html>
  );
}

