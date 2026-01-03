import NewsCard from "../../../components/NewsCard/NewsCard";

const NewsBentoGrid = ({ items }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 auto-rows-[120px] md:auto-rows-[120px] gap-4 md:gap-4 my-8 mx-16">
        <div className="col-start-1 row-start-1 row-span-4 md:col-start-1 md:row-start-1 md:col-span-3 md:row-span-4">
          { items[0] && <NewsCard item={items[0]} variant="hero" /> }
        </div>
        <div className="col-start-1 row-start-5 row-span-2 md:col-start-1 md:row-start-5 md:col-span-1 md:row-span-3">
          { items[1] && <NewsCard item={items[1]} variant="featuredBox" /> }
        </div>
        <div className="col-start-1 row-start-7 row-span-2 md:col-start-2 md:row-start-5 md:col-span-2 md:row-span-3">
          { items[2] && <NewsCard item={items[2]} variant="featuredWide" /> }
        </div>
        <div className="hidden md:block md:col-start-1 md:row-start-8 md:col-span-1 md:row-span-2">
          { items[3] && <NewsCard item={items[3]} variant="compact" /> }
        </div>
        <div className="hidden md:block md:col-start-2 md:row-start-8 md:col-span-1 md:row-span-2">
          { items[4] && <NewsCard item={items[4]} variant="compact" /> }
        </div>
        <div className="hidden md:block md:col-start-3 md:row-start-8 md:col-span-1 md:row-span-2">
          { items[5] && <NewsCard item={items[5]} variant="compact" /> }
        </div>
      </div>
  )
}

export default NewsBentoGrid;