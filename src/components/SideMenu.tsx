import { Link } from 'react-router-dom';

export default function SideMenu() {
  return (
    <nav className="bg-gray-200 p-4 h-full">
      <ul>
        <li><Link to="/" className="block py-2">Home</Link></li>
        <li><Link to="/about" className="block py-2">About</Link></li>
        <li><Link to="/dashboard" className="block py-2">Dashboard</Link></li>
      </ul>
    </nav>
  );
}