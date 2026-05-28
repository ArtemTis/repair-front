import { Card } from "../../shared/ui";
import "./ServicesPage.css";

const YANDEX_MAP_EMBED =
  "https://yandex.ru/map-widget/v1/?filter=alternate_vertical%3ARequestWindow&ll=46.061314%2C51.550468&mode=search&sctx=ZAAAAAgBEAAaKAoSCdRhhVs%2BCkdAEes2qP3WxklAEhIJhNkEGJY%2F1T8RjiEAOPbsvT8iBgABAgMEBSgKOABAx80GSAFqAnJ1nQHNzMw9oAEAqAEAvQF%2B1J2QwgGPAa%2Fyx9FSn7zVsg29q8jV5gKLrqO5hQff%2B93WBuS7l6iw2Ya5aICM5qCsAaH83b0Eu%2BT93McBkJ6jlp8GuvDS2ASg24yQ0APGvaGWBJCqpY4E8PTUwv4Dip7LgK4Bka%2FC%2BwOiwfr3BOOng8OoBdqo%2BOWXBduJlPLABeD52spngPymt%2BoC6cCDm7wC%2BM6xgeACggIb0YDQtdC80L7QvdGCINGC0LXRhdC90LjQutC4igIJMTg0MTA4MjIzkgIAmgIMZGVza3RvcC1tYXBzqgIlMjA0ODEwODEyODg0LDU3MjkxNzMyMDUwLDEwMzE3NTk2ODA1NtoCKAoSCSwQPSmTCEdAEUkcOgcIxklAEhIJALsqUIvB0j8RAHrysFBruj%2FgAgE%3D&sll=46.061314%2C51.550468&sspn=0.293063%2C0.103192&text=%D1%80%D0%B5%D0%BC%D0%BE%D0%BD%D1%82%20%D1%82%D0%B5%D1%85%D0%BD%D0%B8%D0%BA%D0%B8&utm_campaign=desktop&utm_medium=search&utm_source=maps&z=12.84";

const ServicesPage = () => {
  return (
    <section className="services-page" aria-labelledby="services-page-title">
      <div className="services-page__inner">
        <header className="services-page__hero">
          <p className="services-page__eyebrow">рядом с вами</p>
          <h1 id="services-page-title" className="services-page__title">
            Сервисные центры
          </h1>
          <p className="services-page__subtitle">
            Карта точек поблизости и короткая памятка перед визитом в сервис.
          </p>
        </header>

        <div className="services-page__tips">
          <Card className="services-page__card">
            <h2 className="services-page__card-title">Перед визитом</h2>
            <ul className="services-page__list">
              <li>Сохраните гарантийный талон и чек — пригодятся при спорной ситуации.</li>
              <li>Опишите симптомы простыми словами и отметьте, когда они появились.</li>
              <li>Возьмите блок питания, кабели и при необходимости съёмные накопители.</li>
              <li>Сделайте резерв данных, если приносите ПК или ноутбук.</li>
            </ul>
          </Card>

          <Card className="services-page__card">
            <h2 className="services-page__card-title">Выбор центра</h2>
            <ul className="services-page__list">
              <li>Сравните отзывы и сроки диагностики в нескольких точках поблизости.</li>
              <li>Уточните, дают ли письменную смету до начала платного ремонта.</li>
              <li>Спросите про условия гарантии на работы и установленные детали.</li>
              <li>Убедитесь, что мастера работают с вашей моделью и типом техники.</li>
            </ul>
          </Card>

          <Card className="services-page__card">
            <h2 className="services-page__card-title">После ремонта</h2>
            <ul className="services-page__list">
              <li>Проверьте устройство на месте: типичный сценарий использования 5–10 минут.</li>
              <li>Зафиксируйте состояние корпуса и экрана на акта приёмке.</li>
              <li>Возьмите акт выполненных работ и сохраните контакты сервиса.</li>
              <li>Если не согласны с диагностикой — возможна независимая экспертиза.</li>
            </ul>
          </Card>
        </div>

        <Card className="services-page__map-card">
          <h2 className="services-page__map-heading">Карта сервисов рядом</h2>

          <div className="services-page__map-frame">
            <iframe
              title="Карта сервисных центров — ремонт техники в Саратове"
              src={YANDEX_MAP_EMBED}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              allowFullScreen
            />
          </div>
        </Card>
      </div>
    </section>
  );
};

export default ServicesPage;
