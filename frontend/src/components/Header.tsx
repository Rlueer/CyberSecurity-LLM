import React from 'react';

// Header bileşeninin alacağı props'ları tanımlıyoruz
interface HeaderProps {
  username: string;
  sector: string;
}

const Header: React.FC<HeaderProps> = ({ username, sector }) => {
  // YENİ: Bugünün tarihini formatlı bir şekilde almak için
  const today = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  const sessionDate = `Assessment Session: ${today}`;

  return (
    <header className="bg-[#1e1e3f] p-4 border-b border-gray-700 flex justify-between items-center shadow-md">
      {/* Sol Taraf: Platform Başlığı */}
      <div>
        <h1 className="text-xl font-bold text-blue-300">
          CyberSecurity Maturity Assessment Platform
        </h1>
      </div>

      {/* Sağ Taraf: Oturum ve Kullanıcı Bilgileri */}
      <div className="text-right">
        {/* DEĞİŞİKLİK: Oturum bilgisi artık dinamik tarihi gösteriyor ve rengi ayarlandı */}
        <div className="text-sm text-gray-400 mb-1">
          {sessionDate}
        </div>

        {/* DEĞİŞİKLİK: User ve Sector bilgileri buraya taşındı, aynı renkte ve daha düzenli */}
        <div className="flex items-center justify-end gap-x-4 text-sm text-gray-400">
          <div className="flex items-center gap-x-2">
            <span>User:</span>
            <span className="font-medium text-gray-200 bg-gray-700/50 px-2 py-0.5 rounded">
              {username}
            </span>
          </div>
          <div className="flex items-center gap-x-2">
            <span>Sector:</span>
            <span className="font-medium text-gray-200 bg-gray-700/50 px-2 py-0.5 rounded">
              {sector}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;