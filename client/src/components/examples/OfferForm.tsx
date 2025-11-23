import OfferForm from "../OfferForm";

export default function OfferFormExample() {
  return (
    <div className="max-w-2xl mx-auto">
      <OfferForm
        onSubmit={(data) => console.log("Form submitted:", data)}
        onCancel={() => console.log("Form cancelled")}
      />
    </div>
  );
}
