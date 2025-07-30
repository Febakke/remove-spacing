# Spacing Variable Migration Plugin

A Figma plugin that helps migrate spacing variables to size variables across your design files.

## Overview

This plugin automates the process of replacing old spacing variables (e.g., `spacing/2`, `spacing/4`) with new size variables (e.g., `size/2`, `size/4`) in your Figma designs. This is particularly useful when updating design systems or migrating between different variable naming conventions.

## Features

- **Search for spacing variables**: Automatically detects spacing variables in selected layers
- **Library integration**: Imports size variables from enabled team libraries
- **Batch updates**: Updates multiple variables at once
- **User feedback**: Clear messaging about what was found and updated
- **Error handling**: Graceful handling of missing variables or permissions

## Prerequisites

1. **Team Library Access**: Ensure you have access to a team library that contains size variables
2. **Variable Naming**: Size variables should follow the pattern `size/X` (e.g., `size/2`, `size/4`, `size/8`)
3. **Plugin Permissions**: The plugin requires `variables` and `teamLibrary` capabilities

## How to Use

### 1. Setup
1. Install the plugin in Figma
2. Ensure your team library with size variables is enabled in the current file
3. Make sure size variables exist in the library (e.g., `size/2`, `size/4`, etc.)

### 2. Migration Process
1. **Select Layers**: Select the layers in Figma that contain spacing variables you want to migrate
2. **Search**: Click "Search for Spacing Variables" to scan the selection
3. **Review**: The plugin will show how many spacing variables were found
4. **Update**: Click "Update to Size Variables" to perform the migration
5. **Verify**: Check the success message and verify the changes in your design

### 3. Variable Mapping
The plugin automatically maps spacing variables to size variables:
- `spacing/2` → `size/2`
- `spacing/4` → `size/4`
- `spacing/8` → `size/8`
- etc.

## Supported Variable Properties

The plugin can update spacing variables bound to various node properties:
- Width and height
- Padding and margins
- Gap properties
- Border radius
- And other numeric properties that accept FLOAT variables

## Error Handling

The plugin handles several error scenarios:
- **No selection**: Prompts user to select layers
- **No library access**: Guides user to enable team libraries
- **Missing size variables**: Reports which variables couldn't be updated
- **Permission issues**: Clear error messages for access problems

## Development

### Building the Plugin

1. Install dependencies:
   ```bash
   npm install
   ```

2. Compile TypeScript:
   ```bash
   npx tsc
   ```

3. The plugin is ready to use in Figma

### Project Structure

- `code.ts` - Main plugin logic (TypeScript)
- `code.js` - Compiled JavaScript (generated)
- `ui.html` - Plugin user interface
- `manifest.json` - Plugin configuration
- `tsconfig.json` - TypeScript configuration

### Key Functions

- `getLibraryVariables()` - Fetches size variables from team libraries
- `searchForSpacingVariables()` - Scans selection for spacing variables
- `updateSpacingVariables()` - Performs the actual variable replacement

## Troubleshooting

### Common Issues

1. **"No library variable collections found"**
   - Enable a team library in your Figma file
   - Ensure the library contains size variables

2. **"No size variables found in the library"**
   - Check that size variables exist in the library
   - Verify naming convention (`size/X`)

3. **"No spacing variables found"**
   - Ensure selected layers actually contain spacing variables
   - Check that spacing variables follow the `spacing/X` naming pattern

4. **Partial updates**
   - Some variables may not have corresponding size variables
   - Check the error message for details

### Debugging

- Open browser developer tools to see console logs
- Check the plugin console in Figma for detailed error messages
- Verify variable names and types match expected patterns

## Contributing

Feel free to submit issues and enhancement requests. For major changes, please open an issue first to discuss what you would like to change.

## License

This project is licensed under the MIT License.
