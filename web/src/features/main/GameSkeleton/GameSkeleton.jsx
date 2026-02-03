const GameSkeleton = () => {
  return (
    <div className="bg-gradient-to-r from-neutral-900 via-neutral-800 to-neutral-900
      p-6 mb-4 flex items-center justify-center gap-8
      border-t-2 border-violet-700 animate-pulse"
    >
      {/* Local */}
      <div className="w-40 flex flex-col items-center gap-3">
        <div className="w-32 h-32 bg-neutral-700 rounded-full" />
        <div className="w-24 h-4 bg-neutral-700 rounded" />
      </div>

      {/* Centro */}
      <div className="flex flex-col items-center gap-4 px-6 w-2xl">
        <div className="w-40 h-6 bg-neutral-700 rounded" />
        <div className="w-56 h-4 bg-neutral-700 rounded" />
        <div className="w-32 h-10 bg-neutral-700 rounded mt-4" />
      </div>

      {/* Rival */}
      <div className="w-40 flex flex-col items-center gap-3">
        <div className="w-32 h-32 bg-neutral-700 rounded-full" />
        <div className="w-24 h-4 bg-neutral-700 rounded" />
      </div>
    </div>
  );
};

export default GameSkeleton;
