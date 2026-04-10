import { FaFutbol } from "react-icons/fa";

const GameEmpty = () => {
  return (
    <div className="bg-neutral-900 p-8 mb-4 flex flex-col items-center
      text-violet-100 border-t-2 border-violet-700"
    >
      <FaFutbol className="text-5xl text-violet-500 mb-4 opacity-80" />

      <h3 className="text-xl font-semibold tracking-wide">
        Sin partidos registrados
      </h3>

      <p className="text-sm opacity-80 mt-2 text-center max-w-sm">
        Todavía no hay información del último partido.
        Cuando se cargue, la vas a ver acá.
      </p>
    </div>
  );
};

export default GameEmpty;
