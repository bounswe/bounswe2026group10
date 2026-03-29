/** Matches backend `UserRole` / `GET /auth/me` */
export type UserRole = 'learner' | 'cook' | 'expert'

/** Payload inside API `success` envelope for `GET /auth/me` */
export interface MeResponse {
  userId: string
  email: string
  username: string
  role: UserRole
  createdAt: string
}
