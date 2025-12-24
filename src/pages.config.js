import Home from './pages/Home';
import Members from './pages/Members';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Home": Home,
    "Members": Members,
}

export const pagesConfig = {
    mainPage: "Home",
    Pages: PAGES,
    Layout: __Layout,
};