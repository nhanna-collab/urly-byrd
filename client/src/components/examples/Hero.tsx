import Hero from "../Hero";
import heroImage from "@assets/generated_images/Hero_shopping_excitement_scene_91137b6a.png";

export default function HeroExample() {
  return (
    <Hero
      backgroundImage={heroImage}
      activeDeals={24}
      activeMerchants={12}
      onBrowseDeals={() => console.log("Browse deals clicked")}
    />
  );
}
