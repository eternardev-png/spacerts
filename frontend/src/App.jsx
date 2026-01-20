import React, { useState } from 'react';
import GameView from './components/GameView';
import { MainMenu } from './components/MainMenu';
import { HangarView } from './components/HangarView';

// Get User ID from Telegram or Mock
const telegramUser = window.Telegram?.WebApp?.initDataUnsafe?.user;
const USER_ID = telegramUser ? String(telegramUser.id) : "user_123";

const App = () => {
  const [view, setView] = useState('menu'); // menu, game, hangar

  const handlePlay = () => setView('game');
  const handleHangar = () => setView('hangar');
  const handleMenu = () => setView('menu');

  return (
    <>
      {view === 'menu' && <MainMenu onPlay={handlePlay} onHangar={handleHangar} />}
      {view === 'game' && <GameView userId={USER_ID} onBack={handleMenu} />}
      {view === 'hangar' && <HangarView userId={USER_ID} onBack={handleMenu} />}
    </>
  );
};

export default App;
