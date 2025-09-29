import React from 'react';
import VideoPlayer from './components/VideoPlayer';

const App: React.FC = () => {
  return (
    <div className="flex items-center justify-center h-screen bg-gray-100">
      <div className="w-full max-w-3xl p-4">
        <VideoPlayer src="https://d2nljoxssb7y4b.cloudfront.net/uploads/media/3/videos/2025/07/29/1753799196_ed501426ae88c5513c63.mp4" />
      </div>
    </div>
  );
};

export default App;