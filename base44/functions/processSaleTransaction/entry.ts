/**
 * SALE TRANSACTION PROCESSOR
 * 
 * Processes a complete sale with multiple items
 * Calls processMenuItemSale for each item to handle inventory deduction
 */

import processMenuItemSale from './processMenuItemSale';

export default async function processSaleTransaction({ saleData }, { base44 }) {
  try {
    const { items, staff_email, staff_name, sale_type = 'dine_in' } = saleData;

    if (!items || items.length === 0) {
      throw new Error('Sale must contain at least one item');
    }

    // Generate unique sale number
    const saleNumber = `SALE-${Date.now()}-${Math.random().toString(36).substring(2, 9).toUpperCase()}`;
    
    const deductionResults = [];
    const allDeductionLogs = [];
    let hasErrors = false;

    // Process each menu item
    for (const item of items) {
      const { menu_item_id, quantity = 1 } = item;

      // Call inventory deduction for this menu item
      const result = await processMenuItemSale(
        { menuItemId: menu_item_id, quantity },
        { base44 }
      );

      deductionResults.push(result);
      
      if (result.success) {
        allDeductionLogs.push(...result.deductionLog);
      } else {
        hasErrors = true;
      }
    }

    // Calculate sale totals
    let subtotal = 0;
    let totalCost = 0;

    const processedItems = await Promise.all(
      items.map(async (item) => {
        const menuItems = await base44.entities.MenuItem.filter({ id: item.menu_item_id });
        const menuItem = menuItems[0];
        
        const itemTotal = (menuItem?.price || 0) * item.quantity;
        const itemCost = (menuItem?.cost || 0) * item.quantity;
        
        subtotal += itemTotal;
        totalCost += itemCost;

        return {
          menu_item_id: item.menu_item_id,
          menu_item_name: menuItem?.name || 'Unknown Item',
          quantity: item.quantity,
          unit_price: menuItem?.price || 0,
          unit_cost: menuItem?.cost || 0,
          total_price: itemTotal,
          total_cost: itemCost
        };
      })
    );

    const grossProfit = subtotal - totalCost;
    const gpPercentage = subtotal > 0 ? (grossProfit / subtotal) * 100 : 0;

    // Create Sale Record
    const sale = await base44.entities.Sale.create({
      sale_number: saleNumber,
      sale_type,
      items: processedItems,
      subtotal,
      total_price: subtotal,
      total_cost: totalCost,
      gross_profit: grossProfit,
      gp_percentage: gpPercentage,
      stock_deducted: !hasErrors,
      deduction_log: allDeductionLogs,
      staff_email,
      staff_name,
      sale_date: new Date().toISOString()
    });

    return {
      success: !hasErrors,
      sale,
      deductionResults,
      warnings: hasErrors ? 'Some items had stock deduction errors. Check deduction_log.' : undefined
    };

  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}