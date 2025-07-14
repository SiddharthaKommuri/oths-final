// Mock data for hotels, flights, and packages
export const mockHotels = [
  {
    id: 1,
    name: 'Grand Plaza Hotel',
    location: 'New York, NY',
    rating: 4.5,
    price: 299,
    roomsAvailable: 5,
    image: 'https://images.pexels.com/photos/258154/pexels-photo-258154.jpeg',
    amenities: ['WiFi', 'Pool', 'Gym', 'Spa', 'Restaurant'],
    description: 'Luxury hotel in the heart of Manhattan with stunning city views and world-class amenities.',
    checkInTime: '3:00 PM',
    checkOutTime: '11:00 AM'
  },
  {
    id: 2,
    name: 'Ocean View Resort',
    location: 'Miami, FL',
    rating: 4.8,
    price: 450,
    roomsAvailable: 3,
    image: 'https://images.pexels.com/photos/261102/pexels-photo-261102.jpeg',
    amenities: ['Beach Access', 'Pool', 'Restaurant', 'Bar', 'Spa'],
    description: 'Beachfront resort with stunning ocean views and direct beach access.',
    checkInTime: '4:00 PM',
    checkOutTime: '12:00 PM'
  },
  {
    id: 3,
    name: 'Mountain Lodge',
    location: 'Denver, CO',
    rating: 4.3,
    price: 199,
    roomsAvailable: 8,
    image: 'https://images.pexels.com/photos/338504/pexels-photo-338504.jpeg',
    amenities: ['Fireplace', 'Hiking Trails', 'Restaurant', 'WiFi'],
    description: 'Cozy lodge nestled in the Rocky Mountains with breathtaking views.',
    checkInTime: '3:00 PM',
    checkOutTime: '11:00 AM'
  },
  {
    id: 4,
    name: 'City Center Hotel',
    location: 'Chicago, IL',
    rating: 4.2,
    price: 249,
    roomsAvailable: 0,
    image: 'https://images.pexels.com/photos/271624/pexels-photo-271624.jpeg',
    amenities: ['WiFi', 'Gym', 'Business Center', 'Restaurant'],
    description: 'Modern hotel in downtown Chicago, perfect for business travelers.',
    checkInTime: '3:00 PM',
    checkOutTime: '11:00 AM'
  },
  {
    id: 5,
    name: 'Sunset Beach Resort',
    location: 'San Diego, CA',
    rating: 4.7,
    price: 389,
    roomsAvailable: 2,
    image: 'https://images.pexels.com/photos/189296/pexels-photo-189296.jpeg',
    amenities: ['Beach Access', 'Pool', 'Spa', 'Restaurant', 'Bar'],
    description: 'Luxury beachfront resort with spectacular sunset views.',
    checkInTime: '4:00 PM',
    checkOutTime: '12:00 PM'
  }
];

export const mockFlights = [
  {
    id: 1,
    airline: 'American Airlines',
    flightNumber: 'AA123',
    from: 'JFK',
    fromCity: 'New York',
    to: 'LAX',
    toCity: 'Los Angeles',
    departure: '08:00',
    arrival: '11:30',
    duration: '5h 30m',
    price: 299,
    class: 'Economy',
    seatsAvailable: 45,
    aircraft: 'Boeing 737'
  },
  {
    id: 2,
    airline: 'Delta Airlines',
    flightNumber: 'DL456',
    from: 'JFK',
    fromCity: 'New York',
    to: 'LAX',
    toCity: 'Los Angeles',
    departure: '14:15',
    arrival: '17:45',
    duration: '5h 30m',
    price: 349,
    class: 'Economy',
    seatsAvailable: 23,
    aircraft: 'Airbus A320'
  },
  {
    id: 3,
    airline: 'United Airlines',
    flightNumber: 'UA789',
    from: 'JFK',
    fromCity: 'New York',
    to: 'LAX',
    toCity: 'Los Angeles',
    departure: '19:30',
    arrival: '23:00',
    duration: '5h 30m',
    price: 279,
    class: 'Economy',
    seatsAvailable: 67,
    aircraft: 'Boeing 777'
  },
  {
    id: 4,
    airline: 'Southwest Airlines',
    flightNumber: 'SW234',
    from: 'ORD',
    fromCity: 'Chicago',
    to: 'DEN',
    toCity: 'Denver',
    departure: '10:45',
    arrival: '12:15',
    duration: '2h 30m',
    price: 189,
    class: 'Economy',
    seatsAvailable: 89,
    aircraft: 'Boeing 737'
  },
  {
    id: 5,
    airline: 'JetBlue Airways',
    flightNumber: 'B6567',
    from: 'BOS',
    fromCity: 'Boston',
    to: 'MIA',
    toCity: 'Miami',
    departure: '16:20',
    arrival: '19:45',
    duration: '3h 25m',
    price: 259,
    class: 'Economy',
    seatsAvailable: 34,
    aircraft: 'Airbus A321'
  }
];

export const mockPackages = [
  {
    id: 1,
    name: 'European Adventure',
    location: 'Paris, Rome, Barcelona',
    duration: '10 days',
    basePrice: 2499,
    image: 'https://images.pexels.com/photos/338515/pexels-photo-338515.jpeg',
    description: 'Explore the best of Europe with guided tours through three iconic cities.',
    included: ['Flights', 'Hotels', 'Breakfast', 'City Tours'],
    activities: [
      { id: 1, name: 'Eiffel Tower Tour', price: 45, included: true },
      { id: 2, name: 'Louvre Museum', price: 35, included: true },
      { id: 3, name: 'Colosseum Tour', price: 55, included: true },
      { id: 4, name: 'Vatican Museums', price: 40, included: false },
      { id: 5, name: 'Sagrada Familia', price: 30, included: true },
      { id: 6, name: 'Park Güell', price: 25, included: false },
      { id: 7, name: 'Seine River Cruise', price: 35, included: false },
      { id: 8, name: 'Flamenco Show', price: 60, included: false }
    ],
    maxTravelers: 8,
    rating: 4.8
  },
  {
    id: 2,
    name: 'Tropical Paradise',
    location: 'Maldives',
    duration: '7 days',
    basePrice: 3299,
    image: 'https://images.pexels.com/photos/1287460/pexels-photo-1287460.jpeg',
    description: 'Luxury resort experience in the pristine waters of the Maldives.',
    included: ['Flights', 'Resort', 'All Meals', 'Water Sports'],
    activities: [
      { id: 1, name: 'Snorkeling Tour', price: 75, included: true },
      { id: 2, name: 'Sunset Cruise', price: 85, included: true },
      { id: 3, name: 'Spa Treatment', price: 120, included: false },
      { id: 4, name: 'Scuba Diving', price: 150, included: false },
      { id: 5, name: 'Dolphin Watching', price: 95, included: false },
      { id: 6, name: 'Private Beach Dinner', price: 200, included: false }
    ],
    maxTravelers: 4,
    rating: 4.9
  },
  {
    id: 3,
    name: 'Asian Discovery',
    location: 'Tokyo, Kyoto, Osaka',
    duration: '12 days',
    basePrice: 2899,
    image: 'https://images.pexels.com/photos/248195/pexels-photo-248195.jpeg',
    description: 'Immerse yourself in Japanese culture with this comprehensive tour.',
    included: ['Flights', 'Hotels', 'JR Pass', 'Cultural Tours'],
    activities: [
      { id: 1, name: 'Tokyo City Tour', price: 65, included: true },
      { id: 2, name: 'Mount Fuji Excursion', price: 95, included: true },
      { id: 3, name: 'Traditional Tea Ceremony', price: 45, included: true },
      { id: 4, name: 'Sushi Making Class', price: 80, included: false },
      { id: 5, name: 'Kyoto Temple Tour', price: 55, included: true },
      { id: 6, name: 'Osaka Food Tour', price: 70, included: false },
      { id: 7, name: 'Sumo Wrestling Show', price: 90, included: false }
    ],
    maxTravelers: 12,
    rating: 4.7
  },
  {
    id: 4,
    name: 'Safari Adventure',
    location: 'Kenya & Tanzania',
    duration: '8 days',
    basePrice: 3799,
    image: 'https://images.pexels.com/photos/631317/pexels-photo-631317.jpeg',
    description: 'Experience the Big Five in their natural habitat with expert guides.',
    included: ['Flights', 'Safari Lodges', 'All Meals', 'Game Drives'],
    activities: [
      { id: 1, name: 'Masai Mara Game Drive', price: 120, included: true },
      { id: 2, name: 'Serengeti Safari', price: 150, included: true },
      { id: 3, name: 'Ngorongoro Crater Tour', price: 100, included: true },
      { id: 4, name: 'Hot Air Balloon Safari', price: 450, included: false },
      { id: 5, name: 'Masai Village Visit', price: 75, included: false },
      { id: 6, name: 'Night Game Drive', price: 85, included: false }
    ],
    maxTravelers: 6,
    rating: 4.9
  }
];

// Utility functions for localStorage operations
export const getBookings = () => {
  return JSON.parse(localStorage.getItem('travora_bookings') || '[]');
};

export const saveBooking = (booking) => {
  const bookings = getBookings();
  const newBooking = {
    ...booking,
    id: Date.now(),
    bookingDate: new Date().toISOString(),
    status: 'confirmed'
  };
  bookings.push(newBooking);
  localStorage.setItem('travora_bookings', JSON.stringify(bookings));
  return newBooking;
};

export const updateBooking = (bookingId, updates) => {
  const bookings = getBookings();
  const updatedBookings = bookings.map(booking =>
    booking.id === bookingId ? { ...booking, ...updates } : booking
  );
  localStorage.setItem('travora_bookings', JSON.stringify(updatedBookings));
  return updatedBookings.find(b => b.id === bookingId);
};

export const canCancelBooking = (bookingDate) => {
  const booking = new Date(bookingDate);
  const now = new Date();
  const diffHours = (now - booking) / (1000 * 60 * 60);
  return diffHours <= 12;
};