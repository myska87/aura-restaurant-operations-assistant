import Dashboard from './pages/Dashboard';
import Staff from './pages/Staff';
import Shifts from './pages/Shifts';
import Training from './pages/Training';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Dashboard": Dashboard,
    "Staff": Staff,
    "Shifts": Shifts,
    "Training": Training,
}

export const pagesConfig = {
    mainPage: "Dashboard",
    Pages: PAGES,
    Layout: __Layout,
};