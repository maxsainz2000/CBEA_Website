'use client';

interface SearchFilterProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  categories: string[];
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
  placeholder?: string;
}

export default function SearchFilter({
  searchQuery,
  onSearchChange,
  categories,
  selectedCategory,
  onCategoryChange,
  placeholder = 'Search budget entries...',
}: SearchFilterProps) {
  return (
    <div className="w-full flex flex-col gap-md" data-testid="search-filter-container">
      {/* Search text field */}
      <div className="w-full relative">
        <input
          type="text"
          className="input-underline py-sm"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={placeholder}
          aria-label="Search budget entries"
          data-testid="search-input"
        />
      </div>

      {/* Quick filter chips / categories */}
      {categories.length > 0 && (
        <div className="flex flex-col gap-xs">
          <span className="font-label-caps text-label-caps text-secondary uppercase tracking-label-caps select-none">
            Filter by Category
          </span>
          <div
            className="flex flex-wrap gap-xs"
            role="group"
            aria-label="Category filters"
            data-testid="category-chips-container"
          >
            {categories.map((category) => {
              const isSelected = selectedCategory === category;
              return (
                <button
                  key={category}
                  onClick={() => onCategoryChange(category)}
                  type="button"
                  className={`px-sm py-xs text-caption font-label-caps select-none cursor-pointer transition-colors ${
                    isSelected
                      ? 'bg-primary text-on-primary font-bold'
                      : 'bg-surface text-secondary hover:bg-outline hover:text-on-background'
                  }`}
                  style={{ borderRadius: '0px' }}
                  aria-pressed={isSelected}
                  data-testid={`category-chip-${category}`}
                >
                  {category}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
