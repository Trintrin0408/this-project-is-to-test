export interface OrderTabItem {
  key: string;
  label: string;
}

interface OrderTabsProps {
  tabs: OrderTabItem[];
  activeTab: string;
  onTabChange: (key: string) => void;
}

export default function OrderTabs({ tabs, activeTab, onTabChange }: Readonly<OrderTabsProps>) {
  return (
    <div className="mb-6 border-b border-slate-200">
      <nav className="flex gap-6 overflow-x-auto">
        {tabs.map((tab) => {
          const isActive = tab.key === activeTab;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => onTabChange(tab.key)}
              className={`whitespace-nowrap pb-4 text-sm font-medium transition-colors ${
                isActive ? 'border-b-2 border-blue-600 font-semibold text-blue-600' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </nav>
    </div>
  );
}
