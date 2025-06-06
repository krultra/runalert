# RunAlert Project Structure

## Root Directory
- `/docs`: Documentation files for the project
- `/public`: Static assets like images, icons, and fonts
- `/app`: Main Next.js application directory (uses App Router pattern)
- `/components`: Reusable UI components
- `/lib`: Utility functions and shared code
- `/styles`: Global CSS and styling utilities

## Key Directories and Files

### App Directory (`/app`)
The application uses Next.js App Router architecture:

- `/app/page.tsx`: Main landing page component
- `/app/layout.tsx`: Root layout that applies to all routes
- `/app/demo`: Demo pages showcasing different UI implementations
  - `/app/demo/shadcn`: Shadcn UI demo with race status messaging
  - `/app/demo/messages`: Alternative message display implementations
- `/app/components`: App-specific components
  - `/app/components/Navigation.tsx`: Global navigation header component
- `/app/contexts`: React context providers
  - `/app/contexts/AuthContext.tsx`: Authentication context
- `/app/styles`: App-specific styling

### Components Directory (`/components`)
- `/components/ui`: Shadcn UI components
  - `/components/ui/accordion.tsx`: Accordion component used for messages
  - `/components/ui/button.tsx`: Button components
  - `/components/ui/card.tsx`: Card components
  - `/components/ui/alert.tsx`: Alert components for notifications

### CSS Modules
- `/app/demo/shadcn/accordion-override.module.css`: CSS module for accordion styling overrides
- `/app/components/navigation-override.module.css`: CSS module for navigation styling overrides

### Public Directory (`/public`)
- `/public/icons`: Application icons including the RunAlert logo

## Key Component Hierarchies

### Message Display System
- `ShadcnDemoPage` (in `/app/demo/shadcn/page.tsx`)
  - Race Status Message Component
  - Message Filtering Controls
  - Accordion Message List
    - Message Headers with Priority Icons
    - Message Content in Accordion Content

### Navigation System
- `Navigation` (in `/app/components/Navigation.tsx`)
  - Logo and Branding Elements
  - Dark/Light Mode Toggle
  - Menu Controls

## Data Flow

1. Authentication data flows through the AuthContext
2. Message data is currently hardcoded in demo components but will be fetched from backend APIs in production
3. Race status messages will be controlled by administrators and distributed to all users
4. User interface state (like dark/light mode) is managed locally with React hooks
