import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn } from 'typeorm';
import { Administrator } from '@vendure/core';

/**
 * Temporary storage for TOTP secrets during setup process.
 * Secrets are stored here between initTotpSetup and enableTotp mutations,
 * then deleted once MFA is successfully enabled.
 */
@Entity('totp_setup_temp')
export class TotpSetupTemp {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  administratorId!: number;

  @ManyToOne(() => Administrator, { onDelete: 'CASCADE' })
  administrator!: Administrator;

  @Column()
  secret!: string;

  @CreateDateColumn()
  createdAt!: Date;

  @Column('timestamp')
  expiresAt!: Date;
}

