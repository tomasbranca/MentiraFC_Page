import { useEffect } from "react";

import { applyHeadMetadata, type HeadMetadata } from "./head";

export const usePageHead = (metadata: HeadMetadata) => {
  useEffect(() => {
    applyHeadMetadata(metadata);
  }, [metadata]);
};
