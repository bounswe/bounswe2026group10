import { useTranslation } from 'react-i18next'
import { useAppSelector } from '@/store/hooks'
import './ProfilePage.css'

export function ProfilePage() {
  const { t } = useTranslation('common')
  const profile = useAppSelector((s) => s.profile)

  const roleLabel = profile.role ? t(`app.roles.${profile.role}`) : '—'

  return (
    <div className="profile-screen">
      <h1 className="profile-screen__title">{t('profileScreen.title')}</h1>

      {profile.status === 'loading' || profile.status === 'idle' ? (
        <p className="profile-screen__muted">{t('profileScreen.loading')}</p>
      ) : profile.status === 'failed' ? (
        <p className="profile-screen__muted">{profile.error ?? t('common.errorRetry')}</p>
      ) : (
        <dl className="profile-screen__dl">
          <div className="profile-screen__row">
            <dt className="profile-screen__dt">{t('profileScreen.username')}</dt>
            <dd className="profile-screen__dd">{profile.username ?? '—'}</dd>
          </div>
          <div className="profile-screen__row">
            <dt className="profile-screen__dt">{t('profileScreen.email')}</dt>
            <dd className="profile-screen__dd">{profile.email ?? '—'}</dd>
          </div>
          <div className="profile-screen__row">
            <dt className="profile-screen__dt">{t('profileScreen.role')}</dt>
            <dd className="profile-screen__dd">{roleLabel}</dd>
          </div>
        </dl>
      )}
    </div>
  )
}
