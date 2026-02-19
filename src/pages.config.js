/**
 * pages.config.js - Page routing configuration
 * 
 * This file is AUTO-GENERATED. Do not add imports or modify PAGES manually.
 * Pages are auto-registered when you create files in the ./pages/ folder.
 * 
 * THE ONLY EDITABLE VALUE: mainPage
 * This controls which page is the landing page (shown when users visit the app).
 * 
 * Example file structure:
 * 
 *   import HomePage from './pages/HomePage';
 *   import Dashboard from './pages/Dashboard';
 *   import Settings from './pages/Settings';
 *   
 *   export const PAGES = {
 *       "HomePage": HomePage,
 *       "Dashboard": Dashboard,
 *       "Settings": Settings,
 *   }
 *   
 *   export const pagesConfig = {
 *       mainPage: "HomePage",
 *       Pages: PAGES,
 *   };
 * 
 * Example with Layout (wraps all pages):
 *
 *   import Home from './pages/Home';
 *   import Settings from './pages/Settings';
 *   import __Layout from './Layout.jsx';
 *
 *   export const PAGES = {
 *       "Home": Home,
 *       "Settings": Settings,
 *   }
 *
 *   export const pagesConfig = {
 *       mainPage: "Home",
 *       Pages: PAGES,
 *       Layout: __Layout,
 *   };
 *
 * To change the main page from HomePage to Dashboard, use find_replace:
 *   Old: mainPage: "HomePage",
 *   New: mainPage: "Dashboard",
 *
 * The mainPage value must match a key in the PAGES object exactly.
 */
import AccountSettings from './pages/AccountSettings';
import Activity from './pages/Activity';
import AddGym from './pages/AddGym';
import AdminGyms from './pages/AdminGyms';
import AppearanceSettings from './pages/AppearanceSettings';
import BrandDiscounts from './pages/BrandDiscounts';
import ClaimGym from './pages/ClaimGym';
import Friends from './pages/Friends';
import GymOwnerDashboard from './pages/GymOwnerDashboard';
import GymRequests from './pages/GymRequests';
import GymRewards from './pages/GymRewards';
import GymSignup from './pages/GymSignup';
import Gyms from './pages/Gyms';
import HelpSupport from './pages/HelpSupport';
import Home from './pages/Home';
import InviteOwner from './pages/InviteOwner';
import Leaderboard from './pages/Leaderboard';
import MemberSignup from './pages/MemberSignup';
import Members from './pages/Members';
import Messages from './pages/Messages';
import NotificationSettings from './pages/NotificationSettings';
import Notifications from './pages/Notifications';
import Onboarding from './pages/Onboarding';
import Plus from './pages/Plus';
import Premium from './pages/Premium';
import PrivacySettings from './pages/PrivacySettings';
import Profile from './pages/Profile';
import ProfileSettings from './pages/ProfileSettings';
import Routines from './pages/Routines';
import Search from './pages/Search';
import Settings from './pages/Settings';
import SubscriptionSettings from './pages/SubscriptionSettings';
import UserProfile from './pages/UserProfile';
import GymCommunity from './pages/GymCommunity';
import __Layout from './Layout.jsx';


export const PAGES = {
    "AccountSettings": AccountSettings,
    "Activity": Activity,
    "AddGym": AddGym,
    "AdminGyms": AdminGyms,
    "AppearanceSettings": AppearanceSettings,
    "BrandDiscounts": BrandDiscounts,
    "ClaimGym": ClaimGym,
    "Friends": Friends,
    "GymOwnerDashboard": GymOwnerDashboard,
    "GymRequests": GymRequests,
    "GymRewards": GymRewards,
    "GymSignup": GymSignup,
    "Gyms": Gyms,
    "HelpSupport": HelpSupport,
    "Home": Home,
    "InviteOwner": InviteOwner,
    "Leaderboard": Leaderboard,
    "MemberSignup": MemberSignup,
    "Members": Members,
    "Messages": Messages,
    "NotificationSettings": NotificationSettings,
    "Notifications": Notifications,
    "Onboarding": Onboarding,
    "Plus": Plus,
    "Premium": Premium,
    "PrivacySettings": PrivacySettings,
    "Profile": Profile,
    "ProfileSettings": ProfileSettings,
    "Routines": Routines,
    "Search": Search,
    "Settings": Settings,
    "SubscriptionSettings": SubscriptionSettings,
    "UserProfile": UserProfile,
    "GymCommunity": GymCommunity,
}

export const pagesConfig = {
    mainPage: "Home",
    Pages: PAGES,
    Layout: __Layout,
};