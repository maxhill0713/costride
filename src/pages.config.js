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
import GymOwnerDashboard from './pages/GymOwnerDashboard';
import MemberSignup from './pages/MemberSignup';
import Leaderboard from './pages/Leaderboard';
import Search from './pages/Search';
import GymCommunity from './pages/GymCommunity';
import BrandDiscounts from './pages/BrandDiscounts';
import AdminGyms from './pages/AdminGyms';
import Home from './pages/Home';
import Members from './pages/Members';
import Premium from './pages/Premium';
import Profile from './pages/Profile';
import Gyms from './pages/Gyms';
import GymSignup from './pages/GymSignup';
import Routines from './pages/Routines';
import Plus from './pages/Plus';
import Friends from './pages/Friends';
import Settings from './pages/Settings';
import Onboarding from './pages/Onboarding';
import GymRewards from './pages/GymRewards';
import RedeemReward from './pages/RedeemReward';
import Messages from './pages/Messages';
import Notifications from './pages/Notifications';
import UserProfile from './pages/UserProfile';
import AddGym from './pages/AddGym';
import __Layout from './Layout.jsx';


export const PAGES = {
    "GymOwnerDashboard": GymOwnerDashboard,
    "MemberSignup": MemberSignup,
    "Leaderboard": Leaderboard,
    "Search": Search,
    "GymCommunity": GymCommunity,
    "BrandDiscounts": BrandDiscounts,
    "AdminGyms": AdminGyms,
    "Home": Home,
    "Members": Members,
    "Premium": Premium,
    "Profile": Profile,
    "Gyms": Gyms,
    "GymSignup": GymSignup,
    "Routines": Routines,
    "Plus": Plus,
    "Friends": Friends,
    "Settings": Settings,
    "Onboarding": Onboarding,
    "GymRewards": GymRewards,
    "RedeemReward": RedeemReward,
    "Messages": Messages,
    "Notifications": Notifications,
    "UserProfile": UserProfile,
    "AddGym": AddGym,
}

export const pagesConfig = {
    mainPage: "Home",
    Pages: PAGES,
    Layout: __Layout,
};