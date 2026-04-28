/**
 * /offer — Оферта (#307).
 *
 * Status: PLACEHOLDER. Полная оферта — отдельный issue в legal-эпике
 * (Roman + юрист). До этого момента: minimal-страница с пояснением
 * + ссылками на контакт.
 *
 * Почему placeholder, а не отказ от страницы:
 * 1. Footer ссылается на /offer (#306) — нужен валидный URL
 * 2. Регулятор / клиент при поиске "оферты IndiaHorizone" не должен получить 404
 * 3. Прозрачность: явно говорим что в работе, а не молчим
 */
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Оферта',
  description:
    'Условия оказания услуг IndiaHorizone находятся в разработке. По вопросам обращайтесь в Telegram.',
  // noindex до публикации финальной версии — placeholder не должен попадать в выдачу
  robots: { index: false, follow: false },
};

export default function OfferPage(): React.ReactElement {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-serif text-4xl font-medium leading-tight tracking-tight">Оферта</h1>
      </header>

      <div
        role="note"
        className="rounded-lg border border-stone-200 bg-stone-50 p-5 text-sm text-stone-800"
      >
        <p className="font-semibold">Документ находится в разработке.</p>
        <p className="mt-2 leading-relaxed">
          Условия оказания услуг IndiaHorizone готовятся к публикации после согласования с юристом.
          До публикации финальной версии все договорные условия согласовываются с клиентом
          индивидуально перед заключением договора.
        </p>
      </div>

      <section className="leading-relaxed">
        <h2 className="font-serif text-2xl font-medium">Контакт</h2>
        <p className="mt-3">
          По вопросам услуг и условий — пишите в Telegram:{' '}
          <a
            href="https://t.me/indiahorizone"
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-primary hover:underline"
          >
            @indiahorizone
          </a>
          . Или по email:{' '}
          <a
            href="mailto:hello@indiahorizone.ru"
            className="font-medium text-primary hover:underline"
          >
            hello@indiahorizone.ru
          </a>
          .
        </p>
      </section>

      <section className="leading-relaxed">
        <h2 className="font-serif text-2xl font-medium">Связанные документы</h2>
        <ul className="mt-3 list-disc space-y-1.5 pl-6">
          <li>
            <a href="/privacy" className="font-medium text-primary hover:underline">
              Политика конфиденциальности
            </a>{' '}
            — как мы обрабатываем ваши данные
          </li>
          <li>
            <a href="/consent" className="font-medium text-primary hover:underline">
              Согласие на обработку ПДн
            </a>{' '}
            — текст согласия в форме заявки
          </li>
        </ul>
      </section>
    </div>
  );
}
