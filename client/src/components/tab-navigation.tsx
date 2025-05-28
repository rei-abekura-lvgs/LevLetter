import { Badge } from "@/components/ui/badge";
import { TabType, TabCounts } from "@/types/common";

interface TabNavigationProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  tabCounts: TabCounts;
}

export function TabNavigation({ activeTab, onTabChange, tabCounts }: TabNavigationProps) {
  const tabs: Array<{
    id: TabType;
    label: string;
    count: number;
    important: boolean;
  }> = [
    { 
      id: "all", 
      label: "すべて", 
      count: tabCounts.all,
      important: tabCounts.all > 0
    },
    { 
      id: "received", 
      label: "受信", 
      count: tabCounts.received,
      important: tabCounts.isReceivedImportant
    },
    { 
      id: "sent", 
      label: "送信", 
      count: tabCounts.sent,
      important: tabCounts.isSentImportant
    },
    { 
      id: "liked", 
      label: "いいね", 
      count: tabCounts.liked,
      important: false
    }
  ];

  return (
    <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id as TabType)}
          className={`
            relative flex items-center justify-center px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 min-w-[80px]
            ${activeTab === tab.id
              ? 'bg-white text-blue-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }
          `}
        >
          <span>{tab.label}</span>
          {tab.count > 0 && (
            <Badge 
              variant={tab.important ? "destructive" : "secondary"} 
              className={`ml-2 text-xs min-w-[20px] h-5 flex items-center justify-center rounded-full
                ${tab.important 
                  ? 'bg-red-500 text-white animate-pulse' 
                  : 'bg-gray-300 text-gray-700'
                }
              `}
            >
              {tab.count}
            </Badge>
          )}
        </button>
      ))}
    </div>
  );
}