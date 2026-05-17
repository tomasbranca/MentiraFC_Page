import { z } from "zod";

import type {
  DashboardNewsInput,
  DashboardNewsItem,
} from "../../src/types/dashboard";
import { mutateSanity, querySanity } from "./sanity";

const DEFAULT_NEWS_IMAGE_ASSET_ID =
  "image-1edafb056eb32eef08e521cabc7b50470d48f74b-809x809-webp";

const dashboardNewsInputSchema = z.object({
  title: z.string().trim().min(1),
  description: z.string().trim().min(1),
  date: z.string().datetime(),
  slug: z
    .string()
    .trim()
    .min(1)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
});

const dashboardNewsItemSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  date: z.string(),
  slug: z.string(),
  imageUrl: z.string().nullable().optional(),
  content: z.array(z.unknown()).optional(),
});

const dashboardNewsProjection = `{
  "id": _id,
  title,
  description,
  date,
  "slug": slug.current,
  "imageUrl": image.asset->url,
  content[]{
    ...,
    "imageUrl": asset->url,
    "fileUrl": file.asset->url,
    "mimeType": file.asset->mimeType,
    "originalFilename": file.asset->originalFilename
  }
}`;

const defaultContent = (title: string) => [
  {
    _key: "intro",
    _type: "block",
    style: "normal",
    markDefs: [],
    children: [
      {
        _key: "intro-text",
        _type: "span",
        marks: [],
        text: `Texto de ejemplo para "${title}". Reemplazá este contenido desde el editor avanzado cuando esté disponible.`,
      },
    ],
  },
];

export const parseDashboardNewsInput = (
  input: unknown
): DashboardNewsInput | null => {
  const parsed = dashboardNewsInputSchema.safeParse(input);
  return parsed.success ? parsed.data : null;
};

const adaptDashboardNewsItem = (input: unknown): DashboardNewsItem => {
  return dashboardNewsItemSchema.parse(input) as DashboardNewsItem;
};

export const listDashboardNews = async (): Promise<DashboardNewsItem[]> => {
  const result = await querySanity<unknown[]>(
    `*[_type == "news"] | order(date desc) ${dashboardNewsProjection}`
  );

  return result.map(adaptDashboardNewsItem);
};

export const getDashboardNewsById = async (
  id: string
): Promise<DashboardNewsItem | null> => {
  const result = await querySanity<unknown | null>(
    `*[_type == "news" && _id == $id][0] ${dashboardNewsProjection}`,
    { id }
  );

  return result ? adaptDashboardNewsItem(result) : null;
};

export const createDashboardNews = async (
  input: DashboardNewsInput
): Promise<DashboardNewsItem> => {
  const created = await mutateSanity<unknown>([
    {
      create: {
        _type: "news",
        title: input.title,
        description: input.description,
        date: input.date,
        slug: {
          _type: "slug",
          current: input.slug,
        },
        image: {
          _type: "image",
          asset: {
            _type: "reference",
            _ref: DEFAULT_NEWS_IMAGE_ASSET_ID,
          },
        },
        content: defaultContent(input.title),
      },
    },
  ]);

  if (!created || typeof created !== "object" || !("_id" in created)) {
    throw new Error("Sanity did not return the created news item.");
  }

  const news = await getDashboardNewsById(String(created._id));

  if (!news) {
    throw new Error("Created news item could not be reloaded.");
  }

  return news;
};

export const updateDashboardNews = async (
  id: string,
  input: DashboardNewsInput
): Promise<DashboardNewsItem> => {
  await mutateSanity<unknown>([
    {
      patch: {
        id,
        set: {
          title: input.title,
          description: input.description,
          date: input.date,
          slug: {
            _type: "slug",
            current: input.slug,
          },
        },
      },
    },
  ]);

  const news = await getDashboardNewsById(id);

  if (!news) {
    throw new Error("Updated news item could not be reloaded.");
  }

  return news;
};

export const deleteDashboardNews = async (id: string): Promise<void> => {
  await mutateSanity<unknown>([
    {
      delete: {
        id,
      },
    },
  ]);
};
