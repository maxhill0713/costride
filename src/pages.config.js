import Groups from './pages/Groups';
import GymCommunity from './pages/GymCommunity';
import GymOwnerDashboard from './pages/GymOwnerDashboard';
import GymSignup from './pages/GymSignup';
import Gyms from './pages/Gyms';
import Home from './pages/Home';
import Leaderboard from './pages/Leaderboard';
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
import MemberSignup from './pages/MemberSignup';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Groups": Groups,
    "GymCommunity": GymCommunity,
    "GymOwnerDashboard": GymOwnerDashboard,
    "GymSignup": GymSignup,
    "Gyms": Gyms,
    "Home": Home,
    "Leaderboard": Leaderboard,
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
    "MemberSignup": MemberSignup,
}

export const pagesConfig = {
    mainPage: "Groups",
    Pages: PAGES,
    Layout: __Layout,
};