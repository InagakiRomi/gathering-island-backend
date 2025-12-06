-- PostgreSQL Database Schema for Gathering Island
-- This script creates all necessary tables with proper relationships

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- 1. USER TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS "user" (
  "id" SERIAL PRIMARY KEY,
  "email" VARCHAR(255) NOT NULL UNIQUE,
  "passwordHash" VARCHAR(255) NOT NULL,
  "refreshTokenHash" VARCHAR(255) DEFAULT '',
  "displayName" VARCHAR(255) NOT NULL,
  "role" VARCHAR(50) DEFAULT 'user',
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index for email lookup
CREATE INDEX IF NOT EXISTS "user_email_idx" ON "user"("email");
CREATE INDEX IF NOT EXISTS "user_updated_at_idx" ON "user"("updatedAt");

-- ============================================
-- 2. GATHERING TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS "gathering" (
  "id" SERIAL PRIMARY KEY,
  "userId" INTEGER NOT NULL,
  "title" VARCHAR(255) NOT NULL,
  "description" TEXT DEFAULT '',
  "location" VARCHAR(255) NOT NULL,
  "participantNumbers" INTEGER NOT NULL,
  "price" NUMERIC(10, 2) NOT NULL,
  "status" VARCHAR(50) DEFAULT 'open',
  "type" VARCHAR(50) DEFAULT 'party',
  "startTime" TIMESTAMP DEFAULT '2099-12-25 00:00:00',
  "dueDate" TIMESTAMP DEFAULT '2099-12-31 23:59:59',
  "isArchived" BOOLEAN DEFAULT false,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "gathering_user_id_fk" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS "gathering_user_id_idx" ON "gathering"("userId");
CREATE INDEX IF NOT EXISTS "gathering_status_idx" ON "gathering"("status");
CREATE INDEX IF NOT EXISTS "gathering_type_idx" ON "gathering"("type");
CREATE INDEX IF NOT EXISTS "gathering_updated_at_idx" ON "gathering"("updatedAt");

-- ============================================
-- 3. TAG TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS "tag" (
  "id" SERIAL PRIMARY KEY,
  "tagName" VARCHAR(255) NOT NULL UNIQUE
);

-- Index for tag name lookup
CREATE INDEX IF NOT EXISTS "tag_name_idx" ON "tag"("tagName");

-- ============================================
-- 4. MANY-TO-MANY JUNCTION TABLE: gathering_tags
-- ============================================
CREATE TABLE IF NOT EXISTS "gathering_tags" (
  "gathering_id" INTEGER NOT NULL,
  "tag_id" INTEGER NOT NULL,
  PRIMARY KEY ("gathering_id", "tag_id"),
  CONSTRAINT "gathering_tags_gathering_fk" FOREIGN KEY ("gathering_id") REFERENCES "gathering"("id") ON DELETE CASCADE,
  CONSTRAINT "gathering_tags_tag_fk" FOREIGN KEY ("tag_id") REFERENCES "tag"("id") ON DELETE CASCADE
);

-- Index for reverse lookup
CREATE INDEX IF NOT EXISTS "gathering_tags_tag_id_idx" ON "gathering_tags"("tag_id");

-- ============================================
-- 5. MIKRO ORM MIGRATIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS "mikro_orm_migrations" (
  "id" SERIAL PRIMARY KEY,
  "name" VARCHAR(255) NOT NULL UNIQUE,
  "executed_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
