/**
 * /consent — Согласие на обработку ПДн (#307).
 *
 * Source-of-truth: docs/LEGAL/CONSENT.md.
 *
 * Версия согласия (CONSENT_VERSION) сохраняется в Lead.consentTextVersion при
 * сабмите формы — это даёт точное доказательство какая редакция была активна
 * на момент подписания. При изменении текста — bump версии.
 *
 * Status: DRAFT v0.1 — требует утверждения юристом.
 */
import type { Metadata } from 'next';

import { CONSENT_VERSION, LEGAL_LAST_UPDATED } from '@/lib/legal/versions';

export const metadata: Metadata = {
  title: 'Согласие на обработку персональных данных',
  description:
    'Текст согласия на обработку персональных данных, который вы даёте при заполнении формы заявки на сайте IndiaHorizone.',
  robots: { index: true, follow: true },
};

export default function ConsentPage(): React.ReactElement {
  return (
    <div className="space-y-8">
      <header>
        <h1 className="font-serif text-4xl font-medium leading-tight tracking-tight">
          Согласие на обработку персональных данных
        </h1>
        <p className="mt-3 text-sm text-muted-foreground">
          Версия {CONSENT_VERSION} (черновик) · обновлено {LEGAL_LAST_UPDATED}
        </p>
      </header>

      <DraftBanner />

      <section className="rounded-2xl border border-border bg-card p-6 sm:p-8">
        <h2 className="font-serif text-xl font-medium">Текст согласия</h2>
        <p className="mt-4 leading-relaxed">
          Заполняя и отправляя форму на сайте indiahorizone.ru, я даю своё согласие на обработку
          моих персональных данных следующим образом:
        </p>

        <dl className="mt-6 space-y-4 leading-relaxed">
          <div>
            <dt className="font-semibold">Оператор:</dt>
            <dd className="mt-1 text-muted-foreground">
              <em>ЧЕРНОВИК — будет указано юр. лицо после регистрации.</em>
            </dd>
          </div>

          <div>
            <dt className="font-semibold">Категории данных:</dt>
            <dd className="mt-1">
              ФИО, телефон, email, и иные данные, добровольно указанные мной в форме или сообщённые
              в ходе коммуникации.
            </dd>
          </div>

          <div>
            <dt className="font-semibold">Цели обработки:</dt>
            <dd className="mt-1">
              <ul className="list-disc space-y-1 pl-6">
                <li>Обработка моей заявки и подбор предложений по туру</li>
                <li>
                  Связь со мной для уточнения деталей и предоставления коммерческого предложения
                </li>
                <li>Заключение и исполнение договора об оказании услуг (при наличии)</li>
              </ul>
            </dd>
          </div>

          <div>
            <dt className="font-semibold">Действия с данными:</dt>
            <dd className="mt-1">
              сбор, запись, систематизация, накопление, хранение, уточнение, использование, передача
              (распространение, предоставление, доступ), обезличивание, блокирование, удаление,
              уничтожение.
            </dd>
          </div>

          <div>
            <dt className="font-semibold">Способы обработки:</dt>
            <dd className="mt-1">
              автоматизированно с использованием средств вычислительной техники; с использованием
              средств электронной коммуникации; на бумажных носителях.
            </dd>
          </div>

          <div>
            <dt className="font-semibold">Передача третьим лицам:</dt>
            <dd className="mt-1">
              я согласен на передачу моих данных партнёру Оператора в Индии (IndiaHorizone IN PVT
              LTD) для целей наземного обслуживания. Я понимаю, что Индия не относится к странам,
              обеспечивающим адекватную защиту ПДн в смысле ст. 12 152-ФЗ, и осознанно даю согласие
              на трансграничную передачу.
            </dd>
          </div>

          <div>
            <dt className="font-semibold">Срок согласия:</dt>
            <dd className="mt-1">
              до достижения целей обработки или отзыва согласия в письменной форме (email на{' '}
              <a
                href="mailto:privacy@indiahorizone.ru"
                className="font-medium text-primary hover:underline"
              >
                privacy@indiahorizone.ru
              </a>
              ).
            </dd>
          </div>

          <div>
            <dt className="font-semibold">Право отзыва:</dt>
            <dd className="mt-1">
              я могу отозвать согласие в любой момент, направив уведомление на{' '}
              <a
                href="mailto:privacy@indiahorizone.ru"
                className="font-medium text-primary hover:underline"
              >
                privacy@indiahorizone.ru
              </a>
              . Отзыв обрабатывается в течение 30 дней.
            </dd>
          </div>

          <div>
            <dt className="font-semibold">Ознакомление:</dt>
            <dd className="mt-1">
              я ознакомлен(а) с{' '}
              <a href="/privacy" className="font-medium text-primary hover:underline">
                Политикой конфиденциальности
              </a>
              .
            </dd>
          </div>
        </dl>
      </section>

      <section>
        <h2 className="font-serif text-2xl font-medium">Версионирование</h2>
        <p className="mt-3 leading-relaxed">
          При каждом изменении текста увеличивается версия. Сервис сохраняет версию согласия,
          активную на момент сабмита формы — это позволяет точно определить, под какой редакцией вы
          дали согласие.
        </p>
        <table className="mt-4 w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-border text-left">
              <th className="py-2 pr-4 font-medium">Версия</th>
              <th className="py-2 pr-4 font-medium">Дата</th>
              <th className="py-2 font-medium">Изменения</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-border">
              <td className="py-2 pr-4 tabular-nums">0.1.0</td>
              <td className="py-2 pr-4 tabular-nums">2026-04-28</td>
              <td className="py-2">Первая редакция (черновик, требует юр. проверки)</td>
            </tr>
          </tbody>
        </table>
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
