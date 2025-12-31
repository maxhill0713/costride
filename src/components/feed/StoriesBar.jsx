import React from 'react';
import { Plus } from 'lucide-react';

const stories = [
  { id: 1, name: 'Your Story', avatar: null, isOwn: true },
  { id: 2, name: 'The Beast', avatar: null, hasNew: true },
  { id: 3, name: 'Iron Lady', avatar: null, hasNew: true },
  { id: 4, name: 'Tank', avatar: null, hasNew: false },
  { id: 5, name: 'Lightning', avatar: null, hasNew: true },
];

export default function StoriesBar() {
  const handleStoryClick = (story) => {
    if (story.isOwn) {
      alert('Create your story!');
    } else {
      alert(`Viewing ${story.name}'s story`);
    }
  };

  return (
    <div className="bg-white border-b border-gray-200 px-4 py-3 overflow-x-auto scrollbar-hide">
      <div className="flex gap-4">
        {stories.map((story) => (
          <button 
            key={story.id} 
            onClick={() => handleStoryClick(story)}
            className="flex flex-col items-center gap-1 flex-shrink-0 hover:scale-105 transition-transform"
          >
            <div className={`w-16 h-16 rounded-full flex items-center justify-center ${
              story.hasNew 
                ? 'bg-gradient-to-tr from-purple-500 via-pink-500 to-orange-400 p-0.5' 
                : story.isOwn 
                ? 'bg-gray-200 p-0.5'
                : 'bg-gray-300 p-0.5'
            }`}>
              <div className="w-full h-full rounded-full bg-white p-0.5 flex items-center justify-center overflow-hidden">
                {story.avatar ? (
                  <img src={story.avatar} alt={story.name} className="w-full h-full object-cover rounded-full" />
                ) : story.isOwn ? (
                  <div className="w-full h-full rounded-full bg-gray-100 flex items-center justify-center">
                    <Plus className="w-6 h-6 text-gray-600" />
                  </div>
                ) : (
                  <div className="w-full h-full rounded-full bg-gradient-to-br from-purple-400 to-pink-500 flex items-center justify-center">
                    <span className="text-sm font-bold text-white">
                      {story.name.charAt(0)}
                    </span>
                  </div>
                )}
              </div>
            </div>
            <span className="text-xs font-medium text-gray-700 max-w-[64px] truncate">
              {story.name}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}