import { Card } from "@/components/ui/card";
import restaurantImg from "@assets/generated_images/Local_restaurant_storefront_1e82e423.png";
import dryCleanerImg from "@assets/generated_images/Dry_cleaning_shop_interior_f01eea02.png";
import carWashImg from "@assets/generated_images/Car_wash_facility_exterior_e1338d24.png";
import yogaStudioImg from "@assets/generated_images/Yoga_studio_interior_space_b7f0c87d.png";
import grocerImg from "@assets/image_1762150084592.png";

const merchants = [
  {
    name: "Restaurants",
    image: restaurantImg,
    description: "Dining & Cafes"
  },
  {
    name: "Dry Cleaners",
    image: dryCleanerImg,
    description: "Laundry Services"
  },
  {
    name: "Car Washes",
    image: carWashImg,
    description: "Auto Detailing"
  },
  {
    name: "Yoga Studios",
    image: yogaStudioImg,
    description: "Wellness & Fitness"
  },
  {
    name: "Local Grocers",
    image: grocerImg,
    description: "Fresh Markets"
  }
];

export default function MerchantShowcase() {
  return (
    <section className="py-16 bg-muted/30">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="font-display font-bold text-3xl md:text-4xl mb-4" data-testid="text-showcase-heading">
            Supporting Local Businesses
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto" data-testid="text-showcase-description">
            From neighborhood restaurants to wellness studios, Urly Byrd helps local merchants connect with their community through exclusive time-limited offers.
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {merchants.map((merchant, index) => (
            <Card
              key={index}
              className="group relative overflow-visible p-0 border-0"
              data-testid={`merchant-type-${index}`}
            >
              <div className="aspect-[4/3] relative rounded-md overflow-hidden">
                <img
                  src={merchant.image}
                  alt={merchant.name}
                  className="w-full h-full object-cover"
                  data-testid={`img-merchant-${index}`}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
                  <h3 className="font-display font-bold text-lg mb-1" data-testid={`text-merchant-name-${index}`}>
                    {merchant.name}
                  </h3>
                  <p className="text-sm text-white/80" data-testid={`text-merchant-desc-${index}`}>
                    {merchant.description}
                  </p>
                </div>
              </div>
            </Card>
          ))}
        </div>

        <div className="text-center mt-12">
          <p className="text-muted-foreground text-sm" data-testid="text-showcase-footer">
            Join hundreds of local businesses already using Urly Byrd to grow their customer base
          </p>
        </div>
      </div>
    </section>
  );
}
