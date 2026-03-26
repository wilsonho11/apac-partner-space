import { useState } from 'react';
import Login from './components/Login';
import Room from './components/Room';

export default function App() {
  const [name, setName] = useState(null);
  if (!name) return <Login onJoin={setName} />;
  return <Room name={name} />;
}
