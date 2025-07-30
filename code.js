"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
// Global variables
let sizeVariables = [];
const HARDCODED_COLLECTION_KEY = "4f28b1ab0d6c4542d489ef3d1d96420e10c9d7d0";
// Main plugin logic
if (figma.editorType === 'figma') {
    figma.showUI(__html__, { themeColors: true, width: 400, height: 400 });
    // Handle messages from UI
    figma.ui.onmessage = (msg) => __awaiter(void 0, void 0, void 0, function* () {
        if (msg.type === 'search-spacing') {
            yield searchForSpacingVariables();
        }
        else if (msg.type === 'update-variables') {
            yield updateSpacingVariables();
        }
        else if (msg.type === 'cancel') {
            figma.closePlugin();
        }
    });
    // Function to get size variables from the hardcoded collection
    function getSizeVariables() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                // Get all variables in the hardcoded collection
                const allVariables = yield figma.teamLibrary.getVariablesInLibraryCollectionAsync(HARDCODED_COLLECTION_KEY);
                // Filter for size variables (assuming they start with "size/")
                sizeVariables = allVariables.filter(variable => variable.name.startsWith('size/') && variable.resolvedType === 'FLOAT');
                if (sizeVariables.length === 0) {
                    figma.ui.postMessage({
                        type: 'error',
                        message: 'No size variables found in the collection. Please ensure size variables exist (e.g., size/2, size/4, etc.)'
                    });
                    return false;
                }
                return true;
            }
            catch (error) {
                figma.ui.postMessage({
                    type: 'error',
                    message: `Error accessing collection variables: ${error}`
                });
                return false;
            }
        });
    }
    // Function to search for spacing variables in selection
    function searchForSpacingVariables() {
        return __awaiter(this, void 0, void 0, function* () {
            const selection = figma.currentPage.selection;
            if (selection.length === 0) {
                figma.ui.postMessage({
                    type: 'error',
                    message: 'Please select at least one layer to search for spacing variables.'
                });
                return;
            }
            // First, ensure we have access to size variables
            const hasVariables = yield getSizeVariables();
            if (!hasVariables) {
                return;
            }
            const spacingVariables = [];
            // Recursively search through all selected nodes
            function searchNode(node) {
                return __awaiter(this, void 0, void 0, function* () {
                    // Check if node has bound variables
                    if ('boundVariables' in node && node.boundVariables) {
                        const boundVars = node.boundVariables;
                        // Check each property that might have spacing variables
                        for (const property of Object.keys(boundVars)) {
                            const boundVar = boundVars[property];
                            if (Array.isArray(boundVar)) {
                                for (const variableRef of boundVar) {
                                    if (variableRef.type === 'VARIABLE_ALIAS') {
                                        // Get the actual variable using async method
                                        const variable = yield figma.variables.getVariableByIdAsync(variableRef.id);
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
                            }
                            else if (boundVar && boundVar.type === 'VARIABLE_ALIAS') {
                                const variable = yield figma.variables.getVariableByIdAsync(boundVar.id);
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
                            yield searchNode(child);
                        }
                    }
                });
            }
            // Search through all selected nodes
            for (const node of selection) {
                yield searchNode(node);
            }
            const result = {
                spacingVariables,
                count: spacingVariables.length
            };
            figma.ui.postMessage({
                type: 'search-results',
                data: result
            });
        });
    }
    // Function to update spacing variables to size variables
    function updateSpacingVariables() {
        return __awaiter(this, void 0, void 0, function* () {
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
                const spacingVariables = [];
                function searchNode(node) {
                    return __awaiter(this, void 0, void 0, function* () {
                        if ('boundVariables' in node && node.boundVariables) {
                            const boundVars = node.boundVariables;
                            for (const property of Object.keys(boundVars)) {
                                const boundVar = boundVars[property];
                                if (Array.isArray(boundVar)) {
                                    for (const variableRef of boundVar) {
                                        if (variableRef.type === 'VARIABLE_ALIAS') {
                                            const variable = yield figma.variables.getVariableByIdAsync(variableRef.id);
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
                                }
                                else if (boundVar && boundVar.type === 'VARIABLE_ALIAS') {
                                    const variable = yield figma.variables.getVariableByIdAsync(boundVar.id);
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
                                yield searchNode(child);
                            }
                        }
                    });
                }
                for (const node of selection) {
                    yield searchNode(node);
                }
                let updatedCount = 0;
                let errorCount = 0;
                // Update each spacing variable
                for (const spacingVar of spacingVariables) {
                    try {
                        // Find corresponding size variable (e.g., spacing/2 -> size/2)
                        const sizeSuffix = spacingVar.variableName.replace('spacing/', '');
                        const correspondingSizeVar = sizeVariables.find(sizeVar => sizeVar.name === `size/${sizeSuffix}`);
                        if (correspondingSizeVar) {
                            // Import the size variable
                            const importedSizeVar = yield figma.variables.importVariableByKeyAsync(correspondingSizeVar.key);
                            // Get the node using async method
                            const node = yield figma.getNodeByIdAsync(spacingVar.nodeId);
                            if (node && 'setBoundVariable' in node) {
                                // Create variable alias for the imported variable
                                const variableAlias = figma.variables.createVariableAlias(importedSizeVar);
                                // Set the bound variable
                                node.setBoundVariable(spacingVar.property, variableAlias);
                                updatedCount++;
                            }
                        }
                        else {
                            errorCount++;
                        }
                    }
                    catch (error) {
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
                }
                else {
                    figma.ui.postMessage({
                        type: 'update-partial',
                        message: `Updated ${updatedCount} variables. ${errorCount} variables could not be updated.`
                    });
                }
            }
            catch (error) {
                figma.ui.postMessage({
                    type: 'error',
                    message: `Error updating variables: ${error}`
                });
            }
        });
    }
}
