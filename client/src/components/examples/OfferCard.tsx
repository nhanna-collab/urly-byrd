import OfferCard from "../OfferCard";
import headphonesImg from "@assets/generated_images/Wireless_headphones_product_photo_f61ff0e8.png";

export default function OfferCardExample() {
  const futureDate = new Date(Date.now() + 5 * 60 * 60 * 1000);

  return (
    <div className="max-w-sm">
      <OfferCard
        id="1"
        title="Premium Wireless Headphones"
        description="Noise-cancelling, 30hr battery, premium sound quality"
        discount="40% OFF"
        originalPrice="$199.99"
        imageUrl={headphonesImg}
        endDate={futureDate}
        merchantName="TechStore"
        onViewDeal={() => console.log("View deal clicked")}
      />
    </div>
  );
}
