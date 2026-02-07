import { pgTable, text, varchar, integer, timestamp, jsonb, boolean } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: varchar("id", { length: 36 }).primaryKey(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  name: varchar("name", { length: 255 }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull()
});

export const profile = pgTable("profile", {
  userId: varchar("user_id", { length: 36 }).primaryKey().references(() => users.id, { onDelete: "cascade" }),
  displayName: varchar("display_name", { length: 255 }).notNull().default("Friend"),
  goals: jsonb("goals").$type<string[]>().notNull().default(["stress"]),
  aiEnabled: boolean("ai_enabled").notNull().default(false),
  preferredCheckinTime: varchar("preferred_checkin_time", { length: 5 }).notNull().default("09:00"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull()
});

export const dailyCheckins = pgTable("daily_checkins", {
  id: varchar("id", { length: 64 }).primaryKey(),
  userId: varchar("user_id", { length: 36 }).notNull().references(() => users.id, { onDelete: "cascade" }),
  dateISO: varchar("date_iso", { length: 10 }).notNull(),
  mood0to10: integer("mood_0_to_10").notNull(),
  energy0to10: integer("energy_0_to_10").notNull(),
  note: text("note"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull()
});

const emotionIntensityJson = jsonb("emotions").$type<{ name: string; intensity0to100: number }[]>();
const distortionsJson = jsonb("distortions").$type<string[]>();

export const thoughtRecords = pgTable("thought_records", {
  id: varchar("id", { length: 64 }).primaryKey(),
  userId: varchar("user_id", { length: 36 }).notNull().references(() => users.id, { onDelete: "cascade" }),
  situation: text("situation").notNull(),
  thoughts: text("thoughts").notNull(),
  emotions: emotionIntensityJson.notNull().default([]),
  distortions: distortionsJson.notNull().default([]),
  evidenceFor: text("evidence_for").notNull().default(""),
  evidenceAgainst: text("evidence_against").notNull().default(""),
  reframe: text("reframe").notNull().default(""),
  actionStep: text("action_step").notNull().default(""),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull()
});

export const skillCompletions = pgTable("skill_completions", {
  id: varchar("id", { length: 64 }).primaryKey(),
  userId: varchar("user_id", { length: 36 }).notNull().references(() => users.id, { onDelete: "cascade" }),
  skillId: varchar("skill_id", { length: 64 }).notNull(),
  reflection: text("reflection"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull()
});

export const safetyEvents = pgTable("safety_events", {
  id: varchar("id", { length: 64 }).primaryKey(),
  userId: varchar("user_id", { length: 36 }).notNull().references(() => users.id, { onDelete: "cascade" }),
  category: varchar("category", { length: 32 }).notNull(),
  source: varchar("source", { length: 32 }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull()
});

export const savedInsights = pgTable("saved_insights", {
  id: varchar("id", { length: 64 }).primaryKey(),
  userId: varchar("user_id", { length: 36 }).notNull().references(() => users.id, { onDelete: "cascade" }),
  note: text("note").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull()
});
