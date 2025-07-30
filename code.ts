// Types for our plugin
interface SpacingVariable {
  nodeId: string;
  variableId: string;
  variableName: string;
  property: string;
  value: any;
}

interface SearchResult {
  spacingVariables: SpacingVariable[];
  count: number;
}

// Global variables
let sizeVariables: any[] = [];
const HARDCODED_COLLECTION_KEY = "4f28b1ab0d6c4542d489ef3d1d96420e10c9d7d0";

// Main plugin logic
if (figma.editorType === 'figma') {
  figma.showUI(__html__, {themeColors: true, width: 400, height: 400 });

  // Handle messages from UI
  figma.ui.onmessage = async (msg) => {
    if (msg.type === 'search-spacing') {
      await searchForSpacingVariables();
    } else if (msg.type === 'update-variables') {
      await updateSpacingVariables();
    } else if (msg.type === 'cancel') {
      figma.closePlugin();
    }
  };

  // Function to get size variables from the hardcoded collection
  async function getSizeVariables() {
    try {
      // Get all variables in the hardcoded collection
      const allVariables = await figma.teamLibrary.getVariablesInLibraryCollectionAsync(HARDCODED_COLLECTION_KEY);
      
      // Filter for size variables (assuming they start with "size/")
      sizeVariables = allVariables.filter(variable => 
        variable.name.startsWith('size/') && variable.resolvedType === 'FLOAT'
      );

      if (sizeVariables.length === 0) {
        figma.ui.postMessage({ 
          type: 'error', 
          message: 'No size variables found in the collection. Please ensure size variables exist (e.g., size/2, size/4, etc.)' 
        });
        return false;
      }

      return true;
    } catch (error) {
      figma.ui.postMessage({ 
        type: 'error', 
        message: `Error accessing collection variables: ${error}` 
      });
      return false;
    }
  }

  // Function to search for spacing variables in selection
  async function searchForSpacingVariables() {
    const selection = figma.currentPage.selection;
    
    if (selection.length === 0) {
      figma.ui.postMessage({ 
        type: 'error', 
        message: 'Please select at least one layer to search for spacing variables.' 
      });
      return;
    }

    // First, ensure we have access to size variables
    const hasVariables = await getSizeVariables();
    if (!hasVariables) {
      return;
    }

    const spacingVariables: SpacingVariable[] = [];

    // Recursively search through all selected nodes
    async function searchNode(node: SceneNode) {
      // Check if node has bound variables
      if ('boundVariables' in node && node.boundVariables) {
        const boundVars = node.boundVariables as Record<string, VariableAlias | VariableAlias[]>;
        
        // Check each property that might have spacing variables
        for (const property of Object.keys(boundVars)) {
          const boundVar = boundVars[property];
          
          if (Array.isArray(boundVar)) {
            for (const variableRef of boundVar) {
              if (variableRef.type === 'VARIABLE_ALIAS') {
                // Get the actual variable using async method
                const variable = await figma.variables.getVariableByIdAsync(variableRef.id);
                if (variable && variable.name.startsWith('spacing/')) {
                  spacingVariables.push({
                    nodeId: node.id,
                    variableId: variable.id,
                    variableName: variable.name,
                    property: property,
                    value: variableRef
                  });
                }
              }
            }
          } else if (boundVar && boundVar.type === 'VARIABLE_ALIAS') {
            const variable = await figma.variables.getVariableByIdAsync(boundVar.id);
            if (variable && variable.name.startsWith('spacing/')) {
              spacingVariables.push({
                nodeId: node.id,
                variableId: variable.id,
                variableName: variable.name,
                property: property,
                value: boundVar
              });
            }
          }
        }
      }

      // Recursively search children
      if ('children' in node) {
        for (const child of node.children) {
          await searchNode(child);
        }
      }
    }

    // Search through all selected nodes
    for (const node of selection) {
      await searchNode(node);
    }

    const result: SearchResult = {
      spacingVariables,
      count: spacingVariables.length
    };

    figma.ui.postMessage({ 
      type: 'search-results', 
      data: result 
    });
  }

  // Function to update spacing variables to size variables
  async function updateSpacingVariables() {
    try {
      const selection = figma.currentPage.selection;
      
      if (selection.length === 0) {
        figma.ui.postMessage({ 
          type: 'error', 
          message: 'Please select at least one layer to update.' 
        });
        return;
      }

      // Re-search for spacing variables
      const spacingVariables: SpacingVariable[] = [];

      async function searchNode(node: SceneNode) {
        if ('boundVariables' in node && node.boundVariables) {
          const boundVars = node.boundVariables as Record<string, VariableAlias | VariableAlias[]>;
          
          for (const property of Object.keys(boundVars)) {
            const boundVar = boundVars[property];
            
            if (Array.isArray(boundVar)) {
              for (const variableRef of boundVar) {
                if (variableRef.type === 'VARIABLE_ALIAS') {
                  const variable = await figma.variables.getVariableByIdAsync(variableRef.id);
                  if (variable && variable.name.startsWith('spacing/')) {
                    spacingVariables.push({
                      nodeId: node.id,
                      variableId: variable.id,
                      variableName: variable.name,
                      property: property,
                      value: variableRef
                    });
                  }
                }
              }
            } else if (boundVar && boundVar.type === 'VARIABLE_ALIAS') {
              const variable = await figma.variables.getVariableByIdAsync(boundVar.id);
              if (variable && variable.name.startsWith('spacing/')) {
                spacingVariables.push({
                  nodeId: node.id,
                  variableId: variable.id,
                  variableName: variable.name,
                  property: property,
                  value: boundVar
                });
              }
            }
          }
        }

        if ('children' in node) {
          for (const child of node.children) {
            await searchNode(child);
          }
        }
      }

      for (const node of selection) {
        await searchNode(node);
      }

      let updatedCount = 0;
      let errorCount = 0;

      // Update each spacing variable
      for (const spacingVar of spacingVariables) {
        try {
          // Find corresponding size variable (e.g., spacing/2 -> size/2)
          const sizeSuffix = spacingVar.variableName.replace('spacing/', '');
          const correspondingSizeVar = sizeVariables.find(sizeVar => 
            sizeVar.name === `size/${sizeSuffix}`
          );

          if (correspondingSizeVar) {
            // Import the size variable
            const importedSizeVar = await figma.variables.importVariableByKeyAsync(correspondingSizeVar.key);
            
            // Get the node using async method
            const node = await figma.getNodeByIdAsync(spacingVar.nodeId);
            if (node && 'setBoundVariable' in node) {
              // Create variable alias for the imported variable
              const variableAlias = figma.variables.createVariableAlias(importedSizeVar);
              
              // Set the bound variable
              (node as any).setBoundVariable(spacingVar.property, variableAlias);
              updatedCount++;
            }
          } else {
            errorCount++;
          }
        } catch (error) {
          errorCount++;
          console.error(`Error updating variable ${spacingVar.variableName}:`, error);
        }
      }

      // Send results back to UI
      if (errorCount === 0) {
        figma.ui.postMessage({ 
          type: 'update-success', 
          message: `Successfully updated ${updatedCount} spacing variables to size variables!` 
        });
      } else {
        figma.ui.postMessage({ 
          type: 'update-partial', 
          message: `Updated ${updatedCount} variables. ${errorCount} variables could not be updated.` 
        });
      }

    } catch (error) {
      figma.ui.postMessage({ 
        type: 'error', 
        message: `Error updating variables: ${error}` 
      });
    }
  }
}
