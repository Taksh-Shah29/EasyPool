import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { storage } from "./storage";
import { insertRideSchema, insertBookingSchema, insertFavoriteLocationSchema } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  setupAuth(app);

  // Profile routes
  app.patch("/api/profile", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const updatedUser = await storage.updateUserProfile(req.user!.id, req.body);
    res.json(updatedUser);
  });

  app.patch("/api/profile/theme", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const { theme } = req.body;
    const updatedUser = await storage.updateUserTheme(req.user!.id, theme);
    res.json(updatedUser);
  });

  // Favorite locations
  app.post("/api/locations", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    const parseResult = insertFavoriteLocationSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json(parseResult.error);
    }

    const location = await storage.createFavoriteLocation(req.user!.id, parseResult.data);
    res.status(201).json(location);
  });

  app.get("/api/locations", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const locations = await storage.getFavoriteLocations(req.user!.id);
    res.json(locations);
  });

  // Rides
  app.post("/api/rides", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    const parseResult = insertRideSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json(parseResult.error);
    }

    const ride = await storage.createRide(req.user!.id, parseResult.data);
    res.status(201).json(ride);
  });

  app.get("/api/rides", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const rides = await storage.getAvailableRides();
    res.json(rides);
  });

  // Bookings
  app.post("/api/bookings", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    const parseResult = insertBookingSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json(parseResult.error);
    }

    const booking = await storage.createBooking(req.user!.id, parseResult.data);

    // Get ride details for the notification
    const ride = await storage.getRide(parseResult.data.rideId);
    if (ride) {
      // Create in-memory notification for the driver
      await storage.createNotification({
        userId: ride.driverId,
        title: "New Ride Request",
        message: `${req.user!.name} wants to book your ride from ${ride.from} to ${ride.to}`,
        type: "ride_request",
        relatedRideId: ride.id,
        relatedBookingId: booking.id
      });
    }

    res.status(201).json(booking);
  });

  app.patch("/api/bookings/:id/status", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    const { status } = req.body;
    const bookingId = parseInt(req.params.id);

    const booking = await storage.updateBookingStatus(bookingId, status);

    // Create in-memory notification for the rider
    await storage.createNotification({
      userId: booking.userId,
      title: `Ride Request ${status.charAt(0).toUpperCase() + status.slice(1)}`,
      message: status === 'accepted' 
        ? "Great news! Your ride request has been accepted." 
        : "Sorry, your ride request has been declined.",
      type: "ride_response",
      relatedRideId: booking.rideId,
      relatedBookingId: booking.id
    });

    res.json(booking);
  });

  app.get("/api/bookings/history", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const bookings = await storage.getUserBookings(req.user!.id);
    const offeredRides = await storage.getUserOfferedRides(req.user!.id);
    res.json({ bookings, offeredRides });
  });

  // Notifications
  app.get("/api/notifications", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const notifications = await storage.getUserNotifications(req.user!.id);
    res.json(notifications);
  });

  app.patch("/api/notifications/:id/read", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    await storage.markNotificationAsRead(parseInt(req.params.id));
    res.sendStatus(200);
  });

  const httpServer = createServer(app);
  return httpServer;
}