"use client";

import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  bookingSlots,
  BookingSlot,
  TimeWindow,
  VenueId,
  venueFor,
  venues,
} from "./booking-data";

type Filters = { date: string; time: TimeWindow; venue: VenueId };
type DemoReservation = { reference: string; slot: BookingSlot };

const defaultFilters: Filters = { date: "2026-08-31", time: "any", venue: "all" };

function BookingDialog({
  slot,
  onClose,
  onComplete,
}: {
  slot: BookingSlot;
  onClose: () => void;
  onComplete: (reservation: DemoReservation) => void;
}) {
  const [step, setStep] = useState<"identity" | "confirm" | "complete">("identity");
  const [reservationId, setReservationId] = useState("DEMO-000001");
  const [birthDate, setBirthDate] = useState("19900101");
  const [email, setEmail] = useState("demo@example.jp");
  const [reference, setReference] = useState("");
  const dialogRef = useRef<HTMLDivElement>(null);
  const venue = venueFor(slot);

  useEffect(() => {
    const previousFocus = document.activeElement as HTMLElement | null;
    dialogRef.current?.querySelector<HTMLElement>("button, input")?.focus();
    const handleDialogKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key === "Escape") onClose();
      if (event.key !== "Tab") return;
      const focusable = dialogRef.current?.querySelectorAll<HTMLElement>(
        'button:not([disabled]), input:not([disabled]), select:not([disabled]), [href], [tabindex]:not([tabindex="-1"])',
      );
      if (!focusable?.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", handleDialogKeyDown);
    return () => {
      document.removeEventListener("keydown", handleDialogKeyDown);
      previousFocus?.focus();
    };
  }, [onClose]);

  function handleIdentitySubmit(event: FormEvent) {
    event.preventDefault();
    setStep("confirm");
  }

  function completeDemoReservation() {
    const demoReference = `DEMO-${slot.date.replaceAll("-", "")}-${slot.start.replace(":", "")}`;
    setReference(demoReference);
    setStep("complete");
    onComplete({ reference: demoReference, slot });
  }

  return (
    <div className="dialog-backdrop">
      <div
        aria-describedby="booking-dialog-description"
        aria-labelledby="booking-dialog-title"
        aria-modal="true"
        className="booking-dialog"
        ref={dialogRef}
        role="dialog"
      >
        <div className="dialog-topline">
          <p className="dialog-step">{step === "identity" ? "1 / 2 本人確認" : step === "confirm" ? "2 / 2 内容確認" : "完了"}</p>
          <button aria-label="予約画面を閉じる" className="icon-button" onClick={onClose} type="button">×</button>
        </div>

        {step === "identity" && (
          <form onSubmit={handleIdentitySubmit}>
            <h2 id="booking-dialog-title">この時間で予約を進めます</h2>
            <p className="dialog-description" id="booking-dialog-description">
              ここは検証用デモです。実在する予約IDや個人情報は入力しないでください。
            </p>
            <div className="dialog-summary" aria-label="選択した予約枠">
              <strong>{slot.dateLabel}（{slot.weekday}） {slot.start}～{slot.end}</strong>
              <span>{venue.name}</span>
            </div>
            <div className="dialog-fields">
              <label>
                デモ予約ID
                <input autoComplete="off" maxLength={24} onChange={(event) => setReservationId(event.target.value)} required value={reservationId} />
              </label>
              <label>
                デモ生年月日（YYYYMMDD）
                <input autoComplete="off" inputMode="numeric" maxLength={8} onChange={(event) => setBirthDate(event.target.value)} pattern="[0-9]{8}" required value={birthDate} />
              </label>
              <label>
                デモ連絡先メール
                <input autoComplete="off" onChange={(event) => setEmail(event.target.value)} required type="email" value={email} />
              </label>
            </div>
            <button className="primary-button dialog-primary" type="submit">内容を確認する</button>
          </form>
        )}

        {step === "confirm" && (
          <div>
            <h2 id="booking-dialog-title">予約内容を確認してください</h2>
            <p className="dialog-description" id="booking-dialog-description">予約枠は確定操作時にサーバーで再確認する設計です。</p>
            <dl className="confirmation-list">
              <div><dt>日時</dt><dd>{slot.dateLabel}（{slot.weekday}） {slot.start}～{slot.end}</dd></div>
              <div><dt>会場</dt><dd>{venue.name}</dd></div>
              <div><dt>予約ID</dt><dd>{reservationId}</dd></div>
              <div><dt>メール</dt><dd>{email}</dd></div>
            </dl>
            <div className="dialog-actions">
              <button className="secondary-button" onClick={() => setStep("identity")} type="button">戻る</button>
              <button className="primary-button" onClick={completeDemoReservation} type="button">デモ予約を確定</button>
            </div>
          </div>
        )}

        {step === "complete" && (
          <div className="complete-state">
            <div className="complete-mark" aria-hidden="true">✓</div>
            <h2 id="booking-dialog-title">デモ予約が完了しました</h2>
            <p id="booking-dialog-description">外部システムへの送信や予約枠の消費は行っていません。</p>
            <p className="reference-number"><span>デモ受付番号</span>{reference}</p>
            <button className="primary-button dialog-primary" onClick={onClose} type="button">予約内容を見る</button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function Home() {
  const [draftFilters, setDraftFilters] = useState<Filters>(defaultFilters);
  const [appliedFilters, setAppliedFilters] = useState<Filters>(defaultFilters);
  const [showAll, setShowAll] = useState(false);
  const [simpleJapanese, setSimpleJapanese] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<BookingSlot | null>(null);
  const [reservation, setReservation] = useState<DemoReservation | null>(null);
  const [announcement, setAnnouncement] = useState("最短の予約候補を表示しています。");
  const closeDialog = useCallback(() => setSelectedSlot(null), []);

  const filteredSlots = useMemo(
    () => bookingSlots.filter((slot) => (
      slot.date >= appliedFilters.date
      && (appliedFilters.time === "any" || slot.timeWindow === appliedFilters.time)
      && (appliedFilters.venue === "all" || slot.venueId === appliedFilters.venue)
    )),
    [appliedFilters],
  );

  const visibleSlots = showAll ? filteredSlots : filteredSlots.slice(0, 6);

  function runSearch(event: FormEvent) {
    event.preventDefault();
    setAppliedFilters(draftFilters);
    setShowAll(false);
    const count = bookingSlots.filter((slot) => (
      slot.date >= draftFilters.date
      && (draftFilters.time === "any" || slot.timeWindow === draftFilters.time)
      && (draftFilters.venue === "all" || slot.venueId === draftFilters.venue)
    )).length;
    setAnnouncement(`${count}件の予約候補が見つかりました。`);
    window.setTimeout(() => document.getElementById("results-title")?.focus(), 0);
  }

  return (
    <>
      <a className="skip-link" href="#main-content">本文へ移動</a>
      <div className="demo-banner" role="status">Bright Bloom 検証用デモ — 実際の予約・個人情報送信は行いません</div>
      <header className="site-header">
        <a className="brand" href="#top" aria-label="品川カード予約 トップ">
          <span className="brand-mark" aria-hidden="true">品</span>
          <span>品川カード予約</span>
        </a>
        <div className="header-actions">
          <button aria-pressed={simpleJapanese} className="text-button" onClick={() => setSimpleJapanese((current) => !current)} type="button">
            {simpleJapanese ? "通常の日本語" : "やさしい日本語"}
          </button>
          <a className="outline-button" href="#reservation-status">予約の確認・変更</a>
        </div>
      </header>

      <main id="main-content">
        <section className="hero" id="top">
          <div className="eyebrow"><span /> マイナンバーカード交付予約</div>
          <h1>{simpleJapanese ? <>あいている時間を、<br /><em>すぐにさがせます。</em></> : <>空いている時間から、<br /><em>すぐに見つかる。</em></>}</h1>
          <p className="hero-copy">
            {simpleJapanese
              ? "5つの場所のあいている時間を、いっしょに見ることができます。行きたい日と時間をえらんでください。"
              : "5つの会場をまとめて検索。あなたの予定に合う受取時間を、会場を行き来せずに選べます。"}
          </p>

          <form className="search-panel" onSubmit={runSearch}>
            <div className="field-group">
              <label htmlFor="date">この日から探す</label>
              <input id="date" min="2026-08-31" name="date" onChange={(event) => setDraftFilters({ ...draftFilters, date: event.target.value })} type="date" value={draftFilters.date} />
            </div>
            <div className="field-group">
              <label htmlFor="time">希望の時間帯</label>
              <select id="time" name="time" onChange={(event) => setDraftFilters({ ...draftFilters, time: event.target.value as TimeWindow })} value={draftFilters.time}>
                <option value="any">指定なし</option>
                <option value="morning">午前</option>
                <option value="afternoon">午後</option>
                <option value="evening">17時以降</option>
              </select>
            </div>
            <div className="field-group">
              <label htmlFor="venue">会場</label>
              <select id="venue" name="venue" onChange={(event) => setDraftFilters({ ...draftFilters, venue: event.target.value as VenueId })} value={draftFilters.venue}>
                <option value="all">すべての会場</option>
                {venues.map((venue) => <option key={venue.id} value={venue.id}>{venue.shortName}</option>)}
              </select>
            </div>
            <button className="primary-button" type="submit">空きを検索</button>
            <p className="search-help">予約には交付通知書の予約IDが必要です。本デモでは合成情報だけを使用します。</p>
          </form>
        </section>

        <section className="results-section" aria-labelledby="results-title">
          <p aria-live="polite" className="sr-only">{announcement}</p>
          <div className="section-heading">
            <div>
              <p className="kicker">全5会場を横断検索</p>
              <h2 id="results-title" tabIndex={-1}>{filteredSlots.length ? `予約できる時間が${filteredSlots.length}件あります` : "条件に合う空きがありません"}</h2>
            </div>
            <p className="result-context">{appliedFilters.date.replaceAll("-", "/")} 以降・空きの早い順</p>
          </div>

          {visibleSlots.length ? (
            <div className="slot-grid">
              {visibleSlots.map((slot, index) => {
                const venue = venueFor(slot);
                const note = index === 0 ? "最短" : slot.remaining <= 3 ? `残り${slot.remaining}枠` : slot.timeWindow === "evening" ? "夜間" : "空きあり";
                const tone = index === 0 ? "mint" : slot.remaining <= 3 ? "amber" : slot.timeWindow === "evening" ? "blue" : "neutral";
                return (
                  <article className="slot-card" key={slot.id}>
                    <div className={`slot-note ${tone}`}>{note}</div>
                    <p className="slot-date">{slot.dateLabel}（{slot.weekday}）</p>
                    <p className="slot-time">{slot.start}</p>
                    <p className="slot-range">終了 {slot.end}</p>
                    <p className="slot-venue"><span aria-hidden="true">●</span>{venue.shortName}<small>{venue.area}・駅から徒歩{slot.walkMinutes}分</small></p>
                    <button className="slot-button" onClick={() => setSelectedSlot(slot)} type="button" aria-label={`${slot.dateLabel} ${slot.weekday}曜日 ${slot.start}から${slot.end}、${venue.name}、${slot.remaining}枠の空きから選ぶ`}>
                      この時間を選ぶ <span aria-hidden="true">→</span>
                    </button>
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="empty-state"><strong>条件を少し広げてみてください</strong><p>時間帯を「指定なし」にするか、別の日付から検索できます。</p></div>
          )}

          {filteredSlots.length > 6 && (
            <button className="show-more-button" onClick={() => setShowAll((current) => !current)} type="button">
              {showAll ? "候補を6件に戻す" : `残り${filteredSlots.length - 6}件も表示`}
            </button>
          )}
        </section>

        <section className="principles-section" aria-labelledby="principles-title">
          <div><p className="kicker">Service principles</p><h2 id="principles-title">迷わない予約を、行政サービスの標準に。</h2></div>
          <div className="principle-grid">
            <article><span>01</span><h3>時間から探す</h3><p>施設構造を知らなくても、都合のよい日時から全会場を比較できます。</p></article>
            <article><span>02</span><h3>ルールを先に伝える</h3><p>締切・必要書類・空き状況を選択前に示し、最後の画面で拒否しません。</p></article>
            <article><span>03</span><h3>誰でも操作できる</h3><p>読上げ、キーボード、拡大表示、やさしい日本語を同じ体験として設計します。</p></article>
          </div>
        </section>

        <section className="reservation-status-section" id="reservation-status" aria-labelledby="reservation-status-title">
          <div>
            <p className="kicker">予約の確認・変更</p>
            <h2 id="reservation-status-title">予約した内容を、ひと目で確認。</h2>
            <p>本番では予約IDと生年月日で本人確認後、変更・取消期限を含めて表示します。</p>
          </div>
          {reservation ? (
            <article className="reservation-card">
              <span className="reservation-status">デモ予約済み</span>
              <strong>{reservation.slot.dateLabel}（{reservation.slot.weekday}） {reservation.slot.start}～{reservation.slot.end}</strong>
              <p>{venueFor(reservation.slot).name}</p>
              <code>{reservation.reference}</code>
              <div className="reservation-actions"><button type="button">変更する</button><button type="button">取消について確認</button></div>
            </article>
          ) : (
            <div className="reservation-placeholder"><strong>まだデモ予約はありません</strong><p>空き時間を選ぶと、ここに予約内容が表示されます。</p><a href="#results-title">空き時間を見る</a></div>
          )}
        </section>
      </main>

      <footer>
        <div><strong>品川カード予約</strong><p>Shinagawa City Service Concept</p></div>
        <div className="footer-meta"><p>実データ・実予約枠には接続していません</p><p>Designed &amp; engineered by Bright Bloom</p></div>
      </footer>

      {selectedSlot && <BookingDialog onClose={closeDialog} onComplete={setReservation} slot={selectedSlot} />}
    </>
  );
}
