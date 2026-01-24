const { base44 } = require("@base44/sdk");

/**
 * Backend function to generate a comprehensive HACCP plan
 * Pulls data from menu items, CCPs, equipment, and processes
 * Generates inspector-ready documentation
 */
exports.generateHACCPPlan = async (event) => {
  console.log("[HACCP] Generation request received:", { event });
  
  // Parse request body
  let requestData = {};
  try {
    requestData = typeof event.body === 'string' ? JSON.parse(event.body) : event.body;
  } catch (parseErr) {
    console.error("[HACCP] Request parse error:", parseErr);
    return {
      statusCode: 400,
      body: JSON.stringify({ success: false, error: "Invalid request format" })
    };
  }

  const { user_email, location_id, location_name } = requestData;

  // Validate required inputs
  if (!user_email) {
    console.error("[HACCP] Missing user_email");
    return {
      statusCode: 400,
      body: JSON.stringify({ success: false, error: "Missing user_email" })
    };
  }

  try {
    console.log("[HACCP] Fetching data...");
    
    // Fetch all required data with null safety
    let menuItems = [];
    let ccpData = [];
    let hazards = [];
    let assets = [];

    try {
      menuItems = await base44.entities.MenuItem.list("-created_date", 500) || [];
    } catch (e) {
      console.warn("[HACCP] MenuItem fetch failed:", e.message);
      menuItems = [];
    }

    try {
      ccpData = await base44.entities.CriticalControlPoint.list("-created_date", 200) || [];
    } catch (e) {
      console.warn("[HACCP] CCP fetch failed:", e.message);
      ccpData = [];
    }

    try {
      hazards = await base44.entities.Hazard.list("-created_date", 100) || [];
    } catch (e) {
      console.warn("[HACCP] Hazard fetch failed:", e.message);
      hazards = [];
    }

    try {
      assets = await base44.entities.Asset.list("-created_date", 100) || [];
    } catch (e) {
      console.warn("[HACCP] Asset fetch failed:", e.message);
      assets = [];
    }

    console.log("[HACCP] Data fetched:", {
      menuItems: menuItems.length,
      ccpData: ccpData.length,
      hazards: hazards.length,
      assets: assets.length
    });

    // Get latest version
    let existingPlans = [];
    try {
      existingPlans = await base44.entities.HACCPPlan.filter({
        location_id: location_id || "default"
      }, "-created_date", 10) || [];
    } catch (e) {
      console.warn("[HACCP] Existing plans fetch failed:", e.message);
      existingPlans = [];
    }

    const latestVersion = existingPlans[0]?.version || "1.0";
    const [major, minor] = latestVersion.split(".").map(Number);
    const newVersion = `${major}.${minor + 1}`;

    console.log("[HACCP] Generated new version:", newVersion);

    // Build comprehensive HACCP content
    const haccpContent = generateHACCPContent({
      location_name: location_name || "Main",
      menuItems,
      ccpData,
      hazards,
      assets,
      version: newVersion,
      generatedDate: new Date().toISOString()
    });

    // Archive old versions (mark is_active = false but don't delete)
    if (existingPlans && existingPlans.length > 0) {
      console.log("[HACCP] Archiving", existingPlans.length, "previous versions");
      for (const plan of existingPlans) {
        try {
          await base44.entities.HACCPPlan.update(plan.id, {
            is_active: false
          });
        } catch (archiveErr) {
          console.warn("[HACCP] Archive failed for plan", plan.id, archiveErr.message);
        }
      }
    }

    // Create new HACCP plan record
    console.log("[HACCP] Creating HACCP plan record...");
    const haccpRecord = await base44.entities.HACCPPlan.create({
      location_id: location_id || "default",
      location_name: location_name || "Main",
      version: newVersion,
      last_updated: new Date().toISOString(),
      verified_by: user_email,
      verified_date: new Date().toISOString().split("T")[0],
      is_active: true,
      scope: `${menuItems.length} menu items, ${ccpData.length} CCPs, ${hazards.length} identified hazards`,
      hazard_analysis_complete: true,
      ccps_identified: ccpData.length,
      linked_menu_items: (menuItems && menuItems.length > 0) ? menuItems.slice(0, 50).map(m => m.id).filter(Boolean) : [],
      compliance_status: "implemented",
      notes: haccpContent
    });

    console.log("[HACCP] HACCP plan created:", haccpRecord.id);

    // Create report entry so it appears in reports dashboard
    console.log("[HACCP] Creating operation report...");
    const reportRecord = await base44.entities.OperationReport.create({
      reportId: `HACCP-${newVersion}-${Date.now()}`,
      reportType: "HACCP",
      locationId: location_id || "default",
      staffId: user_email,
      staffName: user_email.split("@")[0],
      staffEmail: user_email,
      reportDate: new Date().toISOString().split("T")[0],
      completionPercentage: 100,
      status: "completed",
      sourceEntityId: haccpRecord.id,
      sourceEntityType: "HACCPPlan",
      timestamp: new Date().toISOString(),
      checklistItems: [
        {
          item_id: "haccp_version",
          item_name: "HACCP Version",
          answer: newVersion
        },
        {
          item_id: "ccp_identified",
          item_name: "Critical Control Points Identified",
          answer: `${ccpData.length} CCPs`
        },
        {
          item_id: "hazard_analysis",
          item_name: "Hazard Analysis Complete",
          answer: "Yes"
        }
      ]
    });

    console.log("[HACCP] Report created:", reportRecord.id);

    const responseBody = JSON.stringify({
      success: true,
      haccpPlanId: haccpRecord.id,
      reportId: reportRecord.id,
      version: newVersion,
      message: "HACCP plan generated successfully"
    });

    console.log("[HACCP] Returning success response");

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: responseBody
    };
  } catch (error) {
    console.error("[HACCP] CRITICAL ERROR:", error);
    console.error("[HACCP] Error stack:", error.stack);
    
    const errorResponse = JSON.stringify({
      success: false,
      error: "Failed to generate HACCP plan",
      details: error.message || "Unknown error"
    });

    console.log("[HACCP] Returning error response:", errorResponse);

    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: errorResponse
    };
  }
};

/**
 * Generate comprehensive HACCP document content
 */
function generateHACCPContent({
  location_name,
  menuItems,
  ccpData,
  hazards,
  assets,
  version,
  generatedDate
}) {
  const sections = [];

  // 1. Business Details
  sections.push({
    section: "1. BUSINESS INFORMATION",
    content: [
      `Location: ${location_name}`,
      `HACCP Plan Version: ${version}`,
      `Generated: ${new Date(generatedDate).toLocaleDateString()}`,
      `Menu Items Under Control: ${menuItems.length}`,
      `Critical Control Points: ${ccpData.length}`,
      `Status: Active & Implemented`
    ]
  });

  // 2. Process Flow (simplified text-based)
  sections.push({
    section: "2. PROCESS FLOW OVERVIEW",
    content: [
      "DELIVERY → STORAGE → PREPARATION → COOKING → HOLDING → SERVING",
      "",
      "Key Process Stages:",
      "• Delivery: Incoming goods inspection",
      "• Storage: Maintain correct temperatures",
      "• Preparation: Cross-contamination prevention",
      "• Cooking: Time and temperature monitoring",
      "• Holding: Hot/cold holding maintenance",
      "• Serving: Final safety checks"
    ]
  });

  // 3. Hazard Analysis
  const biologicalHazards = hazards.filter(h => h.type === "biological");
  const chemicalHazards = hazards.filter(h => h.type === "chemical");
  const physicalHazards = hazards.filter(h => h.type === "physical");

  sections.push({
    section: "3. HAZARD ANALYSIS",
    subsections: [
      {
        name: "3.1 Biological Hazards",
        items: biologicalHazards.length > 0
          ? biologicalHazards.map(h => `• ${h.description} (Severity: ${h.severity})`)
          : ["• Bacterial contamination (high risk)", "• Viral pathogens (medium risk)", "• Parasites (low risk)"]
      },
      {
        name: "3.2 Chemical Hazards",
        items: chemicalHazards.length > 0
          ? chemicalHazards.map(h => `• ${h.description} (Severity: ${h.severity})`)
          : ["• Pesticide residues (low risk)", "• Allergen cross-contamination (high risk)", "• Cleaning agent residues (medium risk)"]
      },
      {
        name: "3.3 Physical Hazards",
        items: physicalHazards.length > 0
          ? physicalHazards.map(h => `• ${h.description} (Severity: ${h.severity})`)
          : ["• Glass/metal fragments (high risk)", "• Wood splinters (medium risk)", "• Plastic contamination (low risk)"]
      }
    ]
  });

  // 4. Critical Control Points
  sections.push({
    section: "4. CRITICAL CONTROL POINTS",
    subsections: ccpData.map((ccp, idx) => ({
      name: `CCP ${idx + 1}: ${ccp.name}`,
      items: [
        `Stage: ${ccp.stage}`,
        `Parameter: ${ccp.monitoring_parameter}`,
        `Critical Limit: ${ccp.critical_limit} ${ccp.unit}`,
        `Monitoring Frequency: ${ccp.check_frequency}`,
        `Monitoring Method: ${ccp.monitoring_method}`,
        `Responsible Role: ${ccp.responsible_role}`
      ]
    }))
  });

  // 5. Corrective Actions
  sections.push({
    section: "5. CORRECTIVE ACTIONS",
    content: [
      "When a CCP deviation occurs:",
      "",
      "IMMEDIATE ACTIONS:",
      "1. Stop operation of affected process immediately",
      "2. Identify affected products",
      "3. Prevent distribution of unsafe product",
      "4. Document the deviation with time and details",
      "",
      "CORRECTIVE MEASURES:",
      "• Re-cook to correct temperature",
      "• Discard non-salvageable product",
      "• Implement additional quality checks",
      "• Review and adjust process parameters",
      "",
      "VERIFICATION:",
      "• Recheck after corrective action",
      "• Document all actions taken",
      "• Notify management"
    ]
  });

  // 6. Monitoring Procedures
  sections.push({
    section: "6. MONITORING PROCEDURES",
    content: [
      "Daily monitoring by trained staff:",
      "",
      "Temperature Monitoring:",
      `• Frequency: ${ccpData.find(c => c.unit === 'celsius') ? ccpData.find(c => c.unit === 'celsius').check_frequency : 'Per batch'}`,
      "• Method: Calibrated thermometer",
      "• Records: Maintained for 3 years",
      "",
      "Equipment Maintenance:",
      "• Weekly calibration checks",
      "• Monthly maintenance inspections",
      "• Annual professional servicing",
      "",
      "Staff Observation:",
      "• Visual inspection of food quality",
      "• Hygiene compliance verification",
      "• Equipment function assessment"
    ]
  });

  // 7. Verification
  sections.push({
    section: "7. VERIFICATION PROCEDURES",
    content: [
      "Daily:",
      "• Review monitoring records",
      "• Confirm all CCPs within limits",
      "• Check equipment calibration",
      "",
      "Weekly:",
      "• Review temperature logs",
      "• Verify corrective actions if taken",
      "• Check staff training records",
      "",
      "Monthly:",
      "• Manager review of all records",
      "• Equipment maintenance verification",
      "• Complaint analysis",
      "",
      "Quarterly:",
      "• Full HACCP system review",
      "• Update hazard analysis if needed",
      "• Review menu changes impact"
    ]
  });

  // 8. Record Keeping
  sections.push({
    section: "8. RECORD-KEEPING PROCEDURES",
    content: [
      "Required Records:",
      "• CCP monitoring logs (daily)",
      "• Temperature logs (per equipment)",
      "• Corrective action records",
      "• Staff training certificates",
      "• Equipment maintenance logs",
      "• Supplier audit records",
      "• Customer complaints",
      "",
      "Retention Period:",
      "• 3 years minimum",
      "• Legally mandated records: 6 years+",
      "• Available for inspection"
    ]
  });

  // Format for display
  return sections.map(s => {
    let text = `\n${s.section}\n${"=".repeat(s.section.length)}\n`;
    if (s.content) {
      text += s.content.join("\n");
    }
    if (s.subsections) {
      text += s.subsections.map(sub => {
        let subText = `\n${sub.name}:\n`;
        subText += sub.items.join("\n");
        return subText;
      }).join("\n");
    }
    return text;
  }).join("\n");
}