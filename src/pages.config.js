import Home from './pages/Home';
import Members from './pages/Members';
import Feed from './pages/Feed';
import Leaderboard from './pages/Leaderboard';
import Routines from './pages/Routines';
import Plus from './pages/Plus';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Home": Home,
    "Members": Members,
    "Feed": Feed,
    "Leaderboard": Leaderboard,
    "Routines": Routines,
    "Plus": Plus,
}

export const pagesConfig = {
    mainPage: "Home",
    Pages: PAGES,
    Layout: __Layout,
};