import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { I18nextProvider } from 'react-i18next'
import i18n from '@/i18n/i18n'
import { CulturalTagRequestRow } from '@/pages/Admin/Parts/CulturalTagRequestRow'
import { ApproveCulturalTagDialog } from '@/pages/Admin/Parts/ApproveCulturalTagDialog'
import type { CulturalTagRequest } from '@/services/types/admin'

const pendingRequest: CulturalTagRequest = {
  id: 1,
  labelEn: 'Holiday Meal',
  labelTr: 'Bayram Yemeği',
  country: 'Turkey',
  status: 'pending',
  decisionNote: null,
  decidedBy: null,
  createdAt: '2026-05-10T00:00:00Z',
  decidedAt: null,
  requester: { id: 'p1', username: 'expert_user' },
}

const approvedRequest: CulturalTagRequest = {
  ...pendingRequest,
  id: 2,
  status: 'approved',
  decisionNote: 'Great tag.',
  decidedAt: '2026-05-11T00:00:00Z',
}

function wrap(ui: React.ReactElement) {
  return render(<I18nextProvider i18n={i18n}>{ui}</I18nextProvider>)
}

// ─── CulturalTagRequestRow ────────────────────────────────────────────────────

describe('CulturalTagRequestRow', () => {
  it('renders requester username, labels, and country', () => {
    wrap(
      <CulturalTagRequestRow
        request={pendingRequest}
        onApprove={vi.fn()}
        onReject={vi.fn()}
      />
    )

    expect(screen.getByText('expert_user')).toBeInTheDocument()
    expect(screen.getByText('Holiday Meal')).toBeInTheDocument()
    expect(screen.getByText('Bayram Yemeği')).toBeInTheDocument()
    expect(screen.getByText('Turkey')).toBeInTheDocument()
  })

  it('shows Approve and Reject buttons for pending requests', () => {
    wrap(
      <CulturalTagRequestRow
        request={pendingRequest}
        onApprove={vi.fn()}
        onReject={vi.fn()}
      />
    )

    expect(screen.getByRole('button', { name: /approve/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /reject/i })).toBeInTheDocument()
  })

  it('hides action buttons for non-pending requests', () => {
    wrap(
      <CulturalTagRequestRow
        request={approvedRequest}
        onApprove={vi.fn()}
        onReject={vi.fn()}
      />
    )

    expect(screen.queryByRole('button', { name: /approve/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /reject/i })).not.toBeInTheDocument()
  })

  it('shows decision note for decided requests', () => {
    wrap(
      <CulturalTagRequestRow
        request={approvedRequest}
        onApprove={vi.fn()}
        onReject={vi.fn()}
      />
    )

    expect(screen.getByText('Great tag.')).toBeInTheDocument()
  })

  it('calls onApprove when Approve button is clicked', async () => {
    const onApprove = vi.fn()
    const user = userEvent.setup()

    wrap(
      <CulturalTagRequestRow
        request={pendingRequest}
        onApprove={onApprove}
        onReject={vi.fn()}
      />
    )

    await user.click(screen.getByRole('button', { name: /approve/i }))
    expect(onApprove).toHaveBeenCalledTimes(1)
  })

  it('calls onReject when Reject button is clicked', async () => {
    const onReject = vi.fn()
    const user = userEvent.setup()

    wrap(
      <CulturalTagRequestRow
        request={pendingRequest}
        onApprove={vi.fn()}
        onReject={onReject}
      />
    )

    await user.click(screen.getByRole('button', { name: /reject/i }))
    expect(onReject).toHaveBeenCalledTimes(1)
  })
})

// ─── ApproveCulturalTagDialog ─────────────────────────────────────────────────

describe('ApproveCulturalTagDialog', () => {
  it('pre-fills labelEn, labelTr, and country from the request', () => {
    wrap(
      <ApproveCulturalTagDialog
        request={pendingRequest}
        busy={false}
        onCancel={vi.fn()}
        onSubmit={vi.fn()}
      />
    )

    expect(screen.getByDisplayValue('Holiday Meal')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Bayram Yemeği')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Turkey')).toBeInTheDocument()
  })

  it('disables the Approve button when labelEn is cleared', async () => {
    const user = userEvent.setup()

    wrap(
      <ApproveCulturalTagDialog
        request={pendingRequest}
        busy={false}
        onCancel={vi.fn()}
        onSubmit={vi.fn()}
      />
    )

    const labelEnInput = screen.getByDisplayValue('Holiday Meal')
    await user.clear(labelEnInput)

    expect(screen.getByRole('button', { name: /approve/i })).toBeDisabled()
  })

  it('calls onSubmit with edited values when Approve is clicked', async () => {
    const onSubmit = vi.fn()
    const user = userEvent.setup()

    wrap(
      <ApproveCulturalTagDialog
        request={pendingRequest}
        busy={false}
        onCancel={vi.fn()}
        onSubmit={onSubmit}
      />
    )

    const labelEnInput = screen.getByDisplayValue('Holiday Meal')
    await user.clear(labelEnInput)
    await user.type(labelEnInput, 'Festival Meal')

    await user.click(screen.getByRole('button', { name: /approve/i }))

    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({ labelEn: 'Festival Meal' })
    )
  })

  it('calls onCancel when Cancel is clicked', async () => {
    const onCancel = vi.fn()
    const user = userEvent.setup()

    wrap(
      <ApproveCulturalTagDialog
        request={pendingRequest}
        busy={false}
        onCancel={onCancel}
        onSubmit={vi.fn()}
      />
    )

    await user.click(screen.getByRole('button', { name: /cancel/i }))
    expect(onCancel).toHaveBeenCalledTimes(1)
  })

  it('disables both buttons when busy', () => {
    wrap(
      <ApproveCulturalTagDialog
        request={pendingRequest}
        busy={true}
        onCancel={vi.fn()}
        onSubmit={vi.fn()}
      />
    )

    const buttons = screen.getAllByRole('button')
    buttons.forEach((btn) => expect(btn).toBeDisabled())
  })
})
