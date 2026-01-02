import Feed from './pages/Feed';
import GymCommunity from './pages/GymCommunity';
import GymSignup from './pages/GymSignup';
import Gyms from './pages/Gyms';
import Home from './pages/Home';
import Leaderboard from './pages/Leaderboard';
import Members from './pages/Members';
import Notifications from './pages/Notifications';
import Plus from './pages/Plus';
import Profile from './pages/Profile';
import Routines from './pages/Routines';
import Search from './pages/Search';
import Messages from './pages/Messages';
import Groups from './pages/Groups';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Feed": Feed,
    "GymCommunity": GymCommunity,
    "GymSignup": GymSignup,
    "Gyms": Gyms,
    "Home": Home,
    "Leaderboard": Leaderboard,
    "Members": Members,
    "Notifications": Notifications,
    "Plus": Plus,
    "Profile": Profile,
    "Routines": Routines,
    "Search": Search,
    "Messages": Messages,
    "Groups": Groups,
}

export const pagesConfig = {
    mainPage: "Home",
    Pages: PAGES,
    Layout: __Layout,
};