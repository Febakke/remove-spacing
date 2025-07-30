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

interface LibraryCollection {
  key: string;
  name: string;
}

// Global variables
let sizeVariables: any[] = [];
let libraryCollectionKey: string | null = null;
let availableCollections: LibraryCollection[] = [];

// Main plugin logic
if (figma.editorType === 'figma') {
  figma.showUI(__html__, { width: 400, height: 400 });

  // Handle messages from UI
  figma.ui.onmessage = async (msg) => {
    if (msg.type === 'get-collections') {
      await getAvailableCollections();
    } else if (msg.type === 'select-collection') {
      await selectCollection(msg.collectionKey);
    } else if (msg.type === 'search-spacing') {
      await searchForSpacingVariables();
    } else if (msg.type === 'update-variables') {
      await updateSpacingVariables();
    } else if (msg.type === 'cancel') {
      figma.closePlugin();
    }
  };

  // Function to get available library collections
  async function getAvailableCollections() {
    try {
      // Get available library variable collections
      const libraryCollections = await figma.teamLibrary.getAvailableLibraryVariableCollectionsAsync();
      
      if (libraryCollections.length === 0) {
        figma.ui.postMessage({ 
          type: 'error', 
          message: 'No library variable collections found. Please enable a library with size variables.' 
        });
        return;
      }

      // Map collections to our interface
      availableCollections = libraryCollections.map(collection => ({
        key: collection.key,
        name: collection.name
      }));

      figma.ui.postMessage({ 
        type: 'collections-list', 
        collections: availableCollections 
      });

    } catch (error) {
      figma.ui.postMessage({ 
        type: 'error', 
        message: `Error accessing library collections: ${error}` 
      });
    }
  }

  // Function to select a collection and get its variables
  async function selectCollection(collectionKey: string) {
    try {
      libraryCollectionKey = collectionKey;
      
      // Get all variables in the selected collection
      const allVariables = await figma.teamLibrary.getVariablesInLibraryCollectionAsync(collectionKey);
      
      // Filter for size variables (assuming they start with "size/")
      sizeVariables = allVariables.filter(variable => 
        variable.name.startsWith('size/') && variable.resolvedType === 'FLOAT'
      );

      if (sizeVariables.length === 0) {
        figma.ui.postMessage({ 
          type: 'error', 
          message: 'No size variables found in the selected collection. Please ensure size variables exist (e.g., size/2, size/4, etc.)' 
        });
        return;
      }

      // Get the collection name for display
      const selectedCollection = availableCollections.find(c => c.key === collectionKey);
      const collectionName = selectedCollection ? selectedCollection.name : 'Unknown Collection';

      figma.ui.postMessage({ 
        type: 'collection-selected', 
        collectionName: collectionName,
        sizeVariablesCount: sizeVariables.length
      });

    } catch (error) {
      figma.ui.postMessage({ 
        type: 'error', 
        message: `Error accessing collection variables: ${error}` 
      });
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

    // Check if we have a collection selected
    if (!libraryCollectionKey || sizeVariables.length === 0) {
      figma.ui.postMessage({ 
        type: 'error', 
        message: 'Please select a library collection first.' 
      });
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
