import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, MapPin, Calendar, Users, Star, Plane, Building, Package } from 'lucide-react';

const Home = () => {
  const [searchType, setSearchType] = useState('hotels');
  const [searchData, setSearchData] = useState({
    destination: '',
    checkIn: '',
    checkOut: '',
    guests: 1,
  });
  const navigate = useNavigate();

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchType === 'hotels') {
      navigate('/search/hotels', { state: searchData });
    } else {
      navigate('/search/flights', { state: searchData });
    }
  };

  const featuredDestinations = [
    {
      id: 1,
      name: 'New York City',
      image: 'https://images.pexels.com/photos/290386/pexels-photo-290386.jpeg',
      hotels: 1200,
      startingPrice: 1991,
    },
    {
      id: 2,
      name: 'Paris',
      image: 'https://images.pexels.com/photos/338515/pexels-photo-338515.jpeg',
      hotels: 800,
      startingPrice: 2993,
    },
    {
      id: 3,
      name: 'Tokyo',
      image: 'https://images.pexels.com/photos/248195/pexels-photo-248195.jpeg',
      hotels: 950,
      startingPrice: 2493,
    },
    {
      id: 4,
      name: 'London',
      image: 'https://images.pexels.com/photos/460672/pexels-photo-460672.jpeg',
      hotels: 750,
      startingPrice: 1790,
    },
  ];

  const features = [
    {
      icon: Building,
      title: 'Best Hotels',
      description: 'Find and book the perfect accommodation for your stay',
    },
    {
      icon: Plane,
      title: 'Flight Deals',
      description: 'Compare and book flights at the best prices',
    },
    {
      icon: Package,
      title: 'Travel Packages',
      description: 'Complete travel packages designed by experts',
    },
    {
      icon: Star,
      title: 'Trusted Reviews',
      description: 'Real reviews from verified travelers',
    },
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-r from-primary-600 to-primary-800 text-white">
        <div className="absolute inset-0 bg-black opacity-20"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Discover Your Next Adventure
            </h1>
            <p className="text-xl md:text-2xl text-primary-100 max-w-3xl mx-auto">
              Book hotels, flights, and complete travel packages with ease. Your perfect trip is just a click away.
            </p>
          </div>

         
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Why Choose Travora?</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              We make travel planning simple and enjoyable with our comprehensive booking platform
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div key={index} className="text-center">
                  <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Icon className="w-8 h-8 text-primary-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">{feature.title}</h3>
                  <p className="text-gray-600">{feature.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Featured Destinations */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Popular Destinations</h2>
            <p className="text-lg text-gray-600">Discover amazing places around the world</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {featuredDestinations.map((destination) => (
             
                <div className="card overflow-hidden hover:shadow-lg transition-shadow">
                  <div className="relative h-48">
                    <img
                      src={destination.image}
                      alt={destination.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
                    <div className="absolute bottom-4 left-4 text-white">
                      <h3 className="text-xl font-semibold">{destination.name}</h3>
                      <p className="text-sm opacity-90">{destination.hotels} hotels</p>
                    </div>
                  </div>
                  <div className="p-4">
                    <p className="text-gray-600">Starting from</p>
                    <p className="text-2xl font-bold text-primary-600">₹{destination.startingPrice}</p>
                    <p className="text-sm text-gray-500">per night</p>
                  </div>
                </div>
              
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-primary-600 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Start Your Journey?</h2>
          <p className="text-xl text-primary-100 mb-8 max-w-2xl mx-auto">
            Join thousands of travelers who trust Travora for their booking needs
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/auth/signup"
              className="bg-white text-primary-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
            >
              Sign Up Now
            </Link>
            
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;