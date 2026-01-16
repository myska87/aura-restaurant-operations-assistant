import AllergenDashboard from './pages/AllergenDashboard';
import Announcements from './pages/Announcements';
import Assets from './pages/Assets';
import Culture from './pages/Culture';
import DailyCheckIn from './pages/DailyCheckIn';
import Dashboard from './pages/Dashboard';
import Documents from './pages/Documents';
import EquipmentHealth from './pages/EquipmentHealth';
import Forms from './pages/Forms';
import Inventory from './pages/Inventory';
import LeadershipPathway from './pages/LeadershipPathway';
import Meetings from './pages/Meetings';
import Menu from './pages/Menu';
import MenuCostingDashboard from './pages/MenuCostingDashboard';
import OperationsHistory from './pages/OperationsHistory';
import POSSystem from './pages/POSSystem';
import Performance from './pages/Performance';
import PrepPlanner from './pages/PrepPlanner';
import Profile from './pages/Profile';
import Quality from './pages/Quality';
import QualityControl from './pages/QualityControl';
import SOPs from './pages/SOPs';
import ServiceRecovery from './pages/ServiceRecovery';
import Settings from './pages/Settings';
import ShiftHandovers from './pages/ShiftHandovers';
import Shifts from './pages/Shifts';
import Staff from './pages/Staff';
import StockDashboard from './pages/StockDashboard';
import Training from './pages/Training';
import TrainingInsights from './pages/TrainingInsights';
import __Layout from './Layout.jsx';


export const PAGES = {
    "AllergenDashboard": AllergenDashboard,
    "Announcements": Announcements,
    "Assets": Assets,
    "Culture": Culture,
    "DailyCheckIn": DailyCheckIn,
    "Dashboard": Dashboard,
    "Documents": Documents,
    "EquipmentHealth": EquipmentHealth,
    "Forms": Forms,
    "Inventory": Inventory,
    "LeadershipPathway": LeadershipPathway,
    "Meetings": Meetings,
    "Menu": Menu,
    "MenuCostingDashboard": MenuCostingDashboard,
    "OperationsHistory": OperationsHistory,
    "POSSystem": POSSystem,
    "Performance": Performance,
    "PrepPlanner": PrepPlanner,
    "Profile": Profile,
    "Quality": Quality,
    "QualityControl": QualityControl,
    "SOPs": SOPs,
    "ServiceRecovery": ServiceRecovery,
    "Settings": Settings,
    "ShiftHandovers": ShiftHandovers,
    "Shifts": Shifts,
    "Staff": Staff,
    "StockDashboard": StockDashboard,
    "Training": Training,
    "TrainingInsights": TrainingInsights,
}

export const pagesConfig = {
    mainPage: "Dashboard",
    Pages: PAGES,
    Layout: __Layout,
};