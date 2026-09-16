import { and, desc, eq, gte } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { ENV } from "./_core/env";
import {
  Child,
  DiaperLog,
  FeedingLog,
  InsertUser,
  children,
  diaperLogs,
  feedingLogs,
  medicalEvents,
  motherProfiles,
  users,
} from "../drizzle/schema";

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) return;
  const values: InsertUser = { openId: user.openId };
  const updateSet: Record<string, unknown> = {};
  for (const field of ["name", "email", "loginMethod"] as const) {
    if (user[field] !== undefined) {
      values[field] = user[field] ?? null;
      updateSet[field] = user[field] ?? null;
    }
  }
  values.lastSignedIn = user.lastSignedIn ?? new Date();
  updateSet.lastSignedIn = values.lastSignedIn;
  if (user.role !== undefined) {
    values.role = user.role;
    updateSet.role = user.role;
  } else if (user.openId === ENV.ownerOpenId) {
    values.role = "admin";
    updateSet.role = "admin";
  }
  await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result[0];
}

export async function getMotherProfile(userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const rows = await db.select().from(motherProfiles).where(eq(motherProfiles.userId, userId)).limit(1);
  return rows[0];
}

export async function saveMotherProfile(userId: number, data: Partial<typeof motherProfiles.$inferInsert>) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const existing = await getMotherProfile(userId);
  if (existing) {
    await db.update(motherProfiles).set({ ...data, updatedAt: new Date() }).where(eq(motherProfiles.userId, userId));
  } else {
    await db.insert(motherProfiles).values({ userId, ...data });
  }
  return getMotherProfile(userId);
}

export async function listChildren(userId: number): Promise<Child[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(children).where(eq(children.userId, userId)).orderBy(desc(children.createdAt));
}

export async function getChild(userId: number, childId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const rows = await db.select().from(children).where(and(eq(children.userId, userId), eq(children.id, childId))).limit(1);
  return rows[0];
}

export async function insertChild(userId: number, data: Omit<typeof children.$inferInsert, "userId">) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  await db.insert(children).values({ userId, ...data });
  const rows = await listChildren(userId);
  return rows[0];
}

export async function listFeedingLogs(userId: number, childId: number) {
  const db = await getDb();
  if (!db) return [] as FeedingLog[];
  return db.select().from(feedingLogs).where(and(eq(feedingLogs.userId, userId), eq(feedingLogs.childId, childId))).orderBy(desc(feedingLogs.loggedAt)).limit(20);
}

export async function insertFeedingLog(userId: number, data: Omit<typeof feedingLogs.$inferInsert, "userId">) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  await db.insert(feedingLogs).values({ userId, ...data });
  return listFeedingLogs(userId, data.childId);
}

export async function listDiaperLogs(userId: number, childId: number) {
  const db = await getDb();
  if (!db) return [] as DiaperLog[];
  return db.select().from(diaperLogs).where(and(eq(diaperLogs.userId, userId), eq(diaperLogs.childId, childId))).orderBy(desc(diaperLogs.loggedAt)).limit(20);
}

export async function insertDiaperLog(userId: number, data: Omit<typeof diaperLogs.$inferInsert, "userId">) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  await db.insert(diaperLogs).values({ userId, ...data });
  return listDiaperLogs(userId, data.childId);
}

export async function listMedicalEvents(userId: number, childId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(medicalEvents).where(and(eq(medicalEvents.userId, userId), eq(medicalEvents.childId, childId))).orderBy(medicalEvents.eventDate).limit(30);
}

export async function getDashboardData(userId: number, childId: number) {
  const db = await getDb();
  if (!db) return { mother: undefined, children: [], feedings: [], diapers: [], medical: [] };
  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const [mother, childRows, feedings, diapers, medical] = await Promise.all([
    getMotherProfile(userId),
    listChildren(userId),
    db.select().from(feedingLogs).where(and(eq(feedingLogs.userId, userId), eq(feedingLogs.childId, childId), gte(feedingLogs.loggedAt, since))).orderBy(desc(feedingLogs.loggedAt)).limit(20),
    db.select().from(diaperLogs).where(and(eq(diaperLogs.userId, userId), eq(diaperLogs.childId, childId), gte(diaperLogs.loggedAt, since))).orderBy(desc(diaperLogs.loggedAt)).limit(20),
    listMedicalEvents(userId, childId),
  ]);
  return { mother, children: childRows, feedings, diapers, medical };
}
