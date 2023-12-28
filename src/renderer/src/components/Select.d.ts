import React from 'react';
export type SelectOption = {
    label: string;
    value: string;
    leadingIcon?: React.ReactNode;
    trailingIcon?: React.ReactNode;
    disabled?: boolean;
};
export type SelectProps = {
    label?: string;
    options: SelectOption[];
    value: string | undefined;
    placeholder?: string;
    disabled?: boolean;
    onChange?: (value: string | undefined) => void;
};
export declare const Select: React.FC<SelectProps>;
