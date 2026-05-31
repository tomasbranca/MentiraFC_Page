export const FOOTER_SOCIAL_PLATFORMS = [
  "instagram",
  "tiktok",
  "x",
  "youtube",
  "facebook",
  "web",
] as const;

export type FooterSocialPlatform = (typeof FOOTER_SOCIAL_PLATFORMS)[number];

export type FooterSocialLink = {
  id: string;
  label: string;
  platform: FooterSocialPlatform;
  url: string;
};

export type FooterLink = {
  id: string;
  label: string;
  url: string;
};

export type FooterSponsor = {
  id: string;
  name: string;
  url: string;
  logoUrl: string;
  logoAlt: string;
};

export type FooterSettings = {
  id: string;
  contactEmail: string;
  socials: FooterSocialLink[];
  links: FooterLink[];
  sponsors: FooterSponsor[];
  updatedAt?: string | null;
};

export const DEFAULT_FOOTER_SETTINGS: FooterSettings = {
  id: "footerSettings",
  contactEmail: "mentirafc@gmail.com",
  socials: [
    {
      id: "instagram",
      label: "Instagram",
      platform: "instagram",
      url: "https://instagram.com/mentira.fc",
    },
    {
      id: "tiktok",
      label: "TikTok",
      platform: "tiktok",
      url: "https://tiktok.com/@mentira.football",
    },
  ],
  links: [
    {
      id: "web-design",
      label: "@bicore.erp",
      url: "https://instagram.com/bicore.erp",
    },
  ],
  sponsors: [
    {
      id: "neokings",
      name: "NeoKings",
      url: "https://www.neokings.com.ar",
      logoUrl: "/sponsors/neokings-160.webp",
      logoAlt: "NeoKings",
    },
  ],
};
