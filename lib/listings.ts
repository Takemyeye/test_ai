export type Listing = {
  id: string;
  title: string;
  price: number;
  beds: number;
  baths: number;
  sqft: number;
  neighborhood: string;
  description: string;
  features: string[];
};

export const listings: Listing[] = [
  {
    id: "maple-craftsman",
    title: "Renovated Craftsman on Maple Street",
    price: 745000,
    beds: 3,
    baths: 2,
    sqft: 1850,
    neighborhood: "Ballard",
    description:
      "A 1920s Craftsman with a full 2021 renovation: new roof, updated electrical, and a chef's kitchen with quartz counters. The fenced backyard has a mature apple tree and a detached studio that works as an office. Two blocks from the elementary school and a ten-minute walk to the farmers market.",
    features: ["Detached office studio", "Fenced backyard", "New roof (2021)", "Gas range", "Off-street parking for two cars"],
  },
  {
    id: "harbor-loft",
    title: "Top-Floor Loft with Harbor Views",
    price: 615000,
    beds: 1,
    baths: 1,
    sqft: 980,
    neighborhood: "Belltown",
    description:
      "Corner loft on the ninth floor of a converted 1910 warehouse with 14-foot ceilings, exposed brick, and west-facing windows over Elliott Bay. The building has a rooftop deck, secure bike storage, and a 24-hour concierge. Light rail and the ferry terminal are both within a fifteen-minute walk. HOA is $620 per month and covers water, garbage, and building insurance.",
    features: ["Harbor views", "Rooftop deck", "Concierge", "Bike storage", "In-unit laundry"],
  },
  {
    id: "cedar-family",
    title: "Five-Bedroom Colonial on a Quiet Cul-de-Sac",
    price: 1195000,
    beds: 5,
    baths: 3.5,
    sqft: 3400,
    neighborhood: "Bellevue",
    description:
      "Spacious two-story home with a finished basement, three-car garage, and a level quarter-acre lot on a cul-de-sac. The primary suite has a walk-in closet and soaking tub. Assigned to Bellevue School District with the middle school under a mile away. A community pool and tennis courts are included in the $95 monthly HOA. Commute to downtown Seattle is about 25 minutes by car off-peak, 45 minutes at rush hour.",
    features: ["Finished basement", "Three-car garage", "Community pool", "Level lot", "Central air conditioning"],
  },
  {
    id: "capitol-townhome",
    title: "Modern Townhome Near Volunteer Park",
    price: 899000,
    beds: 3,
    baths: 2.5,
    sqft: 1620,
    neighborhood: "Capitol Hill",
    description:
      "Built in 2019, this three-level townhome has a rooftop terrace with views of the Space Needle, a one-car garage with an EV charger, and radiant floor heating. The ground floor bedroom works well as a guest room or office. Walk Score of 94: groceries, cafes, and the light rail station are all within ten minutes on foot. No HOA.",
    features: ["Rooftop terrace", "EV charger", "Radiant heating", "No HOA", "Walk Score 94"],
  },
  {
    id: "lakeview-rambler",
    title: "Mid-Century Rambler with Lake Access",
    price: 985000,
    beds: 4,
    baths: 2,
    sqft: 2200,
    neighborhood: "Kirkland",
    description:
      "Single-level 1962 rambler on a half-acre lot with deeded access to a shared private dock on Lake Washington. Original hardwood floors, a wood-burning fireplace, and a large covered patio. The kitchen and bathrooms are original and would benefit from updating. The septic system was inspected in 2024. Bus to downtown Kirkland stops at the end of the street.",
    features: ["Shared private dock", "Half-acre lot", "Single-level living", "Wood-burning fireplace", "Covered patio"],
  },
  {
    id: "pioneer-studio",
    title: "Compact Studio in Pioneer Square",
    price: 329000,
    beds: 0,
    baths: 1,
    sqft: 520,
    neighborhood: "Pioneer Square",
    description:
      "Efficient studio in a 1905 brick building with tall windows, a Murphy bed, and a galley kitchen with full-size appliances. The building is pet-friendly and has a shared laundry room and a small courtyard. Steps from the stadiums and the King Street transit hub. HOA is $410 per month. Street parking only; a monthly garage spot is available nearby for about $250.",
    features: ["Murphy bed", "Pet-friendly building", "Courtyard", "Near King Street Station", "Tall windows"],
  },
  {
    id: "greenlake-duplex",
    title: "Owner-Occupied Duplex Near Green Lake",
    price: 1050000,
    beds: 4,
    baths: 3,
    sqft: 2650,
    neighborhood: "Green Lake",
    description:
      "Side-by-side duplex with a three-bedroom owner's unit and a one-bedroom rental currently leased at $1,950 per month through next August. Each unit has its own entrance, laundry, and meter. The shared backyard has raised garden beds. Green Lake park is a five-minute walk, and the bus to the University of Washington runs every ten minutes.",
    features: ["Rental unit with tenant in place", "Separate meters", "Raised garden beds", "Two laundry sets", "Near Green Lake park"],
  },
  {
    id: "queen-anne-victorian",
    title: "Restored Victorian on Queen Anne Hill",
    price: 1650000,
    beds: 4,
    baths: 3,
    sqft: 3100,
    neighborhood: "Queen Anne",
    description:
      "An 1898 Victorian with original millwork, stained glass, and a wraparound porch overlooking the city skyline. Systems were fully updated in 2018: plumbing, electrical, and a high-efficiency furnace. The top floor is a private suite with its own bath. Steep lot with a terraced garden and a one-car garage accessed from the alley. Downtown is a fifteen-minute bus ride; the Seattle Center is a ten-minute walk.",
    features: ["Skyline views", "Wraparound porch", "Original stained glass", "Updated systems (2018)", "Alley garage"],
  },
  {
    id: "columbia-city-bungalow",
    title: "Starter Bungalow Near Columbia City Station",
    price: 589000,
    beds: 2,
    baths: 1,
    sqft: 1100,
    neighborhood: "Columbia City",
    description:
      "A tidy 1940s bungalow on a flat lot with a fenced yard and a large unfinished basement that could be converted to more living space. The roof was replaced in 2022. Light rail is a six-minute walk, putting downtown at about 15 minutes by train. The main street with restaurants and a Saturday farmers market is two blocks away. One bathroom only; laundry is in the basement.",
    features: ["Six minutes to light rail", "Unfinished basement", "New roof (2022)", "Fenced yard", "Flat lot"],
  },
  {
    id: "fremont-condo",
    title: "Two-Bedroom Condo Steps from the Fremont Bridge",
    price: 675000,
    beds: 2,
    baths: 2,
    sqft: 1150,
    neighborhood: "Fremont",
    description:
      "Third-floor corner unit in a 2008 building with a south-facing balcony, an open kitchen with an island, and two full bathrooms. Comes with one deeded garage space and a storage locker. The Burke-Gilman Trail is at the door for biking to the University of Washington or downtown. HOA is $540 per month and includes water, sewer, garbage, and earthquake insurance. The building allows up to two pets under 50 pounds each.",
    features: ["Deeded garage space", "South-facing balcony", "On the Burke-Gilman Trail", "Two pets allowed", "Storage locker"],
  },
];

export function getListing(id: string): Listing | undefined {
  return listings.find((listing) => listing.id === id);
}

export function formatPrice(price: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(price);
}
