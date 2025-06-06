# RunAlert Technology Stack

## Frontend Technologies

### Core Framework
- **Next.js**: React framework used for server-side rendering and static site generation
- **React**: JavaScript library for building user interfaces
- **TypeScript**: Superset of JavaScript that adds static type definitions

### UI & Styling
- **Tailwind CSS**: Utility-first CSS framework for styling
- **Shadcn UI**: Component library built on Radix UI primitives with Tailwind CSS styling
- **CSS Modules**: For component-specific styles and overrides
- **Radix UI**: Unstyled, accessible components used as the foundation for Shadcn UI

### State Management
- **React Context API**: For global state management (authentication, themes)
- **React Hooks**: For component-level state management

### Authentication
- **Firebase Authentication**: For user authentication and management

## Backend Technologies

### Database
- **Firebase Firestore**: NoSQL database for storing user data, race information, and messages

### Hosting & Deployment
- **Vercel**: For hosting the Next.js application
- **Firebase Hosting**: Alternative deployment option

### APIs & Services
- **Firebase Cloud Functions**: For serverless backend functionality
- **Firebase Cloud Messaging (FCM)**: For push notifications

## Development Tools

### Code Quality
- **ESLint**: JavaScript/TypeScript linting
- **Prettier**: Code formatting

### Build Tools
- **npm/yarn**: Package management
- **Next.js Build**: Building and optimization

### Version Control
- **Git**: Version control system

## Testing
- **Jest**: JavaScript testing framework
- **React Testing Library**: For testing React components

## Performance & Analytics
- **Lighthouse**: For performance monitoring
- **Firebase Analytics**: For usage analytics

## Notes on Technology Choices
- The stack prioritizes modern React patterns with strong typing via TypeScript
- UI components follow a consistent pattern using Shadcn UI and Tailwind
- The application is designed to be deployed as a serverless application
- Authentication and database are handled through Firebase services
- All components should support both light and dark mode theming
