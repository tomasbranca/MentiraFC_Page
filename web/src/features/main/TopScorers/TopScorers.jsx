import PlayerCard from "../../../components/PlayerCard/PlayerCard";

const TopScorers = ({ players }) => {
  return (
    <section className="p-4 m-6 col-span-2">
      <div className="flex items-center">
        <div className="text-4xl text-violet-900 font-extrabold py-4 uppercase">
          Máximos goleadores
        </div>
        <div className="bg-violet-900 h-8 flex-grow ml-4"></div>
      </div>

      <div className="flex justify-between">
        {players.map((player) => (
          <PlayerCard key={player._id} player={player} mode="goals" />
        ))}
      </div>
    </section>
  );
};

export default TopScorers;
