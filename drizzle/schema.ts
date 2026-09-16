import { int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  stripeCustomerId: varchar("stripeCustomerId", { length: 255 }),
  stripeSubscriptionId: varchar("stripeSubscriptionId", { length: 255 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export const motherProfiles = mysqlTable("mother_profiles", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(),
  age: int("age"),
  childrenCount: int("childrenCount"),
  marriageYears: int("marriageYears"),
  weightKg: varchar("weightKg", { length: 16 }),
  healthStatus: text("healthStatus"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const children = mysqlTable("children", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  name: varchar("name", { length: 120 }).notNull(),
  birthStatus: mysqlEnum("birthStatus", ["born", "pregnant"]).default("born").notNull(),
  ageMonths: int("ageMonths"),
  weightKg: varchar("weightKg", { length: 16 }),
  gender: mysqlEnum("gender", ["girl", "boy", "unknown"]).default("unknown").notNull(),
  deliveryType: mysqlEnum("deliveryType", ["natural", "cesarean", "unknown"]).default("unknown").notNull(),
  birthDate: timestamp("birthDate"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const feedingLogs = mysqlTable("feeding_logs", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  childId: int("childId").notNull(),
  feedingType: mysqlEnum("feedingType", ["breast", "formula", "mixed"]).notNull(),
  breastSide: mysqlEnum("breastSide", ["right", "left", "both"]),
  formulaType: varchar("formulaType", { length: 120 }),
  amountMl: int("amountMl"),
  durationMinutes: int("durationMinutes"),
  note: varchar("note", { length: 255 }),
  loggedAt: timestamp("loggedAt").defaultNow().notNull(),
});

export const diaperLogs = mysqlTable("diaper_logs", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  childId: int("childId").notNull(),
  diaperType: mysqlEnum("diaperType", ["pee", "poop", "mixed"]).notNull(),
  peeColor: varchar("peeColor", { length: 80 }),
  poopColor: varchar("poopColor", { length: 80 }),
  poopTexture: varchar("poopTexture", { length: 80 }),
  amount: int("amount"),
  loggedAt: timestamp("loggedAt").defaultNow().notNull(),
});

export const medicalEvents = mysqlTable("medical_events", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  childId: int("childId").notNull(),
  kind: mysqlEnum("kind", ["vaccine", "doctor", "emergency"]).notNull(),
  title: varchar("title", { length: 160 }).notNull(),
  eventDate: timestamp("eventDate").notNull(),
  doctor: varchar("doctor", { length: 120 }),
  clinic: varchar("clinic", { length: 160 }),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type Child = typeof children.$inferSelect;
export type FeedingLog = typeof feedingLogs.$inferSelect;
export type DiaperLog = typeof diaperLogs.$inferSelect;
export type MedicalEvent = typeof medicalEvents.$inferSelect;
