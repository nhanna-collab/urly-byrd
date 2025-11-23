import MerchantCard from "../MerchantCard";

export default function MerchantCardExample() {
  return (
    <div className="max-w-xs">
      <MerchantCard
        id="1"
        name="TechStore"
        activeOffers={5}
        onViewOffers={() => console.log("View offers clicked")}
      />
    </div>
  );
}
