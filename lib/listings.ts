export type PropertyType = "house" | "condo" | "townhome" | "multi-family";

export type Listing = {
  id: string;
  title: string;
  type: PropertyType;
  price: number;
  beds: number;
  baths: number;
  sqft: number;
  yearBuilt: number;
  neighborhood: string;
  description: string;
  features: string[];
  image: string;
};

export const PROPERTY_TYPE_LABELS: Record<PropertyType, string> = {
  house: "House",
  condo: "Condo",
  townhome: "Townhome",
  "multi-family": "Multi-family",
};

export const listings: Listing[] = [
  {
    id: "maple-craftsman",
    title: "Renovated Craftsman on Maple Street",
    type: "house",
    price: 745000,
    beds: 3,
    baths: 2,
    sqft: 1850,
    yearBuilt: 1924,
    neighborhood: "Ballard",
    description:
      "A 1920s Craftsman with a full 2021 renovation: new roof, updated electrical, and a chef's kitchen with quartz counters. The fenced backyard has a mature apple tree and a detached studio that works as an office. Two blocks from the elementary school and a ten-minute walk to the farmers market.",
    features: ["Detached office studio", "Fenced backyard", "New roof (2021)", "Gas range", "Off-street parking for two cars"],
    image: "/listings/maple-craftsman.svg",
  },
  {
    id: "harbor-loft",
    title: "Top-Floor Loft with Harbor Views",
    type: "condo",
    price: 615000,
    beds: 1,
    baths: 1,
    sqft: 980,
    yearBuilt: 1910,
    neighborhood: "Belltown",
    description:
      "Corner loft on the ninth floor of a converted 1910 warehouse with 14-foot ceilings, exposed brick, and west-facing windows over Elliott Bay. The building has a rooftop deck, secure bike storage, and a 24-hour concierge. Light rail and the ferry terminal are both within a fifteen-minute walk. HOA is $620 per month and covers water, garbage, and building insurance.",
    features: ["Harbor views", "Rooftop deck", "Concierge", "Bike storage", "In-unit laundry"],
    image: "/listings/harbor-loft.svg",
  },
  {
    id: "cedar-family",
    title: "Five-Bedroom Colonial on a Quiet Cul-de-Sac",
    type: "house",
    price: 1195000,
    beds: 5,
    baths: 3.5,
    sqft: 3400,
    yearBuilt: 1996,
    neighborhood: "Bellevue",
    description:
      "Spacious two-story home with a finished basement, three-car garage, and a level quarter-acre lot on a cul-de-sac. The primary suite has a walk-in closet and soaking tub. Assigned to Bellevue School District with the middle school under a mile away. A community pool and tennis courts are included in the $95 monthly HOA. Commute to downtown Seattle is about 25 minutes by car off-peak, 45 minutes at rush hour.",
    features: ["Finished basement", "Three-car garage", "Community pool", "Level lot", "Central air conditioning"],
    image: "/listings/cedar-family.svg",
  },
  {
    id: "capitol-townhome",
    title: "Modern Townhome Near Volunteer Park",
    type: "townhome",
    price: 899000,
    beds: 3,
    baths: 2.5,
    sqft: 1620,
    yearBuilt: 2019,
    neighborhood: "Capitol Hill",
    description:
      "Built in 2019, this three-level townhome has a rooftop terrace with views of the Space Needle, a one-car garage with an EV charger, and radiant floor heating. The ground floor bedroom works well as a guest room or office. Walk Score of 94: groceries, cafes, and the light rail station are all within ten minutes on foot. No HOA.",
    features: ["Rooftop terrace", "EV charger", "Radiant heating", "No HOA", "Walk Score 94"],
    image: "/listings/capitol-townhome.svg",
  },
  {
    id: "lakeview-rambler",
    title: "Mid-Century Rambler with Lake Access",
    type: "house",
    price: 985000,
    beds: 4,
    baths: 2,
    sqft: 2200,
    yearBuilt: 1962,
    neighborhood: "Kirkland",
    description:
      "Single-level 1962 rambler on a half-acre lot with deeded access to a shared private dock on Lake Washington. Original hardwood floors, a wood-burning fireplace, and a large covered patio. The kitchen and bathrooms are original and would benefit from updating. The septic system was inspected in 2024. Bus to downtown Kirkland stops at the end of the street.",
    features: ["Shared private dock", "Half-acre lot", "Single-level living", "Wood-burning fireplace", "Covered patio"],
    image: "/listings/lakeview-rambler.svg",
  },
  {
    id: "pioneer-studio",
    title: "Compact Studio in Pioneer Square",
    type: "condo",
    price: 329000,
    beds: 0,
    baths: 1,
    sqft: 520,
    yearBuilt: 1905,
    neighborhood: "Pioneer Square",
    description:
      "Efficient studio in a 1905 brick building with tall windows, a Murphy bed, and a galley kitchen with full-size appliances. The building is pet-friendly and has a shared laundry room and a small courtyard. Steps from the stadiums and the King Street transit hub. HOA is $410 per month. Street parking only; a monthly garage spot is available nearby for about $250.",
    features: ["Murphy bed", "Pet-friendly building", "Courtyard", "Near King Street Station", "Tall windows"],
    image: "/listings/pioneer-studio.svg",
  },
  {
    id: "greenlake-duplex",
    title: "Owner-Occupied Duplex Near Green Lake",
    type: "multi-family",
    price: 1050000,
    beds: 4,
    baths: 3,
    sqft: 2650,
    yearBuilt: 1948,
    neighborhood: "Green Lake",
    description:
      "Side-by-side duplex with a three-bedroom owner's unit and a one-bedroom rental currently leased at $1,950 per month through next August. Each unit has its own entrance, laundry, and meter. The shared backyard has raised garden beds. Green Lake park is a five-minute walk, and the bus to the University of Washington runs every ten minutes.",
    features: ["Rental unit with tenant in place", "Separate meters", "Raised garden beds", "Two laundry sets", "Near Green Lake park"],
    image: "/listings/greenlake-duplex.svg",
  },
  {
    id: "queen-anne-victorian",
    title: "Restored Victorian on Queen Anne Hill",
    type: "house",
    price: 1650000,
    beds: 4,
    baths: 3,
    sqft: 3100,
    yearBuilt: 1898,
    neighborhood: "Queen Anne",
    description:
      "An 1898 Victorian with original millwork, stained glass, and a wraparound porch overlooking the city skyline. Systems were fully updated in 2018: plumbing, electrical, and a high-efficiency furnace. The top floor is a private suite with its own bath. Steep lot with a terraced garden and a one-car garage accessed from the alley. Downtown is a fifteen-minute bus ride; the Seattle Center is a ten-minute walk.",
    features: ["Skyline views", "Wraparound porch", "Original stained glass", "Updated systems (2018)", "Alley garage"],
    image: "/listings/queen-anne-victorian.svg",
  },
  {
    id: "columbia-city-bungalow",
    title: "Starter Bungalow Near Columbia City Station",
    type: "house",
    price: 589000,
    beds: 2,
    baths: 1,
    sqft: 1100,
    yearBuilt: 1941,
    neighborhood: "Columbia City",
    description:
      "A tidy 1940s bungalow on a flat lot with a fenced yard and a large unfinished basement that could be converted to more living space. The roof was replaced in 2022. Light rail is a six-minute walk, putting downtown at about 15 minutes by train. The main street with restaurants and a Saturday farmers market is two blocks away. One bathroom only; laundry is in the basement.",
    features: ["Six minutes to light rail", "Unfinished basement", "New roof (2022)", "Fenced yard", "Flat lot"],
    image: "/listings/columbia-city-bungalow.svg",
  },
  {
    id: "fremont-condo",
    title: "Two-Bedroom Condo Steps from the Fremont Bridge",
    type: "condo",
    price: 675000,
    beds: 2,
    baths: 2,
    sqft: 1150,
    yearBuilt: 2008,
    neighborhood: "Fremont",
    description:
      "Third-floor corner unit in a 2008 building with a south-facing balcony, an open kitchen with an island, and two full bathrooms. Comes with one deeded garage space and a storage locker. The Burke-Gilman Trail is at the door for biking to the University of Washington or downtown. HOA is $540 per month and includes water, sewer, garbage, and earthquake insurance. The building allows up to two pets under 50 pounds each.",
    features: ["Deeded garage space", "South-facing balcony", "On the Burke-Gilman Trail", "Two pets allowed", "Storage locker"],
    image: "/listings/fremont-condo.svg",
  },
  {
    id: "alki-view-home",
    title: "Sound-View Home Above Alki Beach",
    type: "house",
    price: 1125000,
    beds: 3,
    baths: 2.5,
    sqft: 2100,
    yearBuilt: 1978,
    neighborhood: "West Seattle",
    description:
      "Split-level home on a hillside lot with unobstructed views of Puget Sound and the Olympic Mountains from the living room, kitchen, and a 300-square-foot cedar deck. The lower level has a family room with a second fireplace and a separate entrance. Windows and siding were replaced in 2020. Alki Beach is a twelve-minute walk downhill; the water taxi to downtown takes about fifteen minutes. Two-car garage plus a boat-length driveway.",
    features: ["Puget Sound views", "Cedar deck", "Separate lower-level entrance", "New windows (2020)", "Near water taxi"],
    image: "/listings/alki-view-home.svg",
  },
  {
    id: "redmond-trail-townhome",
    title: "End-Unit Townhome on the Redmond Central Connector",
    type: "townhome",
    price: 779000,
    beds: 2,
    baths: 2.5,
    sqft: 1400,
    yearBuilt: 2016,
    neighborhood: "Redmond",
    description:
      "End-unit townhome with windows on three sides, an open main floor, and a fenced patio that opens directly onto the Redmond Central Connector trail. Both bedrooms are en suite. The attached two-car tandem garage has a 240-volt outlet. Microsoft's main campus is a ten-minute bike ride and the downtown Redmond light rail station is under a mile. HOA is $310 per month and covers exterior maintenance, roof, and landscaping.",
    features: ["Direct trail access", "Two en-suite bedrooms", "Tandem two-car garage", "240V outlet", "Ten minutes to Microsoft by bike"],
    image: "/listings/redmond-trail-townhome.svg",
  },
  {
    id: "wallingford-tudor",
    title: "Brick Tudor with ADU Potential in Wallingford",
    type: "house",
    price: 1010000,
    beds: 3,
    baths: 1.75,
    sqft: 1900,
    yearBuilt: 1928,
    neighborhood: "Wallingford",
    description:
      "Classic 1928 brick Tudor with arched doorways, leaded glass, and a wood-burning fireplace flanked by built-ins. The daylight basement has eight-foot ceilings, a three-quarter bath, and a separate exterior door, and could be converted to an accessory dwelling unit under current zoning. Sewer line was replaced in 2019; the furnace is a 2015 high-efficiency model. Gas Works Park and the Burke-Gilman Trail are a ten-minute walk, and the 44 bus to the University of Washington and Ballard stops one block away.",
    features: ["Daylight basement", "ADU potential", "Leaded glass windows", "New sewer line (2019)", "One block to the 44 bus"],
    image: "/listings/wallingford-tudor.svg",
  },
  {
    id: "slu-condo",
    title: "One-Bedroom Condo by Lake Union Park",
    type: "condo",
    price: 529000,
    beds: 1,
    baths: 1,
    sqft: 720,
    yearBuilt: 2014,
    neighborhood: "South Lake Union",
    description:
      "Fifth-floor unit in a 2014 steel-and-concrete building with floor-to-ceiling windows, a balcony facing Lake Union, and a den nook that fits a desk. The building has a gym, a rooftop lounge with barbecue grills, and a guest suite that owners can reserve. One garage space and a bike locker are included. HOA is $480 per month and covers water, sewer, garbage, gas, and the concierge. The streetcar stops outside, and Amazon's headquarters campus is a five-minute walk.",
    features: ["Lake Union views", "Den nook", "Rooftop lounge", "Guest suite", "Streetcar at the door"],
    image: "/listings/slu-condo.svg",
  },
  {
    id: "issaquah-acreage",
    title: "Farmhouse-Style Home on 1.2 Acres in Issaquah",
    type: "house",
    price: 1395000,
    beds: 4,
    baths: 3,
    sqft: 2800,
    yearBuilt: 2004,
    neighborhood: "Issaquah",
    description:
      "A 2004 farmhouse-style home on a 1.2-acre lot bordering a greenbelt, with a wraparound porch, a great room with vaulted ceilings, and a main-floor primary suite. The 900-square-foot detached shop has power and a loft. The lot is zoned to allow up to two horses and has a fenced pasture. Water is from a private well tested in 2025; the septic system was pumped and inspected the same year. Issaquah High School is a seven-minute drive, and I-90 is ten minutes away for a 30-minute off-peak commute to Seattle.",
    features: ["1.2-acre lot", "Detached shop with loft", "Horses allowed", "Main-floor primary suite", "Borders a greenbelt"],
    image: "/listings/issaquah-acreage.svg",
  },
  {
    id: "beacon-hill-triplex",
    title: "Three-Unit Building Near Beacon Hill Station",
    type: "multi-family",
    price: 1275000,
    beds: 6,
    baths: 3,
    sqft: 3000,
    yearBuilt: 1955,
    neighborhood: "Beacon Hill",
    description:
      "Fully occupied triplex with three two-bedroom units, each with its own meter and in-unit laundry. Two units are leased at $2,100 per month through spring and one is month-to-month at $1,950, for a gross rent of $6,150 per month. Roof replaced in 2021 and all three water heaters replaced in 2023. Four off-street parking spaces in the rear. The Beacon Hill light rail station is a four-minute walk and Jefferson Park with the golf course is five blocks away.",
    features: ["Three units, fully leased", "Gross rent $6,150 per month", "Separate meters", "New roof (2021)", "Four minutes to light rail"],
    image: "/listings/beacon-hill-triplex.svg",
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
