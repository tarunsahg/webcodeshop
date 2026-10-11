import { db } from '@/lib/db';

// Reads the Google Analytics measurement ID saved in Admin -> Integrations.
// Falls back to the NEXT_PUBLIC_GA_ID env var. Renders nothing until an ID exists.
function gaId() {
  try {
    const r = db().prepare("SELECT value FROM settings WHERE key='gaMeasurementId'").get();
    if (r && r.value) {
      try { return (JSON.parse(r.value) || '').toString().trim(); } catch { return (r.value || '').toString().trim(); }
    }
  } catch {}
  return (process.env.NEXT_PUBLIC_GA_ID || '').trim();
}

export default function Analytics() {
  const id = gaId();
  if (!id) return null;
  const inline = "window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','" + id + "');";
  return (
    <>
      <script async src={'https://www.googletagmanager.com/gtag/js?id=' + id}></script>
      <script dangerouslySetInnerHTML={ { __html: inline } } />
    </>
  );
}
