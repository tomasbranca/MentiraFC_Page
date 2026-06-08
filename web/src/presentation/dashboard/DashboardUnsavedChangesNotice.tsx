const DashboardUnsavedChangesNotice = ({ labels }: { labels: string[] }) => {
  if (labels.length === 0) {
    return null;
  }

  return (
    <div className="rounded-sm border border-amber-200/20 bg-amber-200/6 p-3 text-sm text-amber-50">
      <p className="font-semibold">Cambios sin guardar</p>
      <p className="mt-1 text-xs leading-relaxed text-amber-50/75">
        Campos editados: {labels.join(", ")}.
      </p>
    </div>
  );
};

export default DashboardUnsavedChangesNotice;
