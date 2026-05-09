/** Matches backend `UserRole` / `GET /auth/me`. */
export type UserRole = 'learner' | 'cook' | 'expert' | 'admin'

/** Roles that can be selected on the registration form (admin is intentionally excluded). */
export type RegistrableRole = Exclude<UserRole, 'admin'>

/** Payload inside API `success` envelope for `GET /auth/me` */
export interface MeResponse {
  userId: string
  email: string
  username: string
  role: UserRole
  createdAt: string
}
