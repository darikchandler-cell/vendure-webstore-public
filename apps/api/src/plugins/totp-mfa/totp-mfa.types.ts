import { ObjectType, Field } from 'type-graphql';

@ObjectType()
export class InitTotpSetupResult {
  @Field()
  secret!: string;

  @Field()
  qrCodeUri!: string;
}

@ObjectType()
export class EnableTotpResult {
  @Field()
  success!: boolean;
}

@ObjectType()
export class VerifyTotpLoginResult {
  @Field()
  success!: boolean;
}

@ObjectType()
export class DisableTotpResult {
  @Field()
  success!: boolean;
}


