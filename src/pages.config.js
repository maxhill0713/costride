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
import Routines from './pages/Routines';
import Profile from './pages/Profile';
import Search from './pages/Search';
import Home from './pages/Home';
import AdminGyms from './pages/AdminGyms';
import Friends from './pages/Friends';
import Onboarding from './pages/Onboarding';
import Leaderboard from './pages/Leaderboard';
import GymCommunity from './pages/GymCommunity';
import Notifications from './pages/Notifications';
import AddGym from './pages/AddGym';
import GymSignup from './pages/GymSignup';
import Messages from './pages/Messages';
import BrandDiscounts from './pages/BrandDiscounts';
import Members from './pages/Members';
import UserProfile from './pages/UserProfile';
import GymOwnerDashboard from './pages/GymOwnerDashboard';
import GymRewards from './pages/GymRewards';
import MemberSignup from './pages/MemberSignup';
import Settings from './pages/Settings';
import Gyms from './pages/Gyms';
import Plus from './pages/Plus';
import Premium from './pages/Premium';
import __Layout from './Layout.jsx';


export const PAGES = {
    "RedeemReward": RedeemReward,
    "Routines": Routines,
    "Profile": Profile,
    "Search": Search,
    "Home": Home,
    "AdminGyms": AdminGyms,
    "Friends": Friends,
    "Onboarding": Onboarding,
    "Leaderboard": Leaderboard,
    "GymCommunity": GymCommunity,
    "Notifications": Notifications,
    "AddGym": AddGym,
    "GymSignup": GymSignup,
    "Messages": Messages,
    "BrandDiscounts": BrandDiscounts,
    "Members": Members,
    "UserProfile": UserProfile,
    "GymOwnerDashboard": GymOwnerDashboard,
    "GymRewards": GymRewards,
    "MemberSignup": MemberSignup,
    "Settings": Settings,
    "Gyms": Gyms,
    "Plus": Plus,
    "Premium": Premium,
}

export const pagesConfig = {
    mainPage: "Home",
    Pages: PAGES,
    Layout: __Layout,
};