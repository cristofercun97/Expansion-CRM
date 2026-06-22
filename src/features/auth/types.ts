export type RegisterInput = {
  displayName: string
  email: string
  password: string
  /** Legacy path param `/registro/:referralCode` */
  referralCodeFromUrl?: string
  /** Query param `?ref=` for commercial recommendation */
  recommendationCodeFromUrl?: string
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
  recommendationCodeFromUrl?: string
  inviteCode?: string
}
