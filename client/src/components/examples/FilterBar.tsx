import FilterBar from "../FilterBar";

export default function FilterBarExample() {
  return (
    <FilterBar
      onSearch={(query) => console.log("Search:", query)}
      onSortChange={(sort) => console.log("Sort:", sort)}
      onCategoryChange={(category) => console.log("Category:", category)}
    />
  );
}
