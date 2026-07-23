export type SignupGender = "male" | "female" | "other" | "";

export interface SignupInputs {
  email: string;
  alias: string;
  name: string;
  dateOfBirth: Date | undefined;
  gender: SignupGender | undefined;
  acceptedTerms: boolean;
}

export type SignupFieldErrors = Record<string, string>;
