import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Adds totpSecret column to administrator table for TOTP MFA support.
 * This column stores the base32-encoded TOTP secret key for administrators
 * who have enabled Multi-Factor Authentication.
 */
export class AddTotpSecretToAdministrator1733000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "administrator"
      ADD COLUMN IF NOT EXISTS "totpSecret" character varying
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "administrator"
      DROP COLUMN IF EXISTS "totpSecret"
    `);
  }
}


