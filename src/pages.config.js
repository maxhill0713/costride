import BrandDiscounts from './pages/BrandDiscounts';
import GymCommunity from './pages/GymCommunity';
import GymOwnerDashboard from './pages/GymOwnerDashboard';
import GymRewards from './pages/GymRewards';
import GymSignup from './pages/GymSignup';
import Gyms from './pages/Gyms';
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
import UserProfile from './pages/UserProfile';
import Home from './pages/Home';
import __Layout from './Layout.jsx';


export const PAGES = {
    "BrandDiscounts": BrandDiscounts,
    "GymCommunity": GymCommunity,
    "GymOwnerDashboard": GymOwnerDashboard,
    "GymRewards": GymRewards,
    "GymSignup": GymSignup,
    "Gyms": Gyms,
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
    "UserProfile": UserProfile,
    "Home": Home,
}

export const pagesConfig = {
    mainPage: "Home",
    Pages: PAGES,
    Layout: __Layout,
};