import { useEffect } from "react";
import { useLocation } from "react-router-dom";

import { applyHeadMetadata } from "./head";
import { getStaticPageHeadByPathname } from "./metadata";

const RouteHead = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    const metadata = getStaticPageHeadByPathname(pathname);

    if (metadata) {
      applyHeadMetadata(metadata);
    }
  }, [pathname]);

  return null;
};

export default RouteHead;
