/**
 * FooterLegal — юридические ссылки + ИНН/ОГРН placeholder (#306).
 *
 * ИНН/ОГРН/юр.адрес заполняется после регистрации юрлица — пока placeholder.
 * Ссылки на /privacy, /consent, /offer открываются (страницы DRAFT — #307).
 */
export function FooterLegal(): React.ReactElement {
  return (
    <footer className="border-t border-border bg-muted/40 py-12">
      <div className="mx-auto max-w-6xl px-6 text-sm text-muted-foreground">
        <div className="grid gap-8 sm:grid-cols-3">
          <div>
            <div className="font-serif text-xl text-foreground">
              India<em className="not-italic text-primary">Horizone</em>
            </div>
            <p className="mt-3 max-w-xs text-xs">
              Tech-enabled India concierge для русскоязычных клиентов. Не туроператор. Партнёр в
              Индии — IndiaHorizone IN PVT LTD.
            </p>
          </div>
          <div>
            <h6 className="mb-3 font-medium uppercase tracking-wide text-foreground">Компания</h6>
            <ul className="space-y-2 text-xs">
              <li>ИНН/ОГРН: будет добавлен (#306)</li>
              <li>Юр.адрес: будет добавлен</li>
            </ul>
          </div>
          <div>
            <h6 className="mb-3 font-medium uppercase tracking-wide text-foreground">Документы</h6>
            <ul className="space-y-2 text-xs">
              <li>
                <a href="/privacy" className="hover:text-primary">
                  Политика конфиденциальности
                </a>
              </li>
              <li>
                <a href="/consent" className="hover:text-primary">
                  Согласие на обработку ПДн
                </a>
              </li>
              <li>
                <a href="/offer" className="hover:text-primary">
                  Оферта
                </a>
              </li>
            </ul>
          </div>
        </div>
        <div className="mt-8 border-t border-border pt-6 text-xs">
          © 2026 IndiaHorizone · Made with care · Mumbai → Moscow
        </div>
      </div>
    </footer>
  );
}
