import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Creates totp_setup_temp table for temporarily storing TOTP secrets during setup.
 * This table is used to store the secret between initTotpSetup and enableTotp mutations,
 * allowing the user to scan the QR code and verify the token before persisting to the
 * administrator table.
 */
export class CreateTotpSetupTempTable1733000000001 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "totp_setup_temp" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "administratorId" integer NOT NULL,
        "secret" character varying NOT NULL,
        "createdAt" timestamp NOT NULL DEFAULT now(),
        "expiresAt" timestamp NOT NULL,
        CONSTRAINT "FK_totp_setup_temp_administrator" 
          FOREIGN KEY ("administratorId") 
          REFERENCES "administrator"("id") 
          ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_totp_setup_temp_administratorId" 
      ON "totp_setup_temp"("administratorId")
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_totp_setup_temp_expiresAt" 
      ON "totp_setup_temp"("expiresAt")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP TABLE IF EXISTS "totp_setup_temp"
    `);
  }
}


