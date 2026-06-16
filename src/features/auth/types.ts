export type RegisterInput = {
  displayName: string
  email: string
  password: string
  referralCodeFromUrl?: string
  inviteCode?: string
}

/** @deprecated Use RegisterInput */
export type RegisterLeaderInput = RegisterInput

export type LoginInput = {
  email: string
  password: string
}

export type GoogleRegisterInput = {
  referralCodeFromUrl?: string
  inviteCode?: string
}
