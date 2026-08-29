import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import SettingsPage from '../page'

const { redirect } = vi.hoisted(() => ({ redirect: vi.fn() }))

vi.mock('next/navigation', () => ({ redirect }))

describe('SettingsPage', () => {
  it('renders a useful settings overview at the canonical root route', () => {
    render(<SettingsPage />)

    expect(redirect).not.toHaveBeenCalled()
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1)
    expect(screen.getByRole('heading', { level: 1, name: 'Настройки' })).toBeInTheDocument()
    expect(screen.getByText(/управляйте кабинетом, уведомлениями/i)).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Работа с кабинетом' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Финансовые параметры' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Системные операции' })).toBeInTheDocument()
  })
})
