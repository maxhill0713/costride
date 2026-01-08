import Challenges from './pages/Challenges';
import Groups from './pages/Groups';
import GymCommunity from './pages/GymCommunity';
import GymSignup from './pages/GymSignup';
import Gyms from './pages/Gyms';
import Leaderboard from './pages/Leaderboard';
import Members from './pages/Members';
import Messages from './pages/Messages';
import Notifications from './pages/Notifications';
import Plus from './pages/Plus';
import Premium from './pages/Premium';
import Profile from './pages/Profile';
import Routines from './pages/Routines';
import Search from './pages/Search';
import Leaderboards from './pages/Leaderboards';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Challenges": Challenges,
    "Groups": Groups,
    "GymCommunity": GymCommunity,
    "GymSignup": GymSignup,
    "Gyms": Gyms,
    "Leaderboard": Leaderboard,
    "Members": Members,
    "Messages": Messages,
    "Notifications": Notifications,
    "Plus": Plus,
    "Premium": Premium,
    "Profile": Profile,
    "Routines": Routines,
    "Search": Search,
    "Leaderboards": Leaderboards,
}

export const pagesConfig = {
    mainPage: "Challenges",
    Pages: PAGES,
    Layout: __Layout,
};