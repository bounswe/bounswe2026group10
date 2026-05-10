import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { I18nextProvider } from 'react-i18next'
import i18n from '@/i18n/i18n'
import { ContentRequestRow } from '@/pages/Admin/Parts/ContentRequestRow'
import { ApproveContentRequestDialog } from '@/pages/Admin/Parts/ApproveContentRequestDialog'
import type { DishGenreRequest, DishVarietyRequest } from '@/services/types/admin'

const pendingGenreRequest: DishGenreRequest = {
  id: 1,
  nameEn: 'Pastries',
  nameTr: 'Börek Çeşitleri',
  descriptionEn: 'Baked goods made from dough',
  descriptionTr: 'Hamurdan yapılan yiyecekler',
  status: 'pending',
  decisionNote: null,
  decidedBy: null,
  createdAt: '2026-05-10T00:00:00Z',
  decidedAt: null,
  requester: { id: 'p1', username: 'expert_user' },
}

const approvedGenreRequest: DishGenreRequest = {
  ...pendingGenreRequest,
  id: 2,
  status: 'approved',
  decisionNote: 'Great genre.',
  decidedAt: '2026-05-11T00:00:00Z',
}

const pendingVarietyRequest: DishVarietyRequest = {
  id: 3,
  genreId: 5,
  nameEn: 'Börek',
  nameTr: 'Börek',
  descriptionEn: 'A flaky pastry',
  descriptionTr: 'Çıtır bir hamur işi',
  status: 'pending',
  decisionNote: null,
  decidedBy: null,
  createdAt: '2026-05-10T00:00:00Z',
  decidedAt: null,
  requester: { id: 'p2', username: 'another_expert' },
}

function wrap(ui: React.ReactElement) {
  return render(<I18nextProvider i18n={i18n}>{ui}</I18nextProvider>)
}

// ─── ContentRequestRow ────────────────────────────────────────────────────────

describe('ContentRequestRow — genre', () => {
  it('renders requester username, nameEn, nameTr for a genre request', () => {
    wrap(
      <ContentRequestRow
        type="genre"
        request={pendingGenreRequest}
        onApprove={vi.fn()}
        onReject={vi.fn()}
      />
    )

    expect(screen.getByText('expert_user')).toBeInTheDocument()
    expect(screen.getByText('Pastries')).toBeInTheDocument()
    expect(screen.getByText('Börek Çeşitleri')).toBeInTheDocument()
  })

  it('renders variety request with genreId', () => {
    wrap(
      <ContentRequestRow
        type="variety"
        request={pendingVarietyRequest}
        onApprove={vi.fn()}
        onReject={vi.fn()}
      />
    )

    expect(screen.getByText('another_expert')).toBeInTheDocument()
    // nameEn and nameTr are both "Börek" so use getAllByText
    expect(screen.getAllByText('Börek').length).toBeGreaterThanOrEqual(1)
    expect(screen.getByText('5')).toBeInTheDocument()
  })

  it('shows Approve and Reject buttons for pending requests', () => {
    wrap(
      <ContentRequestRow
        type="genre"
        request={pendingGenreRequest}
        onApprove={vi.fn()}
        onReject={vi.fn()}
      />
    )

    expect(screen.getByRole('button', { name: /approve/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /reject/i })).toBeInTheDocument()
  })

  it('hides action buttons for non-pending requests', () => {
    wrap(
      <ContentRequestRow
        type="genre"
        request={approvedGenreRequest}
        onApprove={vi.fn()}
        onReject={vi.fn()}
      />
    )

    expect(screen.queryByRole('button', { name: /approve/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /reject/i })).not.toBeInTheDocument()
  })

  it('calls onApprove when Approve button is clicked', async () => {
    const onApprove = vi.fn()
    const user = userEvent.setup()

    wrap(
      <ContentRequestRow
        type="genre"
        request={pendingGenreRequest}
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
      <ContentRequestRow
        type="genre"
        request={pendingGenreRequest}
        onApprove={vi.fn()}
        onReject={onReject}
      />
    )

    await user.click(screen.getByRole('button', { name: /reject/i }))
    expect(onReject).toHaveBeenCalledTimes(1)
  })
})

// ─── ApproveContentRequestDialog — genre ─────────────────────────────────────

describe('ApproveContentRequestDialog — genre', () => {
  it('pre-fills nameEn and nameTr from the genre request', () => {
    wrap(
      <ApproveContentRequestDialog
        type="genre"
        request={pendingGenreRequest}
        busy={false}
        onCancel={vi.fn()}
        onSubmit={vi.fn()}
      />
    )

    expect(screen.getByDisplayValue('Pastries')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Börek Çeşitleri')).toBeInTheDocument()
  })

  it('does not render genreId input for genre type', () => {
    wrap(
      <ApproveContentRequestDialog
        type="genre"
        request={pendingGenreRequest}
        busy={false}
        onCancel={vi.fn()}
        onSubmit={vi.fn()}
      />
    )

    // The genre ID field label should not be present for genre type
    expect(screen.queryByDisplayValue('5')).not.toBeInTheDocument()
  })

  it('disables the Approve button when nameEn is cleared', async () => {
    const user = userEvent.setup()

    wrap(
      <ApproveContentRequestDialog
        type="genre"
        request={pendingGenreRequest}
        busy={false}
        onCancel={vi.fn()}
        onSubmit={vi.fn()}
      />
    )

    const nameEnInput = screen.getByDisplayValue('Pastries')
    await user.clear(nameEnInput)

    expect(screen.getByRole('button', { name: /approve/i })).toBeDisabled()
  })

  it('calls onSubmit with correct payload when Approve is clicked', async () => {
    const onSubmit = vi.fn()
    const user = userEvent.setup()

    wrap(
      <ApproveContentRequestDialog
        type="genre"
        request={pendingGenreRequest}
        busy={false}
        onCancel={vi.fn()}
        onSubmit={onSubmit}
      />
    )

    const nameEnInput = screen.getByDisplayValue('Pastries')
    await user.clear(nameEnInput)
    await user.type(nameEnInput, 'Baked Goods')

    await user.click(screen.getByRole('button', { name: /approve/i }))

    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({ nameEn: 'Baked Goods' })
    )
  })

  it('disables all buttons when busy', () => {
    wrap(
      <ApproveContentRequestDialog
        type="genre"
        request={pendingGenreRequest}
        busy={true}
        onCancel={vi.fn()}
        onSubmit={vi.fn()}
      />
    )

    const buttons = screen.getAllByRole('button')
    buttons.forEach((btn) => expect(btn).toBeDisabled())
  })
})

// ─── ApproveContentRequestDialog — variety ───────────────────────────────────

describe('ApproveContentRequestDialog — variety', () => {
  it('pre-fills nameEn, nameTr, and genreId from the variety request', () => {
    wrap(
      <ApproveContentRequestDialog
        type="variety"
        request={pendingVarietyRequest}
        busy={false}
        onCancel={vi.fn()}
        onSubmit={vi.fn()}
      />
    )

    // nameEn and nameTr are both "Börek" — use getAllByDisplayValue
    expect(screen.getAllByDisplayValue('Börek').length).toBeGreaterThanOrEqual(1)
    // genreId pre-filled as "5"
    expect(screen.getByDisplayValue('5')).toBeInTheDocument()
  })

  it('calls onSubmit with genreId in payload when Approve is clicked', async () => {
    const onSubmit = vi.fn()
    const user = userEvent.setup()

    wrap(
      <ApproveContentRequestDialog
        type="variety"
        request={pendingVarietyRequest}
        busy={false}
        onCancel={vi.fn()}
        onSubmit={onSubmit}
      />
    )

    await user.click(screen.getByRole('button', { name: /approve/i }))

    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({ nameEn: 'Börek', genreId: 5 })
    )
  })
})
