import { upsertUserProfile } from "./lib/firestore.ts";

const FAKE_USERS = [
  {
    uid: "fake_user_1",
    name: "Alex the Designer",
    bio: "I can help with UI/UX and Figma. Looking to learn React Native!",
    skillsOffer: ["UI Design", "Figma", "Branding"],
    skillsWant: ["React Native", "Firebase"],
    lat: 34.0522, 
    lng: -118.2437,
    radiusMiles: 50,
    locationName: "Los Angeles, CA",
    photoUrl: "https://via.placeholder.com/150",
  },
  {
    uid: "fake_user_2",
    name: "Jordan Coder",
    bio: "Backend pro. I need help with my app's visual design.",
    skillsOffer: ["Node.js", "Python", "PostgreSQL"],
    skillsWant: ["UI Design", "Tailwind CSS"],
    lat: 34.0600, 
    lng: -118.2500,
    radiusMiles: 50,
    locationName: "Echo Park, CA",
    photoUrl: "https://via.placeholder.com/150",
  }

  {
  uid: "piano_pro_phx",
  name: "Sarah Melody",
  bio: "Classical pianist for 15 years. I'd love to trade piano lessons for some help with mobile app development!",
  skillsOffer: ["Piano", "Music Theory", "Classical Music"],
  skillsWant: ["React Native", "JavaScript", "Coding"],
  // Downtown Phoenix Coordinates
  lat: 33.4484, 
  lng: -112.0740,
  radiusMiles: 25,
  locationName: "Phoenix, AZ",
  photoUrl: "https://via.placeholder.com/150",
}
];

async function seed() {
  console.log("🌱 Seeding users...");
  for (const user of FAKE_USERS) {
    await upsertUserProfile(user as any);
    console.log(`Added: ${user.name}`);
  }
  console.log("✅ Done!");
}

seed();