import 'server-only';
import { sql } from './db';

/**
 * The full schema. Every statement is idempotent, so running setup twice is
 * harmless and adding a table later only needs a new entry here.
 */
export async function createSchema(): Promise<void> {
  await sql.unsafe(`
    CREATE TABLE IF NOT EXISTS users (
      id            SERIAL PRIMARY KEY,
      name          VARCHAR(120) NOT NULL,
      email         VARCHAR(190) NOT NULL UNIQUE,
      password_hash VARCHAR(255) NOT NULL,
      role          VARCHAR(20)  NOT NULL DEFAULT 'editor',
      avatar        VARCHAR(500) DEFAULT '',
      is_active     BOOLEAN      NOT NULL DEFAULT TRUE,
      last_login_at TIMESTAMPTZ,
      created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS settings (
      skey   VARCHAR(120) PRIMARY KEY,
      svalue TEXT         NOT NULL DEFAULT '',
      sgroup VARCHAR(60)  NOT NULL DEFAULT 'general'
    );

    CREATE TABLE IF NOT EXISTS menus (
      id          SERIAL PRIMARY KEY,
      slug        VARCHAR(60) NOT NULL UNIQUE,
      label       VARCHAR(80) NOT NULL,
      kind        VARCHAR(20) NOT NULL DEFAULT 'page',
      description VARCHAR(255) DEFAULT '',
      custom_url  VARCHAR(255) DEFAULT '',
      in_nav      BOOLEAN NOT NULL DEFAULT TRUE,
      enabled     BOOLEAN NOT NULL DEFAULT TRUE,
      locked      BOOLEAN NOT NULL DEFAULT FALSE,
      sort_order  INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS categories (
      id          SERIAL PRIMARY KEY,
      name        VARCHAR(120) NOT NULL,
      slug        VARCHAR(140) NOT NULL UNIQUE,
      description VARCHAR(255) DEFAULT '',
      color       VARCHAR(20)  DEFAULT '#2563eb',
      sort_order  INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS posts (
      id               SERIAL PRIMARY KEY,
      title            VARCHAR(220) NOT NULL,
      slug             VARCHAR(240) NOT NULL UNIQUE,
      excerpt          TEXT    DEFAULT '',
      content          TEXT    DEFAULT '',
      cover_image      VARCHAR(500) DEFAULT '',
      category_id      INTEGER REFERENCES categories(id) ON DELETE SET NULL,
      author_id        INTEGER REFERENCES users(id) ON DELETE SET NULL,
      tags             VARCHAR(255) DEFAULT '',
      status           VARCHAR(20)  NOT NULL DEFAULT 'draft',
      is_featured      BOOLEAN NOT NULL DEFAULT FALSE,
      allow_comments   BOOLEAN NOT NULL DEFAULT TRUE,
      views            INTEGER NOT NULL DEFAULT 0,
      meta_title       VARCHAR(220) DEFAULT '',
      meta_description VARCHAR(320) DEFAULT '',
      published_at     TIMESTAMPTZ,
      created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS comments (
      id         SERIAL PRIMARY KEY,
      post_id    INTEGER NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
      name       VARCHAR(120) NOT NULL,
      email      VARCHAR(190) DEFAULT '',
      body       TEXT NOT NULL,
      status     VARCHAR(20) NOT NULL DEFAULT 'pending',
      ip         VARCHAR(45) DEFAULT '',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS experiences (
      id               SERIAL PRIMARY KEY,
      role             VARCHAR(180) NOT NULL,
      organization     VARCHAR(180) DEFAULT '',
      organization_url VARCHAR(255) DEFAULT '',
      location         VARCHAR(140) DEFAULT '',
      track            VARCHAR(30)  NOT NULL DEFAULT 'work',
      employment_type  VARCHAR(60)  DEFAULT '',
      start_date       DATE,
      end_date         DATE,
      is_current       BOOLEAN NOT NULL DEFAULT FALSE,
      summary          TEXT DEFAULT '',
      highlights       TEXT DEFAULT '',
      logo             VARCHAR(500) DEFAULT '',
      enabled          BOOLEAN NOT NULL DEFAULT TRUE,
      sort_order       INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS skills (
      id         SERIAL PRIMARY KEY,
      name       VARCHAR(120) NOT NULL,
      category   VARCHAR(80)  NOT NULL DEFAULT 'General',
      level      INTEGER      NOT NULL DEFAULT 70,
      icon       VARCHAR(60)  DEFAULT '',
      enabled    BOOLEAN NOT NULL DEFAULT TRUE,
      sort_order INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS services (
      id         SERIAL PRIMARY KEY,
      title      VARCHAR(160) NOT NULL,
      summary    TEXT DEFAULT '',
      bullets    TEXT DEFAULT '',
      icon       VARCHAR(60) DEFAULT '',
      price_note VARCHAR(120) DEFAULT '',
      enabled    BOOLEAN NOT NULL DEFAULT TRUE,
      sort_order INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS projects (
      id          SERIAL PRIMARY KEY,
      title       VARCHAR(180) NOT NULL,
      slug        VARCHAR(200) NOT NULL UNIQUE,
      summary     TEXT DEFAULT '',
      description TEXT DEFAULT '',
      image       VARCHAR(500) DEFAULT '',
      live_url    VARCHAR(255) DEFAULT '',
      repo_url    VARCHAR(255) DEFAULT '',
      tech        VARCHAR(255) DEFAULT '',
      client      VARCHAR(160) DEFAULT '',
      year        VARCHAR(20)  DEFAULT '',
      category    VARCHAR(80)  DEFAULT '',
      is_featured BOOLEAN NOT NULL DEFAULT FALSE,
      enabled     BOOLEAN NOT NULL DEFAULT TRUE,
      sort_order  INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS certifications (
      id             SERIAL PRIMARY KEY,
      title          VARCHAR(200) NOT NULL,
      issuer         VARCHAR(180) DEFAULT '',
      issue_date     DATE,
      credential_id  VARCHAR(120) DEFAULT '',
      credential_url VARCHAR(255) DEFAULT '',
      image          VARCHAR(500) DEFAULT '',
      enabled        BOOLEAN NOT NULL DEFAULT TRUE,
      sort_order     INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS testimonials (
      id           SERIAL PRIMARY KEY,
      name         VARCHAR(140) NOT NULL,
      role         VARCHAR(180) DEFAULT '',
      organization VARCHAR(180) DEFAULT '',
      quote        TEXT NOT NULL,
      photo        VARCHAR(500) DEFAULT '',
      rating       INTEGER NOT NULL DEFAULT 5,
      enabled      BOOLEAN NOT NULL DEFAULT FALSE,
      sort_order   INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS highlights (
      id         SERIAL PRIMARY KEY,
      label      VARCHAR(140) NOT NULL,
      value      VARCHAR(40)  NOT NULL,
      suffix     VARCHAR(20)  DEFAULT '',
      icon       VARCHAR(60)  DEFAULT '',
      enabled    BOOLEAN NOT NULL DEFAULT TRUE,
      sort_order INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS messages (
      id         SERIAL PRIMARY KEY,
      name       VARCHAR(140) NOT NULL,
      email      VARCHAR(190) NOT NULL,
      phone      VARCHAR(60)  DEFAULT '',
      subject    VARCHAR(200) DEFAULT '',
      body       TEXT NOT NULL,
      ip         VARCHAR(45)  DEFAULT '',
      is_read    BOOLEAN NOT NULL DEFAULT FALSE,
      is_starred BOOLEAN NOT NULL DEFAULT FALSE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS subscribers (
      id         SERIAL PRIMARY KEY,
      email      VARCHAR(190) NOT NULL UNIQUE,
      is_active  BOOLEAN NOT NULL DEFAULT TRUE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS login_attempts (
      id         SERIAL PRIMARY KEY,
      identifier VARCHAR(190) NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE INDEX IF NOT EXISTS idx_posts_status   ON posts (status, published_at DESC);
    CREATE INDEX IF NOT EXISTS idx_posts_category ON posts (category_id);
    CREATE INDEX IF NOT EXISTS idx_comments_post  ON comments (post_id, status);
    CREATE INDEX IF NOT EXISTS idx_exp_track      ON experiences (track, enabled);
    CREATE INDEX IF NOT EXISTS idx_attempts       ON login_attempts (identifier, created_at DESC);
  `);
}
