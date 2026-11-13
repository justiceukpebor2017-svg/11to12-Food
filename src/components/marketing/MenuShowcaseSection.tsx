import React, { useEffect, useMemo, useState } from 'react';
import {
  Utensils,
  Soup,
  Beef,
  CircleDot,
  CupSoda,
  LayoutGrid,
  Columns3,
  Camera,
} from 'lucide-react';
import {
  MenuShowcaseCategory,
  MenuShowcaseItem,
  MainMealSubGroup,
} from '../../types';
import {
  MENU_SHOWCASE_CATEGORIES,
  MAIN_MEAL_SUBGROUPS,
  mergeMenuShowcaseItems,
} from '../../data/menuShowcaseData';
import {
  getLocalMenuShowcaseMap,
  subscribeToMenuShowcase,
} from '../../services/firebase';

type LayoutMode = 'grid' | 'horizontal';

interface SectionTheme {
  container: string;
  headerBorder: string;
  titleColor: string;
  countColor: string;
  subtitleColor: string;
  toggleBg: string;
  toggleActive: string;
  toggleInactive: string;
  cardBg: string;
  cardTitle: string;
  cardDesc: string;
  cardKicker: string;
  imageBg: string;
  placeholderBg: string;
  placeholderText: string;
}

const SECTION_THEMES: Record<MenuShowcaseCategory, SectionTheme> = {
  'main-meals': {
    container: 'bg-gradient-to-br from-[#FFF4ED] via-[#FFF8F3] to-[#FFE7D6] border-orange-200/90',
    headerBorder: 'border-orange-200/80',
    titleColor: 'text-black',
    countColor: 'text-orange-700',
    subtitleColor: 'text-zinc-600',
    toggleBg: 'bg-white/90 border-orange-200',
    toggleActive: 'bg-gradient-to-r from-[#FF4C00] to-[#FF6E24] text-white',
    toggleInactive: 'text-zinc-600 hover:text-black',
    cardBg: 'bg-white border-orange-200/70 hover:border-[#FF4C00]',
    cardTitle: 'text-[#1A1A1A]',
    cardDesc: 'text-zinc-600',
    cardKicker: 'text-[#FF4C00]',
    imageBg: 'bg-[#FFF0E5] border-orange-100',
    placeholderBg: 'bg-gradient-to-br from-[#FFE5D3] to-[#FFF6EE]',
    placeholderText: 'text-orange-900/70',
  },
  soups: {
    container: 'bg-gradient-to-br from-[#FF4C00] via-[#FF5E14] to-[#FF8533] border-orange-500 text-white',
    headerBorder: 'border-white/25',
    titleColor: 'text-white',
    countColor: 'text-orange-100',
    subtitleColor: 'text-orange-50',
    toggleBg: 'bg-white/15 border-white/25',
    toggleActive: 'bg-white text-[#FF4C00]',
    toggleInactive: 'text-white/90 hover:text-white',
    cardBg: 'bg-white border-white/80 hover:border-orange-200',
    cardTitle: 'text-[#1A1A1A]',
    cardDesc: 'text-zinc-600',
    cardKicker: 'text-[#FF4C00]',
    imageBg: 'bg-[#FFF3EB] border-orange-100',
    placeholderBg: 'bg-gradient-to-br from-[#FFE4D1] to-[#FFF6EF]',
    placeholderText: 'text-orange-900/75',
  },
  protein: {
    container: 'bg-zinc-200/80 border-zinc-300/90',
    headerBorder: 'border-zinc-300',
    titleColor: 'text-black',
    countColor: 'text-zinc-600',
    subtitleColor: 'text-zinc-700',
    toggleBg: 'bg-white border-zinc-300',
    toggleActive: 'bg-black text-white',
    toggleInactive: 'text-zinc-600 hover:text-black',
    cardBg: 'bg-white border-zinc-200 hover:border-[#FF4C00]',
    cardTitle: 'text-black',
    cardDesc: 'text-zinc-600',
    cardKicker: 'text-[#FF4C00]',
    imageBg: 'bg-zinc-100 border-zinc-200',
    placeholderBg: 'bg-gradient-to-br from-zinc-100 to-[#FFF2E9]',
    placeholderText: 'text-zinc-600',
  },
  swallow: {
    container: 'bg-gradient-to-br from-[#FF4C00] via-[#FF5E14] to-[#FF8533] border-orange-500 text-white',
    headerBorder: 'border-white/25',
    titleColor: 'text-white',
    countColor: 'text-orange-100',
    subtitleColor: 'text-orange-50',
    toggleBg: 'bg-black/20 border-white/25',
    toggleActive: 'bg-white text-black',
    toggleInactive: 'text-white/90 hover:text-white',
    cardBg: 'bg-white border-white/80 hover:border-black',
    cardTitle: 'text-black',
    cardDesc: 'text-zinc-600',
    cardKicker: 'text-[#FF4C00]',
    imageBg: 'bg-[#FFF3EB] border-orange-100',
    placeholderBg: 'bg-gradient-to-br from-[#FFE4D1] to-[#FFF6EF]',
    placeholderText: 'text-orange-900/75',
  },
  drinks: {
    container: 'bg-white border-zinc-200',
    headerBorder: 'border-zinc-200',
    titleColor: 'text-black',
    countColor: 'text-[#FF4C00]',
    subtitleColor: 'text-zinc-600',
    toggleBg: 'bg-zinc-100 border-zinc-200',
    toggleActive: 'bg-gradient-to-r from-[#FF4C00] to-[#FF6E24] text-white',
    toggleInactive: 'text-zinc-600 hover:text-black',
    cardBg: 'bg-[#FAF7F2] border-zinc-200 hover:border-[#FF4C00]',
    cardTitle: 'text-black',
    cardDesc: 'text-zinc-600',
    cardKicker: 'text-[#FF4C00]',
    imageBg: 'bg-zinc-100 border-zinc-200',
    placeholderBg: 'bg-gradient-to-br from-zinc-100 via-white to-[#FFF2E8]',
    placeholderText: 'text-zinc-600',
  },
};

interface MenuShowcaseCardProps {
  item: MenuShowcaseItem;
  layout: LayoutMode;
  categoryLabel: string;
  theme: SectionTheme;
}

const CategoryFallbackIcon: React.FC<{ category: MenuShowcaseCategory; dark?: boolean }> = ({
  category,
  dark,
}) => {
  const color = dark ? 'text-orange-400' : 'text-[#FF4C00]';
  switch (category) {
    case 'soups':
      return <Soup className={`w-7 h-7 ${color}`} />;
    case 'protein':
      return <Beef className={`w-7 h-7 ${color}`} />;
    case 'swallow':
      return <CircleDot className={`w-7 h-7 ${color}`} />;
    case 'drinks':
      return <CupSoda className={`w-7 h-7 ${color}`} />;
    default:
      return <Utensils className={`w-7 h-7 ${color}`} />;
  }
};

const MenuShowcaseCard: React.FC<MenuShowcaseCardProps> = ({
  item,
  layout,
  categoryLabel,
  theme,
}) => {
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    setImgError(false);
  }, [item.imageUrl]);

  const hasValidImage = Boolean(item.imageUrl && item.imageUrl.trim() && !imgError);
  const subTitle = item.subGroup ? `${item.subGroup} · ${categoryLabel}` : categoryLabel;
  const isDarkCard = false;

  if (layout === 'horizontal') {
    return (
      <article className={`w-[260px] sm:w-[290px] shrink-0 snap-start rounded-2xl border overflow-hidden flex flex-col hover:shadow-md transition-all ${theme.cardBg}`}>
        <div className={`aspect-[4/3] w-full border-b relative overflow-hidden flex items-center justify-center ${theme.imageBg}`}>
          {hasValidImage ? (
            <img
              src={item.imageUrl}
              alt={item.name}
              loading="lazy"
              referrerPolicy="no-referrer"
              onError={() => setImgError(true)}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className={`w-full h-full flex flex-col items-center justify-center p-4 text-center ${theme.placeholderBg}`}>
              <div className="w-12 h-12 rounded-2xl border bg-white/90 border-orange-200/70 flex items-center justify-center shadow-2xs mb-2">
                <CategoryFallbackIcon category={item.category} dark={isDarkCard} />
              </div>
              <span className={`text-[11px] font-semibold flex items-center gap-1 ${theme.placeholderText}`}>
                <Camera className="w-3 h-3 opacity-75" />
                <span>Image ready in Admin</span>
              </span>
            </div>
          )}
        </div>

        <div className="p-4 flex-1 flex flex-col justify-between space-y-2">
          <div className="space-y-1">
            <p className={`text-[11px] font-semibold uppercase tracking-wider ${theme.cardKicker}`}>
              {subTitle}
            </p>
            <h4 className={`text-sm sm:text-base font-bold leading-snug ${theme.cardTitle}`}>
              {item.name}
            </h4>
          </div>
        </div>
      </article>
    );
  }

  return (
    <article className={`rounded-2xl border overflow-hidden flex flex-col hover:shadow-md transition-all ${theme.cardBg}`}>
      <div className={`aspect-[4/3] w-full border-b relative overflow-hidden flex items-center justify-center ${theme.imageBg}`}>
        {hasValidImage ? (
          <img
            src={item.imageUrl}
            alt={item.name}
            loading="lazy"
            referrerPolicy="no-referrer"
            onError={() => setImgError(true)}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className={`w-full h-full flex flex-col items-center justify-center p-4 text-center ${theme.placeholderBg}`}>
            <div
              className={`w-12 h-12 rounded-2xl border flex items-center justify-center shadow-2xs mb-2 ${
                isDarkCard ? 'bg-zinc-900 border-zinc-700' : 'bg-white/90 border-orange-200/70'
              }`}
            >
              <CategoryFallbackIcon category={item.category} dark={isDarkCard} />
            </div>
            <span className={`text-[11px] font-semibold flex items-center gap-1 ${theme.placeholderText}`}>
              <Camera className="w-3 h-3 opacity-75" />
              <span>Image ready in Admin</span>
            </span>
          </div>
        )}
      </div>

      <div className="p-4 flex-1 flex flex-col justify-between space-y-2">
        <div className="space-y-1">
          <p className={`text-[11px] font-semibold uppercase tracking-wider ${theme.cardKicker}`}>
            {subTitle}
          </p>
          <h4 className={`text-sm sm:text-base font-bold leading-snug ${theme.cardTitle}`}>
            {item.name}
          </h4>
        </div>
      </div>
    </article>
  );
};

export const MenuShowcaseSection: React.FC = () => {
  const [overridesMap, setOverridesMap] = useState<Record<string, MenuShowcaseItem>>(() =>
    getLocalMenuShowcaseMap()
  );
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<MenuShowcaseCategory | 'all'>('all');
  const [activeMainSubGroup, setActiveMainSubGroup] = useState<MainMealSubGroup | 'all'>('all');

  const [layoutModes, setLayoutModes] = useState<Record<MenuShowcaseCategory, LayoutMode>>({
    'main-meals': 'grid',
    soups: 'grid',
    protein: 'grid',
    swallow: 'grid',
    drinks: 'grid',
  });

  useEffect(() => {
    const unsub = subscribeToMenuShowcase((remoteMap) => {
      setOverridesMap(remoteMap);
    });
    return () => unsub();
  }, []);

  const allItems = useMemo(() => mergeMenuShowcaseItems(overridesMap), [overridesMap]);

  const setCategoryLayout = (catId: MenuShowcaseCategory, mode: LayoutMode) => {
    setLayoutModes((prev) => ({
      ...prev,
      [catId]: mode,
    }));
  };

  const visibleCategories = useMemo(() => {
    if (activeCategoryFilter === 'all') return MENU_SHOWCASE_CATEGORIES;
    return MENU_SHOWCASE_CATEGORIES.filter((c) => c.id === activeCategoryFilter);
  }, [activeCategoryFilter]);

  return (
    <section
      id="see-menu"
      className="py-20 sm:py-24 bg-zinc-100 text-[#1A1A1A] font-['Poppins'] border-t border-zinc-200"
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        {/* Section Heading */}
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <div className="inline-block px-4 py-1.5 rounded-full bg-gradient-to-r from-[#FF4C00] to-[#FF782C] text-white text-xs font-bold tracking-wide shadow-xs">
            Full Kitchen Lineup
          </div>
          <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-black">
            See what is on the menu
          </h2>
          <p className="text-zinc-600 text-sm sm:text-base font-medium leading-relaxed">
            Explore our freshly prepared main meals, rich soups, daily proteins, smooth swallows, and chilled drinks. Switch any section between grid or horizontal scroll.
          </p>
        </div>

        {/* Category Jump / Filter Bar */}
        <div className="flex items-center justify-start sm:justify-center gap-2 overflow-x-auto pb-2 no-scrollbar">
          <button
            type="button"
            onClick={() => setActiveCategoryFilter('all')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition whitespace-nowrap shrink-0 cursor-pointer border ${
              activeCategoryFilter === 'all'
                ? 'bg-gradient-to-r from-[#FF4C00] to-[#FF6E24] text-white border-[#FF4C00] shadow-sm'
                : 'bg-zinc-200 text-zinc-800 border-zinc-300 hover:border-orange-300'
            }`}
          >
            All Categories
          </button>
          {MENU_SHOWCASE_CATEGORIES.map((cat) => {
            const isSelected = activeCategoryFilter === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setActiveCategoryFilter(cat.id)}
                className={`px-4 py-2.5 rounded-xl text-xs font-bold transition whitespace-nowrap shrink-0 cursor-pointer border ${
                  isSelected
                    ? 'bg-gradient-to-r from-[#FF4C00] to-[#FF6E24] text-white border-[#FF4C00] shadow-sm'
                    : 'bg-white text-zinc-700 border-zinc-200 hover:border-orange-300'
                }`}
              >
                {cat.title}
              </button>
            );
          })}
        </div>

        {/* Menu Category Sections */}
        <div className="space-y-10">
          {visibleCategories.map((catMeta) => {
            const theme = SECTION_THEMES[catMeta.id];
            const rawCategoryItems = allItems.filter((item) => item.category === catMeta.id);
            const categoryItems =
              catMeta.id === 'main-meals' && activeMainSubGroup !== 'all'
                ? rawCategoryItems.filter((item) => item.subGroup === activeMainSubGroup)
                : rawCategoryItems;
            const currentLayout = layoutModes[catMeta.id];

            return (
              <div
                key={catMeta.id}
                className={`rounded-3xl border p-5 sm:p-8 space-y-6 shadow-xs ${theme.container}`}
              >
                {/* Section Header + Independent Grid / Horizontal Scroll Toggle */}
                <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-5 ${theme.headerBorder}`}>
                  <div className="space-y-1">
                    <div className="flex items-baseline gap-2.5">
                      <h3 className={`text-xl sm:text-2xl font-extrabold tracking-tight ${theme.titleColor}`}>
                        {catMeta.title}
                      </h3>
                      <span className={`text-xs font-bold tabular-nums ${theme.countColor}`}>
                        {categoryItems.length} {categoryItems.length === 1 ? 'item' : 'items'}
                      </span>
                    </div>
                    <p className={`text-xs sm:text-sm ${theme.subtitleColor}`}>
                      {catMeta.subtitle}
                    </p>
                  </div>

                  {/* Per-section Layout Switcher */}
                  <div
                    role="group"
                    aria-label={`${catMeta.title} layout mode`}
                    className={`inline-flex items-center p-1 rounded-xl border self-start sm:self-auto shrink-0 ${theme.toggleBg}`}
                  >
                    <button
                      type="button"
                      onClick={() => setCategoryLayout(catMeta.id, 'grid')}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap shrink-0 cursor-pointer ${
                        currentLayout === 'grid' ? theme.toggleActive : theme.toggleInactive
                      }`}
                    >
                      <LayoutGrid className="w-3.5 h-3.5" />
                      <span>Grid</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setCategoryLayout(catMeta.id, 'horizontal')}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap shrink-0 cursor-pointer ${
                        currentLayout === 'horizontal' ? theme.toggleActive : theme.toggleInactive
                      }`}
                    >
                      <Columns3 className="w-3.5 h-3.5" />
                      <span>Horizontal Scroll</span>
                    </button>
                  </div>
                </div>

                {/* Sub-group selector inside Main Meals */}
                {catMeta.id === 'main-meals' && (
                  <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
                    <button
                      type="button"
                      onClick={() => setActiveMainSubGroup('all')}
                      className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap shrink-0 cursor-pointer border ${
                        activeMainSubGroup === 'all'
                          ? 'bg-gradient-to-r from-[#FF4C00] to-[#FF6E24] text-white border-[#FF4C00]'
                          : 'bg-white text-zinc-700 border-orange-200 hover:border-[#FF4C00]'
                      }`}
                    >
                      All Main Meals
                    </button>
                    {MAIN_MEAL_SUBGROUPS.map((sub) => (
                      <button
                        key={sub}
                        type="button"
                        onClick={() => setActiveMainSubGroup(sub)}
                        className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap shrink-0 cursor-pointer border ${
                          activeMainSubGroup === sub
                            ? 'bg-gradient-to-r from-[#FF4C00] to-[#FF6E24] text-white border-[#FF4C00]'
                            : 'bg-white text-zinc-700 border-orange-200 hover:border-[#FF4C00]'
                        }`}
                      >
                        {sub} Meals
                      </button>
                    ))}
                  </div>
                )}

                {/* Items Container: Grid OR Horizontal Scroll */}
                {categoryItems.length === 0 ? (
                  <div className="py-10 text-center text-sm opacity-75">
                    No items in this category yet.
                  </div>
                ) : currentLayout === 'grid' ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {categoryItems.map((item) => (
                      <MenuShowcaseCard
                        key={item.id}
                        item={item}
                        layout="grid"
                        categoryLabel={catMeta.title}
                        theme={theme}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="flex items-stretch gap-4 overflow-x-auto pb-3 snap-x snap-mandatory scroll-smooth">
                    {categoryItems.map((item) => (
                      <MenuShowcaseCard
                        key={item.id}
                        item={item}
                        layout="horizontal"
                        categoryLabel={catMeta.title}
                        theme={theme}
                      />
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
