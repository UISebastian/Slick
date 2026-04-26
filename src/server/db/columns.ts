import { integer, timestamp } from "drizzle-orm/pg-core";

export function timestamps() {
  return {
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow()
  };
}

export function createdAtOnly() {
  return {
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow()
  };
}

export function rowVersion() {
  return integer("row_version").notNull().default(1);
}

export function deletedAt() {
  return timestamp("deleted_at", { withTimezone: true });
}

export function mutableColumns() {
  return {
    ...timestamps(),
    rowVersion: rowVersion(),
    deletedAt: deletedAt()
  };
}

export function runtimeMutableColumns() {
  return {
    ...timestamps(),
    rowVersion: rowVersion()
  };
}
