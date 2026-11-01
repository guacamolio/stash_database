// Shows an error thrown by api(): the main message plus any per-field details from the server.
export default function FormError({ error }) {
  if (!error) return null;
  return (
    <div className="error" role="alert">
      <p>{error.message}</p>
      {error.details?.length > 0 && (
        <ul>{error.details.map((d, i) => <li key={i}>{d.message}</li>)}</ul>
      )}
    </div>
  );
}
