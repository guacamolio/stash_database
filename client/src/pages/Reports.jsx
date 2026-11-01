//ļauj skatīties printēt vai saglabāt kā csv file reportus 
import { useEffect, useState } from 'react';
import { api } from '../api.js';
import { useAuth } from '../context/AuthContext.jsx';
import FormError from '../components/FormError.jsx';

const TITLES = { stock: 'Krājumi', orders: 'Pasūtījumi', placement: 'Izvietojums un stāvoklis', activity: 'Darbību žurnāls' };

export default function Reports() {
  const { user } = useAuth();
  const [type, setType] = useState(user.reports[0]);
  const [report, setReport] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    setError(null); setReport(null);
    api(`/reports/${type}`).then(setReport).catch(setError);
  }, [type]);

  return (
    <>
      <div className="page-head">
        <h2>Atskaites</h2>
        <div className="actions">
          {/* plain link: the browser sends the cookie and downloads the CSV, domāts lai neatsūta vecu report ja piem. maini tabus pārāk aātri un mēģini tad saglabāt failu*/}
          <a className="btn" href={`/api/reports/${type}?format=csv`}>Lejupielādēt CSV</a>
          <button className="btn ghost" onClick={() => window.print()}>Drukāt</button>
        </div>
      </div>
      <div className="tabs">
        {user.reports.map((t) => (
          <button key={t} className={t === type ? 'active' : ''} onClick={() => setType(t)}>{TITLES[t]}</button>
        ))}
      </div>
      <FormError error={error} />
      {report && (
        <>
          <h3>{report.title} <small>({report.rows.length} ieraksti, {new Date().toLocaleString('lv-LV')})</small></h3>
          <table>
            <thead><tr>{report.columns.map((c) => <th key={c.key}>{c.label}</th>)}</tr></thead>
            <tbody>
              {report.rows.map((r, i) => <tr key={i}>{report.columns.map((c) => <td key={c.key}>{r[c.key]}</td>)}</tr>)}
              {report.rows.length === 0 && <tr><td colSpan={report.columns.length}>Nav datu.</td></tr>}
            </tbody>
          </table>
        </>
      )}
    </>
  );
}
