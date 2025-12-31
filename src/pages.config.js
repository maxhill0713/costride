import Feed from './pages/Feed';
import Home from './pages/Home';
import Leaderboard from './pages/Leaderboard';
import Members from './pages/Members';
import Plus from './pages/Plus';
import Routines from './pages/Routines';
import Profile from './pages/Profile';
import Notifications from './pages/Notifications';
import Search from './pages/Search';
import Gyms from './pages/Gyms';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Feed": Feed,
    "Home": Home,
    "Leaderboard": Leaderboard,
    "Members": Members,
    "Plus": Plus,
    "Routines": Routines,
    "Profile": Profile,
    "Notifications": Notifications,
    "Search": Search,
    "Gyms": Gyms,
}

export const pagesConfig = {
    mainPage: "Home",
    Pages: PAGES,
    Layout: __Layout,
};