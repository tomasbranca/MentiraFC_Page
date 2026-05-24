const DashboardContentLoader = () => (
  <div
    className="flex min-h-[24rem] items-center justify-center px-4 py-10 sm:min-h-[32rem]"
    role="status"
    aria-live="polite"
  >
    <div className="flex items-center gap-3 text-sm font-semibold text-violet-100/75">
      <span
        className="size-5 animate-spin rounded-full border-2 border-violet-200/25 border-t-violet-100"
        aria-hidden="true"
      />
      <span>Cargando contenido</span>
    </div>
  </div>
);

export default DashboardContentLoader;
