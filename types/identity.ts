export interface DIDIdentity {
  id: string;
  did: string;
  method: string;
  status: string;
  public_key_multibase: string;
  verification_method_id: string;
  created_at: string;
  updated_at: string;
}

export type DIDDocument = Record<string, unknown>;
