import { valueModFactory } from '@flstk/react-core';
import { StyleGuide } from '@flstk/react-native/ui-kit/StyleGuide';
import { rnStyleMods, RnStyle } from '@flstk/react-native/utils';

const mod = valueModFactory<RnStyle>();

export const spacingMods = rnStyleMods({
    marginBottom: mod('marginBottom', StyleGuide.spacing),
    marginLeft: mod('marginLeft', StyleGuide.spacing),
    marginRight: mod('marginRight', StyleGuide.spacing),
    marginTop: mod('marginTop', StyleGuide.spacing),
    marginHorizontal: mod('marginHorizontal', StyleGuide.spacing),
    marginVertical: mod('marginVertical', StyleGuide.spacing),
    margin: mod('margin', StyleGuide.spacing),

    paddingTop: mod('paddingTop', StyleGuide.spacing),
    paddingBottom: mod('paddingBottom', StyleGuide.spacing),
    paddingLeft: mod('paddingLeft', StyleGuide.spacing),
    paddingRight: mod('paddingRight', StyleGuide.spacing),
    padding: mod('padding', StyleGuide.spacing),
    paddingVertical: mod('paddingVertical', StyleGuide.spacing),
    paddingHorizontal: mod('paddingHorizontal', StyleGuide.spacing),
});
