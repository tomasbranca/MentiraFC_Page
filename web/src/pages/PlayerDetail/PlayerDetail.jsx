import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { getPlayerBySlug } from "../../lib/sanity";
import { FaArrowLeft } from "react-icons/fa";

const POSITION_MAP = {
  arq: "Arquero",
  def: "Defensa",
  med: "Mediocampista",
  del: "Delantero",
};

const PlayerDetail = () => {
  const { slug } = useParams();
  const [player, setPlayer] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getPlayerBySlug(slug).then((data) => {
      setPlayer(data);
      setLoading(false);
    });
  }, [slug]);

  const formatDate = (date) =>
    new Date(date + "T00:00:00Z").toLocaleDateString("es-AR", {
      day: "numeric",
      month: "long",
      year: "numeric",
      timeZone: "UTC",
    });

  const calculateAge = (date) => {
    const birth = new Date(date);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
    return age;
  };

  if (loading) return null;
  if (!player) return <p>Jugador no encontrado</p>;

  return (
    <>
      {/* Volver */}
      <div className="max-w-6xl mx-auto px-6 py-6">
        <Link
          to="/plantel"
          className="flex items-center gap-2 text-sm text-gray-600 hover:text-black"
        >
          <FaArrowLeft /> Volver al plantel
        </Link>
      </div>

      {/* HERO */}
      <section className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 mb-16">
        {/* FOTO */}
        <div className="w-full h-full">
          <img
            src={player.imageUrl}
            alt={`${player.name} ${player.lastName}`}
            className="w-full h-full object-cover"
          />
        </div>

        {/* NUMERO */}
        <div className="bg-violet-900 text-white p-10 flex flex-col justify-between">
          <div>
            <span className="text-7xl font-extrabold opacity-50 ">
              {player.number}
            </span>
          </div>

          {/* NOMBRE + POSICION */}
          <div>
            <h1 className="text-4xl font-bold mt-6 leading-tight">
              {player.name.toUpperCase()}
              <br />
              <span className="font-black">
                {player.lastName.toUpperCase()}
              </span>
            </h1>

            <p className="mt-3 text-sm tracking-widest">
              {POSITION_MAP[player.position].toUpperCase()}
            </p>
          </div>

          {/* INFO PERSONAL + GOLES */}
          <div className="grid grid-cols-2 gap-6 text-xl">
            <div>
              <p className="opacity-70">EDAD</p>
              <p className="font-semibold">
                {calculateAge(player.birthDate)} años
              </p>
            </div>

            <div>
              <p className="opacity-70">GOLES</p>
              <p className="font-semibold">{player.goals}</p>
            </div>

            <div className="col-span-2">
              <p className="opacity-70">FECHA DE NACIMIENTO</p>
              <p className="font-semibold">{formatDate(player.birthDate)}</p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
};

export default PlayerDetail;
