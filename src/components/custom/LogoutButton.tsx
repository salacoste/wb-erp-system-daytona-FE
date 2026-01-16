'use client'

import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { LogOut } from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import { logoutUser } from '@/lib/api'
import { useMutation } from '@tanstack/react-query'

/**
 * Logout button component
 * Handles user logout with API call and state cleanup
 */
export function LogoutButton() {
  const router = useRouter()
  const { logout } = useAuthStore()

  const mutation = useMutation({
    mutationFn: async () => {
      // Try to call logout API, but don't fail if it errors
      try {
        await logoutUser()
      } catch (error) {
        // Log error but continue with local logout
        console.warn('Logout API call failed:', error)
      }
      // Always clear local state
      logout()
    },
    onSuccess: () => {
      toast.success('Вы вышли из аккаунта')
      router.push('/login')
    },
    onError: () => {
      // Even if API fails, we've cleared local state
      toast.success('Вы вышли из аккаунта')
      router.push('/login')
    },
  })

  const handleLogout = () => {
    mutation.mutate()
  }

  return (
    <Button
      variant="outline"
      onClick={handleLogout}
      disabled={mutation.isPending}
      aria-label="Выйти из аккаунта"
    >
      <LogOut className="mr-2 h-4 w-4" />
      {mutation.isPending ? 'Выход...' : 'Выйти'}
    </Button>
  )
}

