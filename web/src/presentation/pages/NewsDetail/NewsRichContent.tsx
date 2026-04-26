import { PortableText } from "@portabletext/react";

const portableTextComponents = {
  block: {
    normal: ({ children }) => (
      <p className="mb-4 text-base md:text-lg leading-relaxed text-neutral-200 whitespace-pre-line">
        {children}
      </p>
    ),
    h1: ({ children }) => (
      <h1 className="mb-4 text-3xl md:text-4xl font-extrabold normal-case text-white leading-tight">
        {children}
      </h1>
    ),
    h2: ({ children }) => (
      <h2 className="mb-4 text-2xl md:text-3xl font-bold normal-case text-white leading-tight">
        {children}
      </h2>
    ),
    h3: ({ children }) => (
      <h3 className="mb-3 text-xl md:text-2xl font-bold normal-case text-white leading-tight">
        {children}
      </h3>
    ),
    h4: ({ children }) => (
      <h4 className="mb-3 text-lg md:text-xl font-semibold normal-case text-white leading-tight">
        {children}
      </h4>
    ),
    blockquote: ({ children }) => (
      <blockquote className="my-4 border-l-4 border-violet-500 pl-4 italic text-neutral-300 whitespace-pre-line">
        {children}
      </blockquote>
    ),
  },
  marks: {
    strong: ({ children }) => (
      <strong className="font-bold text-white">{children}</strong>
    ),
    em: ({ children }) => <em className="italic">{children}</em>,
    underline: ({ children }) => <span className="underline">{children}</span>,
  },
  list: {
    bullet: ({ children }) => (
      <ul className="my-4 ml-6 list-disc space-y-2 text-base md:text-lg text-neutral-200">
        {children}
      </ul>
    ),
    number: ({ children }) => (
      <ol className="my-4 ml-6 list-decimal space-y-2 text-base md:text-lg text-neutral-200">
        {children}
      </ol>
    ),
  },
  listItem: {
    bullet: ({ children }) => (
      <li className="list-item whitespace-pre-line">{children}</li>
    ),
    number: ({ children }) => (
      <li className="list-item whitespace-pre-line">{children}</li>
    ),
  },
  hardBreak: () => <br />,
};

type NewsRichContentProps = {
  content: unknown;
};

const NewsRichContent = ({ content }: NewsRichContentProps) => {
  return <PortableText value={content} components={portableTextComponents} />;
};

export default NewsRichContent;
