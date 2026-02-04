import "./Loader.css";

const Loader = () => {
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-violet-950">
      <div className="flex flex-col items-center gap-6">
        {/* Logo */}
        <img
          src="/logo.webp"
          alt="Mentira FC"
          className="w-20 fade-in"
        />

        {/* Spinner */}
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-slate-600 border-t-white" />
      </div>
    </div>
  );
};

export default Loader;
