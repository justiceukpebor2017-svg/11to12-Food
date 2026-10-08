import { MenuItem, UserProfile, AdminAnnouncement, InventoryItem, SupportTicket, MealRating, DayOfWeek, CustomerRecord, WaitlistLead, SelectedLunchDay } from '../types';
import { getStructuredMealForDate } from './menuRotation';

// Helper to build 20 workdays starting from Sept 22, 2026
function buildInitialSubscriberDays(startDate: Date, totalCount: number, swallowDefault: 'Semo' | 'Eba' | 'Fufu'): SelectedLunchDay[] {
  const result: SelectedLunchDay[] = [];
  const cur = new Date(startDate);
  while (result.length < totalCount) {
    const dayOfWeek = cur.getDay();
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      const meal = getStructuredMealForDate(cur);
      if (meal && !meal.isHoliday && !meal.isNoDelivery) {
        const yyyy = cur.getFullYear();
        const mm = String(cur.getMonth() + 1).padStart(2, '0');
        const dd = String(cur.getDate()).padStart(2, '0');
        const dateStr = `${yyyy}-${mm}-${dd}`;
        result.push({
          dateStr,
          meal,
          selectedSwallow: dayOfWeek === 5 ? swallowDefault : undefined,
        });
      }
    }
    cur.setDate(cur.getDate() + 1);
  }
  return result;
}

export const INITIAL_CUSTOMERS: CustomerRecord[] = [];

export const INITIAL_WAITLIST_LEADS: WaitlistLead[] = [];

export const INITIAL_MENU_ITEMS: MenuItem[] = [
  {
    id: 'm-mon',
    day: 'Mon',
    dateStr: '2026-08-04', // Today/this week monday-saturday
    title: 'Party Jollof Rice with Grilled Peppered Chicken',
    description: 'Smoky firewood-flavored party Jollof served with fried plantain (dodo), seasoned coleslaw, and juicy jumbo grilled chicken.',
    category: 'Rice & Grains',
    protein: 'Grilled Chicken',
    spiceLevel: 'Medium',
    allergens: ['Dairy (coleslaw cream)'],
    ingredients: ['Long grain rice', 'Tomatoes & red bell peppers', 'Chicken breast', 'Plantain', 'Vegetable oil', 'Cabbage & carrots'],
    imageUrl: 'https://images.unsplash.com/photo-1604382354936-07c5d9983bd3?auto=format&fit=crop&q=80&w=800',
    subPackOption: {
      title: 'Lagos Snack-Heavy Power Sub Pack',
      description: 'Piping hot Mini Puff-Puff (6pcs), Spicy Meat Pie, Cold Zobo drink (500ml), and Roasted Peanuts.',
      items: ['Mini Puff-Puff (6pcs)', 'Spicy Meat Pie', 'Chilled Hibiscus Zobo', 'Peanuts'],
    },
  },
  {
    id: 'm-tue',
    day: 'Tue',
    dateStr: '2026-08-05',
    title: 'Ewa Aganyin with Fried Plantain & Assorted Beef Sauce',
    description: 'Silky smooth slow-cooked brown beans mashed to perfection, drenched in dark caramelized chili Aganyin oil and soft fried dodo.',
    category: 'Beans & Delicacies',
    protein: 'Beef Sauce',
    spiceLevel: 'Pepper Dem',
    allergens: ['Crayfish'],
    ingredients: ['Honey beans', 'Palm oil', 'Dried chilli pepper', 'Onions', 'Beef chunks', 'Ripe plantains'],
    imageUrl: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&q=80&w=800',
    subPackOption: {
      title: 'Aganyin & Small Chops Combo Pack',
      description: 'Extra Portion Aganyin Beans + 2x Samosa + Chilled Fresh Passionfruit Juice.',
      items: ['Aganyin Beans Extra', 'Beef Samosa (2pcs)', 'Chilled Passionfruit Juice'],
    },
  },
  {
    id: 'm-wed',
    day: 'Wed',
    dateStr: '2026-08-06',
    title: 'Ofada Rice with Ayamase Green Sauce & Goat Meat',
    description: 'Aromatic unpolished Ofada rice wrapped in banana leaf, smothered in spicy bleached palm oil green pepper sauce with boiled egg & goat meat.',
    category: 'Rice & Grains',
    protein: 'Assorted Goat Meat',
    spiceLevel: 'Hot',
    allergens: ['Iru (Locust Bean)', 'Egg'],
    ingredients: ['Ofada rice', 'Green bell peppers', 'Bleached palm oil', 'Iru', 'Goat meat', 'Hardboiled egg'],
    imageUrl: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&q=80&w=800',
    subPackOption: {
      title: 'Ayamase Express & Chilled Tiger Nut Milk',
      description: 'Ayamase wrap with extra plantain chips & artisanal dates Tiger Nut (Kunun Aya) milk.',
      items: ['Ayamase Wrap', 'Plantain Chips', 'Chilled Kunun Aya Milk (500ml)'],
    },
  },
  {
    id: 'm-thu',
    day: 'Thu',
    dateStr: '2026-08-07',
    title: 'Semo with Egusi Soup & Smoked Turkey',
    description: 'Hot smooth Semo served alongside rich melon seed Egusi soup loaded with stockfish, bitterleaf, and succulent smoked turkey.',
    category: 'Swallow & Soup',
    protein: 'Smoked Turkey',
    spiceLevel: 'Medium',
    allergens: ['Stockfish', 'Crayfish'],
    ingredients: ['Semolina', 'Ground Egusi seeds', 'Bitterleaf', 'Palm oil', 'Smoked turkey', 'Crayfish'],
    imageUrl: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&q=80&w=800',
    subPackOption: {
      title: 'Swallow Alternative: Yam Fries & Spicy Turkey Wings',
      description: 'Crispy fried yam chips with spicy pepper dip, grilled turkey wings, and chilled ginger lemon drink.',
      items: ['Crispy Yam Chips', 'Spicy Turkey Wings (2pcs)', 'Ginger Lemon Juice'],
    },
  },
  {
    id: 'm-fri',
    day: 'Fri',
    dateStr: '2026-08-08',
    title: 'Special Seafood Fried Rice with Garlic Butter Prawns',
    description: 'Friday team special! Savory wok-fried rice packed with sweet corn, carrots, liver cubes, and jumbo grilled prawns.',
    category: 'Special Feast',
    protein: 'Grilled Chicken',
    spiceLevel: 'Mild',
    allergens: ['Shellfish (Prawns)'],
    ingredients: ['Basmati rice', 'Jumbo prawns', 'Sweet corn', 'Carrots & green peas', 'Soy sauce', 'Butter garlic'],
    imageUrl: 'https://images.unsplash.com/photo-1512058564366-18510be2db19?auto=format&fit=crop&q=80&w=800',
    subPackOption: {
      title: 'Friday Party Snack Box',
      description: 'Small Chops Mega Platter: 4 Spring Rolls, 4 Samosa, 6 Puff Puff, 2 Peppered Gizzard + Cold Chapman.',
      items: ['Spring Rolls & Samosa', 'Puff Puff Platter', 'Peppered Gizzard Skewer', 'Chilled Chapman Drink'],
    },
  },
  {
    id: 'm-sat',
    day: 'Sat',
    dateStr: '2026-08-09',
    title: 'Catfish Pepper Soup with Boiled White Yam',
    description: 'Weekend overtime or home chill edition. Aromatic native herbal pepper soup with fresh catfish steak and boiled soft white yam.',
    category: 'Beans & Delicacies',
    protein: 'Fried Fish',
    spiceLevel: 'Pepper Dem',
    allergens: ['Fish'],
    ingredients: ['Fresh Catfish', 'Ehu & Ehuru native spices', 'Scent leaf', 'Chili pepper', 'White yam'],
    imageUrl: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&q=80&w=800',
    subPackOption: {
      title: 'Saturday Chill Pack: Asun & Ice Cold Malt',
      description: 'Spicy habanero grilled goat meat (Asun) + Chilled Amstel Malt.',
      items: ['Spicy Goat Meat Asun (300g)', 'Chilled Amstel Malt', 'Plantain Chips'],
    },
  },
];

export const INITIAL_USER_PROFILE: UserProfile = {
  id: '',
  name: '',
  email: '',
  phone: '',
  occupation: '',
  company: '',
  address: '',
  floorSuite: '',
  deliveryArea: 'Victoria Island',
  creditsBalance: 0,
  spicePreference: 'Medium',
  proteinsPreferred: [],
  dislikes: [],
  standardLunchTime: '11:45 AM',
  eatLocation: 'Work',
  subscriptionStatus: 'Pending Activation' as any,
  planName: 'No Active Plan',
  nextBillingDate: '',
  totalMealsReceived: 0,
  totalSubscribedDays: 0,
  skipCount: 0,
  isPasswordSet: false,
  selectedDays: [],
  pendingAddressChange: null,
};

export const INITIAL_ANNOUNCEMENTS: AdminAnnouncement[] = [];

export const INITIAL_INVENTORY: InventoryItem[] = [];

export const INITIAL_MEAL_RATINGS: MealRating[] = [];

export const INITIAL_SUPPORT_TICKETS: SupportTicket[] = [];

