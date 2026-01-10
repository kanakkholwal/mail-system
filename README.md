# Mail System 📧

A modern, type-safe email service built with Next.js, React Email, and Nodemailer. This FOSS (Free and Open Source Software) project provides a robust API for sending transactional emails with beautiful, customizable templates.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Next.js](https://img.shields.io/badge/Next.js-15.1.3-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)](https://www.typescriptlang.org/)

## ✨ Features

- **🎨 Beautiful Email Templates**: Pre-built, responsive email templates using React Email components
- **🔒 Type-Safe**: Full TypeScript support with Zod schema validation
- **📝 Template Registry**: Centralized template management system
- **⚡ Fast & Modern**: Built on Next.js 15 with React 19
- **🔐 Secure**: Built-in security with server identity verification
- **🎯 Flexible**: Easy to customize and extend with new templates
- **📦 Production Ready**: Includes error handling, validation, and logging

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js**: Version 18.x or higher
- **npm**, **yarn**, or **pnpm**: Package manager (pnpm recommended)
- **SMTP Server**: Access to an SMTP server (e.g., Gmail, SendGrid, Sendinblue)

## 🚀 Quick Start

### 1. Clone the Repository

```bash
git clone https://github.com/kanakkholwal/mail-system.git
cd mail-system
```

### 2. Install Dependencies

```bash
npm install
# or
yarn install
# or
pnpm install
```

### 3. Configure Environment Variables

Copy the example environment file and configure your settings:

```bash
cp .env.example .env
```

Edit `.env` with your SMTP credentials:

```env
# SMTP Configuration
MAIL_EMAIL=your-email@example.com
MAIL_PASSWORD=your-smtp-password
SMTP_HOST=smtp-relay.sendinblue.com

# Security
SERVER_IDENTITY=your-secure-random-key

# Optional
NODE_ENV=development
```

### 4. Run the Development Server

```bash
npm run dev
```

The server will start at `http://localhost:3000`

## 🔧 Configuration

### Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `MAIL_EMAIL` | ✅ | `noreply@nexonauts.com` | SMTP email address |
| `MAIL_PASSWORD` | ✅ | - | SMTP password/app password |
| `SMTP_HOST` | ❌ | `smtp-relay.sendinblue.com` | SMTP server host |
| `SERVER_IDENTITY` | ✅ | - | Security key for API authentication |
| `NODE_ENV` | ❌ | `development` | Environment mode |

### SMTP Configuration

The system supports any SMTP provider. Common configurations:

**Gmail:**
```env
SMTP_HOST=smtp.gmail.com
MAIL_EMAIL=your-email@gmail.com
MAIL_PASSWORD=your-app-password
```

**SendGrid:**
```env
SMTP_HOST=smtp.sendgrid.net
MAIL_EMAIL=apikey
MAIL_PASSWORD=your-sendgrid-api-key
```

**Sendinblue (Brevo):**
```env
SMTP_HOST=smtp-relay.sendinblue.com
MAIL_EMAIL=your-email@example.com
MAIL_PASSWORD=your-smtp-key
```

## 📨 API Usage

### Send Email Endpoint

**Endpoint:** `POST /api/send`

**Request Body:**

```json
{
  "template_key": "welcome_verify",
  "targets": ["user@example.com"],
  "subject": "Welcome to Our Platform!",
  "payload": {
    "name": "John Doe",
    "email": "user@example.com",
    "verificationUrl": "https://example.com/verify?token=abc123"
  }
}
```

**Response (Success):**

```json
{
  "data": ["user@example.com"]
}
```

**Response (Error):**

```json
{
  "error": "Template Validation Failed",
  "message": "Invalid payload for template"
}
```

### Example cURL Request

```bash
curl -X POST http://localhost:3000/api/send \
  -H "Content-Type: application/json" \
  -d '{
    "template_key": "welcome_verify",
    "targets": ["user@example.com"],
    "subject": "Welcome!",
    "payload": {
      "name": "John Doe",
      "email": "user@example.com",
      "verificationUrl": "https://example.com/verify?token=abc123"
    }
  }'
```

### Example JavaScript/Node.js Request

```javascript
const response = await fetch('http://localhost:3000/api/send', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    template_key: 'welcome_verify',
    targets: ['user@example.com'],
    subject: 'Welcome to Our Platform!',
    payload: {
      name: 'John Doe',
      email: 'user@example.com',
      verificationUrl: 'https://example.com/verify?token=abc123'
    }
  })
});

const result = await response.json();
console.log(result);
```

## 📧 Available Email Templates

### 1. Welcome & Verification Email (`welcome_verify`)

**Purpose:** Welcome new users and verify their email address.

**Required Payload:**

```typescript
{
  name: string;              // User's name
  email: string;             // User's email address
  verificationUrl: string;   // URL for email verification
  branding?: {               // Optional branding override
    name?: string;
    logoUrl?: string;
    websiteUrl?: string;
    primaryColor?: string;
  }
}
```

### 2. Password Reset Email (`reset_password`)

**Purpose:** Send password reset instructions to users.

**Required Payload:**

```typescript
{
  name: string;              // User's name
  email: string;             // User's email address
  resetUrl: string;          // URL for password reset
  branding?: {               // Optional branding override
    name?: string;
    logoUrl?: string;
    websiteUrl?: string;
    primaryColor?: string;
  }
}
```

## 🎨 Creating Custom Templates

### Step 1: Create Template Component

Create a new directory in `emails/templates/`:

```bash
mkdir emails/templates/my-template
```

Create `index.tsx`:

```tsx
import { Button } from "@emails/kit/components/button";
import { Layout } from "@emails/kit/components/layout";
import { H1, BodyText } from "@emails/kit/components/typography";
import { Section } from "@react-email/components";
import { MyTemplateProps } from "./schema";

export const MyTemplate = ({ name, actionUrl }: MyTemplateProps) => {
  return (
    <Layout previewText="Your custom email">
      <Section className="my-6">
        <H1>Hello {name}!</H1>
        <BodyText>This is your custom email template.</BodyText>
        <Button href={actionUrl}>Take Action</Button>
      </Section>
    </Layout>
  );
};

export default MyTemplate;
```

### Step 2: Define Schema

Create `schema.ts`:

```tsx
import { z } from "zod";

export const myTemplateSchema = z.object({
  name: z.string(),
  actionUrl: z.string().url(),
});

export type MyTemplateProps = z.infer<typeof myTemplateSchema>;
```

### Step 3: Register Template

Update `emails/registry.ts`:

```tsx
import MyTemplate from "./templates/my-template";
import { myTemplateSchema } from "./templates/my-template/schema";

export const registry = {
  // ... existing templates
  "my_template": {
    component: MyTemplate,
    schema: myTemplateSchema,
  },
} as const;
```

### Step 4: Use Your Template

```bash
curl -X POST http://localhost:3000/api/send \
  -H "Content-Type: application/json" \
  -d '{
    "template_key": "my_template",
    "targets": ["user@example.com"],
    "subject": "Custom Email",
    "payload": {
      "name": "John",
      "actionUrl": "https://example.com/action"
    }
  }'
```

## 🏗️ Project Structure

```
mail-system/
├── app/
│   ├── api/
│   │   └── send/
│   │       └── route.ts          # Email sending API endpoint
│   └── layout.tsx                # Root layout
├── emails/
│   ├── kit/                      # Reusable email components
│   │   ├── components/           # Button, Header, Footer, etc.
│   │   ├── tailwind.ts           # Tailwind configuration
│   │   ├── tokens.ts             # Design tokens
│   │   └── types.ts              # TypeScript types
│   ├── templates/                # Email templates
│   │   ├── welcome-verify/
│   │   └── reset-password/
│   ├── helper.ts                 # Email sending helper functions
│   ├── registry.ts               # Template registry
│   ├── renderer.tsx              # Template renderer
│   └── schema.ts                 # Zod schemas
├── .env.example                  # Example environment variables
├── next.config.ts                # Next.js configuration
├── package.json                  # Dependencies and scripts
├── project.config.ts             # Project configuration
├── tsconfig.json                 # TypeScript configuration
└── README.md                     # This file
```

## 🛠️ Development

### Available Scripts

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm run start

# Lint code
npm run lint

# Format code
npm run format
```

### Code Style

This project uses:
- **TypeScript** for type safety
- **Zod** for runtime validation
- **Prettier** for code formatting
- **ESLint** for code linting

### Adding New Features

1. Create a new branch: `git checkout -b feature/your-feature`
2. Make your changes
3. Run linting: `npm run lint`
4. Format code: `npm run format`
5. Test your changes thoroughly
6. Commit with clear messages
7. Push and create a Pull Request

## 🤝 Contributing

Contributions are welcome! Here's how you can help:

### Reporting Bugs

1. Check if the bug has already been reported
2. Create a new issue with a clear title and description
3. Include steps to reproduce
4. Add relevant logs or screenshots

### Suggesting Enhancements

1. Open an issue describing the enhancement
2. Explain why this enhancement would be useful
3. Provide examples if possible

### Pull Requests

1. Fork the repository
2. Create your feature branch
3. Make your changes following our coding standards
4. Add or update tests if needed
5. Ensure all tests pass
6. Update documentation as needed
7. Submit a pull request

### Code of Conduct

- Be respectful and inclusive
- Provide constructive feedback
- Focus on what's best for the community
- Show empathy towards other contributors

## 🐛 Troubleshooting

### Common Issues

**Issue: "SMTP Authentication Failed"**
- Verify your SMTP credentials are correct
- For Gmail, ensure you're using an App Password, not your regular password
- Check if 2FA is enabled on your email account

**Issue: "Template not found in registry"**
- Verify the template_key matches exactly with registry keys
- Check the spelling and case sensitivity
- Ensure the template is properly registered in `emails/registry.ts`

**Issue: "Invalid payload for template"**
- Check that all required fields are provided
- Verify field types match the schema
- Review the Zod validation error messages in the response

**Issue: "Port 3000 already in use"**
- Kill the process using port 3000: `lsof -ti:3000 | xargs kill -9`
- Or use a different port: `PORT=3001 npm run dev`

### Getting Help

- 📖 Check the [documentation](https://nexonauts.mintlify.app/templates/mail-system)
- 💬 Open an issue on GitHub
- 📧 Contact the maintainers

## 📚 Additional Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [React Email Documentation](https://react.email/docs/introduction)
- [Nodemailer Documentation](https://nodemailer.com/)
- [Zod Documentation](https://zod.dev/)

## 📄 License

This project is licensed under the MIT License - see below for details:

```
MIT License

Copyright (c) 2024 Nexonauts

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

## 🙏 Acknowledgments

- Built with [Next.js](https://nextjs.org/)
- Email templates powered by [React Email](https://react.email/)
- Email delivery via [Nodemailer](https://nodemailer.com/)
- Type safety with [TypeScript](https://www.typescriptlang.org/) and [Zod](https://zod.dev/)

## 📞 Support

If you find this project helpful, please consider:
- ⭐ Starring the repository
- 🐛 Reporting bugs
- 💡 Suggesting new features
- 🤝 Contributing to the codebase
- 📢 Sharing with others

---

Made with ❤️ by the Nexonauts team
