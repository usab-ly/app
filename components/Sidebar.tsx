'use client';

import { useState, useEffect, use } from 'react';
import {
  Bot,
  Route,
  FileBarChart,
  AlertTriangle,
  History,
  Settings,
  ArrowLeft,
  Gift,
  Search,
  LucideIcon,
  Cherry,
} from 'lucide-react';
import { useRouter } from 'next/navigation';

type TabId = 'agent' | 'flows' | 'reports' | 'issues' | 'history' | 'settings';

interface NavItem {
  id: TabId;
  label: string;
  icon: LucideIcon;
}

const navItems: NavItem[] = [
  { id: 'agent', label: 'Agent', icon: Bot },
  { id: 'flows', label: 'Flows', icon: Route },
  { id: 'reports', label: 'Reports', icon: FileBarChart },
  { id: 'issues', label: 'Issues', icon: AlertTriangle },
  { id: 'history', label: 'History', icon: History },
  { id: 'settings', label: 'Settings', icon: Settings },
];

interface SidebarProps {
  onNavigate?: (url: string) => void;
  onBack?: () => void;
  onForward?: () => void;
  onRefresh?: () => void;
  onToggleSidebar?: () => void;
  onRunFlow?: (flowName: string, flowGoal?: string) => void;
  currentUrl?: string;
  currentFavicon?: string | null;
}

export default function Sidebar({
  onNavigate,
  onBack,
  onForward,
  onRefresh,
  onToggleSidebar,
  onRunFlow,
  currentUrl = 'https://www.google.com',
  currentFavicon,
}: SidebarProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabId>('agent');
  const [hudVisible, setHudVisible] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');

  useEffect(() => {
    const checkHudState = async () => {
      if (typeof window !== 'undefined' && window.api) {
        const state = await window.api.getHudState();
        if (state) setHudVisible(state.hudVisible);
      }
    };
    checkHudState();
    const interval = setInterval(checkHudState, 500);
    return () => clearInterval(interval);
  }, []);

  if (!hudVisible) return null;

  return (
    <div className='h-screen flex rounded-l-4xl '>
      {/* Icon Navigation Rail */}
      <aside className='w-25 h-full flex flex-col items-center justify-between backdrop-blur-3xl pt-8 pb-4 absolute top-0 left-0'>
        <div className='h-4 w-full titlebar' />
        {/* Traffic lights spacer */}

        {/* Brand Logo (minimal cursive U) */}
        {/* <div
          aria-label='Usably Logo'
          className='mt-2 -mb-5 w-12 h-12 flex items-center justify-center'
        >
          <svg viewBox='0 0 64 64' className='w-9 h-9 text-white/80'>
            <path
              d='M18 12 C 15 40, 20 44, 32 44 C 44 44, 49 40, 46 12'
              stroke='currentColor'
              strokeWidth='3.5'
              fill='none'
              strokeLinecap='round'
              strokeLinejoin='round'
            />
          </svg>
        </div> */}

        {/* Nav Items */}
        <nav className='flex flex-col items-center justify-start gap-2 mt-2 h-fit sidebar-grain'>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`
                  w-full flex flex-col items-center gap-2 py-3 px-3 rounded-xl transition-all duration-200
                  ${
                    isActive
                      ? 'bg-white/10 text-white'
                      : 'text-white/50 hover:text-white/80 hover:bg-white/5'
                  }
                `}
              >
                <Icon size={30} strokeWidth={1.5} />
                <span className='text-[10px] font-medium tracking-wide'>
                  {item.label}
                </span>
              </button>
            );
          })}
        </nav>

        {/* Footer Actions */}
        <div className='flex flex-col items-center gap-3 text-white/40'>
          <button
            onClick={onBack}
            className='p-2 rounded-lg hover:bg-white/10 hover:text-white/80 transition-all'
            title='Go Back'
          >
            <ArrowLeft size={18} />
          </button>
        </div>
      </aside>

      {/* Content Panel */}
      <div className='flex-1 w-[250px] flex flex-col ml-[100px]'>
        {/* Search Header */}
        <div className='py-4'>
          <div className='relative'>
            <Search
              size={16}
              className='absolute left-3 top-1/2 -translate-y-1/2 text-white/30'
            />
            <input
              type='text'
              placeholder={`Search ${navItems.find((n) => n.id === activeTab)?.label}...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className='w-full bg-white/5 border border-white/10 rounded-lg py-2.5 pl-10 pr-4 text-sm text-white/90 placeholder:text-white/30 focus:outline-none focus:border-white/20 focus:bg-white/10 transition-all'
            />
          </div>
        </div>

        {/* Tab Content */}
        <div className='flex-1 overflow-y-auto pb-4'>
          {activeTab === 'agent' && <AgentPanel />}
          {activeTab === 'flows' && <FlowsPanel onRunFlow={onRunFlow} />}
          {activeTab === 'reports' && <ReportsPanel />}
          {activeTab === 'issues' && <IssuesPanel />}
          {activeTab === 'history' && <HistoryPanel />}
          {activeTab === 'settings' && <SettingsPanel />}
        </div>
      </div>
    </div>
  );
}

// Panel Components
function AgentPanel() {
  const router = useRouter();
  const agents = [
    {
      id: 1,
      name: 'UX Explorer',
      description: 'Full site exploration',
      status: 'ready',
    },
    {
      id: 2,
      name: 'Flow Tester',
      description: 'Test specific user flows',
      status: 'ready',
    },
    {
      id: 3,
      name: 'Accessibility Checker',
      description: 'WCAG compliance testing',
      status: 'ready',
    },
    {
      id: 4,
      name: 'Performance Auditor',
      description: 'Speed & load analysis',
      status: 'running',
    },
  ];

  const route = () => {
    // router.push('/agent');
  };

  return (
    <div className='space-y-3'>
      <p className='text-xs text-white/40 uppercase tracking-wider font-medium mb-4'>
        Select Agent
      </p>
      {agents.map((agent) => (
        <div
          key={agent.id}
          className='group p-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/10 cursor-pointer transition-all'
          onClick={() => route()}
        >
          <div className='flex items-start justify-between'>
            <div>
              <h3 className='text-sm font-medium text-white/90'>
                {agent.name}
              </h3>
              <p className='text-xs text-white/50 mt-1'>{agent.description}</p>
            </div>
            <span
              className={`text-[10px] px-2 py-1 rounded-full ${
                agent.status === 'running'
                  ? 'bg-green-500/20 text-green-400'
                  : 'bg-white/10 text-white/50'
              }`}
            >
              {agent.status}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}

function FlowsPanel({
  onRunFlow,
}: {
  onRunFlow?: (name: string, goal?: string) => void;
}) {
  const flows = [
    {
      id: 15,
      name: 'Product Thoughts',
      goal: 'User test this website and provide feedback on the product and what could be improved',
      lastRun: 'Never',
    },
    {
      id: 14,
      name: 'Do the Hello World Algo',
      goal: 'Complete the Hello World algorithm on this Algorithm Typing website',
      lastRun: 'Never',
    },
    {
      id: 13,
      name: 'Electric Toothbrush Search',
      goal: 'Search for an article for the best electric toothbrushes',
      lastRun: 'Never',
    },
    {
      id: 12,
      name: 'Dandruff Search',
      goal: 'Go to amazon.com and search for dandruff shampoos',
      lastRun: 'Never',
    },
    {
      id: 11,
      name: 'Search For Arun Deegutla Linkedin',
      goal: 'Search for Arun Deegutla on Google and navigate to his profile on Linkedin',
      lastRun: '2 hours ago',
    },
    {
      id: 10,
      name: 'Login with Codeforces',
      goal: 'Navigate to the authentication page and log in with codeforces',
      lastRun: '2 hours ago',
    },
    {
      id: 1,
      name: 'Sign Up Flow',
      goal: 'Sign up for a new account using a temporary email',
      lastRun: '2 hours ago',
    },
    {
      id: 2,
      name: 'Checkout Process',
      goal: 'Add an item to cart and complete checkout',
      lastRun: '1 day ago',
    },
    {
      id: 3,
      name: 'Password Reset',
      goal: 'Reset password for an existing account',
      lastRun: 'Never',
    },
    {
      id: 4,
      name: 'Profile Update',
      goal: 'Update user profile name and bio',
      lastRun: '3 days ago',
    },
  ];

  return (
    <div className='space-y-3'>
      <div className='flex items-center justify-between mb-4'>
        <p className='text-xs text-white/40 uppercase tracking-wider font-medium'>
          User Flows
        </p>
        <button className='text-xs text-purple-400 hover:text-purple-300 transition-colors'>
          + New Flow
        </button>
      </div>
      {flows.map((flow) => (
        <div
          key={flow.id}
          className='group p-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/10 cursor-pointer transition-all'
        >
          <div className='flex items-center justify-between'>
            <div>
              <h3 className='text-sm font-medium text-white/90'>{flow.name}</h3>
              <p className='text-xs text-white/50 mt-1'>
                Last run: {flow.lastRun}
              </p>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onRunFlow?.(flow.name, flow.goal);
              }}
              className='opacity-0 group-hover:opacity-100 text-xs px-3 py-1.5 rounded-lg bg-purple-500/20 text-purple-400 hover:bg-purple-500/30 transition-all'
            >
              Run
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

function ReportsPanel() {
  const reports = [
    { id: 1, site: 'example.com', score: 72, issues: 12, date: 'Dec 18, 2025' },
    { id: 2, site: 'myapp.io', score: 89, issues: 4, date: 'Dec 17, 2025' },
    {
      id: 3,
      site: 'dashboard.co',
      score: 45,
      issues: 28,
      date: 'Dec 15, 2025',
    },
  ];

  return (
    <div className='space-y-3'>
      <p className='text-xs text-white/40 uppercase tracking-wider font-medium mb-4'>
        Recent Reports
      </p>
      {reports.map((report) => (
        <div
          key={report.id}
          className='group p-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/10 cursor-pointer transition-all'
        >
          <div className='flex items-center justify-between mb-2'>
            <h3 className='text-sm font-medium text-white/90'>{report.site}</h3>
            <span
              className={`text-lg font-bold ${
                report.score >= 80
                  ? 'text-green-400'
                  : report.score >= 60
                    ? 'text-yellow-400'
                    : 'text-red-400'
              }`}
            >
              {report.score}
            </span>
          </div>
          <p className='text-xs text-white/50'>
            {report.issues} issues found • {report.date}
          </p>
        </div>
      ))}
    </div>
  );
}

function IssuesPanel() {
  const issues = [
    {
      id: 1,
      title: 'Sign up requires 10 clicks',
      severity: 'high',
      flow: 'Sign Up Flow',
    },
    {
      id: 2,
      title: 'Confusing navigation menu',
      severity: 'medium',
      flow: 'General',
    },
    {
      id: 3,
      title: 'Missing form validation',
      severity: 'high',
      flow: 'Checkout',
    },
    {
      id: 4,
      title: 'Slow page transition',
      severity: 'low',
      flow: 'Dashboard',
    },
  ];

  const severityColors = {
    high: 'bg-red-500/20 text-red-400',
    medium: 'bg-yellow-500/20 text-yellow-400',
    low: 'bg-blue-500/20 text-blue-400',
  };

  return (
    <div className='space-y-3'>
      <p className='text-xs text-white/40 uppercase tracking-wider font-medium mb-4'>
        Friction Points
      </p>
      {issues.map((issue) => (
        <div
          key={issue.id}
          className='group p-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/10 cursor-pointer transition-all'
        >
          <div className='flex items-start justify-between gap-3'>
            <div className='flex-1'>
              <h3 className='text-sm font-medium text-white/90'>
                {issue.title}
              </h3>
              <p className='text-xs text-white/50 mt-1'>{issue.flow}</p>
            </div>
            <span
              className={`text-[10px] px-2 py-1 rounded-full capitalize ${severityColors[issue.severity as keyof typeof severityColors]}`}
            >
              {issue.severity}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}

function HistoryPanel() {
  const history = [
    { id: 1, action: 'Ran UX Explorer on example.com', time: '2 hours ago' },
    {
      id: 2,
      action: 'Created new flow: Checkout Process',
      time: '5 hours ago',
    },
    { id: 3, action: 'Exported report to Jira', time: '1 day ago' },
    { id: 4, action: 'Fixed 3 issues on myapp.io', time: '2 days ago' },
  ];

  return (
    <div className='space-y-3'>
      <p className='text-xs text-white/40 uppercase tracking-wider font-medium mb-4'>
        Activity History
      </p>
      {history.map((item) => (
        <div
          key={item.id}
          className='p-3 rounded-xl bg-white/5 border border-white/5'
        >
          <p className='text-sm text-white/80'>{item.action}</p>
          <p className='text-xs text-white/40 mt-1'>{item.time}</p>
        </div>
      ))}
    </div>
  );
}

function SettingsPanel() {
  return (
    <div className='space-y-4'>
      <p className='text-xs text-white/40 uppercase tracking-wider font-medium mb-4'>
        Settings
      </p>

      <div className='p-4 rounded-xl bg-white/5 border border-white/5'>
        <h3 className='text-sm font-medium text-white/90 mb-3'>Integrations</h3>
        <div className='space-y-2'>
          <div className='flex items-center justify-between py-2'>
            <span className='text-sm text-white/70'>Jira</span>
            <span className='text-xs px-2 py-1 rounded-full bg-green-500/20 text-green-400'>
              Connected
            </span>
          </div>
          <div className='flex items-center justify-between py-2'>
            <span className='text-sm text-white/70'>Linear</span>
            <button className='text-xs text-purple-400 hover:text-purple-300'>
              Connect
            </button>
          </div>
          <div className='flex items-center justify-between py-2'>
            <span className='text-sm text-white/70'>GitHub</span>
            <button className='text-xs text-purple-400 hover:text-purple-300'>
              Connect
            </button>
          </div>
        </div>
      </div>

      <div className='p-4 rounded-xl bg-white/5 border border-white/5'>
        <h3 className='text-sm font-medium text-white/90 mb-3'>Preferences</h3>
        <div className='space-y-3'>
          <label className='flex items-center justify-between'>
            <span className='text-sm text-white/70'>Auto-generate tasks</span>
            <input
              type='checkbox'
              defaultChecked
              className='w-4 h-4 rounded accent-purple-500'
            />
          </label>
          <label className='flex items-center justify-between'>
            <span className='text-sm text-white/70'>Email notifications</span>
            <input
              type='checkbox'
              className='w-4 h-4 rounded accent-purple-500'
            />
          </label>
        </div>
      </div>
    </div>
  );
}
