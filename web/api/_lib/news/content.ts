import type { PortableTextBlock } from "@portabletext/types";

import type { DashboardNewsMutationInput } from "../../../src/types/dashboard";
import type {
  NewsContentBlock,
  NewsImageContentBlock,
  NewsVideoContentBlock,
} from "../../../src/types/models";
import { uploadSanityImageAsset } from "../sanity.js";
import { validateDashboardNewsImageFile } from "./validation.js";

const getPortableTextBlock = (
  block: NewsContentBlock
): PortableTextBlock | null =>
  block._type === "block" && "children" in block
    ? (block as PortableTextBlock)
    : null;

const isImageContentBlock = (
  block: NewsContentBlock
): block is NewsImageContentBlock => block._type === "image";

const isVideoContentBlock = (
  block: NewsContentBlock
): block is NewsVideoContentBlock =>
  block._type === "video" && "url" in block;

const hasLegacyVideoFile = (block: NewsVideoContentBlock): boolean =>
  Boolean(
    block.fileUrl ||
      ("file" in block && block.file && typeof block.file === "object")
  );

const validateVideoUrl = (url?: string | null): boolean => {
  if (!url?.trim()) {
    return false;
  }

  try {
    const parsed = new URL(url);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
};

const validatePortableTextLinkHref = (href?: string | null): boolean => {
  if (!href?.trim()) {
    return false;
  }

  if (href.startsWith("#")) {
    return true;
  }

  if (href.startsWith("/") && !href.startsWith("//")) {
    return true;
  }

  try {
    const parsed = new URL(href);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
};

const hasMeaningfulContent = (content: NewsContentBlock[]): boolean =>
  content.some((block) => {
    const textBlock = getPortableTextBlock(block);

    if (textBlock) {
      return (textBlock.children ?? []).some(
        (child) => child._type === "span" && child.text.trim().length > 0
      );
    }

    if (isVideoContentBlock(block)) {
      return Boolean(block.url?.trim() || block.fileUrl?.trim());
    }

    return true;
  });

const getContentImageAssetId = (
  block: NewsContentBlock
): string | null => {
  if (!isImageContentBlock(block)) {
    return null;
  }

  if (block.imageAssetId) {
    return block.imageAssetId;
  }

  if (
    block.asset &&
    typeof block.asset === "object" &&
    "_ref" in block.asset &&
    typeof block.asset._ref === "string"
  ) {
    return block.asset._ref;
  }

  return null;
};

export const collectContentImageAssetIds = (
  content: NewsContentBlock[] = []
): Set<string> =>
  new Set(
    content
      .map(getContentImageAssetId)
      .filter((assetId): assetId is string => Boolean(assetId))
  );

export const validateDashboardNewsContent = (
  input: DashboardNewsMutationInput
): string | null => {
  if (!hasMeaningfulContent(input.content)) {
    return "Agregá al menos un bloque de contenido antes de guardar.";
  }

  for (const block of input.content) {
    const textBlock = getPortableTextBlock(block);

    if (textBlock) {
      const hasInvalidLink = (textBlock.markDefs ?? []).some(
        (markDef) =>
          markDef._type === "link" &&
          !validatePortableTextLinkHref(
            typeof markDef.href === "string" ? markDef.href : null
          )
      );

      if (hasInvalidLink) {
        return "Cada enlace del contenido necesita una URL segura.";
      }
    }

    if (isImageContentBlock(block)) {
      const imageBlock = block as NewsImageContentBlock & { uploadKey?: string };
      const alt = imageBlock.alt?.trim();

      if (!alt) {
        return "Cada imagen del contenido necesita texto alternativo.";
      }

      if (imageBlock.uploadKey) {
        const imageFile = input.contentImageFiles?.[imageBlock.uploadKey];

        if (!imageFile) {
          return "Falta subir una imagen del contenido.";
        }

        const imageError = validateDashboardNewsImageFile(imageFile);

        if (imageError) {
          return imageError;
        }

        continue;
      }

      if (!getContentImageAssetId(imageBlock)) {
        return "Cada imagen del contenido necesita un archivo.";
      }
    }

    if (isVideoContentBlock(block)) {
      const videoBlock = block;

      if (!hasLegacyVideoFile(videoBlock) && !validateVideoUrl(videoBlock.url)) {
        return "Cada video del contenido necesita una URL válida.";
      }
    }
  }

  return null;
};

const normalizeContentImageBlock = async (
  block: NewsImageContentBlock & {
    uploadKey?: string;
  },
  contentImageFiles: Record<string, File>
): Promise<{ block: NewsImageContentBlock; uploadedAssetId: string | null }> => {
  const alt = block.alt?.trim();

  if (!alt) {
    throw new Error("Every content image requires alt text.");
  }

  if (block.uploadKey) {
    const imageFile = contentImageFiles[block.uploadKey];

    if (!imageFile) {
      throw new Error("A content image upload is missing.");
    }

    const imageError = validateDashboardNewsImageFile(imageFile);

    if (imageError) {
      throw new Error(imageError);
    }

    const uploadedAsset = await uploadSanityImageAsset(imageFile);

    return {
      block: {
        _key: block._key,
        _type: "image",
        asset: {
          _type: "reference",
          _ref: uploadedAsset._id,
        },
        alt,
        caption: block.caption?.trim() || undefined,
      },
      uploadedAssetId: uploadedAsset._id,
    };
  }

  const assetId = getContentImageAssetId(block);

  if (!assetId) {
    throw new Error("Every content image requires an asset.");
  }

  return {
    block: {
      _key: block._key,
      _type: "image",
      asset: {
        _type: "reference",
        _ref: assetId,
      },
      alt,
      caption: block.caption?.trim() || undefined,
    },
    uploadedAssetId: null,
  };
};

export const normalizeNewsContent = async (
  input: DashboardNewsMutationInput
): Promise<{ content: NewsContentBlock[]; uploadedAssetIds: string[] }> => {
  if (!hasMeaningfulContent(input.content)) {
    throw new Error("News content cannot be empty.");
  }

  const uploadedAssetIds: string[] = [];
  const normalizedContent: NewsContentBlock[] = [];

  for (const block of input.content) {
    if (isImageContentBlock(block)) {
      const normalized = await normalizeContentImageBlock(
        block as NewsImageContentBlock & { uploadKey?: string },
        input.contentImageFiles ?? {}
      );
      normalizedContent.push(normalized.block);

      if (normalized.uploadedAssetId) {
        uploadedAssetIds.push(normalized.uploadedAssetId);
      }

      continue;
    }

    if (isVideoContentBlock(block)) {
      const videoBlock = block;

      if (hasLegacyVideoFile(videoBlock)) {
        normalizedContent.push(block);
        continue;
      }

      if (!validateVideoUrl(videoBlock.url)) {
        throw new Error("Every content video requires a valid URL.");
      }

      normalizedContent.push({
        _key: videoBlock._key,
        _type: "video",
        url: videoBlock.url?.trim(),
        caption: videoBlock.caption?.trim() || undefined,
      });
      continue;
    }

    normalizedContent.push(block);
  }

  return {
    content: normalizedContent,
    uploadedAssetIds,
  };
};
