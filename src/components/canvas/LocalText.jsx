import { Children, forwardRef } from 'react';
import { Text } from '@react-three/drei';
import { resolveTextFont } from '../../config/textFonts';

// Keep the original ref, children and animation props: callers still receive
// the Troika text mesh. Pure English keeps its original hand-drawn font.
const LocalText = forwardRef(function LocalText({ children, font, fontWeight, ...props }, ref) {
    let text = '';
    Children.forEach(children, child => {
        if (typeof child === 'string' || typeof child === 'number') text += child;
    });
    return (
        <Text {...props} ref={ref} font={resolveTextFont(text, font, fontWeight)} fontWeight={fontWeight}>
            {children}
        </Text>
    );
});

export default LocalText;
