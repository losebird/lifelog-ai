import React, { useState } from 'react';
import { PlusIcon } from './icons/PlusIcon';
import { TextIcon } from './icons/TextIcon';
import { MicrophoneIcon } from './icons/MicrophoneIcon';
import { CameraIcon } from './icons/CameraIcon';
import { LinkIcon } from './icons/LinkIcon';
import { DocumentIcon } from './icons/DocumentIcon';

interface FloatingActionButtonProps {
  onAddText: () => void;
  onAddVoice: () => void;
  onAddLink: () => void;
  onAddScan: () => void;
  onAddFile: () => void;
}

const FloatingActionButton: React.FC<FloatingActionButtonProps> = ({ onAddText, onAddVoice, onAddLink, onAddScan, onAddFile }) => {
  const [isOpen, setIsOpen] = useState(false);

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  const handleActionClick = (action: () => void) => {
    action();
    setIsOpen(false);
  };

  const menuItems = [
    { icon: <TextIcon className="w-5 h-5 text-tag-blue-text" />, label: '新增文字', action: () => handleActionClick(onAddText), colorClass: 'bg-tag-blue-bg hover:bg-tag-blue-bg/90' },
    { icon: <MicrophoneIcon className="w-5 h-5 text-white" />, label: '语音记录', action: () => handleActionClick(onAddVoice), colorClass: 'bg-brand-primary hover:bg-brand-primary/90' },
    { icon: <CameraIcon className="w-5 h-5 text-tag-green-text" />, label: '扫描文档', action: () => handleActionClick(onAddScan), colorClass: 'bg-tag-green-bg hover:bg-tag-green-bg/90' },
    { icon: <LinkIcon className="w-5 h-5 text-tag-sky-text" />, label: '保存链接', action: () => handleActionClick(onAddLink), colorClass: 'bg-tag-sky-bg hover:bg-tag-sky-bg/90' },
    { icon: <DocumentIcon className="w-5 h-5 text-tag-peach-text" />, label: '上传文件', action: () => handleActionClick(onAddFile), colorClass: 'bg-tag-peach-bg hover:bg-tag-peach-bg/90' },
  ];

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-slate-900/40 z-40"
          onClick={toggleMenu}
        />
      )}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end gap-3">
        <div
          className={`transition-all duration-300 ease-in-out flex flex-col items-end gap-3 ${
            isOpen ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'
          }`}
        >
          {menuItems.map((item, index) => (
            <div key={index} className="flex items-center gap-3 group flex-row-reverse">
              <button
                onClick={item.action}
                className={`rounded-full p-2 shadow-lg transition-colors duration-200 ${item.colorClass}`}
                aria-label={item.label}
              >
                {item.icon}
              </button>
               <span className="bg-slate-700 text-white text-sm px-3 py-1 rounded-md shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap">
                {item.label}
              </span>
            </div>
          ))}
        </div>

        <button
          onClick={toggleMenu}
          className="bg-brand-primary text-white rounded-full w-14 h-14 flex items-center justify-center shadow-lg hover:bg-brand-secondary hover:scale-110 focus:outline-none focus:ring-4 focus:ring-brand-primary/50 transition-all duration-200 ease-in-out"
          aria-label="Toggle Menu"
        >
          <PlusIcon className={`w-7 h-7 transition-transform duration-300 ${isOpen ? 'rotate-45' : 'rotate-0'}`} />
        </button>
      </div>
    </>
  );
};

export default FloatingActionButton;