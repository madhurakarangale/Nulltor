import { Files, Search, GitBranch, Bot, Blocks, Settings, User } from 'lucide-react';

export type ActivityTab = 'explorer' | 'search' | 'git' | 'agent' | 'extensions' | 'settings';

interface ActivityBarProps {
  activeTab: ActivityTab;
  onChangeTab: (tab: ActivityTab) => void;
  onProfileClick: () => void;
  onSettingsClick?: () => void;
  onBotClick?: () => void;
}

export function ActivityBar({ activeTab, onChangeTab, onProfileClick, onSettingsClick, onBotClick }: ActivityBarProps) {
  return (
    <div className="ide-activity-bar">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'center' }}>
        <div className={`activity-bar-icon icon-btn-bounce ${activeTab === 'explorer' ? 'active' : ''}`} onClick={() => onChangeTab('explorer')} title="Explorer">
          <Files size={24} strokeWidth={1.5} />
        </div>
        <div className={`activity-bar-icon icon-btn-bounce ${activeTab === 'search' ? 'active' : ''}`} onClick={() => onChangeTab('search')} title="Search">
          <Search size={24} strokeWidth={1.5} />
        </div>
        <div className={`activity-bar-icon icon-btn-bounce ${activeTab === 'git' ? 'active' : ''}`} onClick={() => onChangeTab('git')} title="Source Control & Commits">
          <GitBranch size={24} strokeWidth={1.5} />
        </div>
        <div 
          className={`activity-bar-icon icon-btn-bounce agent-glow-pulse ${activeTab === 'agent' ? 'active' : ''}`}
          onClick={onBotClick || (() => onChangeTab('agent'))} 
          title="DevBot AI Assistant (Botpress)"
        >
          <Bot size={24} strokeWidth={1.5} />
        </div>
        <div className={`activity-bar-icon icon-btn-bounce ${activeTab === 'extensions' ? 'active' : ''}`} onClick={() => onChangeTab('extensions')} title="Extensions">
          <Blocks size={24} strokeWidth={1.5} />
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'center', marginTop: 'auto', marginBottom: '12px' }}>
        <div className="activity-bar-icon icon-btn-bounce" onClick={onSettingsClick} title="Settings">
          <Settings size={24} strokeWidth={1.5} />
        </div>
        <div className="activity-bar-icon icon-btn-bounce" onClick={onProfileClick} title="Profile">
          <User size={24} strokeWidth={1.5} />
        </div>
      </div>
    </div>
  );
}
