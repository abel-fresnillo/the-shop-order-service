import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  RESEND_API_KEY: z.string().min(1),
  EMAIL_FROM: z.string().min(1),
  EMAIL_RECIPIENT: z.string().email(),
  ORDER_API_KEY: z.string().min(32),
  ALLOWED_ORIGINS: z
    .string()
    .transform((val) => val.split(',').map((s) => s.trim()))
    .pipe(z.array(z.string().url()).min(1)),
  ALLOWED_ORIGIN_PATTERN: z.string().optional(),
  DATABASE_URL: z.string().url(),
});

const result = envSchema.safeParse(process.env);

if (!result.success) {
  const missing = result.error.issues.map((i) => i.path.join('.')).join(', ');
  throw new Error(`Missing or invalid environment variables: ${missing}`);
}

export const config = result.data;
