import React from 'react';
import SnapCarousel, { CarouselProperties } from 'react-native-snap-carousel';

export type CarouselProps<T> = {} & CarouselProperties<T>;

export const Carousel = <T,>(props: CarouselProps<T>) => {
    return <SnapCarousel {...props} />;
};
