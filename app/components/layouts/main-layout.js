import React from 'react';
import { Link } from 'react-router';

export default function(props) {
  return (
    <div className="app">
      <header>

      </header>
      <nav>
        <Link to="/" activeClassName="active">Home</Link>
      </nav>
      <main>
        {props.children}
      </main>
      <footer>

      </footer>
    </div>
  );
}
