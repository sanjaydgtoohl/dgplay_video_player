import React from 'react';
import PlaylistPlayer, { CreativeItem } from './components/PlaylistPlayer';

const data: CreativeItem[] = [
  { 
    id: 314, 
    slot: 2, 
    media_duration: 4, 
    creative_type: 'jpg', 
    creative_url: 'https://ads.dgplay.live/uploads/Media/3/0/1752060563_d32a552750b21a0b4c43.jpg' 
  },
  { 
    id: 315, 
    slot: 3, 
    media_duration: 13, 
    creative_type: 'mp4', 
    creative_url: 'https://d2nljoxssb7y4b.cloudfront.net/uploads/media/3/videos/2025/07/29/1753797167_d7292be7deadc27103dc.mp4' 
  },
  { 
    id: 316, 
    slot: 4, 
    media_duration: 16, 
    creative_type: 'mp4', 
    creative_url: 'https://d2nljoxssb7y4b.cloudfront.net/uploads/media/3/videos/2025/07/29/1753798862_d0b4f54a2ab4ea1d954c.mp4' 
  },
  { 
    id: 317, 
    slot: 5,
     media_duration: 15, 
    creative_type: 'mp4', 
    creative_url: 'https://d2nljoxssb7y4b.cloudfront.net/uploads/media/3/videos/2025/07/29/1753799196_ed501426ae88c5513c63.mp4' },
  { 
    id: 318, 
    slot: 6, 
    media_duration: 12, 
    creative_type: 'tag',
     creative_url: 'https://ssp.dgtoohl.com/uploads/vast/3809578-display.html' 
    },
  { 
    id: 319, 
    slot: 7,
     media_duration: 10, 
    creative_type: 'jpg', 
    creative_url: 'https://ads.dgplay.live/uploads/Media/3//1755757652_40ee815be21b9997e77f.jpg'
  },
  { 
    id: 320, 
    slot: 8, 
    media_duration: 10, 
    creative_type: 'jpg', 
    creative_url: 'https://ads.dgplay.live/uploads/Media/3//1756120751_64cf5db16f8c069f4f7e.jpg'
   },
  { 
    id: 321,
     slot: 9, 
    media_duration: 7, 
    creative_type: 'mp4', 
    creative_url: 'https://ads.dgplay.live/uploads/Media/3//1758106849_992f90810ebbfa254577.mp4' 
    },
  {
     id: 322, 
     slot: 10, 
     media_duration: 6, 
    creative_type: 'tag', 
    creative_url: 'https://ads.dgplay.live/API/Mobile/getPlaylisFCMLink/3/632/51379' },
  { 
    id: 323,
     slot: 11, 
    media_duration: 10, 
    creative_type: 'tag',
     creative_url: 'https://ads.dgplay.live/API/Mobile/getPlaylisFCMLink/3/632/51379'
   },
];

const App: React.FC = () => {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100">
      <div className="w-full">
        <PlaylistPlayer items={data} />
      </div>
    </div>
  );
};

export default App;