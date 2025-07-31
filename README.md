# spacing - size

Simple Figma plugin for swapping from old spacing tokens -> new Size tokens

## Why? 

At one point we (designsystemet.no) had both spacing and sizing tokens as that was the setup Token Studio was supporting. But when dimension tokens was introduced we removed spacing and renamed sizing -> size. There are some cases internally where Figma file still point to these Spacing variables in Figma. Creating a lot of ghost variables. Changing this has to be done manually as Figma has no tools for such a task. This plugin is only ment as a tool to do this job a little simpler. 

## How to use
1. Select a component/frame or other element in Figma and rund the plugin.
2. Search for spacing variables. 
3. If it find any old spacing variables you can update them to size variables. spacing/2 -> size/2
4. And you are done

## How to install
Use the "import plugin from manifest..." and select `manifest.json`

## Notes
The plugin will look for a collection with a specific id. This works internally, but might cause issues if there has been a change of id. Let me know if anybody needs to select a specific collection.  
