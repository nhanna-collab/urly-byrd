export default function ColorPalette() {
  const oranges = [
    { name: "orange-50", class: "bg-orange-50", desc: "Softest peachy (Current: Create Offer)" },
    { name: "orange-100", class: "bg-orange-100", desc: "Light cream" },
    { name: "orange-200", class: "bg-orange-200", desc: "Soft pastel" },
    { name: "orange-300", class: "bg-orange-300", desc: "Warm light" },
    { name: "orange-400", class: "bg-orange-400", desc: "Medium peachy" },
    { name: "orange-500", class: "bg-orange-500", desc: "Vibrant orange" },
    { name: "amber-50", class: "bg-amber-50", desc: "Very light golden" },
    { name: "amber-100", class: "bg-amber-100", desc: "Light honey" },
    { name: "amber-200", class: "bg-amber-200", desc: "Soft amber" },
    { name: "amber-300", class: "bg-amber-300", desc: "Warm amber" },
    { name: "rose-50", class: "bg-rose-50", desc: "Peachy pink-orange" },
    { name: "rose-100", class: "bg-rose-100", desc: "Light rose" },
    { name: "yellow-50", class: "bg-yellow-50", desc: "Sunny yellow-orange" },
    { name: "yellow-100", class: "bg-yellow-100", desc: "Light sunny" },
  ];

  return (
    <div className="min-h-screen p-8 bg-background">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">Orange Color Palette</h1>
        <p className="text-muted-foreground mb-8">
          Click on any color to copy its name. Currently using: orange-50 for Create Offer page
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {oranges.map((color) => (
            <div
              key={color.name}
              className="border rounded-lg overflow-hidden cursor-pointer hover-elevate"
              onClick={() => {
                navigator.clipboard.writeText(color.name);
                alert(`Copied: ${color.name}`);
              }}
              data-testid={`color-${color.name}`}
            >
              <div className={`${color.class} h-32 w-full`}></div>
              <div className="p-4 bg-card">
                <h3 className="font-bold text-lg mb-1">{color.name}</h3>
                <p className="text-sm text-muted-foreground">{color.desc}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-12 p-6 bg-card border rounded-lg">
          <h2 className="text-xl font-bold mb-4">Available Pages to Color:</h2>
          <ul className="grid grid-cols-2 gap-3">
            <li>• Dashboard</li>
            <li>• Reports</li>
            <li>• Campaigns</li>
            <li>• Quick Start</li>
            <li>• Merchant Collateral</li>
            <li>• Start Campaigns</li>
            <li>• Concept Lab</li>
            <li>• Flash Marketing</li>
            <li>• Customers</li>
          </ul>
          <p className="mt-4 text-sm text-muted-foreground">
            Tell me which page should get which color (e.g., "Dashboard amber-50")
          </p>
        </div>
      </div>
    </div>
  );
}
