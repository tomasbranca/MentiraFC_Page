import { useEffect, useMemo, useRef, useState } from "react";
import {
  FiArrowDown,
  FiArrowUp,
  FiEdit2,
  FiEye,
  FiImage,
  FiMove,
  FiTrash2,
  FiType,
  FiUpload,
  FiVideo,
} from "react-icons/fi";

import type { NewsContentBlock } from "../../../types/models";
import { confirmDashboardAction } from "../../app/confirmDialog";
import NewsRichContent from "../NewsDetail/NewsRichContent";
import {
  createImageEditorBlock,
  createRichTextEditorBlock,
  createVideoEditorBlock,
  serializeDashboardNewsEditorBlocks,
  type DashboardNewsEditorBlock,
  type DashboardNewsImageEditorBlock,
  type DashboardNewsVideoEditorBlock,
} from "./dashboardNewsContent.utils";
import {
  readDashboardNewsImageDimensions,
  validateDashboardNewsImageDimensions,
  validateDashboardNewsImageFile,
} from "./dashboardNews.utils";
import DashboardNewsRichTextEditor from "./DashboardNewsRichTextEditor";

type DashboardNewsContentEditorProps = {
  title: string;
  blocks: DashboardNewsEditorBlock[];
  error?: string;
  onChange: (blocks: DashboardNewsEditorBlock[]) => void;
};

const moveItem = <T,>(items: T[], from: number, to: number): T[] => {
  const nextItems = [...items];
  const [item] = nextItems.splice(from, 1);
  nextItems.splice(to, 0, item);
  return nextItems;
};

const iconButtonClassName =
  "inline-flex h-10 w-10 items-center justify-center rounded-[3px] border border-white/10 text-violet-100 transition hover:border-violet-200/35 hover:bg-white/[0.045] focus:outline-none focus:ring-2 focus:ring-violet-500/40 disabled:cursor-not-allowed disabled:opacity-35";

const DashboardNewsContentEditor = ({
  title,
  blocks,
  error,
  onChange,
}: DashboardNewsContentEditorProps) => {
  const [showPreview, setShowPreview] = useState(false);
  const [draggedBlockId, setDraggedBlockId] = useState<string | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);
  const previewUrlsRef = useRef(new Set<string>());

  useEffect(
    () => () => {
      previewUrlsRef.current.forEach((previewUrl) => URL.revokeObjectURL(previewUrl));
    },
    []
  );

  const previewContent = useMemo(
    () => serializeDashboardNewsEditorBlocks(blocks, { forPreview: true }),
    [blocks]
  );

  const updateBlock = (
    id: string,
    updater: (block: DashboardNewsEditorBlock) => DashboardNewsEditorBlock
  ) => {
    onChange(blocks.map((block) => (block.id === id ? updater(block) : block)));
  };

  const removeBlock = async (id: string) => {
    const block = blocks.find((item) => item.id === id);

    if (!block) {
      return;
    }

    const confirmed = await confirmDashboardAction({
      title: "Borrar bloque",
      text: "El bloque se va a quitar de esta noticia. El cambio se confirma recién cuando guardás la noticia.",
      confirmText: "Borrar bloque",
      icon: "warning",
      variant: "danger",
    });

    if (!confirmed) {
      return;
    }

    if (block?.kind === "image" && block.previewUrl) {
      URL.revokeObjectURL(block.previewUrl);
      previewUrlsRef.current.delete(block.previewUrl);
    }

    onChange(blocks.filter((block) => block.id !== id));
  };

  const moveBlock = (id: string, direction: -1 | 1) => {
    const currentIndex = blocks.findIndex((block) => block.id === id);
    const nextIndex = currentIndex + direction;

    if (currentIndex < 0 || nextIndex < 0 || nextIndex >= blocks.length) {
      return;
    }

    onChange(moveItem(blocks, currentIndex, nextIndex));
  };

  const handleDrop = (targetId: string) => {
    if (!draggedBlockId || draggedBlockId === targetId) {
      return;
    }

    const fromIndex = blocks.findIndex((block) => block.id === draggedBlockId);
    const toIndex = blocks.findIndex((block) => block.id === targetId);

    if (fromIndex < 0 || toIndex < 0) {
      return;
    }

    onChange(moveItem(blocks, fromIndex, toIndex));
    setDraggedBlockId(null);
  };

  const addImageBlock = async (file: File | null) => {
    if (!file) {
      return;
    }

    const fileError = validateDashboardNewsImageFile(file);

    if (fileError) {
      setImageError(fileError);
      return;
    }

    try {
      const dimensions = await readDashboardNewsImageDimensions(file);
      const dimensionsError = validateDashboardNewsImageDimensions(dimensions);

      if (dimensionsError) {
        setImageError(dimensionsError);
        return;
      }

      const previewUrl = URL.createObjectURL(file);
      previewUrlsRef.current.add(previewUrl);
      onChange([
        ...blocks,
        createImageEditorBlock({
          title,
          file,
          previewUrl,
        }),
      ]);
      setImageError(null);
    } catch {
      setImageError("No pudimos leer la imagen seleccionada.");
    }
  };

  const replaceImageBlock = async (
    block: DashboardNewsImageEditorBlock,
    file: File | null
  ) => {
    if (!file) {
      return;
    }

    const fileError = validateDashboardNewsImageFile(file);

    if (fileError) {
      setImageError(fileError);
      return;
    }

    try {
      const dimensions = await readDashboardNewsImageDimensions(file);
      const dimensionsError = validateDashboardNewsImageDimensions(dimensions);

      if (dimensionsError) {
        setImageError(dimensionsError);
        return;
      }

      if (block.previewUrl) {
        URL.revokeObjectURL(block.previewUrl);
        previewUrlsRef.current.delete(block.previewUrl);
      }

      const previewUrl = URL.createObjectURL(file);
      previewUrlsRef.current.add(previewUrl);
      updateBlock(block.id, (currentBlock) =>
        currentBlock.kind === "image"
          ? {
              ...currentBlock,
              file,
              previewUrl,
              value: {
                ...currentBlock.value,
                uploadKey:
                  currentBlock.value.uploadKey ??
                  `upload-image-${crypto.randomUUID()}`,
              },
            }
          : currentBlock
      );
      setImageError(null);
    } catch {
      setImageError("No pudimos leer la imagen seleccionada.");
    }
  };

  const renderBlock = (block: DashboardNewsEditorBlock, index: number) => (
    <article
      key={block.id}
      onDragOver={(event) => event.preventDefault()}
      onDrop={() => handleDrop(block.id)}
      className="rounded-[4px] border border-white/10 bg-[#141418]"
    >
      <div className="grid gap-3 border-b border-white/10 px-3 py-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center sm:px-4">
        <div className="flex items-center gap-2">
          <button
            type="button"
            draggable
            onDragStart={() => setDraggedBlockId(block.id)}
            onDragEnd={() => setDraggedBlockId(null)}
            className={`${iconButtonClassName} cursor-grab active:cursor-grabbing`}
            aria-label="Arrastrar bloque"
            title="Arrastrar bloque"
          >
            <FiMove className="size-4" aria-hidden="true" />
          </button>
          <span className="text-xs font-semibold uppercase tracking-[0.16em] text-violet-100/55">
            {block.kind === "richText" && "Texto"}
            {block.kind === "image" && "Imagen"}
            {block.kind === "video" && "Video"}
            {block.kind === "readonly" && "Solo lectura"}
          </span>
        </div>

        <div className="grid grid-cols-3 gap-2 sm:flex sm:items-center">
          <button
            type="button"
            disabled={index === 0}
            onClick={() => moveBlock(block.id, -1)}
            className={`${iconButtonClassName} w-full sm:w-10`}
            aria-label="Subir bloque"
            title="Subir bloque"
          >
            <FiArrowUp className="size-4" aria-hidden="true" />
          </button>
          <button
            type="button"
            disabled={index === blocks.length - 1}
            onClick={() => moveBlock(block.id, 1)}
            className={`${iconButtonClassName} w-full sm:w-10`}
            aria-label="Bajar bloque"
            title="Bajar bloque"
          >
            <FiArrowDown className="size-4" aria-hidden="true" />
          </button>
          {block.kind !== "readonly" && (
            <button
              type="button"
              onClick={() => void removeBlock(block.id)}
              className={`${iconButtonClassName} w-full border-red-300/15 text-red-200 hover:border-red-200/35 hover:bg-red-400/10 sm:w-10`}
              aria-label="Borrar bloque"
              title="Borrar bloque"
            >
              <FiTrash2 className="size-4" aria-hidden="true" />
            </button>
          )}
        </div>
      </div>

      <div className="p-2 sm:p-4">
        {block.kind === "richText" && (
          <DashboardNewsRichTextEditor
            key={block.id}
            value={block.value}
            onChange={(value) =>
              updateBlock(block.id, (currentBlock) =>
                currentBlock.kind === "richText"
                  ? {
                      ...currentBlock,
                      value,
                    }
                  : currentBlock
              )
            }
          />
        )}

        {block.kind === "image" && (
          <ImageBlockEditor
            block={block}
            onReplace={(file) => void replaceImageBlock(block, file)}
            onChange={(nextValue) =>
              updateBlock(block.id, (currentBlock) =>
                currentBlock.kind === "image"
                  ? {
                      ...currentBlock,
                      value: nextValue,
                    }
                  : currentBlock
              )
            }
          />
        )}

        {block.kind === "video" && (
          <VideoBlockEditor
            block={block}
            onChange={(nextValue) =>
              updateBlock(block.id, (currentBlock) =>
                currentBlock.kind === "video"
                  ? {
                      ...currentBlock,
                      value: nextValue,
                    }
                  : currentBlock
              )
            }
          />
        )}

        {block.kind === "readonly" && (
          <div className="rounded-[4px] border border-amber-200/15 bg-amber-200/[0.06] p-4">
            <p className="mb-4 text-xs font-semibold uppercase tracking-[0.18em] text-amber-100/70">
              Este bloque se conserva pero todavía no se puede editar desde el dashboard.
            </p>
            <NewsRichContent content={[block.value]} />
          </div>
        )}
      </div>
    </article>
  );

  return (
    <section className="space-y-4">
      <div className="flex flex-col gap-3 border-t border-white/10 pt-4 sm:flex-row sm:items-center sm:justify-between sm:pt-5">
        <div>
          <h3 className="text-sm font-bold uppercase tracking-wide text-violet-100">
            Contenido
          </h3>
          <p className="mt-2 text-sm text-violet-100/70">
            Armá la nota con texto, imágenes y videos. Las imágenes se suben recién al guardar.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowPreview((current) => !current)}
          className={iconButtonClassName}
          aria-label={showPreview ? "Volver al editor" : "Ver preview"}
          title={showPreview ? "Volver al editor" : "Ver preview"}
        >
          {showPreview ? (
            <FiEdit2 className="size-4" aria-hidden="true" />
          ) : (
            <FiEye className="size-4" aria-hidden="true" />
          )}
        </button>
      </div>

      {showPreview ? (
        <div className="rounded-[4px] border border-white/10 bg-black/20 p-3 sm:p-6">
          {previewContent.length > 0 ? (
            <NewsRichContent content={previewContent as NewsContentBlock[]} />
          ) : (
            <p className="text-sm text-violet-100/60">
              Todavía no agregaste contenido para previsualizar.
            </p>
          )}
        </div>
      ) : (
        <>
          {blocks.length > 0 ? (
            <div className="space-y-4">{blocks.map(renderBlock)}</div>
          ) : (
            <div className="rounded-[4px] border border-dashed border-white/15 bg-black/15 p-4 text-center sm:p-6">
              <p className="text-sm font-medium text-violet-100">
                La noticia todavía no tiene contenido.
              </p>
              <p className="mt-2 text-sm text-violet-100/60">
                Agregá texto, una imagen o un video para empezar.
              </p>
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => onChange([...blocks, createRichTextEditorBlock()])}
              className={iconButtonClassName}
              aria-label="Agregar texto"
              title="Agregar texto"
            >
              <FiType className="size-4" aria-hidden="true" />
            </button>

            <label
              className={`${iconButtonClassName} cursor-pointer`}
              aria-label="Agregar imagen"
              title="Agregar imagen"
            >
              <FiImage className="size-4" aria-hidden="true" />
              <span className="sr-only">Agregar imagen</span>
              <input
                type="file"
                accept=".jpg,.jpeg,.png,.webp"
                className="sr-only"
                onChange={(event) => {
                  const file = event.target.files?.[0] ?? null;
                  event.target.value = "";
                  void addImageBlock(file);
                }}
              />
            </label>

            <button
              type="button"
              onClick={() => onChange([...blocks, createVideoEditorBlock()])}
              className={iconButtonClassName}
              aria-label="Agregar video"
              title="Agregar video"
            >
              <FiVideo className="size-4" aria-hidden="true" />
            </button>
          </div>
        </>
      )}

      {(error || imageError) && (
        <div className="text-sm text-red-300" role="alert">
          {error ?? imageError}
        </div>
      )}
    </section>
  );
};

const ImageBlockEditor = ({
  block,
  onReplace,
  onChange,
}: {
  block: DashboardNewsImageEditorBlock;
  onReplace: (file: File | null) => void;
  onChange: (value: DashboardNewsImageEditorBlock["value"]) => void;
}) => {
  const imageUrl = block.previewUrl ?? block.value.imageUrl ?? "";

  return (
    <div className="grid gap-3 sm:gap-4 lg:grid-cols-[minmax(0,18rem)_minmax(0,1fr)]">
      <div className="overflow-hidden rounded-[3px] border border-white/10 bg-black/20">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={block.value.alt || "Imagen del contenido"}
            className="aspect-video h-full w-full object-cover"
          />
        ) : (
          <div className="flex aspect-video items-center justify-center text-xs font-bold uppercase tracking-[0.18em] text-violet-100/45">
            Sin preview
          </div>
        )}
      </div>

      <div className="space-y-3">
        <label className="block">
          <span className="mb-2 block text-sm font-medium text-violet-100">
            Texto alternativo
          </span>
          <input
            value={block.value.alt ?? ""}
            onChange={(event) =>
              onChange({
                ...block.value,
                alt: event.target.value,
              })
            }
            className="min-h-11 w-full rounded-[3px] border border-white/10 bg-[#0f0f13] px-3 py-2.5 text-sm text-white outline-none transition focus:border-violet-300/80 focus:ring-2 focus:ring-violet-500/20 sm:px-3.5"
          />
        </label>

        <label className="block">
          <span className="mb-2 block text-sm font-medium text-violet-100">
            Epígrafe
          </span>
          <input
            value={block.value.caption ?? ""}
            onChange={(event) =>
              onChange({
                ...block.value,
                caption: event.target.value,
              })
            }
            className="min-h-11 w-full rounded-[3px] border border-white/10 bg-[#0f0f13] px-3 py-2.5 text-sm text-white outline-none transition focus:border-violet-300/80 focus:ring-2 focus:ring-violet-500/20 sm:px-3.5"
          />
        </label>

        <label
          className={`${iconButtonClassName} cursor-pointer`}
          aria-label="Reemplazar imagen"
          title="Reemplazar imagen"
        >
          <FiUpload className="size-4" aria-hidden="true" />
          <span className="sr-only">Reemplazar imagen</span>
          <input
            type="file"
            accept=".jpg,.jpeg,.png,.webp"
            className="sr-only"
            onChange={(event) => {
              const file = event.target.files?.[0] ?? null;
              event.target.value = "";
              onReplace(file);
            }}
          />
        </label>
      </div>
    </div>
  );
};

const VideoBlockEditor = ({
  block,
  onChange,
}: {
  block: DashboardNewsVideoEditorBlock;
  onChange: (value: DashboardNewsVideoEditorBlock["value"]) => void;
}) => (
  <div className="grid gap-3 sm:gap-4 lg:grid-cols-2">
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-violet-100">
        URL del video
      </span>
      <input
        type="url"
        value={block.value.url ?? ""}
        onChange={(event) =>
          onChange({
            ...block.value,
            url: event.target.value,
          })
        }
        placeholder="https://www.youtube.com/..."
        className="min-h-11 w-full rounded-[3px] border border-white/10 bg-[#0f0f13] px-3 py-2.5 text-sm text-white outline-none transition focus:border-violet-300/80 focus:ring-2 focus:ring-violet-500/20 sm:px-3.5"
      />
    </label>

    <label className="block">
      <span className="mb-2 block text-sm font-medium text-violet-100">
        Epígrafe
      </span>
      <input
        value={block.value.caption ?? ""}
        onChange={(event) =>
          onChange({
            ...block.value,
            caption: event.target.value,
          })
        }
        className="min-h-11 w-full rounded-[3px] border border-white/10 bg-[#0f0f13] px-3 py-2.5 text-sm text-white outline-none transition focus:border-violet-300/80 focus:ring-2 focus:ring-violet-500/20 sm:px-3.5"
      />
    </label>
  </div>
);

export default DashboardNewsContentEditor;
