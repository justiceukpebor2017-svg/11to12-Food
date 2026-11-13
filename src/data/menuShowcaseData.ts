import { MenuShowcaseCategory, MenuShowcaseItem, MainMealSubGroup } from '../types';

export interface MenuShowcaseCategoryMeta {
  id: MenuShowcaseCategory;
  title: string;
  subtitle: string;
}

export const MENU_SHOWCASE_CATEGORIES: MenuShowcaseCategoryMeta[] = [
  {
    id: 'main-meals',
    title: 'Main Meals',
    subtitle: 'Rice dishes, yam classics, honey beans & Ewa Agoyin, plantain plates & pasta.',
  },
  {
    id: 'soups',
    title: 'Soups',
    subtitle: 'Rich, slow-simmered Nigerian soups freshly prepared for your lunch drops.',
  },
  {
    id: 'protein',
    title: 'Protein',
    subtitle: 'Hearty fish, poultry, and tender meats cooked to pair with your mains & soups.',
  },
  {
    id: 'swallow',
    title: 'Swallow',
    subtitle: 'Smooth, freshly made swallows served hot alongside every soup day.',
  },
  {
    id: 'drinks',
    title: 'Drinks',
    subtitle: 'Chilled bottled water, sodas, and malt drinks to complete your lunch.',
  },
];

export const MAIN_MEAL_SUBGROUPS: MainMealSubGroup[] = ['Rice', 'Yam', 'Beans', 'Plantain', 'Pasta'];

export const DEFAULT_MENU_SHOWCASE_ITEMS: MenuShowcaseItem[] = [
  // ========================
  // 1. MAIN MEALS - RICE
  // ========================
  {
    id: 'main-rice-jollof-chicken',
    category: 'main-meals',
    subGroup: 'Rice',
    name: 'Jollof Rice & Chicken',
    description: 'Smoky party-style Jollof rice served with spiced chicken and sweet plantain.',
    sortOrder: 10,
  },
  {
    id: 'main-rice-jollof-grilled-fish',
    category: 'main-meals',
    subGroup: 'Rice',
    name: 'Jollof Rice & Grilled Fish',
    description: 'Long-grain Jollof rice paired with herb-marinated oven-grilled fish.',
    sortOrder: 20,
  },
  {
    id: 'main-rice-jollof-beef',
    category: 'main-meals',
    subGroup: 'Rice',
    name: 'Jollof Rice & Beef',
    description: 'Classic tomato-pepper Jollof rice served with tender stewed beef cuts.',
    sortOrder: 30,
  },
  {
    id: 'main-rice-white-stew-plantain',
    category: 'main-meals',
    subGroup: 'Rice',
    name: 'White Rice, Stew & Fried Plantain',
    description: 'Steamed white rice topped with rich tomato stew and golden dodo.',
    sortOrder: 40,
  },
  {
    id: 'main-rice-white-stew-chicken',
    category: 'main-meals',
    subGroup: 'Rice',
    name: 'White Rice, Stew & Chicken',
    description: 'Fluffy parboiled white rice, peppered chicken, and homestyle red stew.',
    sortOrder: 50,
  },
  {
    id: 'main-rice-white-veg-beef',
    category: 'main-meals',
    subGroup: 'Rice',
    name: 'White Rice, Vegetable Sauce & Beef',
    description: 'Steamed white rice served with leafy vegetable sauce and braised beef.',
    sortOrder: 60,
  },
  {
    id: 'main-rice-fried-beef',
    category: 'main-meals',
    subGroup: 'Rice',
    name: 'Fried Rice & Beef',
    description: 'Nigerian stir-fried rice packed with mixed vegetables and spiced beef.',
    sortOrder: 70,
  },
  {
    id: 'main-rice-fried-chicken',
    category: 'main-meals',
    subGroup: 'Rice',
    name: 'Nigerian Fried Rice & Chicken',
    description: 'Fragrant seasoned fried rice finished with roasted chicken.',
    sortOrder: 80,
  },
  {
    id: 'main-rice-veg-fried-chicken',
    category: 'main-meals',
    subGroup: 'Rice',
    name: 'Vegetable Fried Rice & Chicken',
    description: 'Crisp garden-vegetable fried rice served with grilled chicken.',
    sortOrder: 90,
  },
  {
    id: 'main-rice-coconut-chicken',
    category: 'main-meals',
    subGroup: 'Rice',
    name: 'Coconut Rice & Grilled Chicken',
    description: 'Aromatic coconut milk rice paired with pepper-glazed grilled chicken.',
    sortOrder: 100,
  },
  {
    id: 'main-rice-coconut-fish',
    category: 'main-meals',
    subGroup: 'Rice',
    name: 'Coconut Rice & Grilled Fish',
    description: 'Creamy coconut-infused rice served with seasoned grilled fish.',
    sortOrder: 110,
  },
  {
    id: 'main-rice-ofada-ayamase',
    category: 'main-meals',
    subGroup: 'Rice',
    name: 'Ofada Rice & Ayamase Sauce',
    description: 'Authentic local Ofada rice with spicy green pepper designer stew and egg.',
    sortOrder: 120,
  },
  {
    id: 'main-rice-native-fish',
    category: 'main-meals',
    subGroup: 'Rice',
    name: 'Native Rice & Fish',
    description: 'Palm-oil native rice simmered with locust beans, scent leaf, and fish.',
    sortOrder: 130,
  },
  {
    id: 'main-rice-native-assorted',
    category: 'main-meals',
    subGroup: 'Rice',
    name: 'Native Rice & Assorted Meat',
    description: 'Rich palm-oil native rice cooked with iru and tender assorted meats.',
    sortOrder: 140,
  },

  // ========================
  // 1. MAIN MEALS - YAM
  // ========================
  {
    id: 'main-yam-porridge-fish',
    category: 'main-meals',
    subGroup: 'Yam',
    name: 'Yam Porridge with Fish',
    description: 'Creamy pounded-style asaro simmered in palm oil sauce with flaked fish.',
    sortOrder: 150,
  },
  {
    id: 'main-yam-veg-porridge',
    category: 'main-meals',
    subGroup: 'Yam',
    name: 'Yam & Vegetable Porridge',
    description: 'Soft yam cubes slow-cooked with fresh green vegetables and spices.',
    sortOrder: 160,
  },
  {
    id: 'main-yam-fried-plantain',
    category: 'main-meals',
    subGroup: 'Yam',
    name: 'Fried Yam & Fried Plantain',
    description: 'Crispy golden yam chips and sweet fried dodo with pepper sauce.',
    sortOrder: 170,
  },
  {
    id: 'main-yam-boiled-garden-egg',
    category: 'main-meals',
    subGroup: 'Yam',
    name: 'Boiled Yam & Garden Egg Sauce',
    description: 'Soft boiled Puna yam paired with palm-oil garden egg and smoked fish sauce.',
    sortOrder: 180,
  },
  {
    id: 'main-yam-boiled-egg-sauce',
    category: 'main-meals',
    subGroup: 'Yam',
    name: 'Boiled Yam & Egg Sauce',
    description: 'Warm yam slices served with spicy tomato, onion, and scrambled egg sauce.',
    sortOrder: 190,
  },
  {
    id: 'main-yam-sweet-potato-porridge',
    category: 'main-meals',
    subGroup: 'Yam',
    name: 'Sweet Potato Porridge',
    description: 'Savory-sweet potato pottage cooked in rich pepper sauce and fish.',
    sortOrder: 200,
  },
  {
    id: 'main-yam-boiled-sweet-potato-egg',
    category: 'main-meals',
    subGroup: 'Yam',
    name: 'Boiled Sweet Potatoes & Egg Sauce',
    description: 'Steamed orange/white sweet potatoes served with spiced egg sauce.',
    sortOrder: 210,
  },

  // ========================
  // 1. MAIN MEALS - BEANS
  // ========================
  {
    id: 'main-beans-ewa-agoyin',
    category: 'main-meals',
    subGroup: 'Beans',
    name: 'Ewa Agoyin, Pepper Sauce, Fish & Plantain',
    description: 'Soft mashed honey beans topped with signature dark pepper sauce, fish, and dodo.',
    sortOrder: 220,
  },
  {
    id: 'main-beans-rice-beans',
    category: 'main-meals',
    subGroup: 'Beans',
    name: 'White Rice & Honey Beans with Stew',
    description: 'Protein-packed combo of honey beans and rice with rich stew and beef.',
    sortOrder: 230,
  },

  // ========================
  // 1. MAIN MEALS - PLANTAIN
  // ========================
  {
    id: 'main-plantain-boiled-egg',
    category: 'main-meals',
    subGroup: 'Plantain',
    name: 'Boiled Plantain & Egg Sauce',
    description: 'Sweet ripe boiled plantain served with freshly sauteed tomato-egg sauce.',
    sortOrder: 240,
  },
  {
    id: 'main-plantain-boiled-fish-stew',
    category: 'main-meals',
    subGroup: 'Plantain',
    name: 'Boiled Plantain & Fish Stew',
    description: 'Tender boiled plantain paired with spicy Lagos-style fish stew.',
    sortOrder: 250,
  },
  {
    id: 'main-plantain-fried-egg',
    category: 'main-meals',
    subGroup: 'Plantain',
    name: 'Fried Plantain & Egg Sauce',
    description: 'Caramelized golden dodo served with savory scrambled egg & pepper sauce.',
    sortOrder: 260,
  },
  {
    id: 'main-plantain-boli-fish',
    category: 'main-meals',
    subGroup: 'Plantain',
    name: 'Boli & Grilled Fish',
    description: 'Fire-roasted plantain paired with smoky spicy grilled croaker/titus fish.',
    sortOrder: 270,
  },

  // ========================
  // 1. MAIN MEALS - PASTA
  // ========================
  {
    id: 'main-pasta-bolognese',
    category: 'main-meals',
    subGroup: 'Pasta',
    name: 'Spaghetti Bolognese',
    description: 'Al-dente pasta tossed in slow-cooked spiced minced beef tomato sauce.',
    sortOrder: 280,
  },
  {
    id: 'main-pasta-spag-chicken',
    category: 'main-meals',
    subGroup: 'Pasta',
    name: 'Spaghetti & Chicken',
    description: 'Stir-fried Nigerian Jollof spaghetti served with juicy spiced chicken.',
    sortOrder: 290,
  },
  {
    id: 'main-pasta-spag-beef',
    category: 'main-meals',
    subGroup: 'Pasta',
    name: 'Spaghetti & Beef',
    description: 'Savory peppered spaghetti served with tender sautéed beef.',
    sortOrder: 300,
  },

  // ========================
  // 2. SOUPS
  // ========================
  {
    id: 'soup-egusi',
    category: 'soups',
    name: 'Egusi Soup',
    description: 'Melon seed soup simmered with pumpkin leaves, stockfish, and palm oil.',
    sortOrder: 10,
  },
  {
    id: 'soup-efo-riro',
    category: 'soups',
    name: 'Efo Riro',
    description: 'Rich Yoruba spinach stew cooked with iru, ata rodo, and smoked fish.',
    sortOrder: 20,
  },
  {
    id: 'soup-ogbono',
    category: 'soups',
    name: 'Ogbono Soup',
    description: 'Velvety wild mango seed draw soup enriched with bitterleaf or ugu.',
    sortOrder: 30,
  },
  {
    id: 'soup-okra',
    category: 'soups',
    name: 'Okra Soup',
    description: 'Freshly chopped okra simmered in spiced broth with greens and fish.',
    sortOrder: 40,
  },
  {
    id: 'soup-okra-egusi',
    category: 'soups',
    name: 'Okra & Egusi Soup',
    description: 'Comforting fusion of nutty egusi and fresh draw okra.',
    sortOrder: 50,
  },
  {
    id: 'soup-bitterleaf',
    category: 'soups',
    name: 'Bitterleaf Soup (Ofe Onugbu)',
    description: 'Classic Eastern cocoyam-thickened soup with washed bitterleaf and ogiri.',
    sortOrder: 60,
  },
  {
    id: 'soup-afang',
    category: 'soups',
    name: 'Afang Soup',
    description: 'Rich Calabar vegetable soup crafted with shredded okazi and waterleaf.',
    sortOrder: 70,
  },
  {
    id: 'soup-edikang-ikong',
    category: 'soups',
    name: 'Edikang Ikong',
    description: 'Nutrient-rich fluted pumpkin and waterleaf delicacy.',
    sortOrder: 80,
  },
  {
    id: 'soup-oha',
    category: 'soups',
    name: 'Oha Soup',
    description: 'Velvety cocoyam soup finished with tender hand-torn oha leaves.',
    sortOrder: 90,
  },
  {
    id: 'soup-banga',
    category: 'soups',
    name: 'Banga Soup',
    description: 'Aromatic palm fruit soup infused with traditional Delta spices.',
    sortOrder: 100,
  },

  // ========================
  // 3. PROTEIN
  // ========================
  {
    id: 'protein-titus-fish',
    category: 'protein',
    name: 'Titus Fish',
    description: 'Seasoned mackerel sautéed in spiced tomato-pepper sauce.',
    sortOrder: 10,
  },
  {
    id: 'protein-kote-fish',
    category: 'protein',
    name: 'Kote Fish',
    description: 'Crisp-fried or stewed horse mackerel rich in savory flavor.',
    sortOrder: 20,
  },
  {
    id: 'protein-beef',
    category: 'protein',
    name: 'Beef',
    description: 'Braised tender beef cuts glazed in peppered sauce.',
    sortOrder: 30,
  },
  {
    id: 'protein-chicken',
    category: 'protein',
    name: 'Chicken',
    description: 'Herb-marinated oven-grilled or crispy fried chicken.',
    sortOrder: 40,
  },
  {
    id: 'protein-goat-meat',
    category: 'protein',
    name: 'Goat Meat',
    description: 'Succulent slow-simmered spicy peppered goat meat.',
    sortOrder: 50,
  },
  {
    id: 'protein-assorted-meat',
    category: 'protein',
    name: 'Assorted Meat',
    description: 'Hearty medley of beef, shaki, and cow foot cooked in rich stock.',
    sortOrder: 60,
  },
  {
    id: 'protein-eggs',
    category: 'protein',
    name: 'Eggs',
    description: 'Whole boiled or savory spiced scrambled eggs.',
    sortOrder: 70,
  },
  {
    id: 'protein-ponmo',
    category: 'protein',
    name: 'Ponmo',
    description: 'Soft, chewy braised cowhide simmered in spicy pepper sauce.',
    sortOrder: 80,
  },

  // ========================
  // 4. SWALLOW
  // ========================
  {
    id: 'swallow-eba',
    category: 'swallow',
    name: 'Eba',
    description: 'Smooth hot garri prepared to pair effortlessly with rich Nigerian soups.',
    sortOrder: 10,
  },
  {
    id: 'swallow-semo',
    category: 'swallow',
    name: 'Semo',
    description: 'Light, lump-free semolina swallow whipped to perfection.',
    sortOrder: 20,
  },
  {
    id: 'swallow-fufu',
    category: 'swallow',
    name: 'Fufu',
    description: 'Soft, traditional cassava fufu served warm and freshly wrapped.',
    sortOrder: 30,
  },

  // ========================
  // 5. DRINKS
  // ========================
  {
    id: 'drink-water',
    category: 'drinks',
    name: 'Water',
    description: 'Chilled bottled spring water.',
    sortOrder: 10,
  },
  {
    id: 'drink-pepsi',
    category: 'drinks',
    name: 'Pepsi',
    description: 'Ice-cold classic Pepsi.',
    sortOrder: 20,
  },
  {
    id: 'drink-coca-cola',
    category: 'drinks',
    name: 'Coca Cola',
    description: 'Crisp, chilled Coca-Cola.',
    sortOrder: 30,
  },
  {
    id: 'drink-7up',
    category: 'drinks',
    name: '7up',
    description: 'Refreshing lemon-lime soda.',
    sortOrder: 40,
  },
  {
    id: 'drink-sprite',
    category: 'drinks',
    name: 'Sprite',
    description: 'Clean, sparkling lemon-lime refreshment.',
    sortOrder: 50,
  },
  {
    id: 'drink-malt',
    category: 'drinks',
    name: 'Malt',
    description: 'Rich, chilled non-alcoholic malt beverage.',
    sortOrder: 60,
  },
  {
    id: 'drink-schweppes',
    category: 'drinks',
    name: 'Schweppes',
    description: 'Chilled Chapman, Ginger, or Pineapple Schweppes.',
    sortOrder: 70,
  },
];

export function mergeMenuShowcaseItems(
  overridesMap: Record<string, MenuShowcaseItem>
): MenuShowcaseItem[] {
  const mergedMap = new Map<string, MenuShowcaseItem>();

  DEFAULT_MENU_SHOWCASE_ITEMS.forEach((item) => {
    const override = overridesMap[item.id];
    mergedMap.set(item.id, override ? { ...item, ...override } : item);
  });

  // Include any custom items created by admin that are not in default list
  Object.values(overridesMap).forEach((item) => {
    if (item && item.id && !mergedMap.has(item.id)) {
      mergedMap.set(item.id, item);
    }
  });

  return Array.from(mergedMap.values())
    .filter((item) => !item.isDeleted)
    .sort((a, b) => (a.sortOrder ?? 999) - (b.sortOrder ?? 999));
}

/**
 * Resize and compress uploaded menu image client-side so it fits comfortably within Firestore's 1MB doc limit.
 */
export function compressMenuShowcaseImageFile(file: File, maxDimension = 640, quality = 0.78): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Failed to read image file.'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('Invalid image format.'));
      img.onload = () => {
        let { width, height } = img;
        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Canvas context unavailable.'));
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(compressedDataUrl);
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}
