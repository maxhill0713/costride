import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import NavigationTracker from '@/lib/NavigationTracker'
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';

import Layout from './layout';
import Home from './pages/Home';
import Gyms from './pages/Gyms';
import Progress from './pages/Progress';
import Profile from './pages/Profile';
import Settings from './pages/Settings';
import RedeemReward from './pages/RedeemReward';
import GymOwnerDashboard from './pages/GymOwnerDashboard';
import Onboarding from './pages/Onboarding';
import GymSignup from './pages/GymSignup';
import MemberSignup from './pages/MemberSignup';
import Plus from './pages/Plus';
import UserProfile from './pages/UserProfile';
import Friends from './pages/Friends';
import Messages from './pages/Messages';
import Notifications from './pages/Notifications';
import GymCommunity from './pages/GymCommunity';
import AccountSettings from './pages/AccountSettings';
import ProfileSettings from './pages/ProfileSettings';
import PrivacySettings from './pages/PrivacySettings';
import AppearanceSettings from './pages/AppearanceSettings';
import NotificationSettings from './pages/NotificationSettings';
import SubscriptionSettings from './pages/SubscriptionSettings';
import HelpSupport from './pages/HelpSupport';
import AdminGyms from './pages/AdminGyms';
import AddGym from './pages/AddGym';
import ClaimGym from './pages/ClaimGym';
import GymRequests from './pages/GymRequests';
import GymUnderReview from './pages/GymUnderReview';
import InviteOwner from './pages/InviteOwner';
import Leaderboard from './pages/Leaderboard';
import Premium from './pages/Premium';
import Community from './pages/Community';
import ModeratorDashboard from './pages/ModeratorDashboard';
import NotificationsHub from './pages/NotificationsHub';
import PostArchive from './pages/PostArchive';

const LayoutWrapper = ({ children, currentPageName }) => (
  <Layout currentPageName={currentPageName}>{children}</Layout>
);

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();

  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      navigateToLogin();
      return null;
    }
  }

  return (
    <Routes>
      <Route path="/" element={<Navigate to="/Home" replace />} />
      <Route path="/Home" element={<LayoutWrapper currentPageName="Home"><Home /></LayoutWrapper>} />
      <Route path="/Gyms" element={<LayoutWrapper currentPageName="Gyms"><Gyms /></LayoutWrapper>} />
      <Route path="/Progress" element={<LayoutWrapper currentPageName="Progress"><Progress /></LayoutWrapper>} />
      <Route path="/Profile" element={<LayoutWrapper currentPageName="Profile"><Profile /></LayoutWrapper>} />
      <Route path="/Settings" element={<LayoutWrapper currentPageName="Settings"><Settings /></LayoutWrapper>} />
      <Route path="/RedeemReward" element={<LayoutWrapper currentPageName="RedeemReward"><RedeemReward /></LayoutWrapper>} />
      <Route path="/GymOwnerDashboard" element={<LayoutWrapper currentPageName="GymOwnerDashboard"><GymOwnerDashboard /></LayoutWrapper>} />
      <Route path="/Onboarding" element={<LayoutWrapper currentPageName="Onboarding"><Onboarding /></LayoutWrapper>} />
      <Route path="/GymSignup" element={<LayoutWrapper currentPageName="GymSignup"><GymSignup /></LayoutWrapper>} />
      <Route path="/MemberSignup" element={<LayoutWrapper currentPageName="MemberSignup"><MemberSignup /></LayoutWrapper>} />
      <Route path="/Plus" element={<LayoutWrapper currentPageName="Plus"><Plus /></LayoutWrapper>} />
      <Route path="/UserProfile" element={<LayoutWrapper currentPageName="UserProfile"><UserProfile /></LayoutWrapper>} />
      <Route path="/Friends" element={<LayoutWrapper currentPageName="Friends"><Friends /></LayoutWrapper>} />
      <Route path="/Messages" element={<LayoutWrapper currentPageName="Messages"><Messages /></LayoutWrapper>} />
      <Route path="/Notifications" element={<LayoutWrapper currentPageName="Notifications"><Notifications /></LayoutWrapper>} />
      <Route path="/GymCommunity" element={<LayoutWrapper currentPageName="GymCommunity"><GymCommunity /></LayoutWrapper>} />
      <Route path="/AccountSettings" element={<LayoutWrapper currentPageName="AccountSettings"><AccountSettings /></LayoutWrapper>} />
      <Route path="/ProfileSettings" element={<LayoutWrapper currentPageName="ProfileSettings"><ProfileSettings /></LayoutWrapper>} />
      <Route path="/PrivacySettings" element={<LayoutWrapper currentPageName="PrivacySettings"><PrivacySettings /></LayoutWrapper>} />
      <Route path="/AppearanceSettings" element={<LayoutWrapper currentPageName="AppearanceSettings"><AppearanceSettings /></LayoutWrapper>} />
      <Route path="/NotificationSettings" element={<LayoutWrapper currentPageName="NotificationSettings"><NotificationSettings /></LayoutWrapper>} />
      <Route path="/SubscriptionSettings" element={<LayoutWrapper currentPageName="SubscriptionSettings"><SubscriptionSettings /></LayoutWrapper>} />
      <Route path="/HelpSupport" element={<LayoutWrapper currentPageName="HelpSupport"><HelpSupport /></LayoutWrapper>} />
      <Route path="/AdminGyms" element={<LayoutWrapper currentPageName="AdminGyms"><AdminGyms /></LayoutWrapper>} />
      <Route path="/AddGym" element={<LayoutWrapper currentPageName="AddGym"><AddGym /></LayoutWrapper>} />
      <Route path="/ClaimGym" element={<LayoutWrapper currentPageName="ClaimGym"><ClaimGym /></LayoutWrapper>} />
      <Route path="/GymRequests" element={<LayoutWrapper currentPageName="GymRequests"><GymRequests /></LayoutWrapper>} />
      <Route path="/GymUnderReview" element={<LayoutWrapper currentPageName="GymUnderReview"><GymUnderReview /></LayoutWrapper>} />
      <Route path="/InviteOwner" element={<LayoutWrapper currentPageName="InviteOwner"><InviteOwner /></LayoutWrapper>} />
      <Route path="/Leaderboard" element={<LayoutWrapper currentPageName="Leaderboard"><Leaderboard /></LayoutWrapper>} />
      <Route path="/Premium" element={<LayoutWrapper currentPageName="Premium"><Premium /></LayoutWrapper>} />
      <Route path="/Community" element={<LayoutWrapper currentPageName="Community"><Community /></LayoutWrapper>} />
      <Route path="/ModeratorDashboard" element={<LayoutWrapper currentPageName="ModeratorDashboard"><ModeratorDashboard /></LayoutWrapper>} />
      <Route path="/NotificationsHub" element={<LayoutWrapper currentPageName="NotificationsHub"><NotificationsHub /></LayoutWrapper>} />
      <Route path="/PostArchive" element={<LayoutWrapper currentPageName="PostArchive"><PostArchive /></LayoutWrapper>} />
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};

function App() {
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <NavigationTracker />
          <AuthenticatedApp />
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App