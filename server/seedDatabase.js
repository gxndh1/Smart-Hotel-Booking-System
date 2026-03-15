import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/user.model.js';
import Hotel from './models/hotel.model.js';
import Room from './models/room.model.js';
import Booking from './models/booking.model.js';
import Payment from './models/payment.model.js';
import Review from './models/review.model.js';
import LoyaltyAccount from './models/loyalty.model.js';
import Redemption from './models/redemption.model.js';

dotenv.config();

const seedData = async () => {
  try {
    const mongoUrl = process.env.MONGO_URL || 'mongodb://localhost:27017/smart-hotel-booking';
    await mongoose.connect(mongoUrl);
    console.log('Connected to MongoDB...');

    // Drop the database to ensure a fresh start
    await mongoose.connection.db.dropDatabase();
    console.log('Existing database dropped.');

    // 1. Create Admin
    const admin = await User.create({
      name: 'Animesh Gandhi',
      email: 'admin@hotel.com',
      password: 'password123',
      role: 'admin',
      contactNumber: '7783099238'
    });
    console.log('Admin user created.');

    // 1.5 Create Guests
    const guests = await User.create([
      {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123',
        role: 'guest',
        contactNumber: '1112223333'
      },
      {
        name: 'Jane Smith',
        email: 'jane@example.com',
        password: 'password123',
        role: 'guest',
        contactNumber: '4445556666'
      }
    ]);
    console.log('Guest users created.');

    // 2. Define Hotels Data
    const hotelsData = [
      {
        name: 'The Grand Regency',
        location: 'Mumbai, Maharashtra',
        description: 'Experience luxury in the heart of the city with world-class amenities and service.',
        amenities: ['Free WiFi', 'Swimming Pool', 'Valet Parking', '24/7 Room Service', 'Business Center'],
        image: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=800',
        rooms: [
          { type: 'Executive Suite', price: 8500, capacity: 2, totalRooms: 5, features: ['King Size Bed', 'City View', 'Work Desk', 'Bathtub'], image: 'https://images.unsplash.com/photo-1590490360182-c33d57733427?w=800' },
          { type: 'Deluxe Room', price: 4500, capacity: 2, totalRooms: 10, features: ['Queen Size Bed', 'Mini Fridge', 'AC', 'TV'], image: 'https://images.unsplash.com/photo-1566665797739-1674de7a421a?w=800' }
        ]
      },
      {
        name: 'Ocean Breeze Resort',
        location: 'Goa',
        description: 'A beautiful beachside resort with stunning views of the Arabian Sea.',
        amenities: ['Beach Access', 'Spa', 'Bar', 'Outdoor Pool'],
        image: 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=800',
        rooms: [
          { type: 'Sea View Suite', price: 12000, capacity: 2, totalRooms: 3, features: ['Private Balcony', 'Jacuzzi', 'Mini Bar'], image: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800' },
          { type: 'Garden Villa', price: 7000, capacity: 3, totalRooms: 5, features: ['Private Garden', 'Outdoor Shower'], image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800' }
        ]
      },
      {
        name: 'Mountain View Inn',
        location: 'Manali, Himachal Pradesh',
        description: 'Cozy stay nestled in the Himalayas, perfect for nature lovers.',
        amenities: ['Fireplace', 'Trekking Tours', 'Restaurant', 'Free Parking'],
        image: 'https://images.unsplash.com/photo-1611892440504-42a792e24d32?w=800',
        rooms: [
          { type: 'Himalayan Suite', price: 6000, capacity: 2, totalRooms: 4, features: ['Mountain View', 'Heater', 'Wooden Interior'], image: 'https://images.unsplash.com/photo-1590490360182-c33d57733427?w=800' },
          { type: 'Standard Cabin', price: 3000, capacity: 2, totalRooms: 8, features: ['Balcony', 'Tea Maker'], image: 'https://images.unsplash.com/photo-1566665797739-1674de7a421a?w=800' }
        ]
      },
      {
        name: 'Urban Oasis',
        location: 'Bangalore, Karnataka',
        description: 'Modern hotel in the heart of the tech city, ideal for business travelers.',
        amenities: ['High-speed WiFi', 'Gym', 'Conference Room', 'Roof-top Cafe'],
        image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800',
        rooms: [
          { type: 'Business Studio', price: 5500, capacity: 1, totalRooms: 12, features: ['Work Desk', 'Ergonomic Chair', 'Smart TV'], image: 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=800' },
          { type: 'Premium Double', price: 7500, capacity: 2, totalRooms: 15, features: ['King Bed', 'City View', 'Coffee Machine'], image: 'https://images.unsplash.com/photo-1611892440504-42a792e24d32?w=800' }
        ]
      }
    ];

    const allHotels = [];
    const allRooms = [];

    // 3. Create Managers, Hotels and Rooms
    for (const hData of hotelsData) {
      // Generate manager email based on hotel name (lowercase, no spaces)
      const managerEmail = hData.name.toLowerCase().replace(/\s+/g, '') + '@manager.com';
      
      const manager = await User.create({
        name: `${hData.name} Manager`,
        email: managerEmail,
        password: 'manager123@',
        role: 'manager',
        contactNumber: '9876543210'
      });
      console.log(`Manager created for ${hData.name}: ${managerEmail}`);

      const hotel = await Hotel.create({
        name: hData.name,
        location: hData.location,
        description: hData.description,
        amenities: hData.amenities,
        image: hData.image,
        managerId: manager._id,
        rating: 0
      });
      allHotels.push(hotel);
      console.log(`Hotel created: ${hData.name}`);

      const roomsWithHotelId = hData.rooms.map(r => ({ 
        ...r, 
        hotelId: hotel._id, 
        availability: true 
      }));
      const createdRooms = await Room.create(roomsWithHotelId);
      allRooms.push(...createdRooms);
      console.log(`Rooms created for ${hData.name}`);
    }

    // 4. Create Bookings
    const booking1 = await Booking.create({
      userId: guests[0]._id,
      roomId: allRooms[0]._id,
      numberOfRooms: 1,
      checkInDate: new Date(Date.now() + 86400000 * 2), // 2 days from now
      checkOutDate: new Date(Date.now() + 86400000 * 5),
      status: 'confirmed'
    });

    const booking2 = await Booking.create({
      userId: guests[1]._id,
      roomId: allRooms[2]._id,
      numberOfRooms: 1,
      checkInDate: new Date(Date.now() - 86400000 * 10), // 10 days ago
      checkOutDate: new Date(Date.now() - 86400000 * 7),
      status: 'completed'
    });
    console.log('Bookings created.');

    // 5. Create Reviews
    await Review.create([
      {
        userId: guests[1]._id,
        hotelId: allHotels[0]._id,
        rating: 5,
        comment: 'Amazing stay! The service was top-notch.'
      },
      {
        userId: guests[0]._id,
        hotelId: allHotels[1]._id,
        rating: 4,
        comment: 'Great view and comfortable rooms.'
      }
    ]);
    console.log('Reviews created.');

    // 6. Update Hotel Ratings based on reviews
    for (const hotel of allHotels) {
      const reviews = await Review.find({ hotelId: hotel._id });
      if (reviews.length > 0) {
        const avgRating = (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1);
        hotel.rating = parseFloat(avgRating);
        await hotel.save();
      }
    }
    console.log('Hotel ratings updated.');

    console.log('Database seeded successfully with fresh data!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
};

seedData();