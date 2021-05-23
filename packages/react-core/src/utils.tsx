import React, { Fragment, isValidElement } from 'react';

export const renderComponent = (Tag: React.ReactNode | undefined | null): React.ReactNode => {
    if (!Tag) {
        return Tag;
    }

    return isValidElement(Tag) ? (
        Tag
    ) : (
        // @ts-ignore
        <Tag />
    );
};

export const ensureReactElement = (
    node: React.ReactNode,
    handlePrimitive: (value: string | boolean | null) => React.ReactElement,
): React.ReactElement => {
    if (typeof node === 'string' || typeof node === 'boolean' || node === null) {
        return <Fragment children={renderComponent(handlePrimitive(node))} />;
    }

    return <Fragment children={renderComponent(node)} />;
};
