/**
 * /privacy — Политика конфиденциальности (#307).
 *
 * Source-of-truth: docs/LEGAL/PRIVACY.md (markdown). Этот файл — JSX-render
 * того же содержания. Если изменяете — обновите оба места.
 *
 * Версионирование: PRIVACY_VERSION в const ниже, и frontmatter в .md.
 *
 * Status: DRAFT v0.1 — требует утверждения юристом перед публикацией.
 */
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Политика конфиденциальности',
  description: 'Как IndiaHorizone собирает, использует и защищает ваши персональные данные.',
  robots: { index: true, follow: true },
};

const PRIVACY_VERSION = '0.1.0';
const LAST_UPDATED = '28 апреля 2026 г.';

export default function PrivacyPage(): React.ReactElement {
  return (
    <div className="space-y-8">
      <header>
        <h1 className="font-serif text-4xl font-medium leading-tight tracking-tight">
          Политика конфиденциальности
        </h1>
        <p className="mt-3 text-sm text-muted-foreground">
          Версия {PRIVACY_VERSION} (черновик) · обновлено {LAST_UPDATED}
        </p>
      </header>

      <DraftBanner />

      <section>
        <h2 className="font-serif text-2xl font-medium">1. Общие сведения</h2>
        <p className="mt-3 leading-relaxed">
          Настоящая Политика конфиденциальности (далее — Политика) регулирует обработку персональных
          данных пользователей сервиса IndiaHorizone (далее — Сервис), доступного по адресу
          indiahorizone.ru.
        </p>
        <p className="mt-3 leading-relaxed">
          <strong>Оператор персональных данных</strong> (далее — Оператор):{' '}
          <em className="text-muted-foreground">
            ЧЕРНОВИК — будет указано юр. лицо после регистрации.
          </em>
        </p>
        <p className="mt-3 leading-relaxed">
          Контакт по вопросам обработки ПДн:{' '}
          <a
            href="mailto:privacy@indiahorizone.ru"
            className="font-medium text-primary hover:underline"
          >
            privacy@indiahorizone.ru
          </a>
        </p>
      </section>

      <section>
        <h2 className="font-serif text-2xl font-medium">2. Какие данные мы собираем</h2>
        <ul className="mt-3 space-y-2 leading-relaxed">
          <li>
            <strong>Контактная информация</strong> — ФИО, телефон, email при заполнении формы или
            регистрации
          </li>
          <li>
            <strong>Технические данные</strong> — IP-адрес, тип браузера, cookies (автоматически)
          </li>
          <li>
            <strong>Данные о поездке</strong> — город, даты, предпочтения при оформлении тура
          </li>
          <li>
            <strong>Документы для въезда</strong> — скан паспорта, виза (опционально, при
            бронировании)
          </li>
          <li>
            <strong>Контакт экстренной связи</strong> — ФИО и телефон близкого (опционально)
          </li>
        </ul>
      </section>

      <section>
        <h2 className="font-serif text-2xl font-medium">3. Цели обработки</h2>
        <ul className="mt-3 list-disc space-y-1.5 pl-6 leading-relaxed">
          <li>Обработка заявок на туры и подбор предложений</li>
          <li>Заключение и исполнение договора об оказании услуг</li>
          <li>Коммуникация (уведомления о бронировании, поддержка)</li>
          <li>Информационная рассылка (только при явном согласии)</li>
          <li>Анализ работы сайта (обезличенно)</li>
          <li>Соблюдение требований законодательства РФ</li>
        </ul>
      </section>

      <section>
        <h2 className="font-serif text-2xl font-medium">4. Передача данных третьим лицам</h2>
        <p className="mt-3 leading-relaxed">
          Мы передаём минимально необходимые данные следующим категориям получателей:
        </p>
        <ul className="mt-3 space-y-3 leading-relaxed">
          <li>
            <strong>Партнёр в Индии</strong> — IndiaHorizone IN PVT LTD — для координации наземного
            обслуживания. Передаются: ФИО, контакт, программа поездки, экстренный контакт.{' '}
            <span className="text-amber-700">
              Это трансграничная передача в страну, не обеспечивающую адекватной защиты ПДн в смысле
              ст. 12 152-ФЗ — требует отдельного согласия (см.{' '}
              <a href="/consent" className="font-medium text-primary hover:underline">
                /consent
              </a>
              ).
            </span>
          </li>
          <li>
            <strong>Поставщики услуг</strong> — отели, авиакомпании, гиды, страховые — только
            данные, необходимые для конкретного бронирования.
          </li>
          <li>
            <strong>Платёжные сервисы</strong> — для проведения платежей. Сами платёжные данные не
            сохраняются у Оператора.
          </li>
          <li>
            <strong>Государственные органы</strong> — по обоснованному запросу в рамках закона.
          </li>
        </ul>
        <p className="mt-3 leading-relaxed">
          Мы не передаём ваши данные в рекламных целях третьим лицам.
        </p>
      </section>

      <section>
        <h2 className="font-serif text-2xl font-medium">5. Срок хранения</h2>
        <ul className="mt-3 list-disc space-y-1.5 pl-6 leading-relaxed">
          <li>Активные пользователи — на время использования + 3 года после последней операции</li>
          <li>Завершённые туры — 5 лет (бухгалтерский / налоговый учёт)</li>
          <li>Логи доступа — 6 месяцев</li>
          <li>Запрос удаления — обрабатываем за 30 рабочих дней</li>
        </ul>
      </section>

      <section>
        <h2 className="font-serif text-2xl font-medium">6. Cookies и аналитика</h2>
        <p className="mt-3 leading-relaxed">Сайт использует cookies для:</p>
        <ul className="mt-3 list-disc space-y-1.5 pl-6 leading-relaxed">
          <li>Авторизации (сессионные, обязательные)</li>
          <li>Запоминания предпочтений (язык, регион)</li>
          <li>Аналитики посещаемости (Яндекс.Метрика — при наличии вашего согласия)</li>
        </ul>
        <p className="mt-3 leading-relaxed">
          Вы можете отключить cookies в настройках браузера. Без них некоторые функции (личный
          кабинет) могут работать некорректно.
        </p>
      </section>

      <section>
        <h2 className="font-serif text-2xl font-medium">7. Ваши права</h2>
        <p className="mt-3 leading-relaxed">Согласно ст. 14 152-ФЗ, вы имеете право:</p>
        <ul className="mt-3 list-disc space-y-1.5 pl-6 leading-relaxed">
          <li>Получить информацию о наличии и содержании ваших ПДн у Оператора</li>
          <li>Требовать уточнения, блокировки или уничтожения данных</li>
          <li>Отозвать согласие на обработку (с письменным уведомлением)</li>
          <li>Обжаловать действия Оператора в Роскомнадзор или суд</li>
        </ul>
        <p className="mt-3 leading-relaxed">
          Запросы направляйте на{' '}
          <a
            href="mailto:privacy@indiahorizone.ru"
            className="font-medium text-primary hover:underline"
          >
            privacy@indiahorizone.ru
          </a>{' '}
          — рассмотрим в течение 30 дней.
        </p>
      </section>

      <section>
        <h2 className="font-serif text-2xl font-medium">8. Безопасность</h2>
        <ul className="mt-3 list-disc space-y-1.5 pl-6 leading-relaxed">
          <li>Шифрование передачи данных (TLS 1.3+)</li>
          <li>Шифрование персональных документов в хранилище (AES-256)</li>
          <li>Контроль доступа сотрудников по принципу минимальных привилегий</li>
          <li>Аудит-лог критичных операций</li>
          <li>Регулярное резервное копирование</li>
        </ul>
        <p className="mt-3 leading-relaxed">
          При утечке данных, затрагивающей ваши права, мы уведомим вас и Роскомнадзор в
          установленные законом сроки.
        </p>
      </section>

      <section>
        <h2 className="font-serif text-2xl font-medium">9. Изменения политики</h2>
        <p className="mt-3 leading-relaxed">
          Политика может обновляться. О существенных изменениях мы уведомим через email
          пользователям с активным согласием и через всплывающее уведомление на сайте.
        </p>
      </section>
    </div>
  );
}

function DraftBanner(): React.ReactElement {
  return (
    <div
      role="note"
      className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900"
    >
      <strong className="font-semibold">Черновик документа.</strong> Финальная редакция будет
      опубликована после юридической проверки. До утверждения — текст носит ознакомительный
      характер.
    </div>
  );
}
