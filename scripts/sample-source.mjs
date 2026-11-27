// Source of the sample/demo content. Run `node scripts/generate-sample.mjs` after editing.
const U = (id, w) => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${w}&q=80`;
const GV = (f) => `https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/${f}`;

export const categories = [
  { slug: "single-photos", name: "Single Photos", description: "Individual portraits that capture personality, style and expression.", featured: true,
    photos: [["1529626455594-4ff0802cfb7e","Golden Hour Portrait"],["1494790108377-be9c29b29330","Natural Smile"],["1507003211169-0a1dd7228f2d","Classic Studio Portrait"],["1438761681033-6461ffad8d80","Soft Light Study"],["1500648767791-00dcc994a43e","Confident Gaze"]] },
  { slug: "group-photos", name: "Group Photos", description: "Families, friends and teams framed together in one memorable moment.", featured: true,
    photos: [["1529156069898-49953e39b3ac","Friends Forever"],["1511632765486-a01980e01a18","Weekend Together"],["1543269865-cbf427effbad","Shared Laughter"],["1528605248644-14dd04022da1","Team Spirit"]] },
  { slug: "wedding", name: "Wedding Photography", description: "Timeless wedding stories, from the first look to the last dance.", featured: true,
    photos: [["1519741497674-611481863552","The First Dance"],["1511285560929-80b456fea0bc","Vows at Sunset"],["1465495976277-4387d4b0b4c6","Bridal Details"],["1522673607200-164d1b6ce486","Just Married"],["1519225421980-715cb0215aed","Reception Lights"]] },
  { slug: "birthday", name: "Birthday Photography", description: "Colourful celebrations, candles, cake and genuine joy.", featured: true,
    photos: [["1530103862676-de8c9debad1d","Balloons & Wishes"],["1464349095431-e9a21285b5f3","Make a Wish"],["1513151233558-d860c5398176","Confetti Moments"],["1558636508-e0db3814bd1d","Party Table"]] },
  { slug: "engagement", name: "Engagement Photography", description: "The promise of forever, captured with warmth and intimacy.", featured: true,
    photos: [["1516589178581-6cd7833ae3b2","Hand in Hand"],["1515934751635-c81c6bc9a2d8","The Ring"],["1518199266791-5375a83190b7","Together"],["1502635385003-ee1e6a1a742d","A Quiet Moment"]] },
  { slug: "functions-events", name: "Functions & Events", description: "Ceremonies, corporate events and cultural functions covered end to end.", featured: true,
    photos: [["1492684223066-81342ee5ff30","Celebration Night"],["1540575467063-178a50c2df87","Conference Keynote"],["1511578314322-379afb476865","Gala Evening"],["1516450360452-9312f5e86fc7","Live on Stage"]] },
  { slug: "outdoor", name: "Outdoor Photography", description: "Natural light, open landscapes and on-location sessions.", featured: false,
    photos: [["1506744038136-46273834b3fb","Valley at Dawn"],["1469474968028-56623f02e42e","Into the Light"],["1501785888041-af3ef285b470","Mirror Lake"],["1470071459604-3b5ec3a7fe05","Misty Hills"]] },
  { slug: "other", name: "Other Photography", description: "Product, creative and special assignments beyond the usual.", featured: false,
    photos: [["1452587925148-ce544e77e70d","Behind the Lens"],["1542038784456-1ea8e935640e","Field Work"],["1516035069371-29a1b244cc32","Glass & Light"],["1554080353-a576cf803bda","The Craft"]] },
];

export const videos = [
  { title: "i Fotoz Studio Showreel", description: "A quick look at the moments we love to capture.", url: GV("ForBiggerBlazes.mp4"), thumb: U("1554080353-a576cf803bda", 1200), featured: true },
  { title: "Wedding Highlights", description: "Highlights from a beautiful wedding celebration.", url: GV("ForBiggerEscapes.mp4"), thumb: U("1519741497674-611481863552", 1200), featured: true },
  { title: "Event Coverage Reel", description: "Functions and events, covered with care from start to finish.", url: GV("ForBiggerJoyrides.mp4"), thumb: U("1492684223066-81342ee5ff30", 1200), featured: true },
];

export const settings = {
  site_name: "i Fotoz",
  tagline: "Every Frame Tells a Story.",
  email: "cnu.kunchala@gmail.com",
  phone: "+91 98493 05063",
  phone2: "",
  whatsapp: "919849305063",
  address: "Main Road, City Centre, Your City",
  map_embed_url: "",
  business_hours: "Mon – Sat: 9:30 AM – 8:30 PM · Sunday by appointment",
  instagram_url: "https://www.instagram.com/jfilms_ifotozphotography/",
  facebook_url: "",
  youtube_url: "https://www.youtube.com/@sreenuification",
  hero_heading: "Every Frame Tells a Story.",
  hero_description: "Weddings, portraits, celebrations and events — photographed with patience, craft and an eye for the moments that matter.",
  hero_image_url: U("1511285560929-80b456fea0bc", 2400),
  about_heading: "A family studio built on trust and craft",
  about_text: "i Fotoz is led by a professionally trained photographer with a Bachelor of Fine Arts (BFA) from JNTUH. That fine-arts foundation shapes every frame — composition, light and colour come first.\n\nFor years, i Fotoz has photographed the milestones of families in our city — weddings, engagements, birthdays and everyday portraits. We work with care, keep things relaxed in front of the camera, and deliver images you will be proud to keep for a lifetime.\n\nFrom a single portrait in our studio to complete event coverage, every session gets the same attention to light, detail and emotion.",
  about_image_url: "/photographer.jpg",
  photographer_name: "",
  photographer_credentials: "BFA · JNTUH",
  banner_enabled: true,
  banner_text: "Now booking wedding & engagement shoots for the new season",
  banner_link: "/contact",
};

export { U };
