//sākuma lappa pēc login kas parāda textu ko vari apmēram izdarīt atkarīgi kāds tev ir role 
import { useAuth } from '../context/AuthContext.jsx';
import { ROLE_LV } from '../labels.js';

const HINT = {
  admin: 'Pārvaldiet lietotājus, preces un atrašanās vietas, kā arī skatiet atskaites.',
  worker: 'Pievienojiet un atjauniniet preces, veidojiet pasūtījumus un mainiet to statusus.',
  sorter: 'Reģistrējiet preču izvietojumu plauktos un atjauniniet to stāvokli.',
};

export default function Home() {
  const { user } = useAuth();
  return (
    <>
      <h2>Sveiki, {user.username}!</h2>
      <p>Jūsu loma: <strong>{ROLE_LV[user.role]}</strong></p>
      <p>{HINT[user.role]}</p>
    </>
  );
}
