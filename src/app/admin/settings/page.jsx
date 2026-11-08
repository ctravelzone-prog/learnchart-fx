// ---------------------------------------------------------------------------
// admin/settings — Site Settings (admin only). The placeholder content
// on the Home page: stats strip, testimonials, social links, broker
// cards, inside-video ID, live/consult providers, contact info,
// next-batch date and the footer mission line. Lists are edited as
// "one item per line, fields separated by |" — the route parses them
// and stores JSON. Saving never wipes a list: an empty textarea keeps
// the previous value.
// ---------------------------------------------------------------------------
import { requireAdmin } from "../../../lib/admin.js";
import { getStats, getTestimonials, getSocials, getBrokers, getSingleSetting } from "../../../lib/settings.js";

export const metadata = { title: "Site Settings — Admin — LearnChart FX" };

export default async function AdminSettingsPage({ searchParams }) {
  await requireAdmin();
  const sp = await searchParams;
  const stats = getStats();
  const testimonials = getTestimonials();
  const socials = getSocials();
  const brokers = getBrokers();

  return (
    <div className="wrap section">
      <h1 style={{ fontSize: 36 }}>Site Settings</h1>
      <p className="muted">Placeholder content for the Home page and footer. Changes show on the site immediately — no code change needed.</p>
      {sp?.saved === "1" ? <div className="alert alert-ok">Saved.</div> : null}

      <form action="/api/admin/settings" method="post">
        <div className="card">
          <h3>Stats strip (Home)</h3>
          <p className="small muted">One per line: value | label</p>
          <div className="field">
            <textarea name="stats" rows={5} defaultValue={stats.map((s) => `${s.value} | ${s.label}`).join("\n")} />
          </div>

          <h3>Testimonials (Home)</h3>
          <p className="small muted">One per line: name | role | quote</p>
          <div className="field">
            <textarea name="testimonials" rows={5} defaultValue={testimonials.map((t) => `${t.name} | ${t.role} | ${t.quote}`).join("\n")} />
          </div>

          <h3>Social links (Home — Connect With Us)</h3>
          <p className="small muted">One per line: platform | handle | description | button label</p>
          <div className="field">
            <textarea name="socials" rows={6} defaultValue={socials.map((s) => `${s.platform} | ${s.handle} | ${s.desc} | ${s.cta}`).join("\n")} />
          </div>

          <h3>Broker cards (Home)</h3>
          <p className="small muted">One per line: broker name | sign-up link (empty link = placeholder button)</p>
          <div className="field">
            <textarea name="brokers" rows={4} defaultValue={brokers.map((b) => `${b.name} | ${b.link || ""}`).join("\n")} />
          </div>

          <h3>Single values</h3>
          <div className="grid-2">
            <div className="field">
              <label htmlFor="inside_video_id">Inside-video YouTube ID (Home)</label>
              <input id="inside_video_id" name="inside_video_id" defaultValue={getSingleSetting("inside_video_id", "")} placeholder="[Placeholder] = cover only" />
            </div>
            <div className="field">
              <label htmlFor="next_batch_date">Next batch date (Home countdown)</label>
              <input id="next_batch_date" name="next_batch_date" defaultValue={getSingleSetting("next_batch_date", "")} placeholder="2027-01-10T00:00:00+06:00" />
            </div>
            <div className="field">
              <label htmlFor="consult_provider">Consultation audio/video provider</label>
              <input id="consult_provider" name="consult_provider" defaultValue={getSingleSetting("consult_provider", "")} />
            </div>
            <div className="field">
              <label htmlFor="contact_email">Contact email</label>
              <input id="contact_email" name="contact_email" defaultValue={getSingleSetting("contact_email", "")} />
            </div>
            <div className="field">
              <label htmlFor="contact_phone">Contact phone</label>
              <input id="contact_phone" name="contact_phone" defaultValue={getSingleSetting("contact_phone", "")} />
            </div>
          </div>
          <div className="field">
            <label htmlFor="contact_address">Contact address</label>
            <input id="contact_address" name="contact_address" defaultValue={getSingleSetting("contact_address", "")} />
          </div>
          <div className="field">
            <label htmlFor="site_mission">Footer mission line</label>
            <textarea id="site_mission" name="site_mission" rows={2} defaultValue={getSingleSetting("site_mission", "")} />
          </div>

          <button type="submit" className="btn btn-amber">Save Site Settings</button>
        </div>
      </form>
    </div>
  );
}
