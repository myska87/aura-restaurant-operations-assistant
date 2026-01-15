import Announcements from './pages/Announcements';
import Assets from './pages/Assets';
import Culture from './pages/Culture';
import Dashboard from './pages/Dashboard';
import Documents from './pages/Documents';
import Inventory from './pages/Inventory';
import Meetings from './pages/Meetings';
import Menu from './pages/Menu';
import MenuCostingDashboard from './pages/MenuCostingDashboard';
import POSSystem from './pages/POSSystem';
import Performance from './pages/Performance';
import PrepPlanner from './pages/PrepPlanner';
import Profile from './pages/Profile';
import Quality from './pages/Quality';
import QualityControl from './pages/QualityControl';
import SOPs from './pages/SOPs';
import Settings from './pages/Settings';
import ShiftHandovers from './pages/ShiftHandovers';
import Shifts from './pages/Shifts';
import Staff from './pages/Staff';
import StockDashboard from './pages/StockDashboard';
import Training from './pages/Training';
import TrainingInsights from './pages/TrainingInsights';
import DailyCheckIn from './pages/DailyCheckIn';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Announcements": Announcements,
    "Assets": Assets,
    "Culture": Culture,
    "Dashboard": Dashboard,
    "Documents": Documents,
    "Inventory": Inventory,
    "Meetings": Meetings,
    "Menu": Menu,
    "MenuCostingDashboard": MenuCostingDashboard,
    "POSSystem": POSSystem,
    "Performance": Performance,
    "PrepPlanner": PrepPlanner,
    "Profile": Profile,
    "Quality": Quality,
    "QualityControl": QualityControl,
    "SOPs": SOPs,
    "Settings": Settings,
    "ShiftHandovers": ShiftHandovers,
    "Shifts": Shifts,
    "Staff": Staff,
    "StockDashboard": StockDashboard,
    "Training": Training,
    "TrainingInsights": TrainingInsights,
    "DailyCheckIn": DailyCheckIn,
}

export const pagesConfig = {
    mainPage: "Dashboard",
    Pages: PAGES,
    Layout: __Layout,
};