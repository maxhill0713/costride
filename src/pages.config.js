import GymCommunity from './pages/GymCommunity';
import GymOwnerDashboard from './pages/GymOwnerDashboard';
import GymSignup from './pages/GymSignup';
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
import Routines from './pages/Routines';
import Search from './pages/Search';
import UserProfile from './pages/UserProfile';
import Gyms from './pages/Gyms';
import RedeemReward from './pages/RedeemReward';
import __Layout from './Layout.jsx';


export const PAGES = {
    "GymCommunity": GymCommunity,
    "GymOwnerDashboard": GymOwnerDashboard,
    "GymSignup": GymSignup,
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
    "Routines": Routines,
    "Search": Search,
    "UserProfile": UserProfile,
    "Gyms": Gyms,
    "RedeemReward": RedeemReward,
}

export const pagesConfig = {
    mainPage: "GymCommunity",
    Pages: PAGES,
    Layout: __Layout,
};