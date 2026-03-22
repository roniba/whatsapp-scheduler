import { useEffect, useState } from 'react';
import './Toast.css';

interface Props {
  message: string;
  onDone: () => void;
}

export default function Toast({ message, onDone }: Props) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const hide = setTimeout(() => setVisible(false), 1250);
    const done = setTimeout(onDone, 1500);
    return () => { clearTimeout(hide); clearTimeout(done); };
  }, [onDone]);

  return (
    <div className={`toast${visible ? ' toast--visible' : ''}`}>
      {message}
    </div>
  );
}
