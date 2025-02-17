# Ride-Sharing Application

A comprehensive ride-sharing platform designed to connect riders and drivers seamlessly through an intuitive web application.

## Features

- User Authentication (Login/Register)
- Ride Management
  - Offer rides with detailed information
  - Book available rides
  - Real-time notifications for ride requests/responses
- User Profiles
  - Favorite locations
  - Theme preferences
  - Safety information
- Comprehensive Ride Details
  - Car information
  - Parcel acceptance
  - Time-limited offers
  - Comments and additional details

## Key Components

### Server-Side (/server)

- `routes.ts`: API endpoints for all functionality
- `storage.ts`: In-memory data storage implementation
- `auth.ts`: User authentication system

### Client-Side (/client/src)

#### Pages
- `auth-page.tsx`: User authentication interface
- `home-page.tsx`: Main dashboard with all features

#### Hooks
- `use-auth.tsx`: Authentication state management
- `use-notifications.tsx`: Real-time notification system

### Shared
- `schema.ts`: Data models and validation schemas

## Data Models

### User
- Username
- Password (hashed)
- Name
- Phone
- Theme preference
- Profile image

### Ride
- From/To locations
- Date and time
- Available seats
- Price
- Car details
- Parcel acceptance
- Expiration time
- Comments

### Booking
- Ride reference
- User reference
- Status (pending/accepted/rejected)
- Parcel flag

### Notification
- Title
- Message
- Type
- Read status
- Related ride/booking references

## API Endpoints

### Authentication
- POST /api/register
- POST /api/login
- POST /api/logout
- GET /api/user

### Rides
- POST /api/rides
- GET /api/rides
- POST /api/bookings
- PATCH /api/bookings/:id/status
- GET /api/bookings/history

### Profile
- PATCH /api/profile
- PATCH /api/profile/theme
- POST /api/locations
- GET /api/locations

### Notifications
- GET /api/notifications
- PATCH /api/notifications/:id/read

## Usage

1. Register a new account or login
2. As a driver:
   - Navigate to "Offer a Ride" tab
   - Fill in ride details including car information
   - Monitor notifications for booking requests
   - Accept or reject ride requests
3. As a rider:
   - Check available rides in "Take a Ride" tab
   - Book a ride
   - Monitor notifications for booking status
4. Manage your profile:
   - Set theme preferences
   - Add favorite locations
   - Update safety information
