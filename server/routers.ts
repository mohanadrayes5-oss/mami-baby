import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import {
  getDashboardData,
  getMotherProfile,
  insertChild,
  insertDiaperLog,
  insertFeedingLog,
  listChildren,
  listDiaperLogs,
  listFeedingLogs,
  listMedicalEvents,
  saveMotherProfile,
} from "./db";

const childIdInput = z.object({ childId: z.number().int().positive() });

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),
  dashboard: protectedProcedure.input(childIdInput).query(({ ctx, input }) => getDashboardData(ctx.user.id, input.childId)),
  profile: router({
    get: protectedProcedure.query(({ ctx }) => getMotherProfile(ctx.user.id)),
    save: protectedProcedure.input(z.object({
      age: z.number().int().min(12).max(100).optional(),
      childrenCount: z.number().int().min(0).max(30).optional(),
      marriageYears: z.number().int().min(0).max(100).optional(),
      weightKg: z.string().max(16).optional(),
      healthStatus: z.string().max(2000).optional(),
    })).mutation(({ ctx, input }) => saveMotherProfile(ctx.user.id, input)),
  }),
  children: router({
    list: protectedProcedure.query(({ ctx }) => listChildren(ctx.user.id)),
    create: protectedProcedure.input(z.object({
      name: z.string().min(1).max(120),
      birthStatus: z.enum(["born", "pregnant"]),
      ageMonths: z.number().int().min(0).max(240).optional(),
      weightKg: z.string().max(16).optional(),
      gender: z.enum(["girl", "boy", "unknown"]).default("unknown"),
      deliveryType: z.enum(["natural", "cesarean", "unknown"]).default("unknown"),
    })).mutation(({ ctx, input }) => insertChild(ctx.user.id, input)),
  }),
  feeding: router({
    list: protectedProcedure.input(childIdInput).query(({ ctx, input }) => listFeedingLogs(ctx.user.id, input.childId)),
    add: protectedProcedure.input(z.object({
      childId: z.number().int().positive(),
      feedingType: z.enum(["breast", "formula", "mixed"]),
      breastSide: z.enum(["right", "left", "both"]).optional(),
      formulaType: z.string().max(120).optional(),
      amountMl: z.number().int().min(0).max(2000).optional(),
      durationMinutes: z.number().int().min(0).max(240).optional(),
      note: z.string().max(255).optional(),
      loggedAt: z.date().optional(),
    })).mutation(({ ctx, input }) => insertFeedingLog(ctx.user.id, input)),
  }),
  diapers: router({
    list: protectedProcedure.input(childIdInput).query(({ ctx, input }) => listDiaperLogs(ctx.user.id, input.childId)),
    add: protectedProcedure.input(z.object({
      childId: z.number().int().positive(),
      diaperType: z.enum(["pee", "poop", "mixed"]),
      peeColor: z.string().max(80).optional(),
      poopColor: z.string().max(80).optional(),
      poopTexture: z.string().max(80).optional(),
      amount: z.number().int().min(1).max(5).optional(),
      loggedAt: z.date().optional(),
    })).mutation(({ ctx, input }) => insertDiaperLog(ctx.user.id, input)),
  }),
  medical: router({
    list: protectedProcedure.input(childIdInput).query(({ ctx, input }) => listMedicalEvents(ctx.user.id, input.childId)),
  }),
});

export type AppRouter = typeof appRouter;
