/**
 * @vitest-environment node
 */

import { PGlite } from '@electric-sql/pglite';
import { describe, it, expect, beforeEach } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

const migrationSql = fs.readFileSync(path.join(__dirname, 'migration.sql'), 'utf8');
const seedLocalSql = fs.readFileSync(path.join(__dirname, 'seed.local.sql'), 'utf8');
const seedSql = fs.readFileSync(path.join(__dirname, 'seed.sql'), 'utf8');

interface TestRow {
  updated_at?: string;
  id?: string;
  full_name?: string;
}

interface SummaryStatsRow {
  total_collected: number | string;
  total_spent: number | string;
  remaining_balance: number | string;
}

describe('Database Schema & Migration Setup', () => {
  let db: PGlite;

  beforeEach(async () => {
    db = new PGlite();
    await db.waitReady;

    // Create standard Supabase roles so RLS tests can switch to them
    await db.exec(`
      CREATE ROLE anon;
      CREATE ROLE authenticated;
    `);

    // Run local stubs
    await db.exec(seedLocalSql);

    // Run migration
    await db.exec(migrationSql);

    // Run seed
    await db.exec(seedSql);
  });

  it('should successfully load seed data', async () => {
    const profilesResult = await db.query('SELECT * FROM public.profiles');
    expect(profilesResult.rows.length).toBeGreaterThanOrEqual(2);

    const entriesResult = await db.query('SELECT * FROM public.budget_entries');
    expect(entriesResult.rows.length).toBeGreaterThanOrEqual(10);
  });

  it('should enforce Check Constraint amount > 0 on budget_entries', async () => {
    // Invalid amount (0)
    await expect(
      db.query(`
        INSERT INTO public.budget_entries (type, description, category, amount, date, semester, academic_year, entered_by)
        VALUES ('income', 'Test Zero', 'Testing', 0, '2025-09-05', '1st Sem', '2025-2026', 'd0d0d0d0-d0d0-d0d0-d0d0-d0d0d0d0d001')
      `)
    ).rejects.toThrow(/violates check constraint/i);

    // Invalid amount (-1)
    await expect(
      db.query(`
        INSERT INTO public.budget_entries (type, description, category, amount, date, semester, academic_year, entered_by)
        VALUES ('income', 'Test Negative', 'Testing', -1, '2025-09-05', '1st Sem', '2025-2026', 'd0d0d0d0-d0d0-d0d0-d0d0-d0d0d0d0d001')
      `)
    ).rejects.toThrow(/violates check constraint/i);

    // Valid amount (1)
    await expect(
      db.query(`
        INSERT INTO public.budget_entries (type, description, category, amount, date, semester, academic_year, entered_by)
        VALUES ('income', 'Test Positive', 'Testing', 1, '2025-09-05', '1st Sem', '2025-2026', 'd0d0d0d0-d0d0-d0d0-d0d0-d0d0d0d0d001')
      `)
    ).resolves.toBeDefined();
  });

  it('should enforce Check Constraint semester on budget_entries', async () => {
    // Invalid semester '1st semm'
    await expect(
      db.query(`
        INSERT INTO public.budget_entries (type, description, category, amount, date, semester, academic_year, entered_by)
        VALUES ('income', 'Test Invalid Semester', 'Testing', 100, '2025-09-05', '1st semm', '2025-2026', 'd0d0d0d0-d0d0-d0d0-d0d0-d0d0d0d0d001')
      `)
    ).rejects.toThrow(/violates check constraint/i);

    // Valid semesters: '1st Sem', '2nd Sem', 'Summer' should all succeed
    for (const sem of ['1st Sem', '2nd Sem', 'Summer']) {
      await expect(
        db.query(`
          INSERT INTO public.budget_entries (type, description, category, amount, date, semester, academic_year, entered_by)
          VALUES ('income', 'Test Sem ' || $1, 'Testing', 100, '2025-09-05', $1, '2025-2026', 'd0d0d0d0-d0d0-d0d0-d0d0-d0d0d0d0d001')
        `, [sem])
      ).resolves.toBeDefined();
    }
  });

  it('should enforce Check Constraint academic_year on budget_entries', async () => {
    // Invalid format '2025'
    await expect(
      db.query(`
        INSERT INTO public.budget_entries (type, description, category, amount, date, semester, academic_year, entered_by)
        VALUES ('income', 'Test Invalid AY', 'Testing', 100, '2025-09-05', '1st Sem', '2025', 'd0d0d0d0-d0d0-d0d0-d0d0-d0d0d0d0d001')
      `)
    ).rejects.toThrow(/violates check constraint/i);

    // Invalid format '2025-202'
    await expect(
      db.query(`
        INSERT INTO public.budget_entries (type, description, category, amount, date, semester, academic_year, entered_by)
        VALUES ('income', 'Test Invalid AY', 'Testing', 100, '2025-09-05', '1st Sem', '2025-202', 'd0d0d0d0-d0d0-d0d0-d0d0-d0d0d0d0d001')
      `)
    ).rejects.toThrow(/violates check constraint/i);

    // Valid format '2025-2026' should succeed
    await expect(
      db.query(`
        INSERT INTO public.budget_entries (type, description, category, amount, date, semester, academic_year, entered_by)
        VALUES ('income', 'Test Valid AY', 'Testing', 100, '2025-09-05', '1st Sem', '2025-2026', 'd0d0d0d0-d0d0-d0d0-d0d0-d0d0d0d0d001')
      `)
    ).resolves.toBeDefined();
  });

  it('should enforce Check Constraint role on profiles', async () => {
    const profileId = 'd0d0d0d0-d0d0-d0d0-d0d0-d0d0d0d0d001';

    // Invalid role 'Hacker'
    await expect(
      db.query(`
        UPDATE public.profiles
        SET role = 'Hacker'
        WHERE id = $1
      `, [profileId])
    ).rejects.toThrow(/violates check constraint/i);

    // Valid roles: 'Treasurer', 'Auditor', 'President', 'Vice President', 'Secretary' should succeed
    for (const role of ['Treasurer', 'Auditor', 'President', 'Vice President', 'Secretary']) {
      await expect(
        db.query(`
          UPDATE public.profiles
          SET role = $1
          WHERE id = $2
        `, [role, profileId])
      ).resolves.toBeDefined();
    }
  });

  it('should auto-update updated_at column on budget_entries update via trigger', async () => {
    const entryId = 'b0000000-0000-0000-0000-000000000001';
    
    // Fetch initial state
    const res1 = await db.query('SELECT updated_at FROM public.budget_entries WHERE id = $1', [entryId]);
    const originalUpdatedAt = new Date((res1.rows[0] as TestRow).updated_at!).getTime();

    // Wait 10ms to ensure time difference
    await new Promise((resolve) => setTimeout(resolve, 10));

    // Update entry
    await db.query('UPDATE public.budget_entries SET description = $1 WHERE id = $2', ['Updated Description', entryId]);

    // Fetch updated state
    const res2 = await db.query('SELECT updated_at FROM public.budget_entries WHERE id = $1', [entryId]);
    const newUpdatedAt = new Date((res2.rows[0] as TestRow).updated_at!).getTime();

    expect(newUpdatedAt).toBeGreaterThan(originalUpdatedAt);
  });

  it('should auto-update updated_at column on profiles update via trigger', async () => {
    const profileId = 'd0d0d0d0-d0d0-d0d0-d0d0-d0d0d0d0d001';

    // Fetch initial state
    const res1 = await db.query('SELECT updated_at FROM public.profiles WHERE id = $1', [profileId]);
    const originalUpdatedAt = new Date((res1.rows[0] as TestRow).updated_at!).getTime();

    await new Promise((resolve) => setTimeout(resolve, 10));

    // Update profile
    await db.query('UPDATE public.profiles SET full_name = $1 WHERE id = $2', ['Jane Updated', profileId]);

    // Fetch updated state
    const res2 = await db.query('SELECT updated_at FROM public.profiles WHERE id = $1', [profileId]);
    const newUpdatedAt = new Date((res2.rows[0] as TestRow).updated_at!).getTime();

    expect(newUpdatedAt).toBeGreaterThan(originalUpdatedAt);
  });

  it('should have an index on entered_by for RLS lookups', async () => {
    const result = await db.query(`
      SELECT indexname FROM pg_indexes
      WHERE tablename = 'budget_entries' AND indexname = 'budget_entries_entered_by_idx'
    `);
    expect(result.rows.length).toBe(1);
  });

  it('should have composite index for getEntries query pattern', async () => {
    const result = await db.query(`
      SELECT indexname FROM pg_indexes
      WHERE tablename = 'budget_entries' AND indexname = 'budget_entries_semester_category_date_idx'
    `);
    expect(result.rows.length).toBe(1);
  });

  it('should have covering index for getSummaryStats query pattern', async () => {
    const result = await db.query(`
      SELECT indexname FROM pg_indexes
      WHERE tablename = 'budget_entries' AND indexname = 'budget_entries_semester_covering_idx'
    `);
    expect(result.rows.length).toBe(1);
  });

  it('should have extended composite for multi-key ORDER BY', async () => {
    const result = await db.query(`
      SELECT indexname FROM pg_indexes
      WHERE tablename = 'budget_entries' AND indexname = 'budget_entries_semester_date_created_idx'
    `);
    expect(result.rows.length).toBe(1);
  });

  it('should NOT have the redundant budget_entries_semester_idx', async () => {
    const result = await db.query(`
      SELECT indexname FROM pg_indexes
      WHERE tablename = 'budget_entries' AND indexname = 'budget_entries_semester_idx'
    `);
    expect(result.rows.length).toBe(0);
  });

  describe('Row Level Security (RLS) Policies', () => {
    it('should allow public (anonymous) read access on budget_entries and profiles', async () => {
      await db.exec('SET ROLE anon;');
      
      const entries = await db.query('SELECT * FROM public.budget_entries');
      expect(entries.rows.length).toBeGreaterThan(0);

      const profiles = await db.query('SELECT * FROM public.profiles');
      expect(profiles.rows.length).toBeGreaterThan(0);
    });

    it('should block anonymous inserts, updates, and deletes on budget_entries', async () => {
      await db.exec('SET ROLE anon;');

      // INSERT block
      await expect(
        db.query(`
          INSERT INTO public.budget_entries (type, description, category, amount, date, semester, academic_year, entered_by)
          VALUES ('income', 'Anon Entry', 'Testing', 1000, '2025-09-05', '1st Sem', '2025-2026', 'd0d0d0d0-d0d0-d0d0-d0d0-d0d0d0d0d001')
        `)
      ).rejects.toThrow(/permission denied/i);

      // UPDATE block
      await expect(
        db.query("UPDATE public.budget_entries SET description = 'Hacked' WHERE id = 'b0000000-0000-0000-0000-000000000001'")
      ).rejects.toThrow(/permission denied/i);

      // DELETE block
      await expect(
        db.query("DELETE FROM public.budget_entries WHERE id = 'b0000000-0000-0000-0000-000000000001'")
      ).rejects.toThrow(/permission denied/i);
    });

    it('should allow authenticated users to perform writes on budget_entries', async () => {
      // Set role and current user
      await db.exec(`
        SET ROLE authenticated;
        SET request.jwt.claim.sub = 'd0d0d0d0-d0d0-d0d0-d0d0-d0d0d0d0d001';
      `);

      // INSERT should succeed
      const insertRes = await db.query(`
        INSERT INTO public.budget_entries (type, description, category, amount, date, semester, academic_year, entered_by)
        VALUES ('income', 'Auth Entry', 'Testing', 1000, '2025-09-05', '1st Sem', '2025-2026', 'd0d0d0d0-d0d0-d0d0-d0d0-d0d0d0d0d001')
        RETURNING id
      `);
      expect(insertRes.rows.length).toBe(1);
      const newId = (insertRes.rows[0] as TestRow).id!;

      // UPDATE should succeed
      const updateRes = await db.query('UPDATE public.budget_entries SET description = $1 WHERE id = $2 RETURNING description', ['Auth Updated', newId]);
      expect(updateRes.rows[0]).toEqual({ description: 'Auth Updated' });

      // DELETE should succeed
      const deleteRes = await db.query('DELETE FROM public.budget_entries WHERE id = $1 RETURNING id', [newId]);
      expect(deleteRes.rows.length).toBe(1);
    });

    it('should block authenticated users from modifying other users\' entries', async () => {
      // Set auth context to a DIFFERENT user
      await db.exec(`
        SET ROLE authenticated;
        SET request.jwt.claim.sub = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
      `);

      // Try to update an entry owned by d0d0d0d0-...d001
      const updateResult = await db.query(`
        UPDATE public.budget_entries
        SET description = 'Hacked'
        WHERE entered_by = 'd0d0d0d0-d0d0-d0d0-d0d0-d0d0d0d0d001'
      `);

      // The update should affect 0 rows (RLS blocks it)
      expect(updateResult.affectedRows ?? 0).toBe(0);

      // Try to delete an entry owned by d0d0d0d0-...d001
      const deleteResult = await db.query(`
        DELETE FROM public.budget_entries
        WHERE entered_by = 'd0d0d0d0-d0d0-d0d0-d0d0-d0d0d0d0d001'
      `);

      expect(deleteResult.affectedRows ?? 0).toBe(0);

      // Try to insert with someone else's entered_by
      await expect(
        db.query(`
          INSERT INTO public.budget_entries (type, description, category, amount, date, semester, academic_year, entered_by)
          VALUES ('income', 'Hacked Entry', 'Fees', 10000, '2025-01-15', '1st Sem', '2024-2025', 'd0d0d0d0-d0d0-d0d0-d0d0-d0d0d0d0d001')
        `)
      ).rejects.toThrow(/violates row-level security policy/i);
    });

    it('should only allow authenticated users to update their own profile', async () => {
      const user1 = 'd0d0d0d0-d0d0-d0d0-d0d0-d0d0d0d0d001';
      const user2 = 'd0d0d0d0-d0d0-d0d0-d0d0-d0d0d0d0d002';

      // 1. Act as user1
      await db.exec(`
        SET ROLE authenticated;
        SET request.jwt.claim.sub = '${user1}';
      `);

      // Can update own profile
      await expect(
        db.query('UPDATE public.profiles SET full_name = $1 WHERE id = $2', ['Jane Self-Updated', user1])
      ).resolves.toBeDefined();

      // Check name updated
      const res1 = await db.query('SELECT full_name FROM public.profiles WHERE id = $1', [user1]);
      expect((res1.rows[0] as TestRow).full_name).toBe('Jane Self-Updated');

      // Cannot update another users profile
      const resUpdateOther = await db.query('UPDATE public.profiles SET full_name = $1 WHERE id = $2', ['Hack Name', user2]);
      expect(resUpdateOther.affectedRows).toBe(0);

      // Verify user2 name did NOT change
      const res2 = await db.query('SELECT full_name FROM public.profiles WHERE id = $1', [user2]);
      expect((res2.rows[0] as TestRow).full_name).toBe('John Smith');
    });
  });

  describe('Distinct Views', () => {
    it('should have a distinct_semesters view that returns unique semesters', async () => {
      const result = await db.query('SELECT * FROM public.distinct_semesters');
      const semesters = (result.rows as { semester: string }[]).map((r) => r.semester);
      expect(semesters.length).toBeGreaterThan(0);
      // Verify uniqueness
      expect(new Set(semesters).size).toBe(semesters.length);
    });

    it('should have a distinct_categories view that returns unique categories', async () => {
      const result = await db.query('SELECT * FROM public.distinct_categories');
      const categories = (result.rows as { category: string }[]).map((r) => r.category);
      expect(categories.length).toBeGreaterThan(0);
      expect(new Set(categories).size).toBe(categories.length);
    });
  });

  describe('Summary Stats Function', () => {
    it('should have a get_summary_stats function that returns correct aggregates', async () => {
      const result = await db.query('SELECT * FROM public.get_summary_stats($1)', ['1st Sem']);
      expect(result.rows.length).toBe(1);
      const row = result.rows[0] as unknown as SummaryStatsRow;
      expect(Number(row.total_collected)).toBeGreaterThanOrEqual(0);
      expect(Number(row.total_spent)).toBeGreaterThanOrEqual(0);
      expect(Number(row.remaining_balance)).toBe(
        Number(row.total_collected) - Number(row.total_spent)
      );
    });
  });
});

