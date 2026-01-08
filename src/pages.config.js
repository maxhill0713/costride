import Challenges from './pages/Challenges';
import Groups from './pages/Groups';
import GymCommunity from './pages/GymCommunity';
import GymSignup from './pages/GymSignup';
import Gyms from './pages/Gyms';
import Home from './pages/Home';
import Leaderboard from './pages/Leaderboard';
import Leaderboards from './pages/Leaderboards';
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
import GymOwnerDashboard from './pages/GymOwnerDashboard';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Challenges": Challenges,
    "Groups": Groups,
    "GymCommunity": GymCommunity,
    "GymSignup": GymSignup,
    "Gyms": Gyms,
    "Home": Home,
    "Leaderboard": Leaderboard,
    "Leaderboards": Leaderboards,
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
    "GymOwnerDashboard": GymOwnerDashboard,
}

export const pagesConfig = {
    mainPage: "Challenges",
    Pages: PAGES,
    Layout: __Layout,
};