import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Vendure v2.2.0 added the `authenticationStrategy` column to the shared `session`
 * table used by both authenticated and anonymous sessions. Production was upgraded
 * without running the schema migration, so any login attempt now fails with
 * `column "authenticationStrategy" of relation "session" does not exist`.
 *
 * This migration adds the missing column, backfills existing rows with the
 * default `native` strategy, and enforces the NOT NULL constraint expected by the
 * application.
 */
export class AddAuthStrategyColumn1732782000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "session"
      ADD COLUMN IF NOT EXISTS "authenticationStrategy" character varying NOT NULL DEFAULT 'native'
    `);

    await queryRunner.query(`
      UPDATE "session"
      SET "authenticationStrategy" = 'native'
      WHERE "authenticationStrategy" IS NULL
    `);

    await queryRunner.query(`
      ALTER TABLE "session"
      ALTER COLUMN "authenticationStrategy" DROP DEFAULT
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "session"
      DROP COLUMN IF EXISTS "authenticationStrategy"
    `);
  }
}


