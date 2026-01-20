# Eric's Barbers Auth and Booking API

## Description
Eric's Barbers API is a backend service for managing barbershop bookings, user authentication, notifications, and payments. It provides RESTful endpoints for clients to interact with barbers, book appointments, receive notifications, and handle payments securely. The API integrates with external services for email and calendar management.

## Technologies Used
- [NestJS](https://nestjs.com/) - Progressive Node.js framework for building efficient and scalable server-side applications
- [Prisma ORM](https://www.prisma.io/) - Type-safe database ORM
- [TypeScript](https://www.typescriptlang.org/) - Strongly typed JavaScript
- [Jest](https://jestjs.io/) - Testing framework

## 3rd Party Integrations
- [Resend Email API Service](https://resend.com/) - Transactional email delivery
- [Google Calendar API Service](https://developers.google.com/calendar) - Calendar event management

## Getting Started

### Prerequisites
- Node.js >= 18.x
- npm >= 9.x
- PostgreSQL (or your preferred database)

### Installation
```bash
npm install
```

### Environment Setup
Create a `.env` file in the root directory and configure the following variables:
```
DATABASE_URL=postgresql://user:password@localhost:5432/erics_barber
RESEND_API_KEY=your_resend_api_key
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
```

### Database Migration
```bash
npx prisma migrate deploy
```

### Running the Application
```bash
npm run start:dev
```

### Testing
```bash
npm run test
npm run test:e2e
```

## Folder Structure
```
src/
  app.controller.ts        # Main controller
  app.module.ts            # Root module
  app.service.ts           # Main service
  main.ts                  # Entry point
  common/                  # Shared utilities, guards, interceptors
  config/                  # Configuration modules/services
  generated/               # Prisma generated types/models
  infrastructure/          # Logger, mail, payment, prisma services
  modules/                 # Feature modules (auth, barbers, booking, etc.)
  test/                    # End-to-end and unit tests
prisma/
  schema.prisma            # Database schema
  migrations/              # Migration files
```

## API Documentation
- View the API endpoints: [https://erics-barber-api.onrender.com/api](https://erics-barber-api.onrender.com/api)
- OpenAPI/Swagger documentation is available at `/api` when running locally.

## Contributing
Pull requests are welcome! For major changes, please open an issue first to discuss what you would like to change.

## License
MIT