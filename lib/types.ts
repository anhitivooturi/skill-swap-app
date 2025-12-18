export type UserAvailability = Record<string, string[]>;

export type UserProfile = {
  uid: string;
  name: string;
  photoUrl: string;
  bio: string;

  skillsOffer: string[];
  skillsWant: string[];

  availability: UserAvailability;

  locationName: string;
  address: string;
  lat: number;
  lng: number;
  radiusMiles: number;

  createdAt?: any;
  updatedAt?: any;
};

export type SwipeDirection = "like" | "pass";

export type SwipeDoc = {
  fromUid: string;
  toUid: string;
  direction: SwipeDirection;
  createdAt?: any;
};

export type MatchDoc = {
  users: [string, string];
  createdAt?: any;
  lastMessageAt?: any;
  lastMessageText?: string;
};

export type MessageDoc = {
  fromUid: string;
  text: string;
  createdAt?: any;
};
