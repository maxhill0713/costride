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
import AddGym from './pages/AddGym';
import AdminGyms from './pages/AdminGyms';
import BrandDiscounts from './pages/BrandDiscounts';
import Friends from './pages/Friends';
import GymOwnerDashboard from './pages/GymOwnerDashboard';
import GymRewards from './pages/GymRewards';
import GymSignup from './pages/GymSignup';
import Gyms from './pages/Gyms';
import Home from './pages/Home';
import Leaderboard from './pages/Leaderboard';
import MemberSignup from './pages/MemberSignup';
import Members from './pages/Members';
import Messages from './pages/Messages';
import Notifications from './pages/Notifications';
import Onboarding from './pages/Onboarding';
import Plus from './pages/Plus';
import Premium from './pages/Premium';
import Profile from './pages/Profile';
import RedeemReward from './pages/RedeemReward';
import Routines from './pages/Routines';
import Search from './pages/Search';
import Settings from './pages/Settings';
import UserProfile from './pages/UserProfile';
import GymCommunity from './pages/GymCommunity';
import __Layout from './Layout.jsx';


export const PAGES = {
    "AddGym": AddGym,
    "AdminGyms": AdminGyms,
    "BrandDiscounts": BrandDiscounts,
    "Friends": Friends,
    "GymOwnerDashboard": GymOwnerDashboard,
    "GymRewards": GymRewards,
    "GymSignup": GymSignup,
    "Gyms": Gyms,
    "Home": Home,
    "Leaderboard": Leaderboard,
    "MemberSignup": MemberSignup,
    "Members": Members,
    "Messages": Messages,
    "Notifications": Notifications,
    "Onboarding": Onboarding,
    "Plus": Plus,
    "Premium": Premium,
    "Profile": Profile,
    "RedeemReward": RedeemReward,
    "Routines": Routines,
    "Search": Search,
    "Settings": Settings,
    "UserProfile": UserProfile,
    "GymCommunity": GymCommunity,
}

export const pagesConfig = {
    mainPage: "Home",
    Pages: PAGES,
    Layout: __Layout,
};