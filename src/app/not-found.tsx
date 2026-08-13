import { PageState } from '@/components/product/states/PageState'

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-svh w-full max-w-3xl items-center px-4 py-8 sm:px-6">
      <PageState
        state="not-found"
        headingLevel={1}
        title="Страница не найдена"
        explanation="Такой страницы нет, или её адрес мог измениться."
        trust="Ваши данные не изменились. Проверьте адрес или вернитесь к началу работы."
        action={<a href="/">Вернуться на главную</a>}
        className="w-full"
      />
    </main>
  )
}
