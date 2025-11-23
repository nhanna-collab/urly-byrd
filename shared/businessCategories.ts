export const businessCategories = [
  "Food & Beverage",
  "Health & Beauty",
  "Home & Lifestyle",
  "Automotive",
  "Fashion & Apparel",
  "Specialty Retail",
  "Medical & Wellness",
  "Professional Services",
  "Entertainment & Recreation",
  "Hospitality",
  "Education & Childcare",
  "Other Local Retail",
] as const;

export type BusinessCategory = (typeof businessCategories)[number];
