import Groups from './pages/Groups';
import GymCommunity from './pages/GymCommunity';
import GymSignup from './pages/GymSignup';
import Gyms from './pages/Gyms';
import Home from './pages/Home';
import Leaderboard from './pages/Leaderboard';
import Members from './pages/Members';
import Messages from './pages/Messages';
import Notifications from './pages/Notifications';
import Plus from './pages/Plus';
import Profile from './pages/Profile';
import Routines from './pages/Routines';
import Search from './pages/Search';
import Premium from './pages/Premium';
import Challenges from './pages/Challenges';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Groups": Groups,
    "GymCommunity": GymCommunity,
    "GymSignup": GymSignup,
    "Gyms": Gyms,
    "Home": Home,
    "Leaderboard": Leaderboard,
    "Members": Members,
    "Messages": Messages,
    "Notifications": Notifications,
    "Plus": Plus,
    "Profile": Profile,
    "Routines": Routines,
    "Search": Search,
    "Premium": Premium,
    "Challenges": Challenges,
}

export const pagesConfig = {
    mainPage: "Home",
    Pages: PAGES,
    Layout: __Layout,
};