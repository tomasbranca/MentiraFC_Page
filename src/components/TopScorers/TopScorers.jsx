import "./TopScorers.css";
import PlayerCard from "../PlayerCard/PlayerCard";

const TopScorers = ({ players }) => {
  const topScorers = [...players].sort((a, b) => b.goals - a.goals).slice(0, 4);
  return (
    <section className="top-scorers bg-violet-50 p-4 m-6 col-span-2 ">
      <div className="bloque flex items-center">
        <div className="text-4xl text-violet-900 font-bold py-4 uppercase leading-tight">
          Máximos goleadores
        </div>
        <div className="bg-violet-900 h-8 flex-grow ml-4"></div>
      </div>
      <div className="flex  justify-between">
        {topScorers.map((player) => (
          <PlayerCard key={player.id} player={player} mode="goals" />
        ))}
      </div>
    </section>
  );
};

export default TopScorers;
