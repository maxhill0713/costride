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
import Leaderboard from './pages/Leaderboard';
import Search from './pages/Search';
import RedeemReward from './pages/RedeemReward';
import Home from './pages/Home';
import Gyms from './pages/Gyms';
import UserProfile from './pages/UserProfile';
import Premium from './pages/Premium';
import GymOwnerDashboard from './pages/GymOwnerDashboard';
import GymCommunity from './pages/GymCommunity';
import Settings from './pages/Settings';
import GymSignup from './pages/GymSignup';
import Plus from './pages/Plus';
import BrandDiscounts from './pages/BrandDiscounts';
import GymRewards from './pages/GymRewards';
import Members from './pages/Members';
import Notifications from './pages/Notifications';
import Profile from './pages/Profile';
import Routines from './pages/Routines';
import Friends from './pages/Friends';
import Onboarding from './pages/Onboarding';
import MemberSignup from './pages/MemberSignup';
import Messages from './pages/Messages';
import AdminGyms from './pages/AdminGyms';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Leaderboard": Leaderboard,
    "Search": Search,
    "RedeemReward": RedeemReward,
    "Home": Home,
    "Gyms": Gyms,
    "UserProfile": UserProfile,
    "Premium": Premium,
    "GymOwnerDashboard": GymOwnerDashboard,
    "GymCommunity": GymCommunity,
    "Settings": Settings,
    "GymSignup": GymSignup,
    "Plus": Plus,
    "BrandDiscounts": BrandDiscounts,
    "GymRewards": GymRewards,
    "Members": Members,
    "Notifications": Notifications,
    "Profile": Profile,
    "Routines": Routines,
    "Friends": Friends,
    "Onboarding": Onboarding,
    "MemberSignup": MemberSignup,
    "Messages": Messages,
    "AdminGyms": AdminGyms,
}

export const pagesConfig = {
    mainPage: "Home",
    Pages: PAGES,
    Layout: __Layout,
};