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
import RedeemReward from './pages/RedeemReward';
import Leaderboard from './pages/Leaderboard';
import Routines from './pages/Routines';
import Search from './pages/Search';
import GymOwnerDashboard from './pages/GymOwnerDashboard';
import Gyms from './pages/Gyms';
import Friends from './pages/Friends';
import AdminGyms from './pages/AdminGyms';
import GymCommunity from './pages/GymCommunity';
import GymRewards from './pages/GymRewards';
import Home from './pages/Home';
import Members from './pages/Members';
import Plus from './pages/Plus';
import Premium from './pages/Premium';
import GymSignup from './pages/GymSignup';
import UserProfile from './pages/UserProfile';
import MemberSignup from './pages/MemberSignup';
import Settings from './pages/Settings';
import BrandDiscounts from './pages/BrandDiscounts';
import Profile from './pages/Profile';
import Onboarding from './pages/Onboarding';
import Notifications from './pages/Notifications';
import Messages from './pages/Messages';
import __Layout from './Layout.jsx';


export const PAGES = {
    "RedeemReward": RedeemReward,
    "Leaderboard": Leaderboard,
    "Routines": Routines,
    "Search": Search,
    "GymOwnerDashboard": GymOwnerDashboard,
    "Gyms": Gyms,
    "Friends": Friends,
    "AdminGyms": AdminGyms,
    "GymCommunity": GymCommunity,
    "GymRewards": GymRewards,
    "Home": Home,
    "Members": Members,
    "Plus": Plus,
    "Premium": Premium,
    "GymSignup": GymSignup,
    "UserProfile": UserProfile,
    "MemberSignup": MemberSignup,
    "Settings": Settings,
    "BrandDiscounts": BrandDiscounts,
    "Profile": Profile,
    "Onboarding": Onboarding,
    "Notifications": Notifications,
    "Messages": Messages,
}

export const pagesConfig = {
    mainPage: "Home",
    Pages: PAGES,
    Layout: __Layout,
};