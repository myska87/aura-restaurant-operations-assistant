import Assets from './pages/Assets';
import Dashboard from './pages/Dashboard';
import Documents from './pages/Documents';
import Inventory from './pages/Inventory';
import Meetings from './pages/Meetings';
import Menu from './pages/Menu';
import MenuCostingDashboard from './pages/MenuCostingDashboard';
import Profile from './pages/Profile';
import Quality from './pages/Quality';
import SOPs from './pages/SOPs';
import Settings from './pages/Settings';
import Shifts from './pages/Shifts';
import Staff from './pages/Staff';
import Training from './pages/Training';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Assets": Assets,
    "Dashboard": Dashboard,
    "Documents": Documents,
    "Inventory": Inventory,
    "Meetings": Meetings,
    "Menu": Menu,
    "MenuCostingDashboard": MenuCostingDashboard,
    "Profile": Profile,
    "Quality": Quality,
    "SOPs": SOPs,
    "Settings": Settings,
    "Shifts": Shifts,
    "Staff": Staff,
    "Training": Training,
}

export const pagesConfig = {
    mainPage: "Dashboard",
    Pages: PAGES,
    Layout: __Layout,
};