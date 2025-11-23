import AppHeader from "@/components/AppHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function Terminology() {
  const terminology = [
    {
      category: "📊 Analytics",
      items: [
        { term: "Click-Through Rate (CTR)", definition: "Percentage of people who tapped the link in the message." },
        { term: "Conversion Rate (CVR)", definition: "Percentage of people who redeemed the coupon after clicking or claiming." },
        { term: "Engagement Time", definition: "How long it takes a customer to act after receiving the message." },
        { term: "Tracking Link", definition: "A unique link that logs clicks and claim behavior." },
      ]
    },
    {
      category: "💵 Budgeting",
      items: [
        { term: "Click Budget", definition: "The amount of money the merchant allows to be spent on clicks." },
        { term: "Maximum Clicks", definition: "The maximum number of allowed clicks before the offer shuts down." },
        { term: "Shut Down at Maximum", definition: "Automatically turns off the offer when the click limit is reached." },
      ]
    },
    {
      category: "🔢 Coupon Detail",
      items: [
        { term: "Coupon Code Block", definition: "The visible area showing the coupon code." },
        { term: "Redemption Code", definition: "The code used at checkout for the discount." },
      ]
    },
    {
      category: "📲 Engagement",
      items: [
        { term: "Tap-to-Claim Link", definition: "The link a user taps to claim/save the coupon." },
        { term: "Redemption Link", definition: "A link that opens a page with the coupon code, QR, or barcode." },
        { term: "Short Link", definition: "A shortened URL optimized for text messages." },
        { term: "Deep Link", definition: "A link that opens a specific page or screen in an app or site." },
      ]
    },
    {
      category: "🔄 Lifecycle",
      items: [
        { term: "Draft Offer", definition: "An offer created but not yet ready to send." },
        { term: "Scheduled Offer", definition: "An offer set to send at a future time." },
        { term: "Active Offer", definition: "An offer currently available to claim or redeem." },
        { term: "Expired Offer", definition: "An offer whose expiration date/time has passed." },
        { term: "Archived Offer", definition: "An offer stored for records after it is no longer active." },
      ]
    },
    {
      category: "💬 Messaging Type",
      items: [
        { term: "SMS", definition: "A standard text message (words only)." },
        { term: "MMS", definition: "A multimedia message (can include images, icons, cards, timers)." },
      ]
    },
    {
      category: "📡 Propagation",
      items: [
        { term: "Forward", definition: "When a customer sends the coupon to someone else." },
        { term: "Propagation Chain", definition: "The path a coupon takes as it spreads user-to-user." },
      ]
    },
    {
      category: "🏬 Redemption",
      items: [
        { term: "Redemption Event", definition: "The moment the coupon is used at checkout." },
        { term: "Closed Redemption", definition: "A completed and logged redemption in the system." },
        { term: "Redemption Timestamp", definition: "The exact date and time the coupon was redeemed." },
        { term: "Redemption Window", definition: "The period of time during which the coupon can be redeemed." },
      ]
    },
    {
      category: "🔳 Redemption Object",
      items: [
        { term: "QR Code", definition: "A square scannable code used to redeem the offer." },
        { term: "Barcode", definition: "A standard scan code used at checkout to apply the coupon." },
      ]
    },
    {
      category: "🔐 Security",
      items: [
        { term: "Single-Use Token", definition: "A coupon that can only be used once." },
        { term: "Multi-Use Token", definition: "A coupon that can be used multiple times within allowed limits." },
        { term: "Session Lock", definition: "Locks the coupon to a specific device so it cannot be claimed twice." },
        { term: "Device Fingerprint", definition: "A way to identify the device to prevent fraud." },
      ]
    },
    {
      category: "🖥️ System",
      items: [
        { term: "Offer ID", definition: "A unique identifying code for each coupon or offer." },
      ]
    },
    {
      category: "⏱️ Time Element",
      items: [
        { term: "Countdown Timer", definition: "A real-time visual countdown showing how much time remains." },
        { term: "Countdown Clock Icon", definition: "A small clock graphic indicating a limited-time offer." },
      ]
    },
    {
      category: "🕒 Timing",
      items: [
        { term: "Activation Time", definition: "When the coupon becomes valid." },
        { term: "Expiration Date", definition: "The moment the coupon stops being valid." },
        { term: "Run Time Window", definition: "How long the coupon is designed to run." },
        { term: "Time-Limited Offer", definition: "A short-term offer with limited validity." },
        { term: "Redemption Window", definition: "How long the customer has to redeem the coupon." },
      ]
    },
    {
      category: "🖼️ Visual Asset",
      items: [
        { term: "Coupon Card", definition: "A picture or graphic that visually represents the offer in the text." },
        { term: "Offer Card", definition: "Another name for the visual card showing the coupon." },
        { term: "Coupon Icon", definition: "A small visual symbol that indicates a coupon exists." },
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">SMS/MMS Marketing Terminology</h1>
          <p className="text-muted-foreground">Industry-standard terms and definitions for flash marketing campaigns</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {terminology.map((section, idx) => (
            <Card key={idx} data-testid={`terminology-section-${idx}`}>
              <CardHeader className="py-4 px-6">
                <CardTitle className="text-base font-bold">{section.category}</CardTitle>
              </CardHeader>
              <CardContent className="px-6 py-4 space-y-4">
                {section.items.map((item, itemIdx) => (
                  <div key={itemIdx} data-testid={`term-${item.term.toLowerCase().replace(/\s+/g, '-')}`}>
                    <div className="font-semibold text-sm mb-1">{item.term}</div>
                    <div className="text-sm text-muted-foreground">{item.definition}</div>
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
