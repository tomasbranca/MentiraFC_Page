import type { PortableTextBlock } from "@portabletext/types";

import type {
  NewsContentBlock,
  NewsImageContentBlock,
  NewsVideoContentBlock,
} from "../../../types/models";

const editableStyles = new Set(["normal", "h2", "h3", "blockquote"]);
const editableListItems = new Set(["bullet", "number"]);
const editableDecorators = new Set(["strong", "em", "underline"]);
const editableAnnotationTypes = new Set(["link"]);

type NewsImageContentDraftBlock = NewsImageContentBlock & {
  _key: string;
  uploadKey?: string;
};

type NewsVideoContentDraftBlock = NewsVideoContentBlock & {
  _key: string;
};

export type DashboardNewsRichTextEditorBlock = {
  id: string;
  kind: "richText";
  value: PortableTextBlock[];
};

export type DashboardNewsImageEditorBlock = {
  id: string;
  kind: "image";
  value: NewsImageContentDraftBlock;
  file?: File | null;
  previewUrl?: string | null;
};

export type DashboardNewsVideoEditorBlock = {
  id: string;
  kind: "video";
  value: NewsVideoContentDraftBlock;
};

export type DashboardNewsReadonlyEditorBlock = {
  id: string;
  kind: "readonly";
  value: NewsContentBlock;
};

export type DashboardNewsEditorBlock =
  | DashboardNewsRichTextEditorBlock
  | DashboardNewsImageEditorBlock
  | DashboardNewsVideoEditorBlock
  | DashboardNewsReadonlyEditorBlock;

const createEditorKey = (prefix: string): string =>
  `${prefix}-${crypto.randomUUID()}`;

export const createEmptyPortableTextBlock = (): PortableTextBlock => ({
  _key: createEditorKey("text"),
  _type: "block",
  style: "normal",
  markDefs: [],
  children: [
    {
      _key: createEditorKey("span"),
      _type: "span",
      marks: [],
      text: "",
    },
  ],
});

export const createRichTextEditorBlock = (
  value: PortableTextBlock[] = [createEmptyPortableTextBlock()]
): DashboardNewsRichTextEditorBlock => ({
  id: createEditorKey("editor-rich-text"),
  kind: "richText",
  value,
});

export const createImageEditorBlock = ({
  title,
  file,
  previewUrl,
}: {
  title: string;
  file: File;
  previewUrl: string;
}): DashboardNewsImageEditorBlock => ({
  id: createEditorKey("editor-image"),
  kind: "image",
  file,
  previewUrl,
  value: {
    _key: createEditorKey("image"),
    _type: "image",
    alt: title.trim(),
    caption: "",
    uploadKey: createEditorKey("upload-image"),
  },
});

export const createVideoEditorBlock = (): DashboardNewsVideoEditorBlock => ({
  id: createEditorKey("editor-video"),
  kind: "video",
  value: {
    _key: createEditorKey("video"),
    _type: "video",
    url: "",
    caption: "",
  },
});

const getPortableTextBlock = (
  block: NewsContentBlock
): PortableTextBlock | null =>
  block._type === "block" && "children" in block
    ? (block as PortableTextBlock)
    : null;

const isEditableTextBlock = (block: PortableTextBlock): boolean => {
  if (!editableStyles.has(block.style ?? "normal")) {
    return false;
  }

  if (block.listItem && !editableListItems.has(block.listItem)) {
    return false;
  }

  const markDefs = block.markDefs ?? [];
  const markDefKeys = new Set(markDefs.map((markDef) => markDef._key));

  if (
    markDefs.some(
      (markDef) =>
        !editableAnnotationTypes.has(String(markDef._type)) ||
        typeof markDef.href !== "string"
    )
  ) {
    return false;
  }

  return (block.children ?? []).every((child) => {
    if (child._type !== "span") {
      return false;
    }

    return (child.marks ?? []).every(
      (mark: string) => editableDecorators.has(mark) || markDefKeys.has(mark)
    );
  });
};

const isEditableImageBlock = (
  block: NewsContentBlock
): block is NewsImageContentDraftBlock =>
  block._type === "image" &&
  "alt" in block &&
  typeof block._key === "string" &&
  typeof block.alt === "string";

const isEditableVideoBlock = (
  block: NewsContentBlock
): block is NewsVideoContentDraftBlock =>
  block._type === "video" &&
  "url" in block &&
  typeof block._key === "string" &&
  typeof block.url === "string" &&
  !block.fileUrl;

export const toDashboardNewsEditorBlocks = (
  content: NewsContentBlock[] = []
): DashboardNewsEditorBlock[] => {
  const editorBlocks: DashboardNewsEditorBlock[] = [];
  let richTextBuffer: PortableTextBlock[] = [];

  const flushRichTextBuffer = () => {
    if (richTextBuffer.length === 0) {
      return;
    }

    editorBlocks.push(createRichTextEditorBlock(richTextBuffer));
    richTextBuffer = [];
  };

  content.forEach((block) => {
    const textBlock = getPortableTextBlock(block);

    if (textBlock && isEditableTextBlock(textBlock)) {
      richTextBuffer.push(textBlock);
      return;
    }

    flushRichTextBuffer();

    if (isEditableImageBlock(block)) {
      editorBlocks.push({
        id: createEditorKey("editor-image"),
        kind: "image",
        value: block,
      });
      return;
    }

    if (isEditableVideoBlock(block)) {
      editorBlocks.push({
        id: createEditorKey("editor-video"),
        kind: "video",
        value: block,
      });
      return;
    }

    editorBlocks.push({
      id: createEditorKey("editor-readonly"),
      kind: "readonly",
      value: block,
    });
  });

  flushRichTextBuffer();
  return editorBlocks;
};

const serializeImageBlock = (
  block: DashboardNewsImageEditorBlock,
  { forPreview }: { forPreview: boolean }
): NewsImageContentDraftBlock => {
  const baseBlock: NewsImageContentDraftBlock = {
    _key: block.value._key,
    _type: "image",
    alt: block.value.alt?.trim(),
    caption: block.value.caption?.trim() || undefined,
  };

  if (block.file && block.value.uploadKey) {
    return {
      ...baseBlock,
      uploadKey: block.value.uploadKey,
      imageUrl: forPreview ? block.previewUrl ?? null : undefined,
    };
  }

  return {
    ...baseBlock,
    imageAssetId: block.value.imageAssetId ?? null,
    imageUrl: forPreview ? block.value.imageUrl ?? null : undefined,
    asset: block.value.imageAssetId
      ? {
          _type: "reference",
          _ref: block.value.imageAssetId,
        }
      : block.value.asset,
  };
};

export const serializeDashboardNewsEditorBlocks = (
  blocks: DashboardNewsEditorBlock[],
  options: { forPreview?: boolean } = {}
): NewsContentBlock[] => {
  const forPreview = options.forPreview ?? false;

  return blocks.flatMap((block) => {
    if (block.kind === "richText") {
      return block.value;
    }

    if (block.kind === "image") {
      return [serializeImageBlock(block, { forPreview })];
    }

    if (block.kind === "video") {
      return [
        {
          _key: block.value._key,
          _type: "video",
          url: block.value.url?.trim(),
          caption: block.value.caption?.trim() || undefined,
        },
      ];
    }

    return [block.value];
  });
};

const hasMeaningfulText = (block: PortableTextBlock): boolean =>
  (block.children ?? []).some(
    (child) => child._type === "span" && child.text.trim().length > 0
  );

export const hasDashboardNewsContent = (
  blocks: DashboardNewsEditorBlock[]
): boolean =>
  serializeDashboardNewsEditorBlocks(blocks).some((block) => {
    const textBlock = getPortableTextBlock(block);

    if (textBlock) {
      return hasMeaningfulText(textBlock);
    }

    if (isEditableImageBlock(block)) {
      return true;
    }

    if (isEditableVideoBlock(block)) {
      return Boolean(block.url?.trim());
    }

    return true;
  });

const isValidVideoUrl = (value?: string | null): boolean => {
  if (!value?.trim()) {
    return false;
  }

  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
};

export const validateDashboardNewsEditorBlocks = (
  blocks: DashboardNewsEditorBlock[]
): string | null => {
  if (!hasDashboardNewsContent(blocks)) {
    return "Agregá al menos un bloque de contenido antes de guardar.";
  }

  for (const block of blocks) {
    if (block.kind === "image") {
      if (!block.value.alt?.trim()) {
        return "Cada imagen del contenido necesita texto alternativo.";
      }

      if (!block.file && !block.value.imageAssetId && !block.value.asset) {
        return "Cada imagen del contenido necesita un archivo.";
      }
    }

    if (block.kind === "video" && !isValidVideoUrl(block.value.url)) {
      return "Cada video del contenido necesita una URL válida.";
    }
  }

  return null;
};

export const getDashboardNewsContentImageFiles = (
  blocks: DashboardNewsEditorBlock[]
): Record<string, File> =>
  blocks.reduce<Record<string, File>>((files, block) => {
    if (block.kind === "image" && block.file && block.value.uploadKey) {
      files[block.value.uploadKey] = block.file;
    }

    return files;
  }, {});
