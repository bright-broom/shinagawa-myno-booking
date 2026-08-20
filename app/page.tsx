"use client";

const suggestedSlots = [
  { date: "8月31日（月）", time: "10:30", venue: "品川区役所", note: "最短", tone: "mint" },
  { date: "8月31日（月）", time: "12:00", venue: "品川区役所", note: "残り3枠", tone: "amber" },
  { date: "9月1日（火）", time: "18:00", venue: "荏原第一地域センター", note: "夜間", tone: "blue" },
];

export default function Home() {
  return (
    <main>
      <header className="site-header">
        <a className="brand" href="#top" aria-label="品川カード予約 トップ">
          <span className="brand-mark" aria-hidden="true">品</span>
          <span>品川カード予約</span>
        </a>
        <div className="header-actions">
          <button className="text-button" type="button">やさしい日本語</button>
          <button className="outline-button" type="button">予約の確認・変更</button>
        </div>
      </header>

      <section className="hero" id="top">
        <div className="eyebrow"><span /> マイナンバーカード交付予約</div>
        <h1>空いている時間から、<br /><em>すぐに見つかる。</em></h1>
        <p className="hero-copy">
          5つの会場をまとめて検索。あなたの予定に合う受取時間を、
          会場を行き来せずに選べます。
        </p>

        <form className="search-panel" onSubmit={(event) => event.preventDefault()}>
          <div className="field-group wide-field">
            <label htmlFor="date">いつ受け取りたいですか？</label>
            <input id="date" name="date" type="date" defaultValue="2026-08-31" />
          </div>
          <div className="field-group">
            <label htmlFor="time">希望の時間帯</label>
            <select id="time" name="time" defaultValue="any">
              <option value="any">指定なし</option>
              <option value="morning">午前</option>
              <option value="afternoon">午後</option>
              <option value="evening">17時以降</option>
            </select>
          </div>
          <button className="primary-button" type="submit">空きを検索</button>
          <p className="search-help">予約には、交付通知書に記載された予約IDが必要です。</p>
        </form>
      </section>

      <section className="results-section" aria-labelledby="results-title">
        <div className="section-heading">
          <div>
            <p className="kicker">おすすめの空き時間</p>
            <h2 id="results-title">最短で選べる3つの候補</h2>
          </div>
          <button className="text-link" type="button">すべての空きを見る <span aria-hidden="true">→</span></button>
        </div>

        <div className="slot-grid">
          {suggestedSlots.map((slot) => (
            <article className="slot-card" key={`${slot.date}-${slot.time}-${slot.venue}`}>
              <div className={`slot-note ${slot.tone}`}>{slot.note}</div>
              <p className="slot-date">{slot.date}</p>
              <p className="slot-time">{slot.time}</p>
              <p className="slot-venue"><span aria-hidden="true">●</span>{slot.venue}</p>
              <button className="slot-button" type="button" aria-label={`${slot.date} ${slot.time} ${slot.venue}を選ぶ`}>
                この時間を選ぶ <span aria-hidden="true">→</span>
              </button>
            </article>
          ))}
        </div>
      </section>

      <footer>
        <p>Shinagawa City Service Concept</p>
        <p>Designed &amp; engineered by Bright Bloom</p>
      </footer>
    </main>
  );
}
