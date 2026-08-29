import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function SettingsPage() {
  return (
    <section className="space-y-6" aria-labelledby="settings-overview-title">
      <div className="space-y-2">
        <h1 id="settings-overview-title" className="text-3xl font-bold tracking-tight">
          Настройки
        </h1>
        <p className="max-w-3xl text-muted-foreground">
          Управляйте кабинетом, уведомлениями, финансовыми параметрами и системными операциями в
          одном месте.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>
              <h2 className="text-lg">Работа с кабинетом</h2>
            </CardTitle>
            <CardDescription>Профиль продавца и каналы уведомлений.</CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Проверьте сведения кабинета и настройте получение важных событий в Telegram.
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>
              <h2 className="text-lg">Финансовые параметры</h2>
            </CardTitle>
            <CardDescription>Налоги, тарифы и операционные расходы.</CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Поддерживайте расчётные параметры актуальными для корректной аналитики.
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>
              <h2 className="text-lg">Системные операции</h2>
            </CardTitle>
            <CardDescription>Импорт исторических данных.</CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Владелец может запускать загрузку данных за прошлые периоды.
          </CardContent>
        </Card>
      </div>
    </section>
  )
}
