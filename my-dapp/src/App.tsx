// src/App.tsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import MyDapp from './MyDapp.tsx'; // 메인 DApp 컴포넌트 임포트
import HomePage from './HomePage.tsx'; // HomePage (이전 FactoryApp) 컴포넌트 임포트
import StreamingApp from './Streaming.tsx';

function App() {
  return (
    <Router> {/* 전체 앱을 라우터로 감쌉니다. */}
      <div className="app-container"> {/* UI를 가운데 정렬하기 위한 메인 컨테이너 */}
        <nav style={{ padding: '10px', borderBottom: '1px solid #eee', marginBottom: '20px' }}>
          <ul style={{ listStyle: 'none', padding: 0, display: 'flex', gap: '20px', justifyContent: 'center' }}>
            <li><Link to="/">MyDapp (USDC Stream)</Link></li> {/* 루트 경로 */}
            <li><Link to="/factory">Factory DApp (HomePage)</Link></li> {/* /factory 경로 */}
            <li><Link to="/streaming">Streaming DApp (StreamingApp)</Link></li> {/* /factory 경로 */}
          </ul>
        </nav>

        {/* URL 경로에 따라 렌더링할 컴포넌트를 정의합니다. */}
        <Routes>
          <Route path="/" element={<MyDapp />} /> {/* URL이 "/"일 때 MyDapp 컴포넌트를 보여줍니다. */}
          <Route path="/factory" element={<HomePage />} /> {/* URL이 "/factory"일 때 HomePage 컴포넌트를 보여줍니다. */}
          <Route path="/streaming" element={<StreamingApp />} /> {/* URL이 "/streaming"일 때 StreamingApp 컴포넌트를 보여줍니다. */}
          {/* 여기에 다른 페이지들도 필요하면 추가합니다. */}
        </Routes>
      </div>
    </Router>
  );
}

export default App;