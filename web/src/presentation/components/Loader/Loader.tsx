// @ts-nocheck
import {
  SITE_LOGO_ASSETS,
  SITE_LOGO_SIZES,
  SITE_LOGO_SRC_SET,
} from "../../constants/assets.constants";

import "./Loader.css";

const Loader = () => {
  return (
    <div className="fixed inset-0 z-9999 flex items-center justify-center bg-violet-950">
      <div className="flex flex-col items-center gap-6">
        {/* Logo */}
        <img
          src={SITE_LOGO_ASSETS.medium}
          srcSet={SITE_LOGO_SRC_SET}
          sizes={SITE_LOGO_SIZES}
          width={100}
          height={100}
          alt="Mentira FC"
        />

        {/* Spinner */}
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-slate-600 border-t-white" />
      </div>
    </div>
  );
};

export default Loader;
