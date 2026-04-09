import { lazy, Suspense } from 'react';
import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import NavigationTracker from '@/lib/NavigationTracker'
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';

import Layout from './Layout';

const Home                = lazy(() => import('./pages/Home'));
const Gyms                = lazy(() => import('./pages/Gyms'));
const Progress            = lazy(() => import('./pages/Progress.jsx'));
const Profile             = lazy(() => import('./pages/Profile'));
const Settings            = lazy(() => import('./pages/Settings'));
const RedeemReward        = lazy(() => import('./pages/RedeemReward'));
const GymOwnerDashboard   = lazy(() => import('./pages/GymOwnerDashboard'));
const Onboarding          = lazy(() => import('./pages/Onboarding'));
const GymSignup           = lazy(() => import('./pages/GymSignup'));
const MemberSignup        = lazy(() => import('./pages/MemberSignup'));
const Plus                = lazy(() => import('./pages/Plus'));
const UserProfile         = lazy(() => import('./pages/UserProfile'));
const Friends             = lazy(() => import('./pages/Friends'));
const Messages            = lazy(() => import('./pages/Messages'));
const Notifications       = lazy(() => import('./pages/Notifications'));
const GymCommunity        = lazy(() => import('./pages/GymCommunity'));
const AccountSettings     = lazy(() => import('./pages/AccountSettings'));
const ProfileSettings     = lazy(() => import('./pages/ProfileSettings'));
const PrivacySettings     = lazy(() => import('./pages/PrivacySettings'));
const AppearanceSettings  = lazy(() => import('./pages/AppearanceSettings'));
const NotificationSettings = lazy(() => import('./pages/NotificationSettings'));
const SubscriptionSettings = lazy(() => import('./pages/SubscriptionSettings'));
const HelpSupport         = lazy(() => import('./pages/HelpSupport'));
const AdminGyms           = lazy(() => import('./pages/AdminGyms'));
const AddGym              = lazy(() => import('./pages/AddGym'));
const ClaimGym            = lazy(() => import('./pages/ClaimGym'));
const GymRequests         = lazy(() => import('./pages/GymRequests'));
const GymUnderReview      = lazy(() => import('./pages/GymUnderReview'));
const InviteOwner         = lazy(() => import('./pages/InviteOwner'));
const Leaderboard         = lazy(() => import('./pages/Leaderboard'));
const Premium             = lazy(() => import('./pages/Premium'));
const Community           = lazy(() => import('./pages/Community'));
const ModeratorDashboard  = lazy(() => import('./pages/ModeratorDashboard'));
const NotificationsHub    = lazy(() => import('./pages/NotificationsHub'));
const PostArchive         = lazy(() => import('./pages/PostArchive'));

function PageLoader() {
  return (
    <div style={{ position: 'fixed', inset: 0, background: '#080e18', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: 32, height: 32, border: '3px solid rgba(59,130,246,0.2)', borderTopColor: '#3b82f6', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

const LayoutWrapper = ({ children, currentPageName }) => (
  <Layout currentPageName={currentPageName}>{children}</Layout>
);

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();

  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div style={{ position: 'fixed', inset: 0, background: 'linear-gradient(to bottom right, #02040a, #0d2360, #02040a)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 72 }}>
        <div style={{ flex: 1 }} />
        <img src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/694b637358644e1c22c8ec6b/b128c437a_Untitleddesign-7.jpg" alt="CoStride" style={{ width: 115, height: 115, borderRadius: 32, objectFit: 'cover', border: '1px solid rgba(255,255,255,0.15)' }} />
        <div style={{ flex: 1 }} />
        <h1 style={{ color: '#ffffff', fontWeight: 900, fontSize: 32, letterSpacing: '-0.03em', margin: 0 }}>CoStride</h1>
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
    <Suspense fallback={<PageLoader />}>
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
    </Suspense>
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