import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  name: text("name"),
  phone: text("phone"),
  theme: text("theme").default("dark"),
  profileImage: text("profile_image")
});

export const favoriteLocations = pgTable("favorite_locations", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  name: text("name").notNull(),
  address: text("address").notNull(),
  type: text("type").notNull() // home, work, college
});

export const rides = pgTable("rides", {
  id: serial("id").primaryKey(),
  driverId: integer("driver_id").notNull(),
  from: text("from_location").notNull(),
  to: text("to_location").notNull(),
  date: text("date").notNull(),
  time: text("time").notNull(),
  seats: integer("seats").notNull(),
  price: integer("price").notNull(),
  available: boolean("available").notNull().default(true),
  expiresAt: timestamp("expires_at").notNull(),
  acceptsParcel: boolean("accepts_parcel").default(false),
  carModel: text("car_model"),
  carNumber: text("car_number"),
  comments: text("comments")
});

export const bookings = pgTable("bookings", {
  id: serial("id").primaryKey(),
  rideId: integer("ride_id").notNull(),
  userId: integer("user_id").notNull(),
  status: text("status").notNull().default("pending"), // pending, accepted, rejected
  isParcel: boolean("is_parcel").default(false),
  createdAt: timestamp("created_at").defaultNow()
});

export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  title: text("title").notNull(),
  message: text("message").notNull(),
  type: text("type").notNull(), // ride_request, ride_response, system
  read: boolean("read").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  relatedRideId: integer("related_ride_id"),
  relatedBookingId: integer("related_booking_id")
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  name: true,
  phone: true,
  theme: true,
  profileImage: true
});

export const insertFavoriteLocationSchema = createInsertSchema(favoriteLocations).pick({
  name: true,
  address: true,
  type: true
});

export const insertRideSchema = createInsertSchema(rides).pick({
  from: true,
  to: true,
  date: true,
  time: true,
  seats: true,
  price: true,
  acceptsParcel: true,
  carModel: true,
  carNumber: true,
  comments: true
}).extend({
  expiresAt: z.string()
});

export const insertBookingSchema = createInsertSchema(bookings).pick({
  rideId: true,
  isParcel: true
});

export const insertNotificationSchema = createInsertSchema(notifications).pick({
  title: true,
  message: true,
  type: true,
  relatedRideId: true,
  relatedBookingId: true
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type FavoriteLocation = typeof favoriteLocations.$inferSelect;
export type InsertFavoriteLocation = z.infer<typeof insertFavoriteLocationSchema>;
export type Ride = typeof rides.$inferSelect;
export type InsertRide = z.infer<typeof insertRideSchema>;
export type Booking = typeof bookings.$inferSelect;
export type InsertBooking = z.infer<typeof insertBookingSchema>;
export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = z.infer<typeof insertNotificationSchema>;