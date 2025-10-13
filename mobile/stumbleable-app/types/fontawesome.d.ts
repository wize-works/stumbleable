/**
 * FontAwesome Type Fixes
 * 
 * This file resolves type compatibility issues between the custom FontAwesome kit
 * (@awesome.me/kit-240c9f263d) and the core FontAwesome React Native package.
 * 
 * The issue occurs because the custom kit uses a different IconPrefix type
 * ("faslr" - FontAwesome Sharp Light Regular) than what the core library expects.
 */

declare module '@awesome.me/kit-240c9f263d/icons/sharp-duotone/solid' {
    import { IconDefinition } from '@fortawesome/fontawesome-svg-core';

    // Override the IconPrefix type to make it compatible
    interface CustomIconDefinition extends Omit<IconDefinition, 'prefix'> {
        prefix: any; // Allow any prefix to bypass type checking
    }

    export const faShuffle: CustomIconDefinition;
    export const faBookmark: CustomIconDefinition;
    export const faList: CustomIconDefinition;
    export const faGear: CustomIconDefinition;
    export const faSun: CustomIconDefinition;
    export const faMoon: CustomIconDefinition;
}

// Global type augmentation to make FontAwesome icons compatible
declare global {
    namespace FontAwesome {
        interface IconProp {
            prefix?: any;
        }
    }
}

export { };
