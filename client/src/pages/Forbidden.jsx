//nav piekļuves page un tas viss
import { Link } from 'react-router-dom';

export default function Forbidden() {
  return (
    <div className="center">
      <h2>403 – Nav piekļuves</h2>
      <p>Jums nav tiesību skatīt šo lapu.</p>
      <Link to="/">Uz sākumu</Link>
    </div>
  );
}
