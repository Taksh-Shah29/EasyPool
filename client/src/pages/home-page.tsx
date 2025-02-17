import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertRideSchema } from "@shared/schema";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Loader2, LogOut, Bell, Car, Settings } from "lucide-react";
import { useNotifications } from '@/hooks/use-notifications';

export default function HomePage() {
  const { user, logoutMutation } = useAuth();
  const { toast } = useToast();
  const { notifications, loading: loadingNotifications, markAsRead } = useNotifications();

  const offerRideForm = useForm({
    resolver: zodResolver(insertRideSchema),
    defaultValues: {
      from: "",
      to: "",
      date: "",
      time: "",
      seats: 1,
      price: 0,
      acceptsParcel: false,
      carModel: "",
      carNumber: "",
      comments: "",
      expiresAt: ""
    }
  });

  const { data: availableRides, isLoading: loadingRides } = useQuery({
    queryKey: ["/api/rides"]
  });

  const { data: history, isLoading: loadingHistory } = useQuery({
    queryKey: ["/api/bookings/history"]
  });


  const { data: favoriteLocations = [], isLoading: loadingLocations } = useQuery({
    queryKey: ["/api/locations"]
  });

  const offerRideMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/rides", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/rides"] });
      queryClient.invalidateQueries({ queryKey: ["/api/bookings/history"] });
      toast({
        title: "Success",
        description: "Ride posted successfully!"
      });
      offerRideForm.reset();
    }
  });

  const bookRideMutation = useMutation({
    mutationFn: async (rideId: number) => {
      const res = await apiRequest("POST", "/api/bookings", { rideId });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/rides"] });
      queryClient.invalidateQueries({ queryKey: ["/api/bookings/history"] });
      toast({
        title: "Success",
        description: "Ride request sent to driver!"
      });
    }
  });

  const updateBookingStatusMutation = useMutation({
    mutationFn: async ({ bookingId, status }: { bookingId: number; status: string }) => {
      const res = await apiRequest("PATCH", `/api/bookings/${bookingId}/status`, { status });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/bookings/history"] });
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
      toast({
        title: "Success",
        description: "Booking status updated successfully!"
      });
    }
  });

  const addFavoriteLocationMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/locations", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/locations"] });
      toast({
        title: "Success",
        description: "Location added to favorites!"
      });
    }
  });

  const updateThemeMutation = useMutation({
    mutationFn: async (theme: string) => {
      const res = await apiRequest("PATCH", "/api/profile/theme", { theme });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      toast({
        title: "Success",
        description: "Theme updated successfully!"
      });
    }
  });

  const markNotificationReadMutation = useMutation({
    mutationFn: async (notificationId: number) => {
      const res = await apiRequest("PATCH", `/api/notifications/${notificationId}/read`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
    }
  });

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold">Welcome, {user?.name}</h1>
            <div className="relative">
              <Button variant="outline" size="icon">
                <Bell className="h-4 w-4" />
                {notifications.some(n => !n.read) && (
                  <span className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full" />
                )}
              </Button>
            </div>
            <Button variant="outline" size="icon">
              <Settings className="h-4 w-4" />
            </Button>
          </div>
          <Button variant="outline" onClick={() => logoutMutation.mutate()}>
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </Button>
        </div>

        <Tabs defaultValue="offer">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="offer">Offer a Ride</TabsTrigger>
            <TabsTrigger value="take">Take a Ride</TabsTrigger>
            <TabsTrigger value="history">Ride History</TabsTrigger>
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
          </TabsList>

          <TabsContent value="offer">
            <Card>
              <CardHeader>
                <CardTitle>Offer a Ride</CardTitle>
              </CardHeader>
              <CardContent>
                <Form {...offerRideForm}>
                  <form onSubmit={offerRideForm.handleSubmit(data => offerRideMutation.mutate(data))} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={offerRideForm.control}
                        name="from"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>From</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={offerRideForm.control}
                        name="to"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>To</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={offerRideForm.control}
                        name="date"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Date</FormLabel>
                            <FormControl>
                              <Input type="date" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={offerRideForm.control}
                        name="time"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Time</FormLabel>
                            <FormControl>
                              <Input type="time" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={offerRideForm.control}
                        name="expiresAt"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Offer Expires At</FormLabel>
                            <FormControl>
                              <Input type="datetime-local" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={offerRideForm.control}
                        name="seats"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Available Seats</FormLabel>
                            <FormControl>
                              <Input type="number" min="1" {...field} onChange={e => field.onChange(parseInt(e.target.value))} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={offerRideForm.control}
                        name="price"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Price per Seat</FormLabel>
                            <FormControl>
                              <Input type="number" min="0" {...field} onChange={e => field.onChange(parseInt(e.target.value))} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={offerRideForm.control}
                        name="carModel"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Car Model</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={offerRideForm.control}
                        name="carNumber"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Car Number</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={offerRideForm.control}
                        name="acceptsParcel"
                        render={({ field }) => (
                          <FormItem className="flex items-center gap-2">
                            <FormControl>
                              <Input
                                type="checkbox"
                                className="w-4 h-4"
                                checked={field.value}
                                onChange={e => field.onChange(e.target.checked)}
                              />
                            </FormControl>
                            <FormLabel>Accepts Parcels</FormLabel>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <FormField
                      control={offerRideForm.control}
                      name="comments"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Additional Comments</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button type="submit" className="w-full" disabled={offerRideMutation.isPending}>
                      {offerRideMutation.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        "Post Ride"
                      )}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="take">
            <Card>
              <CardHeader>
                <CardTitle>Available Rides</CardTitle>
              </CardHeader>
              <CardContent>
                {loadingRides ? (
                  <div className="flex justify-center p-4">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                ) : availableRides?.length === 0 ? (
                  <p className="text-center text-muted-foreground">No rides available</p>
                ) : (
                  <div className="space-y-4">
                    {availableRides?.map((ride: any) => (
                      <Card key={ride.id}>
                        <CardContent className="p-4">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-medium">{ride.from} → {ride.to}</p>
                              <p className="text-sm text-muted-foreground">
                                {ride.date} at {ride.time}
                              </p>
                              <p className="text-sm">
                                {ride.seats} seats • ${ride.price} per seat
                              </p>
                              {ride.acceptsParcel && (
                                <p className="text-sm text-green-500">Accepts parcels</p>
                              )}
                              {ride.comments && (
                                <p className="text-sm mt-2">{ride.comments}</p>
                              )}
                            </div>
                            <Button
                              onClick={() => bookRideMutation.mutate(ride.id)}
                              disabled={bookRideMutation.isPending}
                            >
                              {bookRideMutation.isPending ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                "Book Ride"
                              )}
                            </Button>
                          </div>
                          <div className="mt-4 pt-4 border-t">
                            <p className="text-sm font-medium">Driver & Vehicle Details:</p>
                            <div className="flex items-center gap-2 mt-2">
                              <Car className="h-4 w-4" />
                              <p className="text-sm">{ride.carModel} • {ride.carNumber}</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="history">
            <Card>
              <CardHeader>
                <CardTitle>Ride History</CardTitle>
              </CardHeader>
              <CardContent>
                {loadingHistory ? (
                  <div className="flex justify-center p-4">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div>
                      <h3 className="font-medium mb-4">Rides Offered</h3>
                      {history?.offeredRides?.length === 0 ? (
                        <p className="text-muted-foreground">No rides offered yet</p>
                      ) : (
                        <div className="space-y-4">
                          {history?.offeredRides?.map((ride: any) => (
                            <Card key={ride.id}>
                              <CardContent className="p-4">
                                <p className="font-medium">{ride.from} → {ride.to}</p>
                                <p className="text-sm text-muted-foreground">
                                  {ride.date} at {ride.time}
                                </p>
                                <p className="text-sm">
                                  {ride.seats} seats • ${ride.price} per seat
                                </p>
                                <p className="text-sm text-muted-foreground mt-2">
                                  Status: {ride.available ? "Available" : "Booked"}
                                </p>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      )}
                    </div>

                    <div>
                      <h3 className="font-medium mb-4">Rides Booked</h3>
                      {history?.bookings?.length === 0 ? (
                        <p className="text-muted-foreground">No rides booked yet</p>
                      ) : (
                        <div className="space-y-4">
                          {history?.bookings?.map((booking: any) => (
                            <Card key={booking.id}>
                              <CardContent className="p-4">
                                <p className="font-medium">{booking.ride.from} → {booking.ride.to}</p>
                                <p className="text-sm text-muted-foreground">
                                  {booking.ride.date} at {booking.ride.time}
                                </p>
                                <p className="text-sm">${booking.ride.price} per seat</p>
                                <p className="text-sm text-muted-foreground mt-2">
                                  Status: {booking.status}
                                </p>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="profile">
            <div className="grid gap-4">
              <Card>
                <CardHeader>
                  <CardTitle>Profile Settings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Theme</Label>
                    <div className="flex gap-4 mt-2">
                      <Button
                        variant={user?.theme === "light" ? "default" : "outline"}
                        onClick={() => updateThemeMutation.mutate("light")}
                      >
                        Light
                      </Button>
                      <Button
                        variant={user?.theme === "dark" ? "default" : "outline"}
                        onClick={() => updateThemeMutation.mutate("dark")}
                      >
                        Dark
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Favorite Locations</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {loadingLocations ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      favoriteLocations.map((location: any) => (
                        <div key={location.id} className="flex justify-between items-center">
                          <div>
                            <p className="font-medium">{location.name}</p>
                            <p className="text-sm text-muted-foreground">{location.address}</p>
                          </div>
                          <span className="text-sm bg-secondary px-2 py-1 rounded">{location.type}</span>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Safety</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <p>Emergency Contact: <strong>{user?.phone}</strong></p>
                    <p className="text-sm text-muted-foreground">
                      Your emergency contact will be notified in case of any safety concerns.
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Help & Support</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <p>Need help? Contact our support team:</p>
                    <p className="text-sm">Email: support@rideshare.com</p>
                    <p className="text-sm">Phone: 1-800-RIDE-HELP</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="notifications">
            <Card>
              <CardHeader>
                <CardTitle>Notifications</CardTitle>
              </CardHeader>
              <CardContent>
                {loadingNotifications ? (
                  <div className="flex justify-center p-4">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                ) : notifications.length === 0 ? (
                  <p className="text-center text-muted-foreground">No notifications</p>
                ) : (
                  <div className="space-y-4">
                    {notifications.map((notification) => (
                      <Card
                        key={notification.id}
                        className={notification.read ? "opacity-70" : ""}
                      >
                        <CardContent className="p-4">
                          <div className="flex justify-between">
                            <div>
                              <p className="font-medium">{notification.title}</p>
                              <p className="text-sm text-muted-foreground">
                                {notification.message}
                              </p>
                              <p className="text-xs text-muted-foreground mt-2">
                                {new Date(notification.createdAt).toLocaleString()}
                              </p>
                            </div>
                            {notification.type === "ride_request" && (
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  onClick={() =>
                                    updateBookingStatusMutation.mutate({
                                      bookingId: notification.relatedBookingId!,
                                      status: "accepted"
                                    })
                                  }
                                >
                                  Accept
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() =>
                                    updateBookingStatusMutation.mutate({
                                      bookingId: notification.relatedBookingId!,
                                      status: "rejected"
                                    })
                                  }
                                >
                                  Reject
                                </Button>
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}