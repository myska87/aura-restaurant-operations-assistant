/**
 * CORE INVENTORY DEDUCTION ENGINE
 * 
 * Sale of Menu Item → Recipe → Ingredients → Inventory Deduction → Log Transaction
 * 
 * This is the SINGLE SOURCE OF TRUTH for inventory deductions.
 * ALL sales MUST go through this function.
 */

export default async function processMenuItemSale({ menuItemId, quantity = 1 }, { base44 }) {
  try {
    // 1. Fetch Menu Item
    const menuItems = await base44.entities.MenuItem.filter({ id: menuItemId });
    const menuItem = menuItems[0];
    
    if (!menuItem) {
      throw new Error(`Menu item ${menuItemId} not found`);
    }

    // 2. Get Recipe from Menu Item (ingredients array IS the recipe)
    if (!menuItem.ingredients || menuItem.ingredients.length === 0) {
      throw new Error(`Menu item "${menuItem.name}" has no recipe/ingredients defined. Cannot process sale.`);
    }

    const recipe = menuItem.ingredients; // The recipe IS the ingredients array
    const deductionLog = [];
    const errors = [];

    // 3. Process Each Ingredient in Recipe
    for (const recipeIngredient of recipe) {
      const { ingredient_id, ingredient_name, quantity: quantityPerServing, unit } = recipeIngredient;
      
      if (!ingredient_id) {
        errors.push(`Ingredient "${ingredient_name}" has no ingredient_id. Skipping deduction.`);
        continue;
      }

      // Calculate total quantity to deduct (recipe quantity × sale quantity)
      const totalQuantityToDeduct = quantityPerServing * quantity;

      // 4. Fetch Inventory Item
      const inventoryItems = await base44.entities.Ingredient.filter({ id: ingredient_id });
      const inventoryItem = inventoryItems[0];

      if (!inventoryItem) {
        errors.push(`Ingredient "${ingredient_name}" (ID: ${ingredient_id}) not found in inventory. Cannot deduct stock.`);
        continue;
      }

      // 5. Check Stock Availability
      const currentStock = inventoryItem.current_stock || 0;
      
      if (currentStock < totalQuantityToDeduct) {
        errors.push(
          `Insufficient stock for "${ingredient_name}". ` +
          `Required: ${totalQuantityToDeduct} ${unit}, Available: ${currentStock} ${unit}`
        );
        continue;
      }

      // 6. Deduct from Inventory
      const newStock = currentStock - totalQuantityToDeduct;
      
      await base44.entities.Ingredient.update(ingredient_id, {
        current_stock: newStock,
        last_ordered: inventoryItem.last_ordered // Preserve existing data
      });

      // 7. Log Deduction
      deductionLog.push({
        ingredient_id,
        ingredient_name,
        quantity_deducted: totalQuantityToDeduct,
        unit,
        stock_before: currentStock,
        stock_after: newStock
      });
    }

    // 8. Return Result
    return {
      success: errors.length === 0,
      menuItemName: menuItem.name,
      quantitySold: quantity,
      deductionLog,
      errors: errors.length > 0 ? errors : undefined,
      timestamp: new Date().toISOString()
    };

  } catch (error) {
    // Fail safely - return error without crashing
    return {
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    };
  }
}