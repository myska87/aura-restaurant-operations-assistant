import Dashboard from './pages/Dashboard';
import Staff from './pages/Staff';
import Shifts from './pages/Shifts';
import Training from './pages/Training';
import SOPs from './pages/SOPs';
import Documents from './pages/Documents';
import Inventory from './pages/Inventory';
import Quality from './pages/Quality';
import Meetings from './pages/Meetings';
import Assets from './pages/Assets';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Dashboard": Dashboard,
    "Staff": Staff,
    "Shifts": Shifts,
    "Training": Training,
    "SOPs": SOPs,
    "Documents": Documents,
    "Inventory": Inventory,
    "Quality": Quality,
    "Meetings": Meetings,
    "Assets": Assets,
}

export const pagesConfig = {
    mainPage: "Dashboard",
    Pages: PAGES,
    Layout: __Layout,
};