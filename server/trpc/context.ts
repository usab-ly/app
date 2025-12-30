import { initTRPC, TRPCError } from '@trpc/server';
import superjson from 'superjson';
import { ZodError } from 'zod';
import { admin } from './util/db';

export async function createTRPCContext(opts: { headers: Headers }) {
  const { headers } = opts;

  const authHeader = headers.get('authorization');
  let user: admin.auth.DecodedIdToken | null = null;

  if (authHeader?.startsWith('Bearer ')) {
    const idToken = authHeader.substring('Bearer '.length);

    try {
      user = await admin.auth().verifyIdToken(idToken);
    } catch (err) {
      console.error('Failed to verify Firebase ID token', err);
    }
  }

  return {
    ...opts,
    user, // null if not logged in or invalid token
  };
}

const t = initTRPC.context<typeof createTRPCContext>().create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError:
          error.cause instanceof ZodError ? error.cause.flatten() : null,
      },
    };
  },
});

export const createCallerFactory = t.createCallerFactory;
export const createTRPCRouter = t.router;

const authedMiddleware = t.middleware(async ({ ctx, next }) => {
  if (!ctx.user) {
    throw new TRPCError({ code: 'UNAUTHORIZED' });
  }
  return next({
    ctx: {
      ...ctx,
      user: ctx.user,
    },
  });
});

export const publicProcedure = t.procedure;
export const authedProcedure = t.procedure.use(authedMiddleware);
