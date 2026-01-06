import { Link } from 'react-router-dom';

export function UnsubscribePageSimple() {
  return (
    <div style={{ padding: '20px', maxWidth: '600px', margin: '0 auto' }}>
      <h1>Unsubscribe Test Page</h1>
      <p>Ova stranica radi!</p>
      <Link to="/">Nazad na početnu</Link>
    </div>
  );
}