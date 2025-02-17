import { User, InsertUser, Ride, InsertRide, Booking, InsertBooking, 
         FavoriteLocation, InsertFavoriteLocation, Notification, InsertNotification } from "@shared/schema";
import session from "express-session";
import createMemoryStore from "memorystore";

const MemoryStore = createMemoryStore(session);

export interface IStorage {
  // User related
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserTheme(userId: number, theme: string): Promise<User>;
  updateUserProfile(userId: number, profile: Partial<User>): Promise<User>;

  // Favorite locations
  createFavoriteLocation(userId: number, location: InsertFavoriteLocation): Promise<FavoriteLocation>;
  getFavoriteLocations(userId: number): Promise<FavoriteLocation[]>;

  // Rides
  createRide(userId: number, ride: InsertRide): Promise<Ride>;
  getRide(id: number): Promise<Ride | undefined>;
  getAvailableRides(): Promise<Ride[]>;

  // Bookings
  createBooking(userId: number, booking: InsertBooking): Promise<Booking>;
  updateBookingStatus(bookingId: number, status: string): Promise<Booking>;
  getUserBookings(userId: number): Promise<(Booking & { ride: Ride })[]>;
  getUserOfferedRides(userId: number): Promise<Ride[]>;

  // Notifications
  createNotification(notification: InsertNotification & { userId: number }): Promise<Notification>;
  getUserNotifications(userId: number): Promise<Notification[]>;
  markNotificationAsRead(notificationId: number): Promise<void>;

  sessionStore: session.Store;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private rides: Map<number, Ride>;
  private bookings: Map<number, Booking>;
  private favoriteLocations: Map<number, FavoriteLocation>;
  private notifications: Map<number, Notification>;
  private currentId: {
    user: number;
    ride: number;
    booking: number;
    favoriteLocation: number;
    notification: number;
  };
  sessionStore: session.Store;

  constructor() {
    this.users = new Map();
    this.rides = new Map();
    this.bookings = new Map();
    this.favoriteLocations = new Map();
    this.notifications = new Map();
    this.currentId = {
      user: 1,
      ride: 1,
      booking: 1,
      favoriteLocation: 1,
      notification: 1
    };
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000
    });
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentId.user++;
    const user = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async updateUserTheme(userId: number, theme: string): Promise<User> {
    const user = await this.getUser(userId);
    if (!user) throw new Error("User not found");
    const updatedUser = { ...user, theme };
    this.users.set(userId, updatedUser);
    return updatedUser;
  }

  async updateUserProfile(userId: number, profile: Partial<User>): Promise<User> {
    const user = await this.getUser(userId);
    if (!user) throw new Error("User not found");
    const updatedUser = { ...user, ...profile };
    this.users.set(userId, updatedUser);
    return updatedUser;
  }

  // Favorite locations methods
  async createFavoriteLocation(userId: number, location: InsertFavoriteLocation): Promise<FavoriteLocation> {
    const id = this.currentId.favoriteLocation++;
    const newLocation = { ...location, id, userId };
    this.favoriteLocations.set(id, newLocation);
    return newLocation;
  }

  async getFavoriteLocations(userId: number): Promise<FavoriteLocation[]> {
    return Array.from(this.favoriteLocations.values())
      .filter(location => location.userId === userId);
  }

  // Ride methods
  async createRide(userId: number, ride: InsertRide): Promise<Ride> {
    const id = this.currentId.ride++;
    const newRide = { ...ride, id, driverId: userId, available: true };
    this.rides.set(id, newRide);
    return newRide;
  }

  async getRide(id: number): Promise<Ride | undefined> {
    return this.rides.get(id);
  }

  async getAvailableRides(): Promise<Ride[]> {
    return Array.from(this.rides.values())
      .filter(ride => ride.available && new Date(ride.expiresAt) > new Date());
  }

  // Booking methods
  async createBooking(userId: number, booking: InsertBooking): Promise<Booking> {
    const id = this.currentId.booking++;
    const newBooking = {
      ...booking,
      id,
      userId,
      status: "pending",
      createdAt: new Date()
    };

    const ride = await this.getRide(booking.rideId);
    if (!ride) throw new Error("Ride not found");

    this.bookings.set(id, newBooking);
    return newBooking;
  }

  async updateBookingStatus(bookingId: number, status: string): Promise<Booking> {
    const booking = this.bookings.get(bookingId);
    if (!booking) throw new Error("Booking not found");

    const updatedBooking = { ...booking, status };
    this.bookings.set(bookingId, updatedBooking);

    if (status === "accepted") {
      const ride = await this.getRide(booking.rideId);
      if (ride) {
        ride.available = false;
        this.rides.set(ride.id, ride);
      }
    }

    return updatedBooking;
  }

  async getUserBookings(userId: number): Promise<(Booking & { ride: Ride })[]> {
    const userBookings = Array.from(this.bookings.values())
      .filter(booking => booking.userId === userId);

    return userBookings.map(booking => ({
      ...booking,
      ride: this.rides.get(booking.rideId)!
    }));
  }

  async getUserOfferedRides(userId: number): Promise<Ride[]> {
    return Array.from(this.rides.values())
      .filter(ride => ride.driverId === userId);
  }

  // Notification methods
  async createNotification(notification: InsertNotification & { userId: number }): Promise<Notification> {
    const id = this.currentId.notification++;
    const newNotification = {
      ...notification,
      id,
      read: false,
      createdAt: new Date()
    };
    this.notifications.set(id, newNotification);
    return newNotification;
  }

  async getUserNotifications(userId: number): Promise<Notification[]> {
    return Array.from(this.notifications.values())
      .filter(notification => notification.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async markNotificationAsRead(notificationId: number): Promise<void> {
    const notification = this.notifications.get(notificationId);
    if (notification) {
      notification.read = true;
      this.notifications.set(notificationId, notification);
    }
  }
}

export const storage = new MemStorage();