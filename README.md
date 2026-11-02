# Next.js Boilerplate

Modern **Next.js 15.3** boilerplate with **TypeScript** & **Tailwind CSS**

Live Demo: https://nextjs15-boilerplate.vercel.app/en

## Project structure

```shell
│
├── .husky                          # Husky git hook scripts
├── messages                        # i18n messages
├── public                          # Public assets folder
├── src
│   ├── app                         # Next JS App (App Router)
│   ├── assets                      # Static assets (images, fonts, etc.)
│   ├── components                  # React components
│   │   ├── icons                   # svg icons
│   │   ├── features                # Components with hooks and calculations
│   │   ├── shared                  # Header, footer, aside components
│   │   ├── skeletons               # Loading components
│   │   ├── ui                      # Atomic components
│   │   └── widgets                 # Advanced UI components
│   ├── constants                   # Project-wide constants
│   ├── data                        # Static or mock data
│   ├── helpers                     # Reusable utility functions (e.g., API, formatting, storage)
│   ├── hooks                       # Reusable custom React hooks
│   ├── i18n                        # Internationalization setup
│   ├── lib                         # Common utility functions
│   ├── providers                   # Global context providers (theme, data fetching, notifications, i18n)
│   ├── schemas                     # Validation schemas
│   ├── services                    # API request functions
│   ├── stores                      # Global state
│   ├── types                       # TypeScript type definitions
│   └── .middleware                 # Middleware for Next.js
├── .env                            # Environment variables
├── .gitignore                      # Git ignore rules
├── .prettierrc                     # Prettier config
├── components.json                 # shadcn/ui config
├── eslint.config.mjs               # ESLint config
├── next.config.mjs                 # Next.js config
├── package.json                    # Project dependencies and scripts
├── postcss.config.js               # PostCSS config
├── README.md                       # README file
├── tailwind.config.js              # Tailwind CSS config
└── tsconfig.json                   # TypeScript config
```

## File Naming Conventions

The project follows consistent file naming conventions:

| File Type      | Example          | Style      |
| -------------- | ---------------- | ---------- |
| Component      | `LoginForm.tsx`  | PascalCase |
| Hook           | `useLogin.ts`    | camelCase  |
| Helper, Schema | `form-schema.ts` | kebab-case |
| Folder         | `login-form/`    | kebab-case |
| Constants      | `ALPHA_REGEX`    | SNAKE_CASE |

